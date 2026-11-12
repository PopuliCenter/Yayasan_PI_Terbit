import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PayloadRequest } from "payload";
import { DELETED_BOOK_ID, aggregateClicks, aggregateOrders, fetchBookTitles, resolveRange, toCsv, wibDayStart } from "./reports";

describe("rentang tanggal WIB", () => {
  it("awal hari WIB = 17.00 UTC hari sebelumnya", () => {
    assert.equal(wibDayStart("2026-11-11").toISOString(), "2026-11-10T17:00:00.000Z");
  });
  it("bawaan 30 hari termasuk hari ini", () => {
    const now = new Date("2026-11-11T03:00:00Z"); // 10.00 WIB
    const res = resolveRange({}, now);
    assert.ok(res.ok);
    if (res.ok) {
      assert.equal(res.range.sampai, "2026-11-11");
      assert.equal(res.range.dari, "2026-10-13");
      assert.equal(res.range.days, 30);
      assert.equal(res.range.to.toISOString(), "2026-11-11T17:00:00.000Z");
    }
  });
  it("tengah malam WIB sudah hari berikutnya", () => {
    const res = resolveRange({ days: 1 }, new Date("2026-11-11T17:30:00Z")); // 00.30 WIB 12 Nov
    assert.ok(res.ok && res.range.sampai === "2026-11-12");
  });
  it("menolak format salah, urutan terbalik, dan rentang terlalu panjang", () => {
    assert.equal(resolveRange({ dari: "2026-13-01", sampai: "2026-12-01" }).ok, false);
    assert.equal(resolveRange({ dari: "11-11-2026", sampai: "2026-12-01" }).ok, false);
    assert.equal(resolveRange({ dari: "2026-12-02", sampai: "2026-12-01" }).ok, false);
    assert.equal(resolveRange({ dari: "2024-01-01", sampai: "2026-01-01" }).ok, false);
    assert.equal(resolveRange({ dari: "2026-01-01", sampai: "2026-01-01" }).ok, true);
  });
});

describe("agregasi", () => {
  it("klik per buku, urut total", () => {
    const rows = aggregateClicks([
      { book: 1, target: "wa" },
      { book: 2, target: "marketplace", platform: "shopee" },
      { book: 2, target: "marketplace", platform: "shopee" },
      { book: { id: 2 }, target: "wa" },
    ]);
    assert.deepEqual(rows[0], { bookId: 2, wa: 1, marketplace: 2, byPlatform: { shopee: 2 } });
    assert.deepEqual(rows[1], { bookId: 1, wa: 1, marketplace: 0, byPlatform: {} });
    assert.equal(rows.length, 2);
  });
  it("klik pada buku terhapus (book null) digabung di baris terakhir, jumlahnya sama dengan total", () => {
    const docs = [
      { book: 1, target: "wa" },
      { book: null, target: "wa" },
      { book: null, target: "marketplace", platform: "tokopedia" },
      { book: undefined, target: "wa" },
      { book: 2, target: "marketplace", platform: "shopee" },
    ];
    const rows = aggregateClicks(docs);
    assert.equal(rows.length, 3);
    // Lebih banyak klik daripada judul mana pun, tetapi tetap di urutan terakhir.
    assert.deepEqual(rows[2], { bookId: DELETED_BOOK_ID, wa: 2, marketplace: 1, byPlatform: { tokopedia: 1 } });
    assert.equal(
      rows.reduce((n, r) => n + r.wa + r.marketplace, 0),
      docs.length,
    );
  });
  it("pesanan: unit, nilai, dan pesanan berbeda", () => {
    const rows = aggregateOrders([
      { id: 10, items: [{ book: 1, quantity: 2, unitPrice: 50_000 }, { book: 1, quantity: 1, unitPrice: 50_000 }] },
      { id: 11, items: [{ book: 1, quantity: 1, unitPrice: 45_000 }, { book: 3, quantity: 4, unitPrice: 10_000 }] },
    ]);
    assert.deepEqual(rows[0], { bookId: 1, orders: 2, units: 4, value: 195_000 });
    assert.deepEqual(rows[1], { bookId: 3, orders: 1, units: 4, value: 40_000 });
  });
});

describe("judul buku untuk laporan", () => {
  const fakeReq = (docs: Array<{ id: number; title: string; slug: string | null }>) => {
    const calls: Array<{ where?: unknown }> = [];
    const req = {
      payload: {
        find: async (args: { where?: unknown }) => {
          calls.push(args);
          return { docs };
        },
      },
    } as unknown as PayloadRequest;
    return { req, calls };
  };

  it("baris buku terhapus diberi judul tanpa ikut dicari", async () => {
    const { req, calls } = fakeReq([{ id: 5, title: "Sejarah", slug: "sejarah" }]);
    const titles = await fetchBookTitles(req, [5, DELETED_BOOK_ID, 7]);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].where, { id: { in: [5, 7] } });
    assert.deepEqual(titles.get(5), { title: "Sejarah", slug: "sejarah" });
    assert.deepEqual(titles.get(7), { title: "Judul terhapus (#7)", slug: null });
    assert.deepEqual(titles.get(DELETED_BOOK_ID), { title: "Judul terhapus", slug: null });
  });

  it("hanya baris buku terhapus: tidak ada kueri", async () => {
    const { req, calls } = fakeReq([]);
    const titles = await fetchBookTitles(req, [DELETED_BOOK_ID]);
    assert.equal(calls.length, 0);
    assert.equal(titles.get(DELETED_BOOK_ID)?.title, "Judul terhapus");
  });
});

describe("toCsv", () => {
  it("BOM, titik koma, kutip ganda, dan pencegahan rumus", () => {
    const csv = toCsv(["Judul", "Total"], [["Buku; \"Satu\"", 3], ["=SUM(A1)", 0]]);
    assert.ok(csv.startsWith("﻿\"Judul\";\"Total\"\r\n"));
    assert.ok(csv.includes('"Buku; ""Satu""";3\r\n'));
    assert.ok(csv.includes("\"'=SUM(A1)\";0\r\n"));
    assert.ok(csv.endsWith("\r\n"));
  });

  it("sel teks berkoma tetap satu sel (Excel dengan pemisah daftar koma)", () => {
    const csv = toCsv(["Judul", "Total"], [["Sejarah,=1+1,", 2], ["Sejarah,=WEBSERVICE(B2)", 4]]);
    assert.ok(csv.includes('"Sejarah,=1+1,";2\r\n'));
    assert.ok(csv.includes('"Sejarah,=WEBSERVICE(B2)";4\r\n'));
    // Dibaca dengan pemisah koma (kutip dihormati): tidak ada sel yang diawali "=".
    for (const line of csv.replace(/^﻿/, "").split("\r\n")) {
      const cells = line.match(/"(?:[^"]|"")*"[^,]*|[^,]+/g) ?? [];
      for (const c of cells) assert.ok(!c.startsWith("="), `sel diawali "=": ${c}`);
    }
  });

  it("angka tidak dikutip agar tetap terbaca sebagai angka", () => {
    assert.equal(toCsv(["Nilai"], [[195_000], [Number.NaN]]), "﻿\"Nilai\"\r\n195000\r\n\r\n");
  });
});
