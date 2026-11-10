/** One thing that can be moved between the two lists. */
export interface TransferItem {
  /** What `value` holds when the item is chosen. Unique in the list. */
  id: string;
  /** The item's name, and its accessible name. Search reads it. */
  label: string;
  /** A second line under the label: an email address, a role, a type. Search reads it too. */
  description?: string;
  /** The item cannot be selected or moved: a member who cannot be removed, a column that is always shown. */
  disabled?: boolean;
}

/** The headings of the two lists. */
export interface TransferTitles {
  /** The list of things still to choose from. Default "Available". */
  available?: string;
  /** The list of things chosen. Default "Chosen". */
  chosen?: string;
}

/** The two lists. */
export type Side = "available" | "chosen";

/** The words the lists say, for translation. A `{name}` mark in a sentence is filled in. */
export interface TransferListLabels {
  /** The placeholder of both search fields. Default "Search". */
  searchPlaceholder?: string;
  /** Names a search field for a screen reader; `{list}` is the list's title. Default "Search {list}". */
  search?: string;
  /** The count in a list's header; `{selected}` and `{total}`. Default "{selected} of {total} selected". */
  selectedCount?: string;
  /** Names the checkbox in a list's header; `{list}`. Default "Select all in {list}". */
  selectAll?: string;
  /** Names the group of buttons between the lists. Default "Move between lists". */
  moveGroup?: string;
  /** The button that moves the selected items to Chosen. Default "Add selected". */
  add?: string;
  /** The button that moves every item to Chosen. Default "Add all". */
  addAll?: string;
  /** The button that moves the selected items back. Default "Remove selected". */
  remove?: string;
  /** The button that moves every item back. Default "Remove all". */
  removeAll?: string;
  /** What a move button says when a search narrows it to what is shown; `{count}`. Default "{label} ({count} shown)". */
  shown?: string;
  /** What is said after items are added; `{count}`, `{noun}` and `{list}`. Default "{count} {noun} added to {list}". */
  added?: string;
  /** What is said after items are removed; `{count}`, `{noun}` and `{list}`. Default "{count} {noun} removed from {list}". */
  removed?: string;
  /** The word for one item. Default "item". */
  itemOne?: string;
  /** The word for several items. Default "items". */
  itemOther?: string;
  /** What the Available list says when everything has been chosen. Default "Everything has been chosen." */
  emptyAvailable?: string;
  /** What the Chosen list says when nothing has. Default "Nothing chosen yet. Select items in {list} and add them." */
  emptyChosen?: string;
  /** What a list says when the search finds nothing; `{query}`. Default "No matches for “{query}”". */
  noMatches?: string;
}

export const DEFAULT_LABELS = {
  searchPlaceholder: "Search",
  search: "Search {list}",
  selectedCount: "{selected} of {total} selected",
  selectAll: "Select all in {list}",
  moveGroup: "Move between lists",
  add: "Add selected",
  addAll: "Add all",
  remove: "Remove selected",
  removeAll: "Remove all",
  shown: "{label} ({count} shown)",
  added: "{count} {noun} added to {list}",
  removed: "{count} {noun} removed from {list}",
  itemOne: "item",
  itemOther: "items",
  emptyAvailable: "Everything has been chosen.",
  emptyChosen: "Nothing chosen yet. Select items in {list} and add them.",
  noMatches: "No matches for “{query}”",
} satisfies Required<TransferListLabels>;

export type Words = Required<TransferListLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** Where one list stands: what is typed in its search field, which items are selected, and where the cursor is. */
export interface PaneState {
  query: string;
  /** The ids selected for moving. Ids that a search hides stay in it, and count again when the search is cleared. */
  selected: ReadonlySet<string>;
  /** The item a range selection grows from. */
  anchor: string | null;
  /** The selection as it was when the anchor was set: a range is added to this, not to whatever the last range left. */
  seed: ReadonlySet<string>;
  /** The item the cursor is on, which the keyboard acts on. */
  active: string | null;
}

export const EMPTY_PANE: PaneState = { query: "", selected: new Set(), anchor: null, seed: new Set(), active: null };

/** Lower case, without accents: "Zoë" is found by "zoe". */
const fold = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** The items that match a search: every word typed must be in the label or the description. */
export function filterItems(items: readonly TransferItem[], query: string): TransferItem[] {
  const needles = fold(query).split(/\s+/).filter(Boolean);
  if (needles.length === 0) return [...items];
  return items.filter((item) => {
    const text = fold(`${item.label} ${item.description ?? ""}`);
    return needles.every((needle) => text.includes(needle));
  });
}

/** The items of a list that are selected and can be moved, in the order the list shows them. */
export function selectedIn(visible: readonly TransferItem[], selected: ReadonlySet<string>): TransferItem[] {
  return visible.filter((item) => selected.has(item.id) && !item.disabled);
}

/** A copy of a set with one id added, or taken out if it was there. */
export function toggled(set: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(set);
  if (!next.delete(id)) next.add(id);
  return next;
}

/** The ids that can be selected between two items of a list, both included, whichever comes first. */
export function rangeBetween(visible: readonly TransferItem[], from: string, to: string): string[] {
  const a = visible.findIndex((item) => item.id === from);
  const b = visible.findIndex((item) => item.id === to);
  if (a < 0 || b < 0) return [];
  return visible
    .slice(Math.min(a, b), Math.max(a, b) + 1)
    .filter((item) => !item.disabled)
    .map((item) => item.id);
}

/**
 * Where the cursor goes when items leave a list: the item that now stands
 * where the first of them stood, so the keyboard carries on from the same
 * place. `null` when nothing is left.
 */
export function nextActive(visible: readonly TransferItem[], moved: ReadonlySet<string>): string | null {
  const first = visible.findIndex((item) => moved.has(item.id));
  const rest = visible.filter((item) => !moved.has(item.id));
  return rest[Math.min(Math.max(first, 0), rest.length - 1)]?.id ?? null;
}

/** The chosen ids that are items, once each, in the order they were given. */
export function knownIds(value: readonly string[], items: readonly TransferItem[]): string[] {
  const known = new Set(items.map((item) => item.id));
  return [...new Set(value)].filter((id) => known.has(id));
}
