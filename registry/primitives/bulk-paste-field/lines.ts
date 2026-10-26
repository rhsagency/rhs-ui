/** The words the field says, in its summary, its panel and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface BulkPasteLabels {
  /** The summary while there is nothing to count. */
  empty: string;
  /** The parts of the summary, each starting with its number: "38 valid", "2 invalid", "5 duplicates". */
  valid: (count: number) => string;
  invalid: (count: number) => string;
  duplicates: (count: number) => string;
  over: (count: number, max: number) => string;
  /** The count in the corner when there is a limit: "38 of 50". */
  counter: (valid: number, max: number) => string;
  removeDuplicates: string;
  removeInvalid: string;
  /** The action that drops what is past the limit. */
  trim: (max: number) => string;
  /** The title of the panel of lines that need attention. */
  problems: (count: number) => string;
  /** A line's name in the panel: "Line 7". */
  line: (number: number) => string;
  /** The reason on an invalid line when your own check gives none. */
  notValid: string;
  /** The reason on a line past the limit. */
  pastLimit: (max: number) => string;
  /** The button that shows more lines in the panel, and the one that folds them away again. */
  showMore: (count: number) => string;
  showFewer: string;
  /** Said under the panel when it has more lines than it lists. */
  andMore: (count: number) => string;
  /** The name of the button on a line in the panel. */
  goToLine: (number: number) => string;
  /** Said after the tidy actions. */
  removedDuplicates: (count: number) => string;
  removedInvalid: (count: number) => string;
  trimmed: (count: number) => string;
  undo: string;
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export const DEFAULT_LABELS: BulkPasteLabels = {
  empty: "One item per line. Paste a column from a spreadsheet, or a comma-separated list.",
  valid: (count) => `${count} valid`,
  invalid: (count) => `${count} invalid`,
  duplicates: (count) => `${count} ${plural(count, "duplicate", "duplicates")}`,
  over: (count, max) => `${count} over the limit of ${max}`,
  counter: (valid, max) => `${valid} of ${max}`,
  removeDuplicates: "Remove duplicates",
  removeInvalid: "Remove invalid",
  trim: (max) => `Keep the first ${max}`,
  problems: (count) => `${count} ${plural(count, "line needs", "lines need")} attention`,
  line: (number) => `Line ${number}`,
  notValid: "Not valid",
  pastLimit: (max) => `Past the limit of ${max}`,
  showMore: (count) => `Show ${count} more`,
  showFewer: "Show fewer",
  andMore: (count) => `and ${count} more`,
  goToLine: (number) => `Go to line ${number}`,
  removedDuplicates: (count) => `Removed ${count} ${plural(count, "duplicate", "duplicates")}.`,
  removedInvalid: (count) => `Removed ${count} invalid ${plural(count, "line", "lines")}.`,
  trimmed: (count) => `Removed ${count} ${plural(count, "line", "lines")} past the limit.`,
  undo: "Undo",
};

/** What became of one line. A plain object, not an enum, so a file that imports it works under any compiler. */
export const Kind = { Empty: 0, Valid: 1, Invalid: 2, Duplicate: 3, Over: 4 } as const;
export type Kind = (typeof Kind)[keyof typeof Kind];

export interface LineIssue {
  /** The line, counting from 1. */
  line: number;
  /** The line as it is in the text, trimmed. */
  text: string;
  /** Why it is listed, in words. */
  reason: string;
  kind: typeof Kind.Invalid | typeof Kind.Over;
}

export interface Analysis {
  /** What became of every line, in order: empty lines are 0. */
  kinds: Uint8Array;
  valid: number;
  invalid: number;
  duplicates: number;
  over: number;
  /** The clean list: normalised, valid, each once, in order, up to the limit. */
  items: string[];
  /** The invalid lines and the lines past the limit, in order, with their reasons. */
  issues: LineIssue[];
}

export interface AnalyseOptions {
  /** True or nothing when the line is fine, false for the default reason, or the reason in words. Gets the normalised line. */
  validate?: (line: string) => boolean | string | void;
  /** The line as it is compared and listed. Default: trimmed. */
  normalise?: (line: string) => string;
  /** The most valid items. Further valid lines are "over". */
  max?: number;
  labels?: BulkPasteLabels;
}

/** The text's lines. A trailing line break does not make an extra line to count, but it is a line of the text. */
export const splitLines = (text: string): string[] => text.split(/\r\n|\r|\n/);

/** Every line of the text sorted into valid, invalid, duplicate and over the limit. One pass, a Set for the duplicates: thousands of lines take a few milliseconds. */
export function analyse(text: string, { validate, normalise = (line) => line.trim(), max, labels = DEFAULT_LABELS }: AnalyseOptions = {}): Analysis {
  const lines = splitLines(text);
  const kinds = new Uint8Array(lines.length);
  const seen = new Set<string>();
  const items: string[] = [];
  const issues: LineIssue[] = [];
  let invalid = 0;
  let duplicates = 0;
  let over = 0;
  lines.forEach((raw, index) => {
    const item = normalise(raw);
    if (item === "") return;
    const verdict = validate?.(item);
    if (verdict !== undefined && verdict !== true) {
      kinds[index] = Kind.Invalid;
      invalid += 1;
      issues.push({ line: index + 1, text: item, reason: verdict === false || verdict === "" ? labels.notValid : verdict, kind: Kind.Invalid });
    } else if (seen.has(item)) {
      kinds[index] = Kind.Duplicate;
      duplicates += 1;
    } else if (max !== undefined && items.length >= max) {
      kinds[index] = Kind.Over;
      over += 1;
      issues.push({ line: index + 1, text: item, reason: labels.pastLimit(max), kind: Kind.Over });
    } else {
      kinds[index] = Kind.Valid;
      seen.add(item);
      items.push(item);
    }
  });
  return { kinds, valid: items.length, invalid, duplicates, over, items, issues };
}

/** The text without the lines of one kind, every other line left exactly as it was and in the same order. */
export function withoutKind(text: string, kinds: Uint8Array, kind: Kind): string {
  return splitLines(text)
    .filter((_, index) => kinds[index] !== kind)
    .join("\n");
}

/** What a paste becomes: commas, semicolons and tabs are line breaks, so a column from a spreadsheet and a comma list both give one item per line. Null when nothing needs changing. */
export function pasteAsLines(pasted: string): string | null {
  if (!/[,;\t]/.test(pasted)) return null;
  const endsWithBreak = /[\r\n]$/.test(pasted);
  const pieces = splitLines(pasted).flatMap((line) => line.split(/[,;\t]/));
  const clean = pieces.map((piece) => piece.trim()).filter(Boolean);
  return clean.join("\n") + (endsWithBreak && clean.length ? "\n" : "");
}

/** Where line `number` (from 1) starts and ends in the text, as character offsets, or null when there is no such line. */
export function lineRange(text: string, number: number): [number, number] | null {
  let start = 0;
  for (let line = 1; line < number; line += 1) {
    const next = text.indexOf("\n", start);
    if (next === -1) return null;
    start = next + 1;
  }
  const end = text.indexOf("\n", start);
  const stop = end === -1 ? text.length : end;
  // A line that ends in a carriage return keeps it out of the selection.
  return [start, text.charAt(stop - 1) === "\r" ? stop - 1 : stop];
}

/** How many lines the text has. */
export function countLines(text: string): number {
  let count = 1;
  for (let at = text.indexOf("\n"); at !== -1; at = text.indexOf("\n", at + 1)) count += 1;
  return count;
}
