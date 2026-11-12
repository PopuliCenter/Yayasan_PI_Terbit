import { type JSXConvertersFunction, RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

type Props = {
  data: unknown;
  className?: string;
  /**
   * Konverter tambahan, mis. untuk blok yang disisipkan di editor (blok Formulir).
   * RichText tidak bertanda 'use client', jadi konverter boleh mengembalikan komponen
   * server async.
   */
  converters?: JSXConvertersFunction;
};

/** Render teks kaya Lexical dengan gaya prosa situs. */
export function RichTextContent({ data, className, converters }: Props) {
  if (!data || typeof data !== "object" || !("root" in data)) return null;
  return (
    <RichText
      data={data as SerializedEditorState}
      className={`prose-populi ${className ?? ""}`}
      converters={converters}
    />
  );
}
