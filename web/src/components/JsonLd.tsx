/**
 * Data terstruktur di HTML awal (F-KAT-03). `<` di-escape agar isi dari CMS
 * tidak bisa menutup tag <script> lebih awal.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
