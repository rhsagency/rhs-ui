/** A change to make: the characters from `from` to `to` become `text`, and afterwards `start` to `end` is selected (positions in the changed text). */
export interface Edit {
  from: number;
  to: number;
  text: string;
  start: number;
  end: number;
}

/** One level of indentation: two spaces. */
export const INDENT = "  ";

const lineStartOf = (value: string, at: number) => value.lastIndexOf("\n", at - 1) + 1;

const lineEndOf = (value: string, at: number) => {
  const found = value.indexOf("\n", at);
  return found === -1 ? value.length : found;
};

/** How many lines a text has: one more than its line breaks. */
export function countLines(value: string): number {
  let lines = 1;
  for (let at = value.indexOf("\n"); at !== -1; at = value.indexOf("\n", at + 1)) lines += 1;
  return lines;
}

/** The lines a selection touches, from the start of the first to the end of the last. A selection that ends right after a line break does not touch the line behind it. */
function touched(value: string, start: number, end: number): { from: number; to: number; lines: string[] } {
  const from = lineStartOf(value, start);
  const last = end > start && value.charAt(end - 1) === "\n" ? end - 1 : end;
  const to = lineEndOf(value, last);
  return { from, to, lines: value.slice(from, to).split("\n") };
}

/**
 * What Tab does. With nothing selected it moves to the next tab stop with
 * spaces; with a selection it indents every line the selection touches (blank
 * lines stay blank) and keeps the selection, so Tab never replaces the text
 * that is selected.
 */
export function indent(value: string, start: number, end: number): Edit {
  if (start === end) {
    const column = start - lineStartOf(value, start);
    const pad = " ".repeat(INDENT.length - (column % INDENT.length));
    return { from: start, to: end, text: pad, start: start + pad.length, end: start + pad.length };
  }
  const { from, to, lines } = touched(value, start, end);
  const added = lines.map((line) => (line.trim() === "" ? 0 : INDENT.length));
  const text = lines.map((line, index) => (added[index] ? INDENT + line : line)).join("\n");
  const total = added.reduce((sum, count) => sum + count, 0);
  return { from, to, text, start: start === from ? start : start + (added[0] ?? 0), end: end + total };
}

/**
 * What Shift+Tab does: takes one level of indentation (up to two spaces, or a
 * tab) off every line the selection touches. Null when there is nothing to
 * take off.
 */
export function outdent(value: string, start: number, end: number): Edit | null {
  const { from, to, lines } = touched(value, start, end);
  const removed = lines.map((line) => (line.startsWith("\t") ? 1 : Math.min(INDENT.length, (/^ */.exec(line)?.[0] ?? "").length)));
  const total = removed.reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  const text = lines.map((line, index) => line.slice(removed[index] ?? 0)).join("\n");
  /** Where a position in the old text is in the new one. */
  const moved = (position: number) => {
    if (position > to) return position - total;
    let offset = from;
    let taken = 0;
    for (let index = 0; index < lines.length; index += 1) {
      const length = lines[index]?.length ?? 0;
      if (position <= offset + length) return position - taken - Math.min(removed[index] ?? 0, position - offset);
      offset += length + 1;
      taken += removed[index] ?? 0;
    }
    return position - total;
  };
  return { from, to, text, start: moved(start), end: moved(end) };
}

const CLOSERS: Record<string, string> = { "{": "}", "[": "]", "(": ")" };

/**
 * What Enter does: the new line starts at the indentation of the line it was
 * pressed on, one level deeper behind an opening bracket, and between a pair
 * of brackets the closing one drops to a line of its own with the caret on the
 * line between.
 */
export function newline(value: string, start: number, end: number): Edit {
  const from = lineStartOf(value, start);
  const before = value.slice(from, start);
  const lead = /^[ \t]*/.exec(before)?.[0] ?? "";
  const opener = before.trimEnd().slice(-1);
  const opens = opener in CLOSERS;
  const inner = lead + (opens ? INDENT : "");
  if (opens && value.charAt(end) === CLOSERS[opener]) {
    const caret = start + 1 + inner.length;
    return { from: start, to: end, text: `\n${inner}\n${lead}`, start: caret, end: caret };
  }
  const text = `\n${inner}`;
  return { from: start, to: end, text, start: start + text.length, end: start + text.length };
}
