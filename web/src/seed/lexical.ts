/** Pembuat dokumen Lexical sederhana untuk data contoh. */

type Node = { type: string; version: number; [k: string]: unknown };

const text = (value: string, format = 0): Node => ({
  type: "text",
  text: value,
  format,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const block = (type: string, children: Node[], extra: Record<string, unknown> = {}): Node => ({
  type,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  ...extra,
});

export const p = (value: string): Node => block("paragraph", [text(value)], { textFormat: 0, textStyle: "" });
export const h2 = (value: string): Node => block("heading", [text(value)], { tag: "h2" });
export const h3 = (value: string): Node => block("heading", [text(value)], { tag: "h3" });

export const ul = (items: string[]): Node =>
  block(
    "list",
    items.map((item, i) => block("listitem", [text(item)], { value: i + 1 })),
    { listType: "bullet", tag: "ul", start: 1 },
  );

export const ol = (items: string[]): Node =>
  block(
    "list",
    items.map((item, i) => block("listitem", [text(item)], { value: i + 1 })),
    { listType: "number", tag: "ol", start: 1 },
  );

export const doc = (...children: Node[]) => ({
  root: { type: "root", format: "" as const, indent: 0, version: 1, direction: "ltr" as const, children },
});
