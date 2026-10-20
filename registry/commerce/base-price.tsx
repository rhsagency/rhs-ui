import type { ComponentProps } from "react";

import { formatMoney } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

/** The unit the pack is measured in: grams, kilograms, millilitres, litres, metres or pieces. */
export type BasePriceUnit = "g" | "kg" | "ml" | "l" | "m" | "piece";

export interface BasePriceLabels {
  /** "per" in "2.49 per 100 g". */
  per?: string;
  /** Grams, as in "per 100 g". */
  g?: string;
  /** Kilograms, as in "per kg". */
  kg?: string;
  /** Millilitres, as in "per 100 ml". */
  ml?: string;
  /** Litres in a quantity, as in "per 2 l". */
  l?: string;
  /** One litre is spelled out, as on a shelf label: "11.90 per litre". */
  litre?: string;
  /** Metres, as in "per m". */
  m?: string;
  /** One piece, as in "per piece". */
  piece?: string;
  /** Several pieces, as in "per 10 pieces". */
  pieces?: string;
}

export interface BasePriceProps extends Omit<ComponentProps<"span">, "children"> {
  /** What the pack costs, in minor units: 249 is 2.49. */
  price: number;
  /** How much one pack holds, in `unit`: 500 for a 500 g bag, 0.75 for a 0.75 l bottle. */
  amount: number;
  /** The unit the pack is measured in: g, kg, ml, l, m or piece. */
  unit: BasePriceUnit;
  /** How many packs the price covers: 6 for a six-pack of 330 ml cans. */
  count?: number;
  /**
   * The reference quantity, in grams, millilitres, metres or pieces: 100 is "per 100 g", 1000 is "per kg"
   * (or "per litre"). Left out, up to 250 g or ml is priced per 100 and anything bigger per 1000.
   */
  per?: number;
  /** ISO 4217 code: "EUR", "USD", "GBP". */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same text. */
  locale?: string;
  /** Start with what the pack holds: "6 × 330 ml · 1.21 per litre". */
  showContent?: boolean;
  /** The words, for another language. */
  labels?: BasePriceLabels;
}

type ReferenceUnit = "g" | "ml" | "m" | "piece";

const UNITS: Record<BasePriceUnit, { reference: ReferenceUnit; factor: number }> = {
  g: { reference: "g", factor: 1 },
  kg: { reference: "g", factor: 1000 },
  ml: { reference: "ml", factor: 1 },
  l: { reference: "ml", factor: 1000 },
  m: { reference: "m", factor: 1 },
  piece: { reference: "piece", factor: 1 },
};

/** What a shelf label states: the price of `per` grams, millilitres, metres or pieces, in minor units. */
export interface BasePriceResult {
  /** In minor units, rounded half up to the cent. */
  amount: number;
  per: number;
  reference: ReferenceUnit;
}

/**
 * Works the base price out of the pack: the price of `per` of the reference
 * unit, rounded half up to the cent with integer arithmetic so 2.675 never
 * becomes 2.67. Null when anything is missing or not a positive number.
 */
export function computeBasePrice(price: number, amount: number, unit: BasePriceUnit, count = 1, per?: number): BasePriceResult | null {
  const base = UNITS[unit];
  if (!base || !(price > 0) || !(amount > 0) || !(count > 0) || (per !== undefined && !(per > 0))) return null;
  // Thousandths of the reference unit, so 0.75 l and 2.5 m stay whole numbers.
  const total = Math.round(amount * base.factor * count * 1000);
  if (!(total > 0)) return null;
  const metric = base.reference === "g" || base.reference === "ml";
  const reference = per ?? (metric ? (total <= 250_000 ? 100 : 1000) : 1);
  const scaled = price * reference * 1000;
  return { amount: Math.floor((2 * scaled + total) / (2 * total)), per: reference, reference: base.reference };
}

/**
 * The required price per 100 g or per litre, worked out from the pack size and
 * the price so it can never drift out of date. It converts units (500 g becomes
 * per 100 g or per kg), handles multipacks, rounds half up to the cent and
 * renders nothing when data is missing. It is a small muted line: give it an
 * `id` and point the price's `aria-describedby` at it, and it joins the price's
 * accessible description.
 */
export function BasePrice({ price, amount, unit, count = 1, per, currency = "EUR", locale = "en-US", showContent = false, labels, className, ...props }: BasePriceProps) {
  const result = computeBasePrice(price, amount, unit, count, per);
  if (!result) return null;
  const words: Required<BasePriceLabels> = { per: "per", g: "g", kg: "kg", ml: "ml", l: "l", litre: "litre", m: "m", piece: "piece", pieces: "pieces", ...labels };

  // 1000 g is a kilogram and 1000 ml a litre; a shelf label says it that way.
  const big = (result.reference === "g" || result.reference === "ml") && result.per % 1000 === 0;
  const quantity = big ? result.per / 1000 : result.per;
  const word = big ? (result.reference === "g" ? words.kg : quantity === 1 ? words.litre : words.l) : result.reference === "piece" ? (quantity === 1 ? words.piece : words.pieces) : words[result.reference];
  const reference = [words.per, quantity === 1 && (big || result.reference === "m" || result.reference === "piece") ? "" : new Intl.NumberFormat(locale).format(quantity), word].filter(Boolean).join(" ");

  const unitWord = unit === "piece" ? (amount === 1 ? words.piece : words.pieces) : words[unit];
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const content = showContent ? `${count > 1 ? `${numbers.format(count)} × ` : ""}${numbers.format(amount)} ${unitWord} · ` : "";

  return (
    <span data-slot="base-price" className={cn("text-xs text-muted-foreground tabular-nums", className)} {...props}>
      {content}
      {formatMoney({ amount: result.amount, currency }, locale)} {reference}
    </span>
  );
}
