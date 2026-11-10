/** One kind of guest: a row in the picker. */
export interface GuestGroup {
  /** The key of the group in the counts, and what a plain form would call it. */
  id: string;
  /** The title of the row: "Adults". */
  label: string;
  /** A line under the title: "Ages 13 or above". */
  description?: string;
  /** The fewest allowed. Default 0. */
  min?: number;
  /** The most allowed of this kind. Default 99. */
  max?: number;
  /** The words for the summary and for a screen reader, one and many: `{ one: "adult", other: "adults" }`. Default the label in lower case, for any number. */
  noun?: { one: string; other: string };
  /** Whether this kind counts toward `maxTotal`. Default true; infants usually do not. */
  countsTowardTotal?: boolean;
}

/** How many of each kind, by group id. */
export type GuestCounts = Record<string, number>;

/** The words the picker says, for translation. A `{name}` mark in a sentence is filled in. */
export interface GuestPickerLabels {
  /** Names the button and the panel. Default "Guests". */
  guests?: string;
  /** On the button while nobody is chosen. Default "Add guests". */
  placeholder?: string;
  /** The button that closes the panel. Default "Done". */
  done?: string;
  /** The minus button; `{group}` is the label in lower case. Default "Fewer {group}". */
  decrease?: string;
  /** The plus button. Default "More {group}". */
  increase?: string;
  /** The footer for one guest. Default "1 guest". */
  totalOne?: string;
  /** The footer for several, no limit; `{total}`. Default "{total} guests". */
  totalMany?: string;
  /** The footer with a limit; `{total}` and `{max}`. Default "{total} of {max} guests". */
  totalOf?: string;
  /** Under a row that is at its fewest; `{min}` and `{noun}`. Default "At least {min} {noun}." */
  atLeast?: string;
  /** Under a row that is at its most; `{max}` and `{noun}`. Default "No more than {max} {noun}." */
  atMost?: string;
  /** Under a row when the total is full; `{maxTotal}`. Default "The limit is {maxTotal} guests in total." */
  totalFull?: string;
  /** After that, when some kinds are left out of the total; `{groups}`. Default "{groups} are not counted." */
  notCounted?: string;
  /** What a screen reader hears after a change; `{group}`, `{count}` and `{total}` (the footer). Default "{group}: {count}. {total}." */
  changed?: string;
}

export const DEFAULT_LABELS = {
  guests: "Guests",
  placeholder: "Add guests",
  done: "Done",
  decrease: "Fewer {group}",
  increase: "More {group}",
  totalOne: "1 guest",
  totalMany: "{total} guests",
  totalOf: "{total} of {max} guests",
  atLeast: "At least {min} {noun}.",
  atMost: "No more than {max} {noun}.",
  totalFull: "The limit is {maxTotal} guests in total.",
  notCounted: "{groups} are not counted.",
  changed: "{group}: {count}. {total}.",
} satisfies Required<GuestPickerLabels>;

export type Words = Required<GuestPickerLabels>;

/** The largest number a kind can reach when nothing else says so. */
const CEILING = 99;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** How many of a kind: what the counts say, or the fewest allowed when they say nothing. */
export const countOf = (counts: GuestCounts, group: GuestGroup): number => counts[group.id] ?? group.min ?? 0;

/** The counts with every group present and inside its own limits. */
export function normalise(groups: readonly GuestGroup[], counts: GuestCounts | undefined): GuestCounts {
  return Object.fromEntries(groups.map((group) => [group.id, Math.min(group.max ?? CEILING, Math.max(group.min ?? 0, Math.trunc(counts?.[group.id] ?? 0)))]));
}

/** The guests that count toward the limit: every kind except those that opt out. */
export function totalOf(counts: GuestCounts, groups: readonly GuestGroup[]): number {
  return groups.reduce((sum, group) => sum + (group.countsTowardTotal === false ? 0 : countOf(counts, group)), 0);
}

export interface Limits {
  min: number;
  max: number;
  /** What holds the maximum back: the kind's own `max`, the total, or nothing worth saying. */
  why: "group" | "total" | null;
}

/** How far a kind can move right now, given what the others hold. */
export function limitsOf(group: GuestGroup, counts: GuestCounts, groups: readonly GuestGroup[], maxTotal: number | undefined): Limits {
  const min = group.min ?? 0;
  const own = group.max ?? CEILING;
  const room = maxTotal !== undefined && group.countsTowardTotal !== false ? maxTotal - (totalOf(counts, groups) - countOf(counts, group)) : Number.POSITIVE_INFINITY;
  const max = Math.max(min, Math.min(own, room));
  return { min, max, why: room < own ? "total" : group.max !== undefined ? "group" : null };
}

/** The noun for a number of a kind: "adult", "adults". */
export function nounFor(group: GuestGroup, count: number, locale: string): string {
  return group.noun ? (count === 1 ? group.noun.one : group.noun.other) : group.label.toLocaleLowerCase(locale);
}

/** "2 adults, 1 child", or `empty` while nobody is chosen. */
export function summarise(counts: GuestCounts, groups: readonly GuestGroup[], locale: string, empty: string): string {
  const numbers = new Intl.NumberFormat(locale);
  const parts = groups.flatMap((group) => {
    const count = countOf(counts, group);
    return count > 0 ? [`${numbers.format(count)} ${nounFor(group, count, locale)}`] : [];
  });
  return parts.length ? new Intl.ListFormat(locale, { style: "long", type: "unit" }).format(parts) : empty;
}
