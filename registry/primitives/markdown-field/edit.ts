export type MarkdownAction = "bold" | "italic" | "link" | "bulleted-list" | "numbered-list" | "quote" | "code";

/** A text and what is selected in it, as positions between characters. A caret is a selection with the same start and end. */
export interface Selection {
  value: string;
  start: number;
  end: number;
}

/** A change to make: the characters from `from` to `to` become `text`, and afterwards `start` to `end` is selected (positions in the changed text). */
export interface Edit {
  from: number;
  to: number;
  text: string;
  start: number;
  end: number;
}

const WORD_CHAR = /[\p{L}\p{N}_]/u;

/** A caret inside or at the end of a word stands for the word, so Bold on a caret makes the word bold. */
function expandToWord(selection: Selection): Selection {
  if (selection.start !== selection.end) return selection;
  let start = selection.start;
  let end = selection.end;
  while (start > 0 && WORD_CHAR.test(selection.value.charAt(start - 1))) start -= 1;
  while (end < selection.value.length && WORD_CHAR.test(selection.value.charAt(end))) end += 1;
  return { ...selection, start, end };
}

/**
 * Wraps the selection in a pair of markers, or takes them off when they are
 * already there, just outside the selection or in it. Spaces at the edges of
 * the selection stay outside the markers, because `** bold**` is not bold. With
 * nothing selected the markers go around a placeholder that is selected, so
 * typing replaces it.
 */
function wrap(selection: Selection, open: string, close: string, placeholder: string): Edit {
  const { value, start, end } = expandToWord(selection);
  const selected = value.slice(start, end);
  if (start >= open.length && value.slice(start - open.length, start) === open && value.slice(end, end + close.length) === close) {
    const from = start - open.length;
    return { from, to: end + close.length, text: selected, start: from, end: from + selected.length };
  }
  if (selected.length >= open.length + close.length && selected.startsWith(open) && selected.endsWith(close)) {
    const inner = selected.slice(open.length, selected.length - close.length);
    return { from: start, to: end, text: inner, start, end: start + inner.length };
  }
  const core = selected.trim();
  if (!core) {
    return { from: start, to: end, text: open + placeholder + close, start: start + open.length, end: start + open.length + placeholder.length };
  }
  const lead = selected.length - selected.trimStart().length;
  const trail = selected.length - selected.trimEnd().length;
  const text = selected.slice(0, lead) + open + core + close + selected.slice(selected.length - trail);
  const from = start + lead + open.length;
  return { from: start, to: end, text, start: from, end: from + core.length };
}

/** Several lines of code become a fenced block, on lines of their own; a fenced block that is selected whole loses its fences. */
function fence(selection: Selection): Edit {
  const { value, start, end } = selection;
  const selected = value.slice(start, end);
  const fenced = /^```[\w-]*\n([\s\S]*?)\n?```$/.exec(selected.trim());
  if (fenced) {
    const inner = fenced[1] ?? "";
    return { from: start, to: end, text: inner, start, end: start + inner.length };
  }
  const before = start > 0 && value.charAt(start - 1) !== "\n" ? "\n" : "";
  const after = end < value.length && value.charAt(end) !== "\n" ? "\n" : "";
  const inside = start + before.length + 4;
  return { from: start, to: end, text: `${before}\`\`\`\n${selected}\n\`\`\`${after}`, start: inside, end: inside + selected.length };
}

function code(selection: Selection): Edit {
  return selection.value.slice(selection.start, selection.end).includes("\n") ? fence(selection) : wrap(selection, "`", "`", "code");
}

/** [text](https://): the selected text becomes the label, a copied address becomes the target, and the part still to be written is selected. */
function link(selection: Selection): Edit {
  const { value, start, end } = selection;
  const selected = value.slice(start, end).trim();
  if (/^https?:\/\/\S+$/i.test(selected)) {
    return { from: start, to: end, text: `[link text](${selected})`, start: start + 1, end: start + 1 + "link text".length };
  }
  if (selected) {
    const at = start + selected.length + 3;
    return { from: start, to: end, text: `[${selected}](https://)`, start: at, end: at + "https://".length };
  }
  return { from: start, to: end, text: "[link text](https://)", start: start + 1, end: start + 1 + "link text".length };
}

const BULLET = /^(\s*)[-*+]\s+/;
const NUMBER = /^(\s*)\d+[.)]\s+/;
const QUOTE = /^(\s*)>\s?/;
const LIST_MARKER = /^(\s*)(?:[-*+]|\d+[.)])\s+/;

/**
 * Puts a marker in front of every line the selection touches, or takes it off
 * when every line has it already. A list marker replaces the other kind (a
 * bulleted line becomes numbered), blank lines are left alone, and numbers
 * count the lines that have one. A caret on an empty line starts the list.
 */
function prefixLines(selection: Selection, kind: "bullet" | "number" | "quote"): Edit {
  const { value, start, end } = selection;
  const from = value.lastIndexOf("\n", start - 1) + 1;
  // A selection that ends right after a line break (a triple click) does not include the line after it.
  const to = end > start && value.charAt(end - 1) === "\n" ? end - 1 : end;
  const found = value.indexOf("\n", to);
  const stop = found === -1 ? value.length : found;
  const block = value.slice(from, stop);
  const lines = block.split("\n");
  const own = kind === "bullet" ? BULLET : kind === "number" ? NUMBER : QUOTE;
  const filled = lines.filter((line) => line.trim() !== "");
  const allMarked = filled.length > 0 && filled.every((line) => own.test(line));
  let counted = 0;
  const changed = lines.map((line) => {
    if (line.trim() !== "" && allMarked) return line.replace(own, "$1");
    if (line.trim() === "" && lines.length > 1) return line;
    counted += 1;
    if (kind === "quote") return QUOTE.test(line) ? line : `${/^\s*/.exec(line)?.[0] ?? ""}> ${line.trimStart()}`;
    const indent = /^\s*/.exec(line)?.[0] ?? "";
    const marker = kind === "bullet" ? "- " : `${counted}. `;
    return indent + marker + line.replace(LIST_MARKER, "$1").trimStart();
  });
  const text = changed.join("\n");
  if (start === end && lines.length === 1) {
    const caret = Math.max(from, start + (text.length - block.length));
    return { from, to: stop, text, start: caret, end: caret };
  }
  return { from, to: stop, text, start: from, end: from + text.length };
}

/** What the toolbar button or shortcut for `action` does to the text. */
export function applyAction(action: MarkdownAction, selection: Selection): Edit {
  switch (action) {
    case "bold":
      return wrap(selection, "**", "**", "bold text");
    case "italic":
      return wrap(selection, "_", "_", "italic text");
    case "code":
      return code(selection);
    case "link":
      return link(selection);
    case "bulleted-list":
      return prefixLines(selection, "bullet");
    case "numbered-list":
      return prefixLines(selection, "number");
    case "quote":
      return prefixLines(selection, "quote");
  }
}


const ITEM = /^(\s*)(?:([-*+])|(\d+)([.)]))(\s+)(.*)$/;

/**
 * What Enter does on a line of a list: another item, numbered on from this one,
 * with whatever follows the caret moving down into it; or, on an item with
 * nothing in it, the end of the list. Null when the caret is not behind a
 * marker, so the line break is the browser's.
 */
export function continueList(selection: Selection): Edit | null {
  if (selection.start !== selection.end) return null;
  const { value, start } = selection;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const found = value.indexOf("\n", start);
  const lineEnd = found === -1 ? value.length : found;
  const match = ITEM.exec(value.slice(lineStart, lineEnd));
  if (!match) return null;
  const [, indent = "", bullet, number, delimiter = "", gap = " ", rest = ""] = match;
  const marker = bullet ?? `${number ?? ""}${delimiter}`;
  if (start - lineStart < indent.length + marker.length + gap.length) return null;
  if (rest.trim() === "") return { from: lineStart, to: lineEnd, text: "", start: lineStart, end: lineStart };
  const next = bullet ?? `${Number(number) + 1}${delimiter}`;
  const text = `\n${indent}${next} `;
  return { from: start, to: start, text, start: start + text.length, end: start + text.length };
}
