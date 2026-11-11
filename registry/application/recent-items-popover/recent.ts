/**
 * The grouping, the time words and the labels behind RecentItemsPopover, as
 * plain types and functions: they hold no state, so a Server Component can use
 * them too. Every day is read in the time zone you pass, so the server and the
 * browser put the same item under the same heading.
 */

/** A moment: a Date, an ISO string or a timestamp in milliseconds. */
export type RecentTime = Date | string | number;

/** One thing that was opened. */
export interface RecentItem {
  /** A stable identity from your own data. It is what `onPin` and `onClear` report, and the key of the row. */
  id: string;
  /** What it is called. One line, cut with an ellipsis; the full title is the row's tooltip. */
  title: string;
  /** What kind of thing it is: "project", "document", "record", "board", "folder", "file", "sheet" or "image" have their own icon, any other word gets a file. It is also written under the title. */
  kind: string;
  /** Where the row goes. Without it the row is a button, and `onOpen` says what it does. */
  href?: string;
  /** When it was last opened. The list is ordered by it, newest first. */
  openedAt: RecentTime;
  /** Pinned items stay at the top whatever their age, and `Clear history` leaves them alone. */
  pinned?: boolean;
}

/** The headings, in the order they appear. */
export type RecentGroupId = "pinned" | "today" | "yesterday" | "earlier" | "recent";

export interface RecentGroup {
  id: RecentGroupId;
  items: RecentItem[];
}

/** The words the popover says, for translation. `{title}`, `{count}` and `{seconds}` are filled in. */
export interface RecentItemsLabels {
  /** The button's text. Default "Recent". */
  trigger?: string;
  /** The title of the panel, and its name for a screen reader. Default "Recent items". */
  title?: string;
  /** The button that clears the history. Default "Clear history". */
  clear?: string;
  /** Shown after it was pressed, for one item. Default "Cleared {count} item". */
  clearedOne?: string;
  /** The same for any other number. Default "Cleared {count} items". */
  clearedMany?: string;
  /** Brings the items back. Default "Undo". */
  undo?: string;
  /** Said after Clear was pressed. Default "History cleared. You can undo it for {seconds} seconds." */
  clearedSaid?: string;
  /** Said after Undo was pressed. Default "History restored." */
  restored?: string;
  /** The heading over pinned items. Default "Pinned". */
  groupPinned?: string;
  /** The heading over what was opened today. Default "Today". */
  groupToday?: string;
  /** The heading over what was opened the day before. Default "Yesterday". */
  groupYesterday?: string;
  /** The heading over everything older. Default "Earlier". */
  groupEarlier?: string;
  /** The one heading used until the browser's clock is known, when there is no `now` to group by. Default "Recent". */
  groupRecent?: string;
  /** The name of the pin button of an item that is not pinned. Default "Pin {title}". */
  pin?: string;
  /** The name of the pin button of a pinned item. Default "Unpin {title}". */
  unpin?: string;
  /** Said when an item was pinned. Default "{title} pinned." */
  pinnedSaid?: string;
  /** Said when an item was unpinned. Default "{title} unpinned." */
  unpinnedSaid?: string;
  /** The title of the empty state. Default "Nothing here yet". */
  emptyTitle?: string;
  /** The line under it. Default "Things you open will show up here, so you can get back to them in one step." */
  emptyBody?: string;
  /** The hint for the arrow keys. Default "Move". */
  hintMove?: string;
  /** The hint for Enter. Default "Open". */
  hintOpen?: string;
  /** The hint for the P key. Default "Pin". */
  hintPin?: string;
  /** The words for the kinds of thing, by `kind`: { project: "Project" }. A kind that is not here is written with a capital letter. */
  kinds?: Record<string, string>;
}

export const DEFAULT_KINDS: Record<string, string> = {
  project: "Project",
  document: "Document",
  record: "Record",
  board: "Board",
  folder: "Folder",
  file: "File",
  sheet: "Sheet",
  image: "Image",
};

export const DEFAULT_LABELS = {
  trigger: "Recent",
  title: "Recent items",
  clear: "Clear history",
  clearedOne: "Cleared {count} item",
  clearedMany: "Cleared {count} items",
  undo: "Undo",
  clearedSaid: "History cleared. You can undo it for {seconds} seconds.",
  restored: "History restored.",
  groupPinned: "Pinned",
  groupToday: "Today",
  groupYesterday: "Yesterday",
  groupEarlier: "Earlier",
  groupRecent: "Recent",
  pin: "Pin {title}",
  unpin: "Unpin {title}",
  pinnedSaid: "{title} pinned.",
  unpinnedSaid: "{title} unpinned.",
  emptyTitle: "Nothing here yet",
  emptyBody: "Things you open will show up here, so you can get back to them in one step.",
  hintMove: "Move",
  hintOpen: "Open",
  hintPin: "Pin",
  kinds: DEFAULT_KINDS,
} satisfies Required<RecentItemsLabels>;

/** Puts values into a template: `fill("Pin {title}", { title })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** `one` for 1 in the locale's own rules, `other` for the rest. */
export function plural(count: number, one: string, other: string, locale: string): string {
  try {
    return new Intl.PluralRules(locale).select(count) === "one" ? one : other;
  } catch {
    return count === 1 ? one : other;
  }
}

/** The word for a kind: from the labels, or the kind itself with a capital letter. */
export function kindLabel(kind: string, kinds: Record<string, string>): string {
  return kinds[kind] ?? (kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : kind);
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A moment as milliseconds, or NaN when it is not a date at all. */
export function toTimestamp(time: RecentTime): number {
  return new Date(time).getTime();
}

function dateFormat(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone });
  } catch {
    // An unknown locale or time zone must not take the page down.
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
  }
}

/** The calendar day a moment falls on in the zone, as a day number, so "yesterday" is the day before and not 24 hours ago. */
export function dayNumber(at: number, timeZone: string): number {
  const parts = dateFormat("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / DAY);
}

/**
 * Splits the items under Pinned, Today, Yesterday and Earlier. Pinned come first whatever their age, then each day, newest
 * first inside every group, and `max` is how many of the others are listed. With no clock yet (`now` is null) the others form one
 * group, because "today" cannot be known without it.
 */
export function groupItems(items: readonly RecentItem[], now: number | null, timeZone: string, max: number): RecentGroup[] {
  const byTime = (a: RecentItem, b: RecentItem) => {
    const diff = toTimestamp(b.openedAt) - toTimestamp(a.openedAt);
    return Number.isNaN(diff) ? 0 : diff;
  };
  const pinned = items.filter((item) => item.pinned).sort(byTime);
  const others = items.filter((item) => !item.pinned).sort(byTime).slice(0, Math.max(0, max));
  const groups: RecentGroup[] = [];
  if (pinned.length) groups.push({ id: "pinned", items: pinned });
  if (now === null) {
    if (others.length) groups.push({ id: "recent", items: others });
    return groups;
  }
  const today = dayNumber(now, timeZone);
  const age = (item: RecentItem) => {
    const at = toTimestamp(item.openedAt);
    return Number.isNaN(at) ? 2 : today - dayNumber(at, timeZone);
  };
  const todays = others.filter((item) => age(item) <= 0);
  const yesterdays = others.filter((item) => age(item) === 1);
  const earlier = others.filter((item) => age(item) >= 2);
  if (todays.length) groups.push({ id: "today", items: todays });
  if (yesterdays.length) groups.push({ id: "yesterday", items: yesterdays });
  if (earlier.length) groups.push({ id: "earlier", items: earlier });
  return groups;
}

/**
 * How long ago, in short words: "now", "4 min. ago", "3 hr. ago", "yesterday", "3 days ago", and from a week on the date. The
 * words come from the locale, and the days from the calendar of the time zone, so the server and the browser write the same
 * text from the same `now`.
 */
export function timeText(at: number, now: number, locale: string, timeZone: string): string {
  if (Number.isNaN(at)) return "";
  const diff = at - now;
  const age = Math.abs(diff);
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "short" });
  }
  if (age < MINUTE) return words.format(0, "second");
  if (age < HOUR) return words.format(Math.trunc(diff / MINUTE), "minute");
  if (age < DAY) return words.format(Math.trunc(diff / HOUR), "hour");
  const days = dayNumber(at, timeZone) - dayNumber(now, timeZone);
  if (Math.abs(days) < 7) return words.format(days, "day");
  const sameYear = dateFormat("en-US", timeZone, { year: "numeric" }).format(at) === dateFormat("en-US", timeZone, { year: "numeric" }).format(now);
  return dateFormat(locale, timeZone, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) }).format(at);
}

/** The date and time written out, which is what the first paint shows before the browser's clock is known. */
export function stampText(at: number, locale: string, timeZone: string): string {
  return Number.isNaN(at) ? "" : dateFormat(locale, timeZone, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(at).replace(/\s/g, " ");
}

/** The exact moment with its zone, for a row's tooltip. */
export function exactText(at: number, locale: string, timeZone: string): string {
  return Number.isNaN(at) ? "" : dateFormat(locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(at).replace(/\s/g, " ");
}
