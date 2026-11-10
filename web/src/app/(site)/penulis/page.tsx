import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CoverImage } from "@/components/CoverImage";
import type { Media } from "@/payload-types";
import { getAuthors } from "@/lib/data";

export const metadata: Metadata = {
  title: "Penulis",
  description: "Para penulis yang karyanya diterbitkan Penerbit Yayasan Populi Indonesia.",
  alternates: { canonical: "/penulis" },
};

export default async function AuthorsPage() {
  const authors = await getAuthors();

  return (
    <div className="page-container py-10">
      <Breadcrumbs items={[{ label: "Penulis" }]} />
      <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Penulis</h1>
      <p className="mt-3 max-w-2xl text-lg">Peneliti, akademisi, dan praktisi yang karyanya kami terbitkan.</p>

      {authors.length === 0 ? (
        <p className="card mt-8 p-6 text-muted">Daftar penulis sedang disiapkan.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((a) => {
            const photo = a.photo && typeof a.photo === "object" ? (a.photo as Media) : null;
            return (
              <li key={a.id} className="card relative flex gap-4 p-4 transition-colors hover:border-primary-300">
                {photo ? (
                  <CoverImage media={photo} sizes="64px" className="size-16 shrink-0 rounded-full object-cover" alt="" />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-100 font-serif text-xl font-semibold text-primary-800"
                  >
                    {a.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-semibold leading-snug">
                    <Link href={`/penulis/${a.slug}`} className="after:absolute after:inset-0 hover:text-primary-700">
                      {a.name}
                    </Link>
                  </h2>
                  {a.shortBio ? <p className="mt-1 line-clamp-2 text-sm text-muted">{a.shortBio}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
