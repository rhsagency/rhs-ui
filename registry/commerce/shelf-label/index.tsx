import type { ComponentProps } from "react";

import { formatMoney } from "@rhs-ui/commerce/money";
import { encodeBarcode, type Barcode } from "@rhs-ui/commerce/shelf-label/ean";
import { cn } from "@/lib/utils";

export type { Barcode, BarcodeFormat } from "@rhs-ui/commerce/shelf-label/ean";

export type ShelfLabelSize = "small" | "medium" | "large";

export interface ShelfLabelLabels {
  /** The unit price line. `{price}` and `{unit}`: "€2.49 per kg". */
  unitPrice?: string;
  /** The accessible name of the barcode. `{format}` and `{digits}`. */
  barcode?: string;
  /** The accessible name of the label. `{product}`. */
  label?: string;
}

const WORDS = {
  unitPrice: "{price} per {unit}",
  barcode: "{format} barcode {digits}",
  label: "Shelf label: {product}",
} satisfies Required<ShelfLabelLabels>;

export interface ShelfLabelProps extends Omit<ComponentProps<"div">, "children"> {
  /** The product's name: "Linen shirt, stone". It takes two lines at most. */
  product: string;
  /** A second line under the name: the size, the weight, what is in the pack. */
  detail?: string;
  /** The price in minor units: 4995 is 49.95. */
  price: number;
  /** The price per unit of measure, for goods sold by weight or volume: `{ amount: 249, per: "kg" }` is "€2.49 per kg". */
  unitPrice?: { amount: number; per: string };
  /** The code under the bars: an EAN-13, a UPC-A (12 digits) or an EAN-8, with its check digit. A wrong check digit is not drawn as a code; the label says what is wrong instead. */
  barcode: string;
  /** A promotion on a black strip across the top: "2 for 1", "Offer until 30 November", "-25%". It stays on one line and is cut short with an ellipsis when it is longer than the label is wide. */
  promotion?: string;
  /** The format: small is 50 × 30 mm, medium 60 × 40 mm and large 100 × 60 mm when printed. Defaults to medium. */
  size?: ShelfLabelSize;
  /** Adds a print stylesheet. When the page is printed, every label marked printable stays, at true size and in black on white, and everything else leaves the paper. */
  printable?: boolean;
  /** ISO 4217 code for the prices. */
  currency?: string;
  /** Locale for the prices. Always passed, so server and browser agree. */
  locale?: string;
  /** The words, for another language. */
  labels?: ShelfLabelLabels;
}

// On screen a label is drawn about as large as it prints, the small formats a little larger so their text stays readable, and all three fit in one row of a 56rem column. Every measure inside is in container units, so a label scales as one.
const SIZES: Record<ShelfLabelSize, string> = {
  small: "w-56 aspect-[5/3]",
  medium: "w-64 aspect-[3/2]",
  large: "w-[22rem] aspect-[5/3]",
};

/*
 * Only in the print medium, and only when a label is marked printable. Everything that neither holds a printable
 * label nor sits in one is taken out of the layout, so no blank pages are left behind, and the labels are set to
 * their format in millimetres. They keep their black on white and print their bars even where the browser would
 * otherwise drop backgrounds.
 */
const PRINT_CSS = `
@media print {
  html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; }
  body *:not(:has([data-slot="shelf-label"][data-printable])):not([data-slot="shelf-label"][data-printable]):not([data-slot="shelf-label"][data-printable] *) { display: none !important; }
  body :has([data-slot="shelf-label"][data-printable]):not([data-slot="shelf-label"][data-printable]) { display: block !important; position: static !important; width: auto !important; height: auto !important; min-height: 0 !important; max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; overflow: visible !important; transform: none !important; background: none !important; box-shadow: none !important; }
  [data-slot="shelf-label"][data-printable] { display: flex !important; max-width: none !important; margin: 0 0 4mm !important; box-shadow: none !important; break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  [data-slot="shelf-label"][data-printable][data-size="small"] { width: 50mm !important; height: 30mm !important; }
  [data-slot="shelf-label"][data-printable][data-size="medium"] { width: 60mm !important; height: 40mm !important; }
  [data-slot="shelf-label"][data-printable][data-size="large"] { width: 100mm !important; height: 60mm !important; }
}`;

const BAR_HEIGHT = 40;
const GUARD_EXTRA = 5;
const TEXT_SIZE = 7.6;

/** The bars as one SVG: the guards run longer than the bars and the digits sit under them where the standard puts them. */
function Bars({ code, name }: { code: Barcode; name: string }) {
  const first = code.format === "EAN-8" ? 7 : 11;
  const last = code.format === "UPC-A" ? 10 : 7;
  const width = first + code.modules.length + last;
  const height = BAR_HEIGHT + GUARD_EXTRA + TEXT_SIZE * 0.9;
  const eight = code.format === "EAN-8";
  const upc = code.format === "UPC-A";
  // Runs of ink, merged, each as one rectangle in the path.
  const runs: { start: number; length: number }[] = [];
  for (let index = 0; index < code.modules.length; index++) {
    if (code.modules[index] !== "1") continue;
    const run = runs[runs.length - 1];
    if (run && run.start + run.length === index) run.length += 1;
    else runs.push({ start: index, length: 1 });
  }
  const path = runs
    .map((run) => {
      const guard = code.guards.some(([from, to]) => run.start >= from && run.start <= to);
      return `M${first + run.start} 0h${run.length}v${BAR_HEIGHT + (guard ? GUARD_EXTRA : 0)}h-${run.length}z`;
    })
    .join("");
  const y = BAR_HEIGHT + GUARD_EXTRA + TEXT_SIZE * 0.75;
  const digits = { fontSize: TEXT_SIZE, fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fill: "#000" } as const;
  return (
    <svg role="img" aria-label={name} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMax meet" className="block h-full w-auto max-w-full overflow-visible" shapeRendering="crispEdges">
      <path d={path} fill="#000" />
      <g aria-hidden="true">
        {code.text.before ? (
          <text x={first - 2} y={y} textAnchor="end" {...digits}>
            {code.text.before}
          </text>
        ) : null}
        <text x={first + (eight ? 3.5 : upc ? 10.5 : 3.5)} y={y} textLength={eight ? 25 : upc ? 31 : 39} lengthAdjust="spacing" {...digits}>
          {code.text.left}
        </text>
        <text x={first + (eight ? 36.5 : 50.5)} y={y} textLength={eight ? 25 : upc ? 31 : 39} lengthAdjust="spacing" {...digits}>
          {code.text.right}
        </text>
        {code.text.after ? (
          <text x={first + code.modules.length + 2} y={y} {...digits}>
            {code.text.after}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

/**
 * The price label that sits on a shelf, a rail or an e-paper tag: the product's name, the price large with its
 * cents set small and raised the way shoppers read them, the price per kilo or litre, a promotion on a black
 * strip, and a barcode drawn as SVG with its digits under it. It is black on white whatever the page's theme,
 * so it scans reliably, and everything inside is sized against the label itself, so one design serves all three
 * formats. The barcode takes the room the text above it leaves, so a two-line name with a detail line under a
 * promotion strip makes it a little smaller instead of running into it; the promotion stays on one line. Mark
 * labels `printable` and the page prints nothing else: each label at true size in millimetres, ready for a label
 * printer or a sheet. A barcode with a wrong check digit is refused and the label says why.
 */
export function ShelfLabel({ product, detail, price, unitPrice, barcode, promotion, size = "medium", printable = false, currency = "EUR", locale = "en-US", labels, className, ...props }: ShelfLabelProps) {
  const words = { ...WORDS, ...labels };
  const encoded = encodeBarcode(barcode);
  const money = (amount: number) => formatMoney({ amount, currency }, locale);
  const parts = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(price / 100);
  const whole = parts.filter((part) => part.type === "integer").map((part) => part.value).join("").length;
  const priceSize = whole <= 3 ? "text-[17cqw]" : whole === 4 ? "text-[13.5cqw]" : "text-[10.5cqw]";
  const spoken = money(price);

  return (
    <>
      {printable ? <style href="rhs-shelf-label-print" precedence="medium">{PRINT_CSS}</style> : null}
      <div
        data-slot="shelf-label"
        data-size={size}
        data-printable={printable || undefined}
        role="group"
        aria-label={words.label.replace("{product}", product)}
        className={cn("@container relative flex max-w-full shrink-0 flex-col overflow-hidden rounded-md border border-black/15 bg-white text-black shadow-sm", SIZES[size], className)}
        {...props}
      >
        {promotion ? (
          <p className="shrink-0 truncate bg-black px-[4.5cqw] py-[1.5cqw] text-[3.8cqw] leading-tight font-bold tracking-[0.06em] text-white uppercase">{promotion}</p>
        ) : null}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)] gap-x-[3cqw] p-[4.5cqw]">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[5.6cqw] leading-[1.15] font-semibold tracking-[-0.01em] text-balance">{product}</p>
            {detail ? <p className="mt-[0.8cqw] truncate text-[3.7cqw] leading-tight text-black/75">{detail}</p> : null}
          </div>

          <div className="text-right">
            <p className="sr-only">{spoken}</p>
            {/* The size goes first: tailwind-merge drops a leading class that sits before a text size, and without the tight line height the price block grows taller than its digits and takes the barcode's room. */}
            <p aria-hidden="true" className={cn(priceSize, "flex items-start justify-end leading-[0.9] font-extrabold tracking-[-0.04em] tabular-nums")}>
              {parts.map((part, index) =>
                part.type === "currency" ? (
                  <span key={index} className="mt-[0.1em] mr-[0.06em] text-[0.4em] tracking-normal">
                    {part.value}
                  </span>
                ) : part.type === "fraction" ? (
                  <span key={index} className="mt-[0.06em] ml-[0.04em] text-[0.46em] tracking-normal">
                    {part.value}
                  </span>
                ) : part.type === "integer" || part.type === "group" ? (
                  <span key={index}>{part.value}</span>
                ) : null,
              )}
            </p>
          </div>

          <div className="flex min-h-0 items-end pt-[1.2cqw]">
            {encoded.ok ? (
              <div className="h-full w-[58cqw] shrink-0">
                <Bars code={encoded.code} name={words.barcode.replace("{format}", encoded.code.format).replace("{digits}", encoded.code.digits)} />
              </div>
            ) : (
              <p role="img" aria-label={encoded.reason} className="grid w-[58cqw] shrink-0 place-items-center border border-dashed border-black/60 px-[2cqw] py-[4cqw] text-center text-[3.8cqw] leading-tight font-medium">
                {encoded.reason}
              </p>
            )}
          </div>

          <p className="self-end text-right text-[3.9cqw] leading-tight font-medium tabular-nums">
            {unitPrice ? words.unitPrice.replace("{price}", money(unitPrice.amount)).replace("{unit}", unitPrice.per) : null}
          </p>
        </div>
      </div>
    </>
  );
}
