/** Which side panel: the explorer at the start (left) or the inspector at the end (right). */
export type WorkbenchPanel = "explorer" | "inspector";

/**
 * The layout of a workbench: how wide each side panel is, and whether it is
 * collapsed. This is what `onSizesChange` hands you and what `defaultSizes`
 * takes back, so it can go to localStorage or a database as it is.
 */
export interface WorkbenchLayout {
  /** The explorer's width in px. It is kept while the panel is collapsed, so opening it again restores it. */
  explorer: number;
  /** The inspector's width in px. */
  inspector: number;
  /** Which side panels are collapsed. */
  collapsed: {
    /** The explorer is collapsed to a hairline. */
    explorer: boolean;
    /** The inspector is collapsed to a hairline. */
    inspector: boolean;
  };
}

/** The least width of each part in px. The canvas minimum is what the two panels may never take. */
export interface WorkbenchMinSizes {
  /** Default 180. */
  explorer?: number;
  /** Default 240. */
  inspector?: number;
  /** Default 360. */
  canvas?: number;
}

/** The layout a workbench starts with: an explorer of 260px, an inspector of 320px, both open. */
export const DEFAULT_LAYOUT: WorkbenchLayout = { explorer: 260, inspector: 320, collapsed: { explorer: false, inspector: false } };
/** The least widths the parts get unless `minSizes` says otherwise, in px. */
export const DEFAULT_MINS = { explorer: 180, inspector: 240, canvas: 360 } as const;

/** The width in rem, of the shell itself, from which the panels sit beside the canvas. Below it they are sheets. */
export const BESIDE_REM = 64;

/** The width of a drag handle in px: a hairline. Its hit area is larger and does not take layout room. */
export const HANDLE = 1;

/** A starting layout with whatever was left out filled in from the defaults. */
export function resolveLayout(layout: Partial<Omit<WorkbenchLayout, "collapsed">> & { collapsed?: Partial<WorkbenchLayout["collapsed"]> }): WorkbenchLayout {
  return {
    explorer: layout.explorer ?? DEFAULT_LAYOUT.explorer,
    inspector: layout.inspector ?? DEFAULT_LAYOUT.inspector,
    collapsed: { explorer: layout.collapsed?.explorer ?? false, inspector: layout.collapsed?.inspector ?? false },
  };
}

/** The minimum sizes with whatever was left out filled in from the defaults. */
export function resolveMins(mins: WorkbenchMinSizes | undefined): Required<WorkbenchMinSizes> {
  return { explorer: mins?.explorer ?? DEFAULT_MINS.explorer, inspector: mins?.inspector ?? DEFAULT_MINS.inspector, canvas: mins?.canvas ?? DEFAULT_MINS.canvas };
}

/** `value` held between `low` and `high`. */
export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Whether two layouts are the same, so a gesture that ends where it began tells nobody. */
export function sameLayout(a: WorkbenchLayout, b: WorkbenchLayout): boolean {
  return a.explorer === b.explorer && a.inspector === b.inspector && a.collapsed.explorer === b.collapsed.explorer && a.collapsed.inspector === b.collapsed.inspector;
}

interface Present {
  explorer: boolean;
  inspector: boolean;
}

/**
 * The widths to draw. The stored widths are what the person chose; when the
 * window is too narrow to hold them beside the canvas minimum, both panels give
 * way in proportion to the room they have above their own minimum. Nothing is
 * stored, so a wider window brings the chosen widths back.
 */
export function fitLayout(layout: WorkbenchLayout, present: Present, mins: Required<WorkbenchMinSizes>, available: number | null): { explorer: number; inspector: number } {
  const want = { explorer: Math.max(mins.explorer, layout.explorer), inspector: Math.max(mins.inspector, layout.inspector) };
  if (available === null) return want;
  const open = { explorer: present.explorer && !layout.collapsed.explorer, inspector: present.inspector && !layout.collapsed.inspector };
  const handles = (present.explorer ? HANDLE : 0) + (present.inspector ? HANDLE : 0);
  const space = available - mins.canvas - handles;
  const over = (open.explorer ? want.explorer : 0) + (open.inspector ? want.inspector : 0) - space;
  if (over <= 0) return want;
  const room = { explorer: open.explorer ? want.explorer - mins.explorer : 0, inspector: open.inspector ? want.inspector - mins.inspector : 0 };
  const total = room.explorer + room.inspector;
  if (total <= 0) return { explorer: mins.explorer, inspector: mins.inspector };
  const cut = Math.min(over, total);
  return {
    explorer: open.explorer ? Math.round(want.explorer - (cut * room.explorer) / total) : want.explorer,
    inspector: open.inspector ? Math.round(want.inspector - (cut * room.inspector) / total) : want.inspector,
  };
}

/** The most a panel may take: what is left of the row after the canvas minimum and the other panel, if that one is open. */
export function maxWidth(panel: WorkbenchPanel, layout: WorkbenchLayout, drawn: { explorer: number; inspector: number }, present: Present, mins: Required<WorkbenchMinSizes>, available: number | null): number {
  if (available === null) return Number.POSITIVE_INFINITY;
  const other: WorkbenchPanel = panel === "explorer" ? "inspector" : "explorer";
  const handles = (present.explorer ? HANDLE : 0) + (present.inspector ? HANDLE : 0);
  const beside = present[other] && !layout.collapsed[other] ? drawn[other] : 0;
  return Math.max(mins[panel], available - mins.canvas - handles - beside);
}
