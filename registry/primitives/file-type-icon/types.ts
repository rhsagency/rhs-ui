/** The kinds of file the icon tells apart. Each has a glyph of its own, so no kind is told apart by colour alone. */
export type FileFamily = "document" | "sheet" | "slide" | "image" | "video" | "audio" | "archive" | "code" | "unknown";

const group = (family: FileFamily, extensions: string): [string, FileFamily][] => extensions.split(" ").map((extension) => [extension, family]);

/**
 * Which family a file extension belongs to, in lower case and without the dot.
 * It is a plain object: add your own at startup, `FILE_TYPES.blend = "image"`,
 * or change one, and every icon follows.
 */
export const FILE_TYPES: Record<string, FileFamily> = Object.fromEntries([
  ...group("document", "pdf doc docx odt rtf txt md markdown pages epub tex log"),
  ...group("sheet", "xls xlsx xlsm xlsb csv tsv ods numbers"),
  ...group("slide", "ppt pptx pps ppsx odp key"),
  ...group("image", "png jpg jpeg gif webp avif svg bmp tif tiff heic heif ico psd ai fig sketch raw"),
  ...group("video", "mp4 mov avi mkv webm m4v wmv flv mpg mpeg"),
  ...group("audio", "mp3 wav flac aac ogg m4a aiff aif opus wma mid midi"),
  ...group("archive", "zip rar 7z tar gz tgz bz2 xz dmg iso"),
  ...group("code", "js mjs cjs jsx ts tsx json jsonc html htm css scss less py rb go rs java kt swift c h cpp cs php sh bash sql yml yaml xml toml vue svelte"),
]);

/**
 * The extension that goes with a MIME type, for a file that comes with a type
 * and no useful name. Also a plain object to extend.
 */
export const MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/gzip": "gz",
  "application/x-tar": "tar",
  "application/x-7z-compressed": "7z",
  "application/vnd.rar": "rar",
  "application/json": "json",
  "application/xml": "xml",
  "application/javascript": "js",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/html": "html",
  "text/css": "css",
  "text/markdown": "md",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
};

/** What a MIME type with no entry of its own still tells: its first part. */
const PREFIXES: Record<string, FileFamily> = { image: "image", video: "video", audio: "audio", text: "document" };

/** An entry of one of the tables above, and never something every object has: a file called "notes.constructor" is not a family. */
function entry<T>(table: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * "report-final.XLSX" becomes "xlsx", "archive.tar.gz" becomes "gz", and a name with no extension, or a dotfile, becomes "".
 * So does a title that only has a dot in it ("Dr. Smith's notes", "Invoice no. 4821", "Notes 2024.11.05"): what follows the last
 * dot counts only when it looks like an extension, one to eight letters and digits with at least one letter and no spaces.
 */
export function fileExtension(name: string | undefined): string {
  const base = (name ?? "").trim().split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  const candidate = dot > 0 && dot < base.length - 1 ? base.slice(dot + 1).toLowerCase() : "";
  return /^(?=[a-z0-9]*[a-z])[a-z0-9]{1,8}$/.test(candidate) ? candidate : "";
}

/** The MIME type without its parameters, in lower case: "Text/CSV; charset=utf-8" becomes "text/csv". */
function mimeOf(mime: string | undefined): string {
  return (mime ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

/** The extension to write on the tag: the one in the name, else the one that goes with the MIME type, else its subtype when that is short enough to read. */
export function extensionOf(name?: string, mime?: string): string {
  const own = fileExtension(name);
  if (own) return own;
  const type = mimeOf(mime);
  const known = entry(MIME_TYPES, type);
  if (known) return known;
  const subtype = type.split("/")[1]?.replace(/^x-/, "") ?? "";
  return /^[a-z0-9]{1,4}$/.test(subtype) ? subtype : "";
}

/** Which family a file belongs to: by the extension of its name first, then by its MIME type, and `unknown` when neither says. */
export function familyOf(name?: string, mime?: string): FileFamily {
  const own = entry(FILE_TYPES, fileExtension(name));
  if (own) return own;
  const type = mimeOf(mime);
  const byExtension = entry(FILE_TYPES, entry(MIME_TYPES, type) ?? "");
  if (byExtension) return byExtension;
  return entry(PREFIXES, type.split("/")[0] ?? "") ?? "unknown";
}

/** The words for a screen reader, when the icon stands alone: "PDF document". */
export const FAMILY_NAMES: Record<FileFamily, string> = {
  document: "document",
  sheet: "spreadsheet",
  slide: "presentation",
  image: "image",
  video: "video",
  audio: "audio file",
  archive: "archive",
  code: "code file",
  unknown: "file",
};
