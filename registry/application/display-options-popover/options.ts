/**
 * The shape of a display setting and the small decisions behind
 * DisplayOptionsPopover, as plain types and functions: they hold no state, so
 * a Server Component can use them too.
 */
import type { ReactNode } from "react";

/** One way to lay the list out: a list, a board, a table. */
export interface DisplayLayout {
  /** A stable identity from your own data: "board". It is what `value.layout` holds. Unique in the list. */
  id: string;
  /** What people call it: "Board". It sits under the icon. */
  label: string;
  /** An icon element for the tile, drawn at 20px. Left out, a drawing is chosen from the id (list, board, table, grid, calendar), and a layout icon stands in for any other. */
  icon?: ReactNode;
}

/** One thing the list can be grouped or ordered by. */
export interface DisplayField {
  /** A stable identity from your own data: "status". Unique in the list. */
  id: string;
  /** What people call it: "Status". Include an entry that means none, such as "No grouping", when grouping is optional. */
  label: string;
}

/** One field of a row that can be shown or hidden. */
export interface DisplayProperty {
  /** A stable identity from your own data: "assignee". Unique in the list. */
  id: string;
  /** What people call it: "Assignee". */
  label: string;
  /** Whether it shows in the defaults. Default true. */
  visible?: boolean;
}

export type DisplayDirection = "asc" | "desc";

/** What is chosen, as plain data you can keep in a saved view or in the address. */
export interface DisplayValue {
  /** The `id` of the layout. */
  layout: string;
  /** The `id` of the field the rows are grouped by. */
  grouping: string;
  /** The `id` of the field the rows are ordered by. */
  ordering: string;
  /** Which way the ordering runs. */
  direction: DisplayDirection;
  /** The `id` of every property that shows on a row, in the order the properties were given. */
  properties: readonly string[];
}

/** The four settings a person can have changed from the defaults. */
export type DisplaySection = "layout" | "grouping" | "ordering" | "properties";

/** The options a value is read against. */
export interface DisplayOptions {
  layouts: readonly DisplayLayout[];
  groupings: readonly DisplayField[];
  orderings: readonly DisplayField[];
  properties: readonly DisplayProperty[];
}

/** The words the popover says, for translation. `{count}` is filled in. */
export interface DisplayOptionsLabels {
  /** The button's text. Default "Display". */
  trigger?: string;
  /** Said after the button's name when something differs from the defaults. Default "{count} changed". */
  changed?: string;
  /** The title of the panel. Default "Display". */
  title?: string;
  /** Puts everything back. Default "Reset". */
  reset?: string;
  /** Shown beside Reset, and said politely, once it was pressed. Default "Back to the defaults". */
  resetDone?: string;
  /** The heading of the layout tiles. Default "Layout". */
  layout?: string;
  /** The heading of the grouping field. Default "Grouping". */
  grouping?: string;
  /** The heading of the ordering field. Default "Ordering". */
  ordering?: string;
  /** The name of the direction button. Default "Descending order". */
  descending?: string;
  /** The heading of the property chips. Default "Properties". */
  properties?: string;
  /** The line under it. Default "Shown on every row". */
  propertiesHint?: string;
  /** A tag beside a heading whose setting differs from the defaults. Default "Changed". */
  changedTag?: string;
}

export const DEFAULT_LABELS = {
  trigger: "Display",
  changed: "{count} changed",
  title: "Display",
  reset: "Reset",
  resetDone: "Back to the defaults",
  layout: "Layout",
  grouping: "Grouping",
  ordering: "Ordering",
  descending: "Descending order",
  properties: "Properties",
  propertiesHint: "Shown on every row",
  changedTag: "Changed",
} satisfies Required<DisplayOptionsLabels>;

/** Puts values into a template: `fill("{count} changed", { count: 2 })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** What a view starts as: the first layout, grouping and ordering, ascending, and every property that is not marked hidden. */
export function defaultDisplay(options: DisplayOptions): DisplayValue {
  return {
    layout: options.layouts[0]?.id ?? "",
    grouping: options.groupings[0]?.id ?? "",
    ordering: options.orderings[0]?.id ?? "",
    direction: "asc",
    properties: options.properties.filter((property) => property.visible !== false).map((property) => property.id),
  };
}

/**
 * A value that can be drawn: an id that no longer exists falls back to the default, and the properties are the ones that
 * exist, in the order they were given, so a saved view from an older version never breaks the panel.
 */
export function readDisplay(value: DisplayValue | undefined, options: DisplayOptions, defaults: DisplayValue): DisplayValue {
  if (!value) return defaults;
  const known = (list: readonly { id: string }[], id: string, fallback: string) => (list.some((item) => item.id === id) ? id : fallback);
  const shown = new Set(value.properties);
  return {
    layout: known(options.layouts, value.layout, defaults.layout),
    grouping: known(options.groupings, value.grouping, defaults.grouping),
    ordering: known(options.orderings, value.ordering, defaults.ordering),
    direction: value.direction === "desc" ? "desc" : "asc",
    properties: options.properties.filter((property) => shown.has(property.id)).map((property) => property.id),
  };
}

/** Whether two lists hold the same ids, whatever their order. */
function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item));
}

/** Which of the four settings differ from the defaults. Ordering counts once, whether the field or the direction moved. */
export function changedSections(value: DisplayValue, defaults: DisplayValue): DisplaySection[] {
  const changed: DisplaySection[] = [];
  if (value.layout !== defaults.layout) changed.push("layout");
  if (value.grouping !== defaults.grouping) changed.push("grouping");
  if (value.ordering !== defaults.ordering || value.direction !== defaults.direction) changed.push("ordering");
  if (!sameSet(value.properties, defaults.properties)) changed.push("properties");
  return changed;
}
