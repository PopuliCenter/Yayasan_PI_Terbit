/**
 * Menerapkan konten resmi (halaman, formulir retur, isian Pengaturan) ke basis data.
 *
 * Dipakai dua jalur:
 * - `npm run isi-konten` (staging/produksi): halaman dibuat atau ditimpa sebagai DRAF,
 *   jadi pengunjung baru melihatnya setelah admin meninjau dan menekan Tayangkan.
 * - `npm run seed` (lokal/CI): halaman langsung tayang.
 *
 * Aturan aman: halaman yang sudah ada hanya ditimpa bila `timpa` (versi lama tetap ada di
 * riwayat Versi); formulir yang sudah ada tidak pernah diubah; Pengaturan hanya diisi pada
 * kolom yang masih kosong atau placeholder.
 */
import type { Payload } from "payload";
import { HALAMAN, FORMULIR_RETUR, type DefHalaman } from "./halaman";
import { susunPengaturan } from "./pengaturan";
import { keLexical } from "./teks";

export type OpsiTerapkan = {
  /** true: langsung tayang (seed). false: simpan sebagai draf. */
  tayang: boolean;
  /** Timpa halaman yang sudah ada (sebagai versi baru). */
  timpa: boolean;
  /** Isi kolom Pengaturan yang masih kosong/placeholder. */
  pengaturan: boolean;
  log: (pesan: string) => void;
};

export type Ringkasan = {
  dibuat: string[];
  ditimpa: string[];
  dilewati: string[];
  pengaturanDiisi: string[];
  tertunda: string[];
};

const teksKonfirmasi = (kalimat: string) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [{ type: "text", text: kalimat, format: 0, detail: 0, mode: "normal", style: "", version: 1 }],
      },
    ],
  },
});

/** ID formulir retur; dibuat bila belum ada (dicari menurut judul). */
const pastikanFormulirRetur = async (payload: Payload, log: OpsiTerapkan["log"]): Promise<number | string> => {
  const ada = await payload.find({
    collection: "forms",
    where: { title: { equals: FORMULIR_RETUR.title } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (ada.docs[0]) {
    log(`formulir "${FORMULIR_RETUR.title}" sudah ada (#${ada.docs[0].id}), dipakai apa adanya`);
    return ada.docs[0].id;
  }
  const f = FORMULIR_RETUR;
  const dibuat = await payload.create({
    collection: "forms",
    overrideAccess: true,
    data: {
      title: f.title,
      submitButtonLabel: f.submitButtonLabel,
      confirmationType: "message",
      confirmationMessage: teksKonfirmasi(f.confirmationMessage),
      purpose: f.purpose,
      requireConsent: true,
      consentLabel: f.consentLabel,
      consentVersion: "1.0",
      retentionDays: f.retentionDays,
      acceptingResponses: true,
      fields: f.fields.map((fl) => ({
        blockType: fl.blockType,
        name: fl.name,
        label: fl.label,
        required: fl.required,
        ...(fl.width ? { width: fl.width } : {}),
        ...(fl.options ? { options: fl.options } : {}),
      })),
    } as never,
  });
  log(`formulir "${f.title}" dibuat (#${dibuat.id})`);
  return dibuat.id;
};

const dataHalaman = (def: DefHalaman, formId: number | string | undefined, tayang: boolean) => ({
  title: def.title,
  slug: def.slug,
  summary: def.summary,
  content: keLexical(
    def.naskah,
    formId === undefined ? undefined : { formId, heading: FORMULIR_RETUR.heading, intro: FORMULIR_RETUR.intro },
  ),
  showInFooter: true,
  footerOrder: def.footerOrder,
  // Draf: tanggal berlaku dikosongkan (juga saat menimpa halaman lama), lalu diisi otomatis
  // saat admin menekan Tayangkan (hook isiTanggalBerlaku di Pages). Seed langsung tayang.
  ...(def.policyVersion
    ? { policyVersion: def.policyVersion, policyEffectiveDate: tayang ? new Date().toISOString() : null }
    : {}),
  _status: tayang ? ("published" as const) : ("draft" as const),
});

export async function terapkanKonten(payload: Payload, opsi: OpsiTerapkan): Promise<Ringkasan> {
  const r: Ringkasan = { dibuat: [], ditimpa: [], dilewati: [], pengaturanDiisi: [], tertunda: [] };

  if (opsi.pengaturan) {
    const s = await payload.findGlobal({ slug: "settings", depth: 0, overrideAccess: true });
    const { patch, tertunda } = susunPengaturan(s as never);
    if (Object.keys(patch).length > 0) {
      await payload.updateGlobal({ slug: "settings", data: patch as never, overrideAccess: true });
    }
    r.pengaturanDiisi = Object.keys(patch);
    r.tertunda = tertunda;
  }

  const butuhFormulir = HALAMAN.some((h) => h.naskah.some((s) => s.t === "form"));
  const formId = butuhFormulir ? await pastikanFormulirRetur(payload, opsi.log) : undefined;

  for (const def of HALAMAN) {
    const ada = await payload.find({
      collection: "pages",
      where: { slug: { in: [def.slug, ...(def.slugLama ?? [])] } },
      draft: true,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const pakaiForm = def.naskah.some((s) => s.t === "form") ? formId : undefined;
    const data = dataHalaman(def, pakaiForm, opsi.tayang);
    const lama = ada.docs[0];
    if (!lama) {
      await payload.create({ collection: "pages", overrideAccess: true, draft: !opsi.tayang, data: data as never });
      r.dibuat.push(def.slug);
    } else if (opsi.timpa) {
      await payload.update({
        collection: "pages",
        id: lama.id,
        overrideAccess: true,
        draft: !opsi.tayang,
        data: data as never,
      });
      r.ditimpa.push(lama.slug === def.slug ? def.slug : `${lama.slug} → ${def.slug}`);
    } else {
      r.dilewati.push(def.slug);
    }
  }
  return r;
}
