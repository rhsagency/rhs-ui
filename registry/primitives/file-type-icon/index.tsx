import type { ComponentProps, ReactNode } from "react";

import { FAMILY_NAMES, extensionOf, familyOf, type FileFamily } from "@rhs-ui/primitives/file-type-icon/types";
import { cn } from "@/lib/utils";

export { FILE_TYPES, MIME_TYPES, extensionOf, familyOf, fileExtension, type FileFamily } from "@rhs-ui/primitives/file-type-icon/types";

export type FileTypeIconSize = "sm" | "md" | "lg";

export interface FileTypeIconProps extends Omit<ComponentProps<"svg">, "name" | "children" | "size"> {
  /** The file name, "report-final.xlsx": its extension picks the glyph and is written on the tag. */
  name?: string;
  /** The MIME type, "application/pdf", for a file that comes with a type and no useful name. The name wins when both are given. */
  mime?: string;
  /** Force a family, for a file this does not know. */
  family?: FileFamily;
  /** 28, 40 or 64px wide. The small one leaves the extension off, which would be too small to read. Default "md". */
  size?: FileTypeIconSize;
  /** Write the extension on the tag. Default true, except at size "sm". Over five letters are cut. */
  showExtension?: boolean;
  /** An accessible name, for an icon that stands alone ("PDF document"). Without it the icon is hidden from assistive technology, because the file name beside it says what the file is. */
  label?: string;
}

const SIZES: Record<FileTypeIconSize, string> = { sm: "w-7", md: "w-10", lg: "w-16" };

/** The glyph of each family, drawn around (0, 0) in the same hand as the icons: 1.5 wide, round ends. The zipper's teeth are a little bolder and square, so they still read at 28px. */
const GLYPHS: Record<FileFamily, ReactNode> = {
  document: <path d="M-7 -4.5h14M-7 0h14M-7 4.5h8.5" />,
  sheet: (
    <>
      <rect x="-7" y="-5.5" width="14" height="11" rx="1.5" />
      <path d="M-7 -1.8h14M-7 1.8h14M0 -5.5v11" />
    </>
  ),
  slide: (
    <>
      <rect x="-8" y="-6.5" width="16" height="9.5" rx="1.5" />
      <path d="M0 3v3M-3.5 6h7" />
    </>
  ),
  image: (
    <>
      <path d="M-8 6l5-7 3.5 4.5 2.5-3L8 6z" />
      <circle cx="3.6" cy="-4" r="1.7" />
    </>
  ),
  video: (
    <>
      <rect x="-8" y="-5.5" width="16" height="11" rx="2.5" />
      <path d="M-1.8 -2.4v4.8l4.2-2.4z" />
    </>
  ),
  audio: <path d="M-6 -2v4M-3 -4.2v8.4M0 -6v12M3 -3.4v6.8M6 -2v4" />,
  archive: (
    <>
      <path d="M-4.4 -6.6H-.2M.2 -4.4H4.4M-4.4 -2.2H-.2M.2 0H4.4" strokeWidth="2" strokeLinecap="butt" />
      <rect x="-2.5" y="2.7" width="5" height="3.8" rx="1.7" />
    </>
  ),
  code: <path d="M-3.5 -4.5L-8 0l4.5 4.5M3.5 -4.5L8 0l-4.5 4.5M1.6 -6.5l-3.2 13" />,
  unknown: <path d="M-3 -3.2a3 3 0 1 1 4.3 2.7C.4 -.1 0 .6 0 2M0 5.8h.01" />,
};

/**
 * A file icon from the extension or the MIME type, drawn in the library's
 * own hand: a page with a folded corner, a glyph for what is in it, and a dark
 * tag with the extension (PDF, XLSX, ZIP). Nine families, and each has a glyph
 * of its own (lines, a grid, a screen, hills, a play mark, a waveform, a
 * zipper, brackets, a question mark), so none is told apart by colour alone.
 * The mapping is the plain objects `FILE_TYPES` and `MIME_TYPES`: extend them
 * at startup for your own formats. The icon is hidden from assistive
 * technology unless you give it a `label`, because the file name next to it
 * carries the meaning.
 */
export function FileTypeIcon({ name, mime, family, size = "md", showExtension, label, className, ...props }: FileTypeIconProps) {
  const kind = family ?? familyOf(name, mime);
  const extension = extensionOf(name, mime).slice(0, 5).toUpperCase();
  const tagged = (showExtension ?? size !== "sm") && extension !== "";
  // The tag text is as large as the page allows: 9.5 units, which is 9.5px at the default size (a 40px icon is 40 units wide), and a little smaller for five letters. A mono letter is 0.6 of the size wide.
  const tagFont = extension.length > 4 ? 8.5 : 9.5;
  const tagWidth = Math.max(20, extension.length * (tagFont * 0.6 + 0.3) + 6);

  return (
    <svg
      data-slot="file-type-icon"
      data-family={kind}
      viewBox="0 0 40 48"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("aspect-[5/6] shrink-0 overflow-visible", SIZES[size], className)}
      {...props}
    >
      <g transform={tagged ? undefined : "translate(-1 0)"}>
        <path d="M9 3H26L36 13V42a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" strokeWidth="1.5" className="fill-background stroke-foreground/35" />
        <path d="M26 3L36 13H29a3 3 0 0 1-3-3Z" className="fill-muted" />
        <path d="M26 3V10a3 3 0 0 0 3 3H36" strokeWidth="1.5" className="stroke-foreground/35" />
        {/* Without a tag the glyph has the whole page, so it is drawn larger: at 28px wide it would otherwise be a faint smudge. */}
        <g transform={tagged ? "translate(21 20)" : "translate(21 26) scale(1.3)"} strokeWidth="1.5" className="stroke-muted-foreground">
          {GLYPHS[kind]}
        </g>
        {tagged ? (
          <g>
            <rect x="2" y="29.5" width={tagWidth} height="12" rx="2.4" strokeWidth="1.5" className="fill-foreground stroke-background" />
            <text x={2 + tagWidth / 2} y="35.5" dy="0.35em" textAnchor="middle" fontSize={tagFont} fontWeight="700" letterSpacing="0.3" stroke="none" className="fill-background font-mono">
              {extension}
            </text>
          </g>
        ) : null}
      </g>
      {label ? <title>{label}</title> : null}
    </svg>
  );
}

/** What a screen reader should call a file by its family, for the `label`: "PDF document". */
export function fileTypeLabel(name?: string, mime?: string): string {
  const extension = extensionOf(name, mime).toUpperCase();
  const words = FAMILY_NAMES[familyOf(name, mime)];
  return extension ? `${extension} ${words}` : words;
}
