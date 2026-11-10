import type { ComponentProps, ReactNode } from "react";

import { QrActions } from "@rhs-ui/primitives/qr-code/actions";
import { encodeQr, qrName, qrPath, qrSvg, type QrLevel, type QrMatrix } from "@rhs-ui/primitives/qr-code/encode";
import { cn } from "@/lib/utils";

export { encodeQr, qrPath, qrSvg, type QrLevel, type QrMatrix } from "@rhs-ui/primitives/qr-code/encode";

/** The saved SVG is at least this many px wide, so Figma, Word or Keynote import it at a usable size instead of a few dozen px. It stays vector. */
const SAVED_SVG_SIDE = 512;

/** The words of the code, for another language. {file} stands for a file name. */
export interface QrCodeLabels {
  /** The name of the group of download buttons. */
  actions: string;
  /** The first button. */
  downloadSvg: string;
  /** The second button. */
  downloadPng: string;
  /** What a screen reader hears after a download. */
  downloaded: string;
  /** What it hears when the PNG could not be made. */
  failed: string;
  /** Shown in place of the code when `value` is empty. */
  empty: string;
  /** Shown in place of the code when `value` does not fit in any QR code. */
  tooLong: string;
}

const LABELS: QrCodeLabels = {
  actions: "Download the QR code",
  downloadSvg: "Download SVG",
  downloadPng: "Download PNG",
  downloaded: "Saved {file}",
  failed: "The PNG could not be made",
  empty: "Nothing to encode yet",
  tooLong: "Too long for a QR code",
};

export interface QrCodeProps extends Omit<ComponentProps<"figure">, "title" | "children"> {
  /** What the code holds: a link, Wi-Fi details, a contact, any text. It is sent as UTF-8. */
  value: string;
  /** The width of the tile in px, quiet zone included. It never grows past its container. Default 192. */
  size?: number;
  /** How much of the code may be lost and still be read: L about 7 percent, M 15, Q 25, H 30. A higher level makes a denser code. Default "M". */
  level?: QrLevel;
  /** The quiet zone around the code, in modules. Scanners want 4; 2 is the least that scans reliably. Default 4. */
  margin?: number;
  /** What the code leads to, for the accessible name: "QR code for {title}". Default the value, without its scheme. */
  title?: string;
  /** A line under the code, shown to everyone. */
  caption?: ReactNode;
  /** Show a row with Download SVG and Download PNG under the code. Default false. */
  actions?: boolean;
  /** The name of the downloaded files, without the extension. Default "qr-code". */
  filename?: string;
  /** The PNG is at least this many px wide, on whole pixels for each module. It is only drawn when its button is pressed. Default 1024. */
  pngSize?: number;
  /** Called with the format and the file after a download has started. Pass it from a client component. */
  onDownload?: (format: "svg" | "png", file: Blob) => void;
  /** The words of the code. */
  labels?: Partial<QrCodeLabels>;
}

/**
 * A QR code drawn as one SVG path from any string: crisp at every size and
 * ready to print, with nothing fetched and nothing drawn on a canvas. The
 * encoder is bundled (pure TypeScript, versions 1 to 40, four error correction
 * levels), so there is no package to install and no request to a service. The
 * modules are always dark on a light tile, in both themes, because a scanner
 * needs that contrast. The figure is named after what it leads to ("QR code
 * for northwind.example/invite"). With `actions` it offers Download SVG and
 * Download PNG, the PNG being rasterised from the SVG only when its button is
 * pressed, and the saved SVG carrying a width and height (at least 512px, on
 * whole pixels per module) so other tools open it at a usable size. A value that is empty, or too long for any QR code, shows a calm
 * message in the place of the tile.
 */
export function QrCode({ value, size = 192, level = "M", margin = 4, title, caption, actions = false, filename = "qr-code", pngSize = 1024, onDownload, labels: labelOverrides, className, ...props }: QrCodeProps) {
  const labels: QrCodeLabels = { ...LABELS, ...labelOverrides };
  const quiet = Math.min(16, Math.max(0, Math.round(margin)));
  let matrix: QrMatrix | null = null;
  let problem = "";
  if (value === "") problem = labels.empty;
  else {
    try {
      matrix = encodeQr(value, level);
    } catch {
      problem = labels.tooLong;
    }
  }
  const name = qrName(value, title);
  const modules = matrix ? matrix.size + quiet * 2 : 0;

  return (
    <figure data-slot="qr-code" data-level={level} data-version={matrix?.version} className={cn("m-0 inline-flex max-w-full flex-col items-center gap-3", className)} {...props}>
      {matrix ? (
        <div className={cn("overflow-hidden border border-border bg-white shadow-xs", quiet === 0 ? "rounded-none" : "rounded-xl")} style={{ width: size, maxWidth: "100%" }}>
          <svg role="img" aria-label={name} viewBox={`0 0 ${modules} ${modules}`} shapeRendering="crispEdges" className="block h-auto w-full">
            <rect width={modules} height={modules} fill="#fff" />
            <path d={qrPath(matrix, quiet)} fill="#000" />
          </svg>
        </div>
      ) : (
        <div role="img" aria-label={problem} className="grid aspect-square place-items-center rounded-xl border border-dashed border-border bg-muted p-4 text-center text-sm text-balance text-muted-foreground" style={{ width: size, maxWidth: "100%" }}>
          {problem}
        </div>
      )}
      {caption ? <figcaption className="max-w-full text-center text-sm text-muted-foreground">{caption}</figcaption> : null}
      {actions && matrix ? <QrActions svg={qrSvg(matrix, quiet, Math.ceil(Math.max(size, SAVED_SVG_SIDE) / modules) * modules)} modules={modules} pngSize={pngSize} filename={filename} onDownload={onDownload} labels={labels} /> : null}
    </figure>
  );
}
