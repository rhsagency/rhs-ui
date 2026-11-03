/** The ids in the order asked for. Ids that are not items are dropped, and items that were not named follow in their own order. */
export function resolveOrder(ids: readonly string[] | undefined, items: readonly { id: string }[]): string[] {
  const known = new Set(items.map((item) => item.id));
  const named = [...new Set(ids ?? [])].filter((id) => known.has(id));
  const rest = items.map((item) => item.id).filter((id) => !named.includes(id));
  return [...named, ...rest];
}

/** A copy of the order with the id at `from` moved to `to`. */
export function moveId(order: readonly string[], from: number, to: number): string[] {
  const next = [...order];
  const [taken] = next.splice(from, 1);
  if (taken !== undefined) next.splice(Math.max(0, Math.min(next.length, to)), 0, taken);
  return next;
}

/** Fills `{label}`, `{position}` and `{total}` in a message. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

/** Where one row sits in the list: its top and its height, measured when it was picked up. */
export interface Slot {
  top: number;
  height: number;
}

/**
 * Where each row of an order sits when the rows are laid out one after the other from `origin` (the top of the first
 * row of the original order), with the space the list had between them. A lifted row's neighbours move to these places.
 */
export function slotTops(order: readonly string[], slots: Readonly<Record<string, Slot>>, gap: number, origin: number): number[] {
  let top = origin;
  const tops: number[] = [];
  for (const id of order) {
    tops.push(top);
    top += (slots[id]?.height ?? 0) + gap;
  }
  return tops;
}
