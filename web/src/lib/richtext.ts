type LexicalNode = { text?: unknown; children?: unknown; type?: unknown };

/**
 * Ambil teks polos dari dokumen Lexical, untuk deskripsi mesin pencari dan
 * data terstruktur. Paragraf dipisah spasi.
 */
export const lexicalToPlainText = (value: unknown, maxLength?: number): string => {
  const parts: string[] = [];

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as LexicalNode;
    if (typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.children)) {
      n.children.forEach(walk);
      if (n.type === "paragraph" || n.type === "heading" || n.type === "listitem") parts.push(" ");
    }
  };

  const root = (value as { root?: unknown } | null)?.root;
  walk(root);

  const text = parts.join("").replace(/\s+/g, " ").trim();
  if (!maxLength || text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length)}…`;
};

export const hasRichText = (value: unknown): boolean => lexicalToPlainText(value).length > 0;
