/**
 * How the selectable table works out a selection, as plain functions with no state and no hook, so the same rules can
 * run on the server (to build the first selection from a query string) and in any table of your own.
 */

/** What the header checkbox shows: none of the rows picked, some of them, or every row that can be picked. */
export type SelectionState = "none" | "some" | "all";

/** Where the ids of the rows on screen stand against a selection. An empty list is "none". */
export function selectionState(ids: readonly string[], selected: ReadonlySet<string>): SelectionState {
  if (ids.length === 0) return "none";
  let picked = 0;
  for (const id of ids) if (selected.has(id)) picked += 1;
  return picked === 0 ? "none" : picked === ids.length ? "all" : "some";
}

/** A new selection with `ids` added (`on`) or taken out (`!on`). Ids that are not listed keep the place they had, so a selection that spans pages survives a change on one page. */
export function setSelected(selected: ReadonlySet<string>, ids: readonly string[], on: boolean): Set<string> {
  const next = new Set(selected);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return next;
}

/** The ids from `from` to `to`, both included, in the order of `ordered`, whichever of the two comes first. When `from` is not in the list (its row left the page) the range is just `to`. */
export function idsBetween(ordered: readonly string[], from: string, to: string): string[] {
  const start = ordered.indexOf(from);
  const end = ordered.indexOf(to);
  if (end === -1) return [];
  if (start === -1) return [to];
  return ordered.slice(Math.min(start, end), Math.max(start, end) + 1);
}

/** Fills `{count}`, `{total}` and `{noun}` in a sentence: "{count} of {total} {noun} selected" becomes "3 of 25 rows selected". */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
