import type { ComponentProps } from "react";

import { IconWarning } from "@rhs-ui/icons";
import { encodeBarcode, type BarcodeFormat } from "@rhs-ui/primitives/barcode/encode";
import { cn } from "@/lib/utils";

export { eanCheckDigit, encodeBarcode } from "@rhs-ui/primitives/barcode/encode";
export type { BarcodeEncoding, BarcodeFormat } from "@rhs-ui/primitives/barcode/encode";

export interface BarcodeProps extends Omit<ComponentProps<"div">, "children"> {
  /** What the code holds. Code 128 takes any ASCII text; EAN-13 takes 12 digits (the check digit is added) or 13 (it is checked). Spaces and hyphens in an EAN are ignored. */
  value: string;
  /** `code128` (the default) for order numbers, tickets and labels, `ean13` for retail products. */
  format?: BarcodeFormat;
  /** Height of the bars in px. Default 64. */
  height?: number;
  /** Width of the thinnest bar in px. Default 2; below 1.5 many phone cameras and cheap scanners stop reading it. The drawing scales down to fit a narrow container, and a scaled drawing no longer has pixel-aligned bars, so give it a container at least as wide as the drawing (the quiet zones count) or keep the value short enough to fit. */
  barWidth?: number;
  /** Print the value under the bars. On by default; a code on a ticket or label should always be readable by eye as well. */
  showValue?: boolean;
  /** What the code identifies, in a word or two: "Order number". The accessible name becomes "Order number: NW-2026-048213". */
  label?: string;
}

/** Quiet zones in modules, left and right. EAN-13 keeps the first digit in its wider left margin. */
const QUIET: Record<BarcodeFormat, readonly [number, number]> = { code128: [10, 10], ean13: [11, 7] };

const round = (value: number) => Number(value.toFixed(3));
/** Control characters have no glyph, so they are shown (and spoken) as a dot. */
const printable = (text: string) => text.replace(/[\u0000-\u001f\u007f]/g, "·");

/**
 * A scannable barcode as SVG, for tickets, shipping labels, packing slips and
 * product tags. Code 128 picks its code sets itself and packs digit runs two
 * to a symbol; EAN-13 adds or checks the check digit and draws the guard bars
 * the way a retail scanner expects. A value that cannot be encoded is reported
 * in words instead of drawn wrong. Black on white with a quiet zone, in light
 * and dark mode alike, because that is what a scanner needs. The value sits
 * under the bars in the mono font and, with `label`, is the accessible name.
 * It is a plain function with no client code, so it renders on the server.
 */
export function Barcode({ value, format = "code128", height = 64, barWidth = 2, showValue = true, label, className, ...props }: BarcodeProps) {
  const encoding = encodeBarcode(value, format);
  if (!encoding.valid) {
    return (
      <div
        data-slot="barcode"
        data-format={format}
        data-state="invalid"
        role="status"
        className={cn(
          "flex w-fit max-w-full items-start gap-2.5 rounded-md border border-dashed border-destructive/50 bg-destructive/5 px-3.5 py-3 text-sm",
          // Darkened toward the foreground, so the small red words reach 4.5:1 on their pale fill.
          "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]",
          className,
        )}
        {...props}
      >
        <IconWarning aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="grid min-w-0 gap-0.5">
          <p className="font-medium">This barcode cannot be drawn</p>
          <p className="leading-snug">{encoding.reason}</p>
        </div>
      </div>
    );
  }

  const bar = Math.max(0.5, barWidth);
  const barHeight = Math.max(16, height);
  const [quietLeft, quietRight] = QUIET[encoding.format];
  const width = round((quietLeft + encoding.modules + quietRight) * bar);
  const pad = round(Math.max(6, bar * 4));
  const fontSize = Math.min(14, Math.max(10, bar * 5.5));
  // An EAN-13's digits stand under their own bars, so they are drawn inside the SVG. The line under a Code 128 is plain text below it instead: when a narrow container shrinks the bars, the text stays as large as it was.
  const digitsInside = showValue && encoding.format === "ean13";
  const baseline = round(pad + barHeight + fontSize + 3);
  const total = digitsInside ? round(baseline + pad * 0.75) : round(pad * 2 + barHeight);
  // A guard bar runs down through the digits, which is how a retail scanner and a person find the halves.
  const guardHeight = digitsInside ? round(baseline + 3 - pad) : barHeight;

  // One path for all the bars. `at` counts modules from the start of the code; the quiet zone comes before it.
  let path = "";
  let at = 0;
  encoding.runs.forEach((run, index) => {
    if (index % 2 === 0) {
      const guard = encoding.guards.some(([from, to]) => at >= from && at + run <= to);
      path += `M${round((quietLeft + at) * bar)} ${pad}h${round(run * bar)}v${guard ? guardHeight : barHeight}h${round(-run * bar)}z`;
    }
    at += run;
  });

  const text = encoding.text;
  const spoken = encoding.format === "ean13" ? `${text.slice(0, 1)} ${text.slice(1, 7)} ${text.slice(7)}` : printable(text);
  const name = `${label ?? (encoding.format === "ean13" ? "EAN-13 barcode" : "Barcode")}: ${spoken}`;

  const shown = printable(text);

  return (
    <div
      data-slot="barcode"
      data-format={encoding.format}
      role="img"
      aria-label={name}
      className={cn("w-fit max-w-full overflow-hidden rounded-md border border-border bg-white text-black shadow-xs", className)}
      {...props}
    >
      <svg viewBox={`0 0 ${width} ${total}`} width={width} height={total} className="block h-auto max-w-full" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
        <rect width={width} height={total} fill="#fff" />
        <path d={path} fill="#000" />
        {digitsInside
          ? Array.from(text, (digit, index) => {
              // The first digit stands in the left margin, the other twelve sit under their seven modules, in two halves around the middle guard.
              const centre = index === 0 ? quietLeft / 2 : quietLeft + 3 + (index <= 6 ? (index - 1) * 7 : 42 + 5 + (index - 7) * 7) + 3.5;
              return (
                <text key={index} x={round(centre * bar)} y={baseline} textAnchor="middle" fontSize={round(fontSize)} fill="#000" shapeRendering="auto" className="font-mono font-medium">
                  {digit}
                </text>
              );
            })
          : null}
      </svg>
      {showValue && encoding.format === "code128" ? (
        <p aria-hidden="true" className="-mt-1.5 px-3 pb-2 text-center font-mono font-medium break-all" style={{ fontSize: round(fontSize), letterSpacing: "0.06em" }}>
          {shown}
        </p>
      ) : null}
    </div>
  );
}
