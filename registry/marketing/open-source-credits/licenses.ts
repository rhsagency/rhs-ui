export interface OpenSourcePackage {
  /** The package's name as its registry lists it: "react", "@scope/name". */
  name: string;
  /** The version in use: "19.2.0". */
  version: string;
  /** The SPDX identifier of its licence: "MIT", "Apache-2.0", "BSD-3-Clause". A dual licence is an expression, "MIT OR Apache-2.0", and each part opens its own text. */
  license: string;
  /** Its repository or home page. The package's name links to it. */
  repository?: string;
}

/** The parts of a licence expression and the word that joins them: "MIT OR Apache-2.0" is two parts joined by "or". */
export function licenseParts(expression: string): { parts: string[]; joiner: "or" | "and" } {
  const text = expression.replace(/[()]/g, " ").trim();
  const joiner = /\sAND\s/i.test(text) && !/\sOR\s/i.test(text) ? "and" : "or";
  const parts = text.split(/\s+(?:OR|AND)\s+/i).map((part) => part.trim()).filter(Boolean);
  return { parts: parts.length ? parts : [expression.trim()], joiner };
}

/**
 * The family a licence belongs to, so that BSD-2-Clause and BSD-3-Clause sit
 * together and Apache-2.0 is simply Apache. A dual licence goes with its first
 * part. Anything the rules do not know is its own family, named by the
 * identifier without its version.
 */
export function licenseFamily(expression: string): string {
  const id = licenseParts(expression).parts[0] ?? expression.trim();
  if (/^\d*BSD/i.test(id)) return "BSD";
  if (/^Apache/i.test(id)) return "Apache";
  if (/^CC(0|-)/i.test(id)) return "Creative Commons";
  const word = id.split("-")[0] ?? id;
  return word.replace(/[\d.]+$/, "") || id;
}

/** A line that opens a list item, which never continues the line above it. */
const LIST_ITEM = /^(?:[-*]|\d{1,2}[.)]|\(?[a-z0-9]{1,3}\))\s/i;

const indentOf = (line: string) => line.length - line.trimStart().length;

/**
 * A licence text for the screen. Most are wrapped by hand at about 80 columns, and a narrow screen wraps them a second
 * time, into stubs: "to deal", "rights". In a paragraph that was wrapped like that, the breaks after a full line are
 * joined into spaces, and so is the hanging indent of a numbered clause. Everything else keeps its line breaks: blank
 * lines, a short line (a copyright line, an address), a list, and any block that is indented as a whole, such as a code
 * sample. The words are never touched, and the text the copy button copies is the one you gave.
 */
export function reflowLicense(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  // The width the text was wrapped at is its longest line, leaving out the odd long one: a URL, a paragraph nobody wrapped.
  const width = lines.reduce((widest, line) => (line.length <= 100 ? Math.max(widest, line.length) : widest), 0);
  // Nothing was wrapped by hand when even the longest line is short: a pair of copyright lines is not a paragraph.
  if (width < 60) return lines.join("\n");

  const out: string[] = [];
  let block: string[] = [];
  const closeBlock = () => {
    // A paragraph starts flush left and its other lines share one indent: none at all, or a hanging one.
    const hanging = block.slice(1).map(indentOf);
    const wrapped = block.length > 1 && indentOf(block[0] ?? "") === 0 && hanging.every((indent) => indent === hanging[0]);
    if (!wrapped) {
      out.push(...block);
    } else {
      out.push(block[0] ?? "");
      for (let index = 1; index < block.length; index++) {
        const before = (block[index - 1] ?? "").trimEnd();
        const line = (block[index] ?? "").trimStart();
        const next = line.split(/\s/, 1)[0] ?? "";
        // A full line is within a word or two of the widest, or leaves no room for the word that follows it.
        const full = before.length >= width - 16 || before.length + 1 + next.length > width;
        if (full && !LIST_ITEM.test(line)) out[out.length - 1] = `${out[out.length - 1] ?? ""} ${line}`;
        else out.push(block[index] ?? "");
      }
    }
    block = [];
  };
  for (const line of lines) {
    if (line.trim() === "") {
      closeBlock();
      out.push(line);
    } else block.push(line);
  }
  closeBlock();
  return out.join("\n");
}
