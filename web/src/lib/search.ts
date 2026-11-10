import { getPayloadClient } from "./payload";

/**
 * Pencarian katalog (F-CARI-01).
 *
 * Kriteria terima: satu huruf salah tetap menemukan bukunya, ISBN dengan atau tanpa
 * tanda hubung ditemukan, dan hasil < 1 dtk untuk 1.000 judul.
 *
 * Pencocokan fuzzy dilakukan di memori dari indeks ringan (judul, subjudul, penulis,
 * seri, ISBN), bukan di SQL, supaya perilakunya sama di SQLite (dev) dan Postgres
 * (produksi) tanpa ekstensi pg_trgm. Untuk 1.000 judul indeksnya hanya puluhan KB
 * dan pencarian selesai dalam hitungan milidetik.
 */

type Entry = {
  id: number;
  title: string;
  tokens: string[];
  text: string;
  isbnDigits: string;
};

const TTL_MS = 60_000;
let cache: { at: number; entries: Entry[] } | null = null;

import { normalize, tokenize, withinEditDistance } from "./fuzzy";

export { normalize, withinEditDistance };

const loadIndex = async (): Promise<Entry[]> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.entries;

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "books",
    overrideAccess: false,
    where: { _status: { equals: "published" } },
    depth: 1,
    limit: 5000,
    pagination: false,
    select: {
      title: true,
      subtitle: true,
      isbn13: true,
      authors: true,
      series: true,
    },
    populate: {
      authors: { name: true },
      series: { title: true },
    },
  });

  const entries: Entry[] = result.docs.map((doc) => {
    const authors = (doc.authors ?? [])
      .map((a) => (typeof a === "object" && a ? a.name : ""))
      .join(" ");
    const series = typeof doc.series === "object" && doc.series ? doc.series.title : "";
    const haystack = [doc.title, doc.subtitle ?? "", authors, series].join(" ");
    return {
      id: doc.id,
      title: normalize(doc.title),
      tokens: Array.from(new Set(tokenize(haystack))),
      text: normalize(haystack),
      isbnDigits: (doc.isbn13 ?? "").replace(/\D/g, ""),
    };
  });

  cache = { at: Date.now(), entries };
  return entries;
};

/** Kosongkan indeks, mis. setelah buku diubah. Instance lain akan menyegarkan sendiri dalam 60 dtk. */
export const invalidateSearchIndex = () => {
  cache = null;
};

const scoreToken = (query: string, entry: Entry): number => {
  let best = 0;
  if (entry.text.includes(query)) best = query.length >= 3 ? 10 : 6;
  const maxEdits = query.length >= 8 ? 2 : 1;

  for (const token of entry.tokens) {
    if (token === query) return 12;
    if (query.length >= 2 && token.startsWith(query)) best = Math.max(best, 9);
    else if (query.length >= 4) {
      if (withinEditDistance(query, token, maxEdits)) best = Math.max(best, 7);
      else if (
        token.length > query.length &&
        withinEditDistance(query, token.slice(0, query.length), 1)
      ) {
        // Awalan dengan salah ketik, mis. "sosiolgi" untuk "sosiologis".
        best = Math.max(best, 5);
      }
    }
  }
  return best;
};

/**
 * Kembalikan ID buku yang cocok, terurut dari skor tertinggi.
 * Semua kata pada kueri harus cocok (semantik AND), agar hasil tidak melebar.
 */
export const searchBookIds = async (rawQuery: string): Promise<number[]> => {
  const query = rawQuery.trim();
  if (!query) return [];

  const entries = await loadIndex();

  // ISBN: cocokkan angka saja, sehingga 978-623-... dan 978623... setara.
  const digits = query.replace(/[\s-]/g, "");
  if (/^\d{4,13}$/.test(digits)) {
    const byIsbn = entries.filter((e) => e.isbnDigits.includes(digits)).map((e) => e.id);
    if (byIsbn.length > 0) return byIsbn;
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const phrase = normalize(query);

  const scored: { id: number; score: number }[] = [];
  for (const entry of entries) {
    let total = 0;
    let matchedAll = true;
    for (const qt of queryTokens) {
      const s = scoreToken(qt, entry);
      if (s === 0) {
        matchedAll = false;
        break;
      }
      total += s;
    }
    if (!matchedAll) continue;
    if (entry.title.includes(phrase)) total += 20;
    scored.push({ id: entry.id, score: total });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
};
