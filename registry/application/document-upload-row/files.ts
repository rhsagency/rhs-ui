/**
 * What the document row needs to know about a file before it is let through: whether it matches an
 * `accept` list, what that list says in words, and how big the file is. No React and no DOM, so the
 * module is safe to import anywhere.
 */

/** Whether a file matches an `accept` list such as ".pdf,image/*". An empty list accepts everything. */
export function acceptsFile(file: { name: string; type: string }, accept?: string): boolean {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

const KINDS: Record<string, string> = { "image/*": "image", "video/*": "video", "audio/*": "audio", "text/*": "text file" };
const SUBTYPES: Record<string, string> = { jpeg: "JPG", jpg: "JPG", "svg+xml": "SVG", webp: "WebP", heic: "HEIC", avif: "AVIF" };

/** An `accept` list in words: ".pdf,image/*" becomes "PDF or image". */
export function acceptWords(accept?: string): string {
  const words: string[] = [];
  for (const rule of (accept ?? "").split(",")) {
    const token = rule.trim().toLowerCase();
    if (!token) continue;
    const subtype = token.startsWith(".") ? token.slice(1) : token.split("/")[1];
    const word = KINDS[token] ?? (subtype ? (SUBTYPES[subtype] ?? subtype.toUpperCase()) : token);
    if (!words.includes(word)) words.push(word);
  }
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} or ${words[words.length - 1]}`;
}

/** A size in the reader's language: "820 kB", "2.4 MB". */
export function formatBytes(bytes: number, locale: string): string {
  const [amount, unit]: readonly [number, string] = bytes < 1000 ? [bytes, "byte"] : bytes < 1e6 ? [bytes / 1e3, "kilobyte"] : bytes < 1e9 ? [bytes / 1e6, "megabyte"] : [bytes / 1e9, "gigabyte"];
  const options: Intl.NumberFormatOptions = { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: unit === "byte" || unit === "kilobyte" ? 0 : 1 };
  try {
    return new Intl.NumberFormat(locale, options).format(amount);
  } catch {
    // An unknown locale must not take the page down.
    return new Intl.NumberFormat("en-US", options).format(amount);
  }
}

/** A share of 100 written as a percentage in the reader's language: 62 becomes "62%". */
export function formatPercent(percent: number, locale: string): string {
  const share = Math.min(1, Math.max(0, percent / 100));
  try {
    return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(share);
  } catch {
    return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(share);
  }
}
