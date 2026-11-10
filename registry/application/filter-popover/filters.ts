/**
 * The words and the small decisions behind FilterPopover, as plain functions:
 * they hold no state and call no hook, so a Server Component can use them too.
 */

/** One choice in a checkbox or radio group. */
export interface FilterOption {
  /** A stable identity from your own data: "acme". It is what the filter value holds. Unique within the group. */
  value: string;
  /** What people call it. */
  label: string;
  /** How many results it has, shown muted at the end. */
  count?: number;
  /** Turns the choice off, for an option that would lead nowhere. */
  disabled?: boolean;
}

interface FilterBase {
  /** A stable identity: the key of this group in the filter value. Unique within the list. */
  id: string;
  /** What the group is called: "Brand". */
  label: string;
  /** Whether the group is open when the panel opens. Default: the first group, and every group that has something chosen. */
  defaultOpen?: boolean;
}

/** Any number of options may be chosen. The value is the list of their `value`s. */
export interface CheckboxFilter extends FilterBase {
  kind: "checkbox";
  options: readonly FilterOption[];
}

/** One option at most is chosen. The value is its `value`. */
export interface RadioFilter extends FilterBase {
  kind: "radio";
  options: readonly FilterOption[];
  /** The option that counts as "no filter", such as "any". Choosing it clears the group. */
  defaultValue?: string;
}

/** A minimum and a maximum on one track. The value is `[min, max]`; the whole span means no filter. */
export interface RangeFilter extends FilterBase {
  kind: "range";
  min: number;
  max: number;
  step?: number;
  /** Written before a number: "€". */
  prefix?: string;
  /** Written after a number: " km". */
  suffix?: string;
}

/** One switch, such as "In stock only". The value is a boolean; off means no filter. */
export interface ToggleFilter extends FilterBase {
  kind: "toggle";
  /** A line under the label that says what it does. */
  description?: string;
}

export type FilterGroup = CheckboxFilter | RadioFilter | RangeFilter | ToggleFilter;

/** What is filtered, by group id. A group that is not filtering is left out. */
export type FilterValue = Record<string, string[] | string | [number, number] | boolean>;

/** The words the filters say, for translation. `{count}`, `{group}` and `{query}` are filled in. */
export interface FilterPopoverLabels {
  /** The trigger. Default "Filters". */
  trigger?: string;
  /** Said after the trigger's name when something is filtered. Default "{count} active". */
  active?: string;
  /** The title of the panel. Default "Filters". */
  title?: string;
  /** Empties the draft. Default "Reset". */
  reset?: string;
  /** Said politely when the count changes, for one result. Default "{count} result". */
  resultOne?: string;
  /** The same for any other number. Default "{count} results". */
  resultMany?: string;
  /** The apply button when the number of results is not known and nothing is chosen. Default "Apply filters". */
  apply?: string;
  /** The same for one filter. Default "Apply {count} filter". */
  applyOne?: string;
  /** The same for several. Default "Apply {count} filters". */
  applyMany?: string;
  /** The apply button when everything was taken away from filters that were on. Default "Clear filters". */
  clear?: string;
  /** The apply button when the results are counted and there is one. Default "Show {count} result". */
  showOne?: string;
  /** The same for any other number. Default "Show {count} results". */
  showMany?: string;
  /** The apply button while the first count is on its way. Default "Show results". */
  showPending?: string;
  /** The apply button when nothing would be left. Default "No results". */
  noResults?: string;
  /** Said under the buttons when nothing would be left. Default "Nothing matches these filters. Take one away.". */
  noResultsHint?: string;
  /** Said after Apply when one filter is on. Default "{count} filter applied". */
  appliedOne?: string;
  /** The same for several. Default "{count} filters applied". */
  appliedMany?: string;
  /** The same when all were taken away. Default "Filters cleared". */
  appliedNone?: string;
  /** What a closed group shows when options are chosen. Default "{count} selected". */
  selected?: string;
  /** The name of the search field of a long group. Default "Search {group}". */
  searchIn?: string;
  /** The hint inside it. Default "Search…". */
  searchPlaceholder?: string;
  /** Said when the search finds nothing. Default "Nothing matches “{query}”". */
  nothingMatches?: string;
  /** The label of the lower field of a range. Default "Min". */
  min?: string;
  /** The label of the upper field. Default "Max". */
  max?: string;
}

export const DEFAULT_LABELS = {
  trigger: "Filters",
  active: "{count} active",
  title: "Filters",
  reset: "Reset",
  resultOne: "{count} result",
  resultMany: "{count} results",
  apply: "Apply filters",
  applyOne: "Apply {count} filter",
  applyMany: "Apply {count} filters",
  clear: "Clear filters",
  showOne: "Show {count} result",
  showMany: "Show {count} results",
  showPending: "Show results",
  noResults: "No results",
  noResultsHint: "Nothing matches these filters. Take one away.",
  appliedOne: "{count} filter applied",
  appliedMany: "{count} filters applied",
  appliedNone: "Filters cleared",
  selected: "{count} selected",
  searchIn: "Search {group}",
  searchPlaceholder: "Search…",
  nothingMatches: "Nothing matches “{query}”",
  min: "Min",
  max: "Max",
} satisfies Required<FilterPopoverLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** How many options a group may have before it gets a search field. */
export const SEARCH_AFTER = 8;

/** Whether a group is filtering: something is chosen, the range is narrower than its span, the switch is on. */
export function isActive(group: FilterGroup, value: FilterValue[string] | undefined): boolean {
  if (value === undefined) return false;
  switch (group.kind) {
    case "checkbox":
      return Array.isArray(value) && typeof value[0] === "string" && value.length > 0;
    case "radio":
      return typeof value === "string" && value !== "" && value !== group.defaultValue;
    case "range": {
      if (!Array.isArray(value) || typeof value[0] !== "number") return false;
      const [low, high] = value as [number, number];
      return low > group.min || high < group.max;
    }
    case "toggle":
      return value === true;
  }
}

/** The filter value reduced to the groups that are filtering, with ranges and lists in shape. Unknown ids are dropped. */
export function cleanFilters(groups: readonly FilterGroup[], value: FilterValue): FilterValue {
  const out: FilterValue = {};
  for (const group of groups) {
    const entry = value[group.id];
    if (!isActive(group, entry) || entry === undefined) continue;
    if (group.kind === "checkbox" && Array.isArray(entry)) {
      // Only options the group has, in the group's order.
      const chosen = group.options.map((option) => option.value).filter((key) => (entry as string[]).includes(key));
      if (chosen.length) out[group.id] = chosen;
    } else if (group.kind === "range" && Array.isArray(entry)) {
      const low = Math.max(group.min, Math.min(Number(entry[0]), group.max));
      const high = Math.min(group.max, Math.max(Number(entry[1]), low));
      out[group.id] = [low, high];
    } else out[group.id] = entry;
  }
  return out;
}

/** How many groups are filtering. */
export function countActive(groups: readonly FilterGroup[], value: FilterValue): number {
  return groups.filter((group) => isActive(group, value[group.id])).length;
}

/** Whether two filter values filter the same way. */
export function sameFilters(groups: readonly FilterGroup[], a: FilterValue, b: FilterValue): boolean {
  return JSON.stringify(cleanFilters(groups, a)) === JSON.stringify(cleanFilters(groups, b));
}

/** The number of a range written with its prefix and suffix, in the reader's locale. */
export function formatRange(group: RangeFilter, amount: number, locale: string): string {
  return `${group.prefix ?? ""}${new Intl.NumberFormat(locale).format(amount)}${group.suffix ?? ""}`;
}

/** What a closed group says about itself: what is chosen, so the panel reads at a glance. Empty when nothing is. */
export function summaryOf(group: FilterGroup, value: FilterValue[string] | undefined, labels: Required<FilterPopoverLabels>, locale: string): string {
  if (!isActive(group, value) || value === undefined) return "";
  if (group.kind === "checkbox" && Array.isArray(value)) {
    const chosen = group.options.filter((option) => (value as string[]).includes(option.value));
    return chosen.length === 1 ? (chosen[0]?.label ?? "") : fill(labels.selected, { count: chosen.length });
  }
  if (group.kind === "radio" && typeof value === "string") return group.options.find((option) => option.value === value)?.label ?? "";
  if (group.kind === "range" && Array.isArray(value) && typeof value[0] === "number") return `${formatRange(group, value[0], locale)} – ${formatRange(group, Number(value[1]), locale)}`;
  return "";
}

/** Picks the singular or the plural sentence for a count, by the rules of the locale. */
export function plural(count: number, one: string, other: string, locale: string): string {
  return new Intl.PluralRules(locale).select(count) === "one" ? one : other;
}
