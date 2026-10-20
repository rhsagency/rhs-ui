import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface PriceRangeLabels {
  /** Starts the "from" style: "From 19". */
  from?: string;
  /** Joins the two ends when a screen reader reads a range: "19 to 39". */
  to?: string;
  /** Said before a price that is on sale. */
  sale?: string;
  /** Said before the struck-through price. */
  regular?: string;
}

export interface PriceRangeProps extends Omit<ComponentProps<"span">, "children"> {
  /** The lowest variant price, in minor units: 1900 is 19.00. */
  min: number;
  /** The highest variant price, in minor units. Leave it out, or make it equal to `min`, for a single price. */
  max?: number;
  /** The lowest regular price, in minor units. Together with `compareAtMax` it makes the struck-through range. */
  compareAtMin?: number;
  /** The highest regular price, in minor units. */
  compareAtMax?: number;
  /** ISO 4217 code: "EUR", "USD", "GBP". */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same text. */
  locale?: string;
  /** "from" shows the lowest price after a word ("From 19"); "range" shows both ends ("19 to 39"). */
  variant?: "from" | "range";
  /** "auto" drops the cents when every figure is a whole amount ("19"); "always" keeps them ("19.00"). */
  cents?: "auto" | "always";
  /** The words around the figures, for another language. */
  labels?: PriceRangeLabels;
}

type RangeFormat = Intl.NumberFormat & { formatRange?: (start: number, end: number) => string };

const isAmount = (value: number | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** The figure as people see it, and as a screen reader should say it when the two differ (a dash is not read as "to"). */
function Figure({ visible, spoken, as: Tag = "span", className }: { visible: string; spoken?: string; as?: "span" | "s"; className?: string }) {
  return (
    <Tag className={className}>
      <span aria-hidden={spoken ? true : undefined}>{visible}</span>
      {spoken ? <span className="sr-only">{spoken}</span> : null}
    </Tag>
  );
}

/**
 * The price of a product that comes in variants: one price when they all cost
 * the same, "From 19" or "19 to 39" when they do not, and the regular range
 * struck through when it is on sale. Ranges are formatted with
 * Intl.NumberFormat formatRange in the reader's locale, figures are tabular,
 * and visually hidden "Sale price" and "Regular price" labels mean the
 * strike-through is never the only signal.
 */
export function PriceRange({ min, max = min, compareAtMin, compareAtMax, currency = "EUR", locale = "en-US", variant = "from", cents = "auto", labels, className, ...props }: PriceRangeProps) {
  if (!isAmount(min) || !isAmount(max)) return null;
  const words = { from: "From", to: "to", sale: "Sale price", regular: "Regular price", ...labels };
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const regular = [compareAtMin, compareAtMax].filter(isAmount).filter((amount) => amount > 0);
  const regularLow = regular.length ? Math.min(...regular) : undefined;
  const regularHigh = regular.length ? Math.max(...regular) : undefined;
  const onSale = regularLow !== undefined && regularHigh !== undefined && (regularLow > low || regularHigh > high);

  const whole = cents === "auto" && [low, high, ...(onSale ? [regularLow, regularHigh] : [])].every((amount) => amount % 100 === 0);
  const format: RangeFormat = new Intl.NumberFormat(locale, { style: "currency", currency, ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) });
  const one = (minor: number) => format.format(minor / 100);
  const span = (a: number, b: number) => ({
    visible: format.formatRange ? format.formatRange(a / 100, b / 100) : `${one(a)} – ${one(b)}`,
    spoken: `${one(a)} ${words.to} ${one(b)}`,
  });

  const now = low === high ? { visible: one(low) } : variant === "from" ? { visible: `${words.from} ${one(low)}` } : span(low, high);
  const was = !onSale || regularLow === undefined || regularHigh === undefined ? null : regularLow === regularHigh || variant === "from" ? { visible: one(regularLow) } : span(regularLow, regularHigh);

  return (
    <span data-slot="price-range" data-on-sale={onSale || undefined} className={cn("inline-flex flex-wrap items-baseline gap-x-2 tabular-nums", className)} {...props}>
      {onSale ? <span className="sr-only">{words.sale}: </span> : null}
      <Figure {...now} className="font-medium text-foreground" />
      {was ? (
        <>
          <span className="sr-only">{words.regular}: </span>
          <Figure {...was} as="s" className="text-[0.875em] text-muted-foreground" />
        </>
      ) : null}
    </span>
  );
}
