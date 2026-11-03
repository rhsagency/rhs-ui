/**
 * What can be known about dragged files. While files are over the page the
 * browser tells us how many there are and each one's kind and MIME type, but
 * never a name, and on some platforms not even the type. After the drop the
 * files have names, and the check is exact.
 */

/** One entry of `dataTransfer.items`, as far as a drag reveals it. */
export interface DragItem {
  kind: string;
  type: string;
}

/** What a drag amounts to: how many files, and how many of them cannot match `accept`. */
export interface DragSummary {
  /** The files that are being dragged. 0 when the browser does not list them (Safari): the files are there, they just cannot be counted or judged. */
  files: number;
  /** Of those, the files that are certainly not what `accept` asks for. */
  refused: number;
}

/** The MIME types of the extensions people put in `accept`. */
const EXTENSION_TYPES: Readonly<Record<string, string>> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/** Platforms disagree about the type of these (a .csv is often application/vnd.ms-excel, a .zip application/x-zip-compressed), so a drag is never refused on the type alone when both are documents. */
const FLEXIBLE = new Set([".csv", ".txt", ".md", ".json", ".zip", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"]);

const AMBIGUOUS = new Set(["application", "text"]);

const family = (type: string) => type.split("/")[0] ?? "";

const rulesOf = (accept: string): string[] =>
  accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);

/** Whether a file, known by its name and type, is what `accept` asks for. The rules are those of the input's `accept` attribute. */
export function fileMatches(file: { name: string; type: string }, accept?: string): boolean {
  if (!accept) return true;
  const rules = rulesOf(accept);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

/** Whether a dragged file of this type could still match. It errs on the side of yes: a refusal stops the drop. */
function mayMatch(type: string, rules: readonly string[]): boolean {
  const actual = type.toLowerCase();
  // The platform did not say what it is.
  if (actual === "" || actual === "application/octet-stream") return true;
  return rules.some((rule) => {
    if (rule.startsWith(".")) {
      const known = EXTENSION_TYPES[rule];
      if (known === undefined || known === actual) return true;
      return FLEXIBLE.has(rule) && AMBIGUOUS.has(family(known)) && AMBIGUOUS.has(family(actual));
    }
    if (rule.endsWith("/*")) return actual.startsWith(rule.slice(0, -1));
    return actual === rule;
  });
}

/** Counts the files in a drag and how many of them certainly do not match `accept`. */
export function summariseDrag(items: ArrayLike<DragItem> | null | undefined, accept?: string): DragSummary {
  const files = items ? Array.from(items).filter((item) => item.kind === "file") : [];
  if (files.length === 0) return { files: 0, refused: 0 };
  const rules = accept ? rulesOf(accept) : [];
  const refused = rules.length === 0 ? 0 : files.filter((item) => !mayMatch(item.type, rules)).length;
  return { files: files.length, refused };
}

const KINDS: Readonly<Record<string, string>> = { "image/*": "images", "video/*": "videos", "audio/*": "audio", "text/*": "text files", "application/pdf": "PDF" };
const SUBTYPES: Readonly<Record<string, string>> = { jpeg: "JPG", "svg+xml": "SVG", plain: "TXT", msword: "DOC", zip: "ZIP", json: "JSON", csv: "CSV" };

/** An `accept` list in words: ".png,.jpg,application/pdf" becomes "PNG, JPG or PDF". */
export function describeAccept(accept: string): string {
  const words: string[] = [];
  for (const rule of rulesOf(accept)) {
    const subtype = rule.startsWith(".") ? rule.slice(1) : rule.split("/")[1];
    const word = KINDS[rule] ?? (subtype ? (SUBTYPES[subtype] ?? subtype.toUpperCase()) : rule);
    if (!words.includes(word)) words.push(word);
  }
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} or ${words[words.length - 1]}`;
}
