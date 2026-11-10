import type { ReactNode } from "react";

/** A moment: a Date, an ISO string or a timestamp in milliseconds. */
export type NotificationTime = Date | string | number;

/** The person behind a notification. */
export interface NotificationActor {
  /** Their name. Initials stand in while the picture loads, or when there is none. */
  name: string;
  /** A picture. */
  image?: string;
}

/** One notification in the panel. */
export interface NotificationEntry {
  /** A stable identity: it is what `onMarkRead` receives, and the key of the row. */
  id: string;
  /** What happened, in a sentence: "Mara Okafor replied to your comment". */
  title: string;
  /** A line of context under it, such as the comment itself. Clamped to two lines. */
  body?: string;
  /** When it happened. Read as relative words ("4 min. ago"), with the exact moment in the row's title. */
  time: NotificationTime;
  /** Where the row goes. Without it the row is a button, and `onOpenItem` says what it does. */
  href?: string;
  /** Not seen yet: the row gets a dot, a heavier title and the word "Unread" for screen readers. */
  unread?: boolean;
  /** Who it came from. Without one the row shows `icon` instead of a picture. */
  actor?: NotificationActor;
  /** An icon element, drawn at 16px in a quiet tile, for a notification that no person sent: an export, a payment, a release. A bell stands in when there is none. */
  icon?: ReactNode;
}

/** The words the bell and the panel say, for translation. `{count}` is a number, written in the locale. */
export interface NotificationLabels {
  /** The bell's name, and the panel's. Default "Notifications". */
  notifications?: string;
  /** Said after the bell's name while something is unread. Default "{count} unread". */
  bellUnread?: string;
  /** Said when the panel opens, for one unread notification. Default "{count} unread notification". */
  unreadOne?: string;
  /** Said when the panel opens, for several. Default "{count} unread notifications". */
  unreadMany?: string;
  /** Read before an unread row, next to the dot. Default "Unread". */
  unread?: string;
  /** The button that clears every dot. Default "Mark all as read". */
  markAll?: string;
  /** Said once they are all read. Default "All notifications marked as read". */
  allMarked?: string;
  /** The title of the empty state. Default "You're all caught up". */
  caughtUp?: string;
  /** The line under it. Default "New notifications will show up here." */
  caughtUpBody?: string;
  /** Said while the skeleton rows show. Default "Loading notifications". */
  loading?: string;
  /** The link at the foot of the panel. Default "View all notifications". */
  viewAll?: string;
}

export const DEFAULT_LABELS = {
  notifications: "Notifications",
  bellUnread: "{count} unread",
  unreadOne: "{count} unread notification",
  unreadMany: "{count} unread notifications",
  unread: "Unread",
  markAll: "Mark all as read",
  allMarked: "All notifications marked as read",
  caughtUp: "You're all caught up",
  caughtUpBody: "New notifications will show up here.",
  loading: "Loading notifications",
  viewAll: "View all notifications",
} satisfies Required<NotificationLabels>;

/** Puts values into a template: `fill("{count} unread", { count: 3 })`. A name it does not know is left as it was. */
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

/** A count as the bell and the panel say it: written in the locale, and "99+" past 99. */
export function countText(count: number, locale: string): string {
  const format = (value: number) => {
    try {
      return new Intl.NumberFormat(locale).format(value);
    } catch {
      return String(value);
    }
  };
  return count > 99 ? `${format(99)}+` : format(count);
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A moment as milliseconds, or NaN when it is not a date at all. */
export function toTimestamp(time: NotificationTime): number {
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
function dayNumber(at: number, timeZone: string): number {
  const parts = dateFormat("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / DAY);
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
  return Number.isNaN(at) ? "" : dateFormat(locale, timeZone, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(at);
}

/** The exact moment with its zone, for the row's title: "Tue, Nov 10, 2026, 9:12 AM UTC". */
export function exactText(at: number, locale: string, timeZone: string): string {
  return Number.isNaN(at) ? "" : dateFormat(locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(at);
}

/** What the bell announces when the panel opens: "3 unread notifications", or that there is nothing new. */
export function unreadSummary(unread: number, locale: string, labels: Required<NotificationLabels>): string {
  return unread > 0 ? fill(plural(unread, labels.unreadOne, labels.unreadMany, locale), { count: countText(unread, locale) }) : labels.caughtUp;
}
