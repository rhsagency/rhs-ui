/**
 * The decisions and words behind FilePreview, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every number
 * that is written goes through the locale.
 */

/** The file to show. FilePreview never fetches: everything it shows comes from this. */
export interface PreviewFile {
  /** The name with its extension, as a person knows it: "Q3-review.pdf". The extension also picks the icon and the name of the type. */
  name: string;
  /** The MIME type: "application/pdf", "image/png". It decides how the file is shown. */
  mime: string;
  /** The size in bytes, written beside the name. */
  size?: number;
  /** Where the file is: an address, a blob URL or a data URI. Images, video, audio and PDFs are loaded from it, and Download saves it. */
  url: string;
  /** The content of a plain-text or code file. Give it to have the file read in place; FilePreview does not fetch it. A text file without it is offered for download. */
  text?: string;
  /** A still shown in a video before it plays. */
  poster?: string;
}

/** How a file is shown. */
export type PreviewKind = "image" | "pdf" | "video" | "audio" | "text" | "other";

/** The words the preview says, for translation. `{name}`, `{type}`, `{shown}` and `{total}` are filled in. */
export interface FilePreviewLabels {
  /** The name of the preview region; `{name}` and `{type}`. Default "Preview of {name}, {type}". */
  region?: string;
  /** The download button. Default "Download". */
  download?: string;
  /** The button that tries again. Default "Retry". */
  retry?: string;
  /** The link that opens a PDF in a tab of its own. Default "Open PDF". */
  openPdf?: string;
  /** Said to a screen reader after a link that opens a new tab. Default "(opens in a new tab)". */
  newTab?: string;
  /** What is said while a file loads; `{name}`. Default "Loading {name}". */
  loading?: string;
  /** What is said when it did not load; `{name}`. Default "{name} could not be loaded." */
  failed?: string;
  /** Said in place of the viewer where the browser cannot show PDFs, which is most phones. Default "This browser cannot show PDFs here. Open it in its own tab to read it." */
  pdfUnsupported?: string;
  /** Under a text file that was cut; `{shown}` and `{total}` are line counts. Default "Showing the first {shown} of {total} lines. Download the file to read the rest." */
  truncated?: string;
  /** The label above a text file, with its length; `{count}`. Default "{count} lines". */
  lines?: string;
  /** The same for a file of one line. Default "{count} line". */
  linesOne?: string;
  /** Under the name of a file that has no preview. Default "There is no preview for this kind of file." */
  noPreview?: string;
  /** The name of a type that is not in the list, `{type}` being the extension in capitals. Default "{type} file". */
  unknownType?: string;
  /** The name of a file without an extension. Default "File". */
  anyType?: string;
  /** Names of types by extension ("pdf", "docx"), replacing the English ones. */
  types?: Readonly<Record<string, string>>;
}

export const DEFAULT_LABELS = {
  region: "Preview of {name}, {type}",
  download: "Download",
  retry: "Retry",
  openPdf: "Open PDF",
  newTab: "(opens in a new tab)",
  loading: "Loading {name}",
  failed: "{name} could not be loaded.",
  pdfUnsupported: "This browser cannot show PDFs here. Open it in its own tab to read it.",
  truncated: "Showing the first {shown} of {total} lines. Download the file to read the rest.",
  lines: "{count} lines",
  linesOne: "{count} line",
  noPreview: "There is no preview for this kind of file.",
  unknownType: "{type} file",
  anyType: "File",
  types: {},
} satisfies Required<FilePreviewLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The extension of a file name in lower case, without the dot: "report.final.PDF" gives "pdf", "README" gives "". */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
}

/** How the file is shown: by its type first, and a file with `text` is read in place whatever its type says. */
export function kindOf(file: PreviewFile): PreviewKind {
  const mime = file.mime.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return file.text !== undefined ? "text" : "other";
}

const CODE = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "css", "scss", "html", "xml", "yml", "yaml", "toml", "sql", "sh", "bash", "py", "rb", "go", "rs", "java", "kt", "swift", "php", "c", "h", "cpp", "cs", "ini", "env", "graphql"]);
const SHEETS = new Set(["xls", "xlsx", "csv", "ods", "tsv", "numbers"]);
const SLIDES = new Set(["ppt", "pptx", "key", "odp"]);
const ARCHIVES = new Set(["zip", "gz", "tar", "tgz", "7z", "rar", "bz2", "xz"]);

/** Which icon stands for the file. The preview picks the glyph itself from this word. */
export type FileGlyph = "image" | "video" | "audio" | "document" | "sheet" | "slides" | "code" | "archive" | "file";

export function glyphOf(file: PreviewFile): FileGlyph {
  const kind = kindOf(file);
  const extension = extensionOf(file.name);
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  if (kind === "audio") return "audio";
  if (SHEETS.has(extension)) return "sheet";
  if (SLIDES.has(extension)) return "slides";
  if (ARCHIVES.has(extension)) return "archive";
  if (CODE.has(extension)) return "code";
  if (kind === "pdf" || kind === "text" || ["doc", "docx", "odt", "rtf", "txt", "md"].includes(extension)) return "document";
  return "file";
}

/** Whether a text file is code, which gets line numbers; prose and logs do not. */
export function isCode(file: PreviewFile): boolean {
  return CODE.has(extensionOf(file.name));
}

const TYPE_NAMES: Readonly<Record<string, string>> = {
  pdf: "PDF document",
  png: "PNG image",
  jpg: "JPEG image",
  jpeg: "JPEG image",
  gif: "GIF image",
  webp: "WebP image",
  avif: "AVIF image",
  svg: "SVG image",
  heic: "HEIC image",
  mp4: "MP4 video",
  webm: "WebM video",
  mov: "QuickTime video",
  mkv: "Matroska video",
  mp3: "MP3 audio",
  wav: "WAV audio",
  ogg: "Ogg audio",
  m4a: "M4A audio",
  flac: "FLAC audio",
  txt: "Plain text",
  md: "Markdown",
  json: "JSON",
  csv: "CSV file",
  xml: "XML",
  yml: "YAML",
  yaml: "YAML",
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  jsx: "JavaScript",
  ts: "TypeScript",
  tsx: "TypeScript",
  sql: "SQL",
  sh: "Shell script",
  py: "Python",
  log: "Log file",
  doc: "Word document",
  docx: "Word document",
  xls: "Excel spreadsheet",
  xlsx: "Excel spreadsheet",
  ppt: "PowerPoint presentation",
  pptx: "PowerPoint presentation",
  zip: "ZIP archive",
  gz: "GZip archive",
  tar: "TAR archive",
  "7z": "7-Zip archive",
  rar: "RAR archive",
};

/** The name of the file's type, in words: "PDF document". Taken from the extension, so it is the same for a file the browser could not name. */
export function typeName(file: PreviewFile, text: Required<FilePreviewLabels>): string {
  const extension = extensionOf(file.name);
  if (!extension) return text.anyType;
  return text.types[extension] ?? TYPE_NAMES[extension] ?? fill(text.unknownType, { type: extension.toUpperCase() });
}

/** A size as it is written beside a name: "2.4 MB", "520 B". The units are the international symbols; the locale writes the number. */
export function formatBytes(bytes: number, locale: string): string {
  const units = ["B", "kB", "MB", "GB"] as const;
  let value = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  // A no-break space keeps the number and its unit on one line.
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 0 ? 0 : value < 10 ? 1 : 0 }).format(value)}\u00a0${units[unit]}`;
}

/** The first `limit` lines of a text and how many it has: a very long file is cut, not drawn line by line. */
export function previewLines(text: string, limit: number): { shown: string; total: number; cut: boolean } {
  const lines = text.replace(/\n$/, "").split("\n");
  return lines.length > limit ? { shown: lines.slice(0, limit).join("\n"), total: lines.length, cut: true } : { shown: text, total: lines.length, cut: false };
}

/** A CSS length from what a person gave: a number is px, a string is taken as it is. */
export function lengthOf(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}
