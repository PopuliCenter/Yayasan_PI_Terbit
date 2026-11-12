type Props = {
  status: "draft" | "published" | null;
  warnings: readonly string[];
};

/** Bilah keterangan tenang di atas Beranda, hanya untuk admin yang sedang mempratinjau. */
export function HomePreviewNotes({ status, warnings }: Props) {
  return (
    <div role="status" className="border-b border-line bg-paper-2 text-sm">
      <div className="page-container py-3">
        <p className="font-semibold text-ink">Pratinjau Beranda</p>
        <p className="text-body">
          {status === "draft"
            ? "Ini draf. Pengunjung masih melihat versi tayang terakhir sampai Anda menekan Tayangkan."
            : "Sama dengan versi yang sedang tayang."}
        </p>
        {warnings.length > 0 ? (
          <ul className="mt-1 list-disc pl-5 text-body">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
