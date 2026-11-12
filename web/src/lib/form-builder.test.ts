import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeExpiry,
  echoValues,
  errorSummary,
  INPUT_PREFIX,
  isFormOpen,
  isInternalPath,
  safeRedirectPath,
  toFieldName,
  toPublicForm,
  uniqueName,
  validateBuilderSubmission,
  type PublicField,
} from "./form-builder";

const DAY = 24 * 60 * 60 * 1000;

const field = (type: PublicField["type"], name: string, extra: Partial<PublicField> = {}): PublicField => ({
  type,
  id: `id-${name}`,
  name,
  label: name.toUpperCase(),
  required: false,
  width: null,
  ...extra,
});

const formData = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
};

const f = (name: string) => INPUT_PREFIX + name;

describe("toFieldName dan uniqueName", () => {
  it("label menjadi nama kolom teknis", () => {
    assert.equal(toFieldName("Nama Lengkap"), "nama_lengkap");
    assert.equal(toFieldName("  E-mail / WA  "), "e_mail_wa");
    assert.equal(toFieldName("Kota Asal (Kab./Kota)"), "kota_asal_kab_kota");
    assert.equal(toFieldName("Pekerjaan Ibu Rumah Tangga"), "pekerjaan_ibu_rumah_tangga");
    assert.equal(toFieldName("2 pilihan"), "f2_pilihan");
    assert.equal(toFieldName("Café"), "cafe");
    assert.equal(toFieldName("!!!"), "kolom");
    assert.ok(toFieldName("x".repeat(80)).length <= 40);
  });
  it("nama kembar diberi akhiran", () => {
    const seen = new Set<string>();
    assert.equal(uniqueName("nama", seen), "nama");
    assert.equal(uniqueName("nama", seen), "nama_2");
    assert.equal(uniqueName("nama", seen), "nama_3");
  });
});

describe("validateBuilderSubmission", () => {
  it("teks dan textarea: wajib, dipangkas, dipotong sesuai batas", () => {
    const fields = [field("text", "nama", { required: true }), field("textarea", "pesan")];
    const empty = validateBuilderSubmission(fields, formData({ [f("nama")]: "   " }));
    assert.equal(empty.ok, false);
    assert.equal(empty.fieldErrors.nama, "Wajib diisi.");

    const long = validateBuilderSubmission(fields, formData({ [f("nama")]: "a".repeat(400), [f("pesan")]: "b".repeat(6000) }));
    assert.equal(long.ok, true);
    assert.equal(long.data.find((d) => d.field === "nama")?.value.length, 300);
    assert.equal(long.data.find((d) => d.field === "pesan")?.value.length, 5000);
  });

  it("email divalidasi dan dibatasi 160 karakter", () => {
    const fields = [field("email", "surel", { required: true })];
    assert.equal(validateBuilderSubmission(fields, formData({ [f("surel")]: "bukan-email" })).ok, false);
    const ok = validateBuilderSubmission(fields, formData({ [f("surel")]: " nama@contoh.id " }));
    assert.deepEqual(ok.data, [{ field: "surel", label: "SUREL", value: "nama@contoh.id" }]);
  });

  it("angka boleh memakai koma desimal", () => {
    const fields = [field("number", "jumlah")];
    assert.equal(validateBuilderSubmission(fields, formData({ [f("jumlah")]: "12,5" })).ok, true);
    assert.equal(validateBuilderSubmission(fields, formData({ [f("jumlah")]: "12.5" })).ok, true);
    assert.equal(validateBuilderSubmission(fields, formData({ [f("jumlah")]: "dua belas" })).ok, false);
  });

  it("select dan radio hanya menerima pilihan yang ada", () => {
    const options = [
      { label: "Hadir", value: "hadir" },
      { label: "Tidak hadir", value: "tidak" },
    ];
    for (const type of ["select", "radio"] as const) {
      const fields = [field(type, "kehadiran", { options, required: true })];
      assert.equal(validateBuilderSubmission(fields, formData({ [f("kehadiran")]: "hadir" })).ok, true);
      const bad = validateBuilderSubmission(fields, formData({ [f("kehadiran")]: "<script>" }));
      assert.equal(bad.ok, false);
      assert.match(bad.fieldErrors.kehadiran, /pilihan yang tersedia/);
      assert.deepEqual(bad.data, []);
    }
  });

  it("tanggal harus TTTT-BB-HH yang ada di kalender", () => {
    const fields = [field("date", "tanggal")];
    assert.equal(validateBuilderSubmission(fields, formData({ [f("tanggal")]: "2026-12-01" })).ok, true);
    assert.equal(validateBuilderSubmission(fields, formData({ [f("tanggal")]: "2026-02-31" })).ok, false);
    assert.equal(validateBuilderSubmission(fields, formData({ [f("tanggal")]: "01/12/2026" })).ok, false);
  });

  it('kotak centang: "on" → Ya, kosong → Tidak, wajib harus dicentang', () => {
    const optional = [field("checkbox", "kabar")];
    assert.deepEqual(validateBuilderSubmission(optional, formData({ [f("kabar")]: "on" })).data, [
      { field: "kabar", label: "KABAR", value: "Ya" },
    ]);
    assert.deepEqual(validateBuilderSubmission(optional, formData({})).data, [
      { field: "kabar", label: "KABAR", value: "Tidak" },
    ]);
    const required = [field("checkbox", "setuju", { required: true })];
    assert.equal(validateBuilderSubmission(required, formData({})).ok, false);
  });

  it("kunci yang tidak dikenal diabaikan; blok pesan tidak menghasilkan data", () => {
    const fields = [field("text", "nama"), field("message", "")];
    const result = validateBuilderSubmission(
      fields,
      formData({ [f("nama")]: "Ani", [f("role")]: "admin", status: "selesai", consent: "on", website: "" }),
    );
    assert.deepEqual(result.data, [{ field: "nama", label: "NAMA", value: "Ani" }]);
    assert.deepEqual(Object.keys(result.values), ["nama"]);
  });

  it("isian tanpa awalan f_ tidak dibaca", () => {
    const result = validateBuilderSubmission([field("text", "nama", { required: true })], formData({ nama: "Ani" }));
    assert.equal(result.ok, false);
  });
});

describe("toPublicForm", () => {
  it("nama dinormalkan dan unik, opsi kosong dibuang, blok tak didukung dilewati", () => {
    const pf = toPublicForm({
      id: 7,
      title: "Daftar acara",
      purpose: "Pendaftaran acara",
      fields: [
        { id: "a", blockType: "text", name: "Nama Lengkap", label: "Nama lengkap", required: true, width: 50 },
        { id: "b", blockType: "text", name: "nama_lengkap", label: "Nama panggilan" },
        { id: "c", blockType: "select", name: "sesi", label: "Sesi", options: [{ label: "Pagi", value: "pagi" }, { label: "", value: "" }] },
        { id: "d", blockType: "country", name: "negara" },
        { id: "e", blockType: "message" },
        { blockType: "date", name: "tanggal", defaultValue: "2026-11-30T17:00:00.000Z" },
      ],
    });
    assert.deepEqual(
      pf.fields.map((x) => [x.type, x.name]),
      [
        ["text", "nama_lengkap"],
        ["text", "nama_lengkap_2"],
        ["select", "sesi"],
        ["message", ""],
        ["date", "tanggal"],
      ],
    );
    assert.equal(pf.fields[0].width, 50);
    assert.deepEqual(pf.fields[2].options, [{ label: "Pagi", value: "pagi" }]);
    assert.equal(pf.fields[4].id, "blok-6");
    assert.equal(pf.fields[4].defaultValue, "2026-12-01", "tanggal awal dibaca dalam WIB");
    assert.equal(pf.requireConsent, true);
  });
});

describe("isFormOpen", () => {
  const now = new Date("2026-11-11T05:00:00Z");
  it("ditutup manual atau melewati closesAt", () => {
    assert.equal(isFormOpen({}, now), true);
    assert.equal(isFormOpen({ acceptingResponses: false }, now), false);
    assert.equal(isFormOpen({ closesAt: "2026-11-11T04:59:00Z" }, now), false);
    assert.equal(isFormOpen({ closesAt: "2026-11-12T00:00:00Z" }, now), true);
  });
});

describe("computeExpiry", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const days = (d: Date) => Math.round((d.getTime() - now.getTime()) / DAY);
  it("masa simpan dibatasi 30–1095 hari, bawaan 365", () => {
    assert.equal(days(computeExpiry(now, 90)), 90);
    assert.equal(days(computeExpiry(now, 1)), 30);
    assert.equal(days(computeExpiry(now, 5000)), 1095);
    assert.equal(days(computeExpiry(now, null)), 365);
    assert.equal(days(computeExpiry(now, Number.NaN)), 365);
  });
});

describe("safeRedirectPath dan isInternalPath", () => {
  const custom = (url: string) => safeRedirectPath({ confirmationType: "redirect", redirect: { type: "custom", url } });
  it("hanya path internal", () => {
    assert.equal(custom("/terima-kasih"), "/terima-kasih");
    assert.equal(custom("//evil.com"), null);
    assert.equal(custom("https://evil.com/terima-kasih"), null);
    assert.equal(custom("/\\evil.com"), null);
    assert.equal(custom("javascript:alert(1)"), null);
    assert.equal(custom("/ada spasi"), null);
  });
  it("halaman rujukan memakai slug; tanpa pengalihan bila konfirmasi berupa pesan", () => {
    assert.equal(
      safeRedirectPath({
        confirmationType: "redirect",
        redirect: { type: "reference", reference: { relationTo: "pages", value: { slug: "terima-kasih" } } },
      }),
      "/terima-kasih",
    );
    assert.equal(
      safeRedirectPath({ confirmationType: "redirect", redirect: { type: "reference", reference: { value: 4 } } }),
      null,
    );
    assert.equal(safeRedirectPath({ confirmationType: "message", redirect: { url: "/x" } }), null);
  });
  it("isInternalPath", () => {
    assert.equal(isInternalPath("/acara"), true);
    assert.equal(isInternalPath("acara"), false);
    assert.equal(isInternalPath(42), false);
  });
});

describe("echoValues dan errorSummary", () => {
  it("echoValues hanya mengembalikan isian berawalan f_", () => {
    assert.deepEqual(echoValues(formData({ [f("nama")]: "Ani", _t: "token", website: "" })), { nama: "Ani" });
  });
  it("errorSummary membuang parameter kueri yang bisa berisi isian pengunjung", () => {
    const err = new Error("Failed query: insert into form_submissions values ($1)\nparams: ani@contoh.id");
    assert.equal(errorSummary(err).message.includes("ani@contoh.id"), false);
    assert.match(errorSummary(err).message, /Failed query/);
  });
});
