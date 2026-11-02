/** What a line is: a charge adds to the price, a discount takes from it, a tax is the tax on it. */
export type PriceLineKind = "charge" | "discount" | "tax";

/** One line of how a price is made up. */
export interface PriceLine {
  /** What it is: "Kestrel down jacket", "Spring offer", "Shipping", "VAT". */
  label: string;
  /** How much, in minor units: 4900 is 49.00. A discount is passed as a positive amount and taken off: a negative one counts the same. */
  amount: number;
  /** Defaults to "charge". */
  kind?: PriceLineKind;
  /** For a tax: the rate in percent, written after the label ("VAT 21%"). */
  rate?: number;
  /** One quiet line under the label: when the offer ends, what is included. */
  note?: string;
}

/**
 * What the lines add up to, in minor units. Charges and discounts always count; taxes count unless `includesTax` is
 * on, because then they are already inside the charges and are only shown for information.
 */
export function sumOf(lines: readonly PriceLine[], includesTax: boolean): number {
  return lines.reduce((total, line) => {
    const kind = line.kind ?? "charge";
    if (kind === "discount") return total - Math.abs(line.amount);
    if (kind === "tax" && includesTax) return total;
    return total + line.amount;
  }, 0);
}
