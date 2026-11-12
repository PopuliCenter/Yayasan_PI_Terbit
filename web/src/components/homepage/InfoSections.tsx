import Link from "next/link";
import type { ReactNode } from "react";
import { RichTextContent } from "@/components/RichTextContent";
import { formatDate } from "@/lib/format";
import type {
  CallToActionBlock,
  NewsBlock,
  NormalizedBlock,
  OrderStepsBlock,
  TextSectionBlock,
  TopicsBlock,
} from "@/lib/homepage-plan";
import { hasRichText } from "@/lib/richtext";
import type { Category, Post } from "@/payload-types";

/* -------------------------------------------------------------------------- */
/* Kerangka bersama                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Kerangka bagian. Biasa: `page-container` dengan jarak atas (sama dengan beranda lama).
 * Pita kertas: latar `bg-paper-2` selebar layar; semua token teks lolos AA di atasnya
 * (accent-700 hanya untuk angka langkah yang besar).
 */
export function Section({
  block,
  id,
  labelledBy,
  spacing = "pt-12",
  children,
}: {
  block: Pick<NormalizedBlock, "paperBand">;
  /** Target #jangkar bila bagian tidak punya judul yang membawa ID. */
  id?: string;
  labelledBy?: string;
  spacing?: string;
  children: ReactNode;
}) {
  if (block.paperBand) {
    return (
      <section id={id} aria-labelledby={labelledBy} className="mt-12 bg-paper-2 py-10">
        <div className="page-container">{children}</div>
      </section>
    );
  }
  return (
    <section id={id} aria-labelledby={labelledBy} className={`page-container ${spacing}`}>
      {children}
    </section>
  );
}

/** Garis pemisah di atas isi bagian, bila `rule`. */
export function Ruled({ rule, children }: { rule: boolean; children: ReactNode }) {
  return rule ? <div className="border-t border-line pt-8">{children}</div> : <>{children}</>;
}

const ruleClasses = (rule: boolean) => (rule ? " border-t border-line pt-8" : "");

/** href sudah lolos safeHref: path situs memakai next/link, selain itu <a> biasa. */
export function SmartLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Bagian                                                                      */
/* -------------------------------------------------------------------------- */

export function TopicsSection({ block, categories }: { block: TopicsBlock; categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <Section block={block} labelledBy={block.headingId} spacing="pt-14">
      <Ruled rule={block.rule}>
        <h2 id={block.headingId} className="text-xl font-semibold">
          {block.heading}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-6">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/kategori/${c.slug}`} className="link inline-flex min-h-11 items-center">
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </Ruled>
    </Section>
  );
}

export function OrderStepsSection({ block }: { block: OrderStepsBlock }) {
  const link = block.linkHref ? (
    <SmartLink href={block.linkHref} className="link">
      {block.linkLabel}
    </SmartLink>
  ) : null;
  return (
    <Section block={block} labelledBy={block.headingId}>
      <div className={`grid gap-8${ruleClasses(block.rule)} md:grid-cols-12`}>
        <div className="md:col-span-4">
          <h2 id={block.headingId} className="text-xl font-semibold">
            {block.heading}
          </h2>
          {block.intro ? <p className="mt-2 text-sm text-muted">{block.intro}</p> : null}
        </div>
        <div className="md:col-span-8">
          {block.steps.length > 0 ? (
            <ol className="space-y-6">
              {block.steps.map((step, i) => (
                <li key={`${i}-${step.title}`} className="flex gap-5">
                  <span aria-hidden className="w-6 shrink-0 font-serif text-2xl leading-none text-accent-700">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-semibold">
                      <span className="sr-only">Langkah {i + 1}: </span>
                      {step.title}
                    </h3>
                    {step.body ? <p className="mt-1 leading-relaxed">{step.body}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
          {block.note || link ? (
            <p className="mt-6 pl-11 text-sm">
              {block.note}
              {block.note && link ? " " : null}
              {link}
            </p>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

export function CallToActionSection({ block }: { block: CallToActionBlock }) {
  const paragraphs = block.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const button = block.buttonHref && block.buttonLabel ? block.buttonHref : null;
  return (
    <Section block={block} labelledBy={block.headingId}>
      <div className={`grid gap-6${ruleClasses(block.rule)} md:grid-cols-12`}>
        <h2 id={block.headingId} className="text-xl font-semibold md:col-span-4">
          {block.heading}
        </h2>
        <div className="md:col-span-8">
          {paragraphs.map((text, i) => (
            <p key={i} className={i === 0 ? "max-w-2xl leading-relaxed" : "mt-4 max-w-2xl leading-relaxed"}>
              {text}
            </p>
          ))}
          {button ? (
            <SmartLink href={button} className={`${block.buttonStyle === "solid" ? "btn-primary" : "btn-outline"} mt-5`}>
              {block.buttonLabel}
            </SmartLink>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

export function NewsSection({ block, posts }: { block: NewsBlock; posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <Section block={block} labelledBy={block.headingId}>
      <div className={`flex items-baseline justify-between gap-4${ruleClasses(block.rule)}`}>
        <h2 id={block.headingId} className="text-xl font-semibold">
          {block.heading}
        </h2>
        <Link href="/kabar" className="link inline-flex min-h-11 shrink-0 items-center text-sm">
          {block.allLinkLabel}
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-line">
        {posts.map((post) => (
          <li key={post.id} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
            <p className="text-sm text-muted">
              <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>
            </p>
            <div>
              <h3 className="text-lg font-semibold leading-snug">
                <Link href={`/kabar/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h3>
              {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm">{post.excerpt}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function TextSection({ block }: { block: TextSectionBlock }) {
  if (!hasRichText(block.content)) return null;
  const heading = block.heading ? (
    <h2
      id={block.headingId}
      className={block.columns === "split" ? "text-xl font-semibold md:col-span-4" : "text-xl font-semibold"}
    >
      {block.heading}
    </h2>
  ) : null;
  const labelledBy = block.heading ? block.headingId : undefined;
  // Tanpa judul, ID jangkar dipasang di <section> agar /#jangkar tetap punya target.
  const sectionId = block.heading ? undefined : block.headingId;

  if (block.columns === "single") {
    return (
      <Section block={block} id={sectionId} labelledBy={labelledBy}>
        <Ruled rule={block.rule}>
          {heading}
          <RichTextContent data={block.content} className={heading ? "mt-4 max-w-3xl" : "max-w-3xl"} />
        </Ruled>
      </Section>
    );
  }
  return (
    <Section block={block} id={sectionId} labelledBy={labelledBy}>
      <div className={`grid gap-6${ruleClasses(block.rule)} md:grid-cols-12`}>
        {heading}
        <div className={heading ? "md:col-span-8" : "md:col-span-8 md:col-start-5"}>
          <RichTextContent data={block.content} className="max-w-2xl" />
        </div>
      </div>
    </Section>
  );
}
