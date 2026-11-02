/** How the quantity is read: added to the stock on hand, taken from it, or what the stock is counted at. */
export type StockMode = "add" | "remove" | "set";

/** One reason an adjustment can have. A reason with `requiresNote` makes the note required: "Other" does, so nobody leaves a gap in the stock history unexplained. */
export interface StockReason {
  /** What `reason` carries in the value, and the identity of the choice: "damaged". */
  value: string;
  /** The words the person reads in the list: "Damaged". */
  label: string;
  /** Makes the note required while this reason is chosen. */
  requiresNote?: boolean;
}

export const DEFAULT_REASONS: readonly StockReason[] = [
  { value: "received", label: "Received" },
  { value: "sold-in-store", label: "Sold in store" },
  { value: "damaged", label: "Damaged" },
  { value: "count-correction", label: "Count correction" },
  { value: "other", label: "Other", requiresNote: true },
];

/** What the person has chosen and typed. */
export interface StockAdjustment {
  /** How the quantity is read: added to the stock, taken from it, or what the stock is set to. */
  mode: StockMode;
  /** A whole number: how many to add or remove, or what the stock is set to. */
  quantity: number;
  /** The `value` of the chosen reason, or null while none is chosen. */
  reason: string | null;
  /** The explanation typed by the person. It may stay empty unless the chosen reason requires it. */
  note: string;
}

/** What the field reports: the adjustment, worked out. */
export interface StockChange extends StockAdjustment {
  /** What the stock will be after the change, worked out for you, so saving needs no arithmetic. Null while the change is refused (it would take the stock below zero) or has no usable quantity. */
  newOnHand: number | null;
  /** The change can be saved: a usable quantity, a reason, the note when the reason asks for one, and not refused. */
  valid: boolean;
}

export type StockProblem = "quantity" | "below" | "reason" | "note";

/** The stock after the change, or null when the change is refused: it takes the stock below zero and `allowNegative` is off. */
export function stockAfter(onHand: number, adjustment: Pick<StockAdjustment, "mode" | "quantity">, allowNegative: boolean): number | null {
  const { mode, quantity } = adjustment;
  const after = mode === "add" ? onHand + quantity : mode === "remove" ? onHand - quantity : quantity;
  return after < 0 && !allowNegative ? null : after;
}

/** Everything that stops the adjustment from being saved, in the order the form reads. */
export function problemsOf(onHand: number, adjustment: StockAdjustment, reasons: readonly StockReason[], allowNegative: boolean): StockProblem[] {
  const problems: StockProblem[] = [];
  const { mode, quantity, reason, note } = adjustment;
  // Adding or removing nothing is no adjustment; setting the stock to zero is one.
  if (!Number.isInteger(quantity) || (mode === "set" ? quantity < 0 && !allowNegative : quantity < 1)) problems.push("quantity");
  else if (stockAfter(onHand, adjustment, allowNegative) === null) problems.push("below");
  const chosen = reasons.find((item) => item.value === reason);
  if (!chosen) problems.push("reason");
  else if (chosen.requiresNote && note.trim() === "") problems.push("note");
  return problems;
}
