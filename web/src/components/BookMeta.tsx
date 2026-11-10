import type { Book } from "@/payload-types";
import { AVAILABILITY, formatRupiah } from "@/lib/format";
import { getDisplayPrice } from "@/lib/pricing";

const TONE: Record<string, string> = {
  ok: "bg-green-50 text-ok ring-green-200",
  warn: "bg-amber-50 text-warn ring-amber-200",
  off: "bg-stone-100 text-off ring-stone-200",
  info: "bg-blue-50 text-info ring-blue-200",
};

export function AvailabilityBadge({ value }: { value: Book["availability"] }) {
  const meta = AVAILABILITY[value] ?? AVAILABILITY.tersedia;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE[meta.tone]}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

type PriceProps = {
  book: Pick<Book, "price" | "listPrice" | "discountStart" | "discountEnd">;
  size?: "sm" | "lg";
};

export function PriceTag({ book, size = "sm" }: PriceProps) {
  const { price, compareAt, percentOff } = getDisplayPrice(book);
  const big = size === "lg";
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={big ? "text-2xl font-bold text-ink" : "font-semibold text-ink"}>
        {compareAt ? <span className="sr-only">Harga sekarang </span> : null}
        {formatRupiah(price)}
      </span>
      {compareAt ? (
        <>
          <s className={big ? "text-base text-muted" : "text-sm text-muted"}>
            <span className="sr-only">Harga normal </span>
            {formatRupiah(compareAt)}
          </s>
          <span className="rounded bg-accent-100 px-1.5 py-0.5 text-xs font-bold text-accent-800">
            −{percentOff}%
          </span>
        </>
      ) : null}
    </p>
  );
}
