import type { ReactNode } from "react";
import { issueFormToken } from "@/lib/antibot";
import { blockId, isFormOpen, toPublicForm } from "@/lib/form-builder";
import { getPublicForm } from "@/lib/forms";
import { RichTextContent } from "../RichTextContent";
import { BotFields } from "./BotFields";
import { BuilderForm } from "./BuilderForm";

type Props = {
  /** Isi blok "formulir" (Lexical BlocksFeature atau blok halaman). */
  block: {
    form?: number | { id: number } | null;
    heading?: string | null;
    intro?: string | null;
  };
  /** Path halaman tempat blok tampil, mis. "/acara-peluncuran". */
  sourcePath: string;
  /** Pratinjau admin: formulir tampil nonaktif agar tidak membuat kiriman sungguhan. */
  preview?: boolean;
};

/**
 * Blok Formulir di halaman publik. Formulir dibaca ulang lewat Local API dengan aturan
 * akses publik, token anti-bot diterbitkan di server, dan teks kaya (pesan konfirmasi,
 * blok pesan) dirender di server lalu diteruskan ke komponen klien.
 */
export async function FormulirSection({ block, sourcePath, preview = false }: Props) {
  const id = typeof block.form === "object" && block.form !== null ? block.form.id : block.form;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) return null;
  const form = await getPublicForm(id);
  if (!form) return null;

  const headingId = `formulir-${form.id}-judul`;
  const open = isFormOpen(form);

  const messages: Record<string, ReactNode> = {};
  (form.fields ?? []).forEach((b, index) => {
    if (b.blockType === "message") {
      messages[blockId(b, index)] = <RichTextContent data={b.message} className="text-[0.95rem]" />;
    }
  });

  return (
    <section aria-labelledby={block.heading ? headingId : undefined} className="scroll-mt-24">
      {block.heading ? (
        <h2 id={headingId} className="text-2xl font-semibold text-ink">
          {block.heading}
        </h2>
      ) : null}
      {block.intro ? <p className="mt-2 text-muted">{block.intro}</p> : null}
      <div className="card mt-4 p-5 sm:p-8">
        {open ? (
          <BuilderForm
            form={toPublicForm(form)}
            sourcePath={sourcePath}
            disabled={preview}
            botFields={<BotFields issuedAt={issueFormToken()} />}
            success={form.confirmationType === "message" ? <RichTextContent data={form.confirmationMessage} /> : null}
            messages={messages}
          />
        ) : (
          <p className="text-[0.95rem] text-body">
            {form.closedMessage || "Formulir ini sudah ditutup. Terima kasih atas minat Anda."}
          </p>
        )}
      </div>
    </section>
  );
}
