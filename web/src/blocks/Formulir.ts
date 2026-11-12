import type { Block } from "payload";

/**
 * Blok "Formulir": menyisipkan formulir khusus (menu Konten → Formulir) ke halaman.
 * Dipakai BlocksFeature Lexical di Pages.content; tersimpan di kolom JSON, tanpa tabel.
 * Impor relatif saja: berkas ini dimuat payload.config lewat Pages.ts.
 */
export const FormulirBlock: Block = {
  slug: "formulir",
  interfaceName: "FormulirBlock",
  labels: { singular: "Formulir", plural: "Formulir" },
  fields: [
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      required: true,
      label: "Formulir",
      admin: { description: "Buat atau ubah isi formulir di menu Konten → Formulir." },
    },
    {
      name: "heading",
      type: "text",
      label: "Judul bagian (opsional)",
    },
    {
      name: "intro",
      type: "textarea",
      label: "Pengantar singkat (opsional)",
      maxLength: 400,
    },
  ],
};
