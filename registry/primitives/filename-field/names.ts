/** A file name in its two parts. The extension keeps its dot: ".pdf". */
export interface NameParts {
  base: string;
  extension: string;
}

/** The words the field says, for another language or your own voice. Each can be replaced. */
export interface FileNameLabels {
  /** The name of the field for a screen reader when it has no label, id or aria-label of its own. */
  name: string;
  /** The name of the extension box when the extension can be edited. */
  extension: string;
  /** What the extension box shows while it is empty, so a file without an extension can be given one: ".ext". */
  extensionPlaceholder: string;
  /** Said when characters were refused; `what` lists them: "a slash (/)" or "a slash (/) or a colon (:)". */
  forbidden: (what: string) => string;
  /** Said when the name stopped at the longest allowed. */
  tooLong: (max: number) => string;
  /** Said when the extension was typed into the name, where it is already fixed. */
  duplicateExtension: (extension: string) => string;
  /** Said when a file of that name exists. */
  taken: (name: string) => string;
  /** The button that offers the next free name. */
  useFree: (name: string) => string;
  /** Said when the name is left empty. */
  empty: string;
  /** Said while the extension is not what it was. `from` is empty when the file had no extension, `to` is empty when it was taken away. */
  extensionChanged: (from: string, to: string) => string;
  /** What a screen reader hears with the fixed extension. */
  fixedExtension: (extension: string) => string;
}

export const DEFAULT_LABELS: FileNameLabels = {
  name: "File name",
  extension: "Extension",
  extensionPlaceholder: ".ext",
  forbidden: (what) => `Names cannot contain ${what}.`,
  tooLong: (max) => `Names can be up to ${max} characters.`,
  duplicateExtension: (extension) => `The extension stays ${extension}, so it is not needed here.`,
  taken: (name) => `A file called ${name} already exists.`,
  useFree: (name) => `Use ${name}`,
  empty: "A file needs a name.",
  extensionChanged: (from, to) => (to === "" ? `Removing ${from} can make the file hard to open.` : from === "" ? `Adding ${to} can make the file hard to open.` : `Changing ${from} to ${to} can make the file hard to open.`),
  fixedExtension: (extension) => `Extension ${extension}, fixed`,
};

/** What each character that cannot be in a file name is called, for the message. */
const FORBIDDEN: Record<string, string> = {
  "/": "a slash (/)",
  "\\": "a backslash (\\)",
  ":": "a colon (:)",
  "*": "an asterisk (*)",
  "?": "a question mark (?)",
  '"': 'a double quote (")',
  "<": "an angle bracket (<)",
  ">": "an angle bracket (>)",
  "|": "a vertical bar (|)",
};

const COMPOUND = [".tar.gz", ".tar.bz2", ".tar.xz", ".tar.zst"];

/** True for a character a file name cannot hold: the nine that file systems refuse and the control characters. */
const isRefused = (char: string) => FORBIDDEN[char] !== undefined || char < " " || char === "\u007f";

/** The refused characters in words: "a slash (/)", "a slash (/) or a colon (:)". */
export function describeRefused(chars: readonly string[]): string {
  const names = [...new Set(chars.map((char) => FORBIDDEN[char] ?? "a control character"))];
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/**
 * Cuts a name at its extension, the way a file manager does: at the last dot,
 * and for .tar.gz and its kin at the one before. A dot at the start (".env") or
 * at the end ("report.") is not an extension.
 */
export function splitName(name: string): NameParts {
  const lower = name.toLowerCase();
  for (const compound of COMPOUND) {
    if (lower.endsWith(compound) && name.length > compound.length) return { base: name.slice(0, -compound.length), extension: name.slice(-compound.length) };
  }
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return { base: name, extension: "" };
  return { base: name.slice(0, dot), extension: name.slice(dot) };
}

/**
 * What stays of text typed or pasted into the name: the characters a file name
 * cannot hold are dropped (and named), spaces at the start are dropped, and the
 * text stops at `max` characters. `caret` comes back moved to where the same
 * place is in the cleaned text, so a refused key does not throw the caret to the end.
 */
export function cleanName(raw: string, caret: number, max: number): { value: string; caret: number; refused: string[]; tooLong: boolean } {
  let value = "";
  let moved = 0;
  let index = 0;
  const refused: string[] = [];
  for (const char of raw) {
    index += char.length;
    if (isRefused(char)) {
      if (!refused.includes(char)) refused.push(char);
    } else if (value !== "" || !/\s/.test(char)) {
      value += char;
    }
    if (index <= caret) moved = value.length;
  }
  const chars = [...value];
  const tooLong = chars.length > max;
  if (tooLong) value = chars.slice(0, max).join("");
  return { value, caret: Math.min(moved, value.length), refused, tooLong };
}

/**
 * The extension as it is typed in its own box: a dot in front, nothing a file
 * name cannot hold, no spaces. A dot with nothing behind it is no extension, but
 * while the box is being typed in (`typing`) it is kept, so deleting an
 * extension down to its dot leaves the box as it is instead of emptying it
 * under the caret.
 */
export function cleanExtension(raw: string, typing = false): string {
  const body = [...raw].filter((char) => !isRefused(char) && !/\s/.test(char)).join("").replace(/^\.+/, "");
  if (body !== "") return `.${body}`;
  return typing && raw.includes(".") ? "." : "";
}

/** Whether a name is in the list, the way file systems compare: ignoring capitals. */
export function isTaken(name: string, taken: readonly string[]): boolean {
  const wanted = name.toLowerCase();
  return taken.some((entry) => entry.toLowerCase() === wanted);
}

/** The first name that is free: "report (2).pdf", "report (3).pdf". A name that already ends in a number counts on from it. */
export function nextFreeName(name: string, taken: readonly string[]): string {
  const { base, extension } = splitName(name);
  const found = / \((\d+)\)$/.exec(base);
  const stem = found ? base.slice(0, found.index) : base;
  for (let count = found ? Number(found[1]) + 1 : 2; count < 1000; count += 1) {
    const candidate = `${stem} (${count})${extension}`;
    if (!isTaken(candidate, taken)) return candidate;
  }
  return `${stem} (copy)${extension}`;
}
