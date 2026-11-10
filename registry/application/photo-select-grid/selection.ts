/**
 * The selection rules behind PhotoSelectGrid, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. A selection
 * is a list of ids in the order they were chosen.
 */

/** One photo of the library. */
export interface SelectablePhoto {
  /** A stable identity from your own records. `selected` and `onSelectedChange` use it. Unique within the grid. */
  id: string;
  /** Where the picture is: an image address or a data URI. */
  src: string;
  /** What the picture shows, in words. It names the photo's toggle for a screen reader, so make it say something: "Harbour at dusk". */
  alt: string;
}

/** The words the grid says, for translation. `{count}`, `{max}` and `{total}` are filled in. */
export interface PhotoSelectGridLabels {
  /** Names the list of photos for a screen reader. Default "Photos". */
  list?: string;
  /** The label of the checkbox that chooses every photo. Default "Select all". */
  selectAll?: string;
  /** The button that empties the selection. Default "Clear". */
  clear?: string;
  /** The status line; `{count}`. Default "{count} selected". */
  selected?: string;
  /** The same with a limit; `{count}` and `{max}`. Default "{count} of {max} selected". */
  selectedOfMax?: string;
  /** The same once the limit is reached, so the reason for the dimmed photos is said where the count is; `{count}` and `{max}`. Default "{count} of {max} selected, limit reached". */
  selectedAtMax?: string;
  /** The status line when nothing is chosen. Default "None selected". */
  none?: string;
  /** Shown instead of "Select all" when there is a limit that is lower than the number of photos; `{max}`. Default "Choose up to {max}". */
  chooseUpTo?: string;
  /** Said when the limit is reached, and why the other photos are dimmed; `{max}`. Default "Limit reached: you can choose up to {max}. Deselect a photo to choose another." */
  limit?: string;
  /** Shown instead of the grid when there are no photos. Default "There are no photos to choose from." */
  empty?: string;
  /** The hint under the grid, for a mouse and a keyboard. Default "Shift-click selects a range. Press Control A to select all." */
  hint?: string;
}

export const DEFAULT_LABELS = {
  list: "Photos",
  selectAll: "Select all",
  clear: "Clear",
  selected: "{count} selected",
  selectedOfMax: "{count} of {max} selected",
  selectedAtMax: "{count} of {max} selected, limit reached",
  none: "None selected",
  chooseUpTo: "Choose up to {max}",
  limit: "Limit reached: you can choose up to {max}. Deselect a photo to choose another.",
  empty: "There are no photos to choose from.",
  hint: "Shift-click selects a range. Press Control A to select all.",
} satisfies Required<PhotoSelectGridLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The selection with one photo flipped: added at the end, or taken out. At the limit, a photo that is not chosen cannot be added. */
export function toggled(selected: readonly string[], id: string, max?: number): string[] {
  if (selected.includes(id)) return selected.filter((chosen) => chosen !== id);
  if (max !== undefined && selected.length >= max) return [...selected];
  return [...selected, id];
}

/**
 * The selection with the photos from `anchor` to `focus` (indexes, in either
 * order, both ends included) added, walking from the anchor towards the focus,
 * so they are chosen in the order a hand would click them. Photos that are
 * already chosen stay where they are, and the limit stops the walk.
 */
export function extended(selected: readonly string[], ids: readonly string[], anchor: number, focus: number, max?: number): string[] {
  const step = focus >= anchor ? 1 : -1;
  const result = [...selected];
  const have = new Set(selected);
  for (let at = anchor; at !== focus + step; at += step) {
    const id = ids[at];
    if (id === undefined || have.has(id)) continue;
    if (max !== undefined && result.length >= max) break;
    result.push(id);
    have.add(id);
  }
  return result;
}

/** The status line: "3 selected", "3 of 6 selected" with a limit, "6 of 6 selected, limit reached" at it, "None selected" at zero. */
export function statusOf(count: number, max: number | undefined, text: Required<PhotoSelectGridLabels>, locale: string): string {
  const number = new Intl.NumberFormat(locale);
  if (count === 0) return text.none;
  if (max === undefined) return fill(text.selected, { count: number.format(count) });
  return fill(count >= max ? text.selectedAtMax : text.selectedOfMax, { count: number.format(count), max: number.format(max) });
}

/** How many tiles share the first row of the grid, which is how far an arrow key moves up or down. */
export function columnsOf(tiles: readonly HTMLElement[]): number {
  const first = tiles[0];
  if (!first) return 1;
  let across = 0;
  for (const tile of tiles) {
    if (tile.offsetTop !== first.offsetTop) break;
    across += 1;
  }
  return Math.max(1, across);
}
