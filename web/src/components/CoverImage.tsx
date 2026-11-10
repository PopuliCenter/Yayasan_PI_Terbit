import type { Media } from "@/payload-types";
import { mediaPath } from "@/lib/site";

type Props = {
  media: Media | number | null | undefined;
  /** Atribut `sizes` untuk srcset, mis. "(min-width: 768px) 25vw, 50vw". */
  sizes: string;
  className?: string;
  /** Gambar LCP di atas lipatan: muat segera dengan prioritas tinggi. */
  priority?: boolean;
  alt?: string;
};

const SIZE_ORDER = ["thumbnail", "card", "detail"] as const;

/**
 * Sampul memakai <img> biasa dengan srcset dari ukuran yang sudah dibuat Payload
 * (WebP 200/420/800 px). Optimasi gambar Next tidak dipakai agar tidak ada
 * pemrosesan ganda dan server tidak perlu mengambil gambar dari dirinya sendiri.
 * Lebar/tinggi asli selalu diisi untuk mencegah CLS.
 */
export function CoverImage({ media, sizes, className, priority, alt }: Props) {
  if (!media || typeof media !== "object" || !media.url) {
    return (
      <div
        className={`flex aspect-[2/3] items-center justify-center bg-paper-2 text-sm text-muted ${className ?? ""}`}
        role="img"
        aria-label={alt ?? "Sampul belum tersedia"}
      >
        <span aria-hidden>Sampul belum tersedia</span>
      </div>
    );
  }

  const candidates = SIZE_ORDER.map((name) => media.sizes?.[name])
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.url && s?.width))
    .map((s) => `${mediaPath(s.url)} ${s.width}w`);
  if (media.width) candidates.push(`${mediaPath(media.url)} ${media.width}w`);

  const src = mediaPath(media.sizes?.card?.url) ?? mediaPath(media.url) ?? "";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- lihat komentar komponen
    <img
      src={src}
      srcSet={candidates.length > 1 ? candidates.join(", ") : undefined}
      sizes={candidates.length > 1 ? sizes : undefined}
      width={media.width ?? 420}
      height={media.height ?? 630}
      alt={alt ?? media.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
