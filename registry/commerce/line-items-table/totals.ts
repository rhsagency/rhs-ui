export interface LineItem {
  /** Identifies the line. Keep it stable between renders. */
  id: string;
  /** What was sold: "Kestrel merino crew jumper". */
  description: string;
  /** A second line under it: a variant, a SKU, a period. */
  detail?: string;
  /** How many. Fractions work for hours and metres. */
  quantity: number;
  /** The unit the quantity is in, written after it: "h", "m", "pcs". */
  unit?: string;
  /** The price of one unit, in minor units: 8900 is 89.00. */
  unitAmount: number;
}

export interface LineItemsDiscount {
  /** What the row says: "Discount (SPRING10)". Defaults to "Discount". */
  label?: string;
  /** A share of the subtotal, in percent: 10 is ten percent off. */
  percent?: number;
  /** A fixed amount, in minor units, taken off after the percentage. */
  amount?: number;
}

export interface LineItemsShipping {
  /** What the row says: "Shipping (Express)". Defaults to "Shipping". */
  label?: string;
  /** The cost, in minor units. 0 is free. */
  amount: number;
}

export interface LineItemsLabels {
  /** Names the table for a screen reader when there is no title. */
  caption?: string;
  /** The column heads. */
  columns?: { description?: string; quantity?: string; unitPrice?: string; amount?: string };
  subtotal?: string;
  discount?: string;
  shipping?: string;
  /** In the place of the cost when shipping is free. */
  free?: string;
  /** The tax row when the prices do not include it. `{rate}`: "21%". */
  vat?: string;
  /** The tax row when the prices already include it. `{rate}`: "21%". */
  vatIncluded?: string;
  total?: string;
  /** Under a line on a phone: the quantity and the unit price. `{quantity}` and `{price}`. */
  each?: string;
  /** Where the lines go when there are none. */
  empty?: string;
}

export const WORDS = {
  caption: "Line items",
  columns: { description: "Description", quantity: "Qty", unitPrice: "Unit price", amount: "Amount" },
  subtotal: "Subtotal",
  discount: "Discount",
  shipping: "Shipping",
  free: "Free",
  vat: "VAT {rate}",
  vatIncluded: "Includes VAT {rate}",
  total: "Total",
  each: "{quantity} × {price}",
  empty: "Nothing here yet.",
} satisfies Required<Omit<LineItemsLabels, "columns">> & { columns: Required<NonNullable<LineItemsLabels["columns"]>> };

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

export interface LineItemsTotals {
  /** The amount of every line, in the order of the lines. */
  lines: number[];
  subtotal: number;
  /** How much comes off, as a positive number. */
  discount: number;
  /** The cost of shipping, or undefined when no shipping row is shown. */
  shipping: number | undefined;
  /** The VAT, or undefined when no rate is given. Included in `total` when the prices exclude it, part of it when they include it. */
  tax: number | undefined;
  total: number;
}

export interface LineItemsInput {
  lines: readonly LineItem[];
  discount?: LineItemsDiscount;
  shipping?: number | LineItemsShipping;
  /** VAT in percent: 21 is 21%. */
  taxRate?: number;
  /** True when the unit amounts already contain the VAT. */
  taxIncluded?: boolean;
}

/**
 * The sums behind the table, in whole minor units. Every line is rounded once, to the nearest unit, and so is the
 * discount and the VAT, so the rows always add up to the total, whatever the quantities. VAT is worked out on the
 * subtotal, less the discount, plus shipping. Use it on your server to get the same figures the table shows.
 */
export function totalsOf({ lines, discount, shipping, taxRate, taxIncluded = false }: LineItemsInput): LineItemsTotals {
  const amounts = lines.map((line) => Math.round(line.quantity * line.unitAmount));
  const subtotal = amounts.reduce((sum, amount) => sum + amount, 0);
  const asked = discount ? Math.round((subtotal * (discount.percent ?? 0)) / 100) + Math.round(discount.amount ?? 0) : 0;
  // A discount never takes more than the lines come to.
  const off = Math.min(subtotal, Math.max(0, asked));
  const delivery = shipping === undefined ? undefined : typeof shipping === "number" ? shipping : shipping.amount;
  const base = subtotal - off + (delivery ?? 0);
  if (taxRate === undefined) return { lines: amounts, subtotal, discount: off, shipping: delivery, tax: undefined, total: base };
  const tax = taxIncluded ? Math.round((base * taxRate) / (100 + taxRate)) : Math.round((base * taxRate) / 100);
  return { lines: amounts, subtotal, discount: off, shipping: delivery, tax, total: taxIncluded ? base : base + tax };
}
