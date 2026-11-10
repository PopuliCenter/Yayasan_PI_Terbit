import { RichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

type Props = {
  data: unknown;
  className?: string;
};

/** Render teks kaya Lexical dengan gaya prosa situs. */
export function RichTextContent({ data, className }: Props) {
  if (!data || typeof data !== "object" || !("root" in data)) return null;
  return (
    <RichText
      data={data as SerializedEditorState}
      className={`prose-populi ${className ?? ""}`}
    />
  );
}
