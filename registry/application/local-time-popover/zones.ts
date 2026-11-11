/**
 * The time zone arithmetic and the words behind LocalTimePopover, as plain
 * functions: they hold no state, so a Server Component can use them too. Every
 * one takes the moment and the zones it needs, and every formatter takes the
 * locale, so the server and the browser write the same text for the same
 * moment. Nothing here reads the zone of the machine it runs on, and daylight
 * saving comes from Intl for the actual date.
 */

/** A moment: a Date, an ISO string or a timestamp in milliseconds. */
export type LocalTime = Date | string | number;

/** One zone to show the moment in. */
export interface LocalZone {
  /** The IANA name of the zone, such as "America/Los_Angeles". Daylight saving follows from it. */
  id: string;
  /** What people call the place: "San Francisco". Default: the place in the zone's name. */
  label?: string;
}

/** The words the popover says, for translation. `{time}`, `{title}` and `{count}` are filled in. */
export interface LocalTimeLabels {
  /** The title of the list. Default "Local times". */
  title?: string;
  /** Read after the time on the trigger, so a screen reader knows what it does. Default "show this time in other time zones". */
  hint?: string;
  /** The tag on the viewer's own zone. Default "You". */
  you?: string;
  /** Marks a zone where it is already the next day. Default "Next day". */
  nextDay?: string;
  /** Marks a zone where it is still the day before. Default "Previous day". */
  previousDay?: string;
  /** The button that copies the times as one line. Default "Copy as text". */
  copy?: string;
  /** What the button says once it copied. Default "Copied". */
  copied?: string;
  /** What the button says when the browser refused. Default "Could not copy". */
  copyFailed?: string;
  /** Said once it copied. Default "Copied the times as text." */
  copiedSaid?: string;
}

export const DEFAULT_LABELS = {
  title: "Local times",
  hint: "show this time in other time zones",
  you: "You",
  nextDay: "Next day",
  previousDay: "Previous day",
  copy: "Copy as text",
  copied: "Copied",
  copyFailed: "Could not copy",
  copiedSaid: "Copied the times as text.",
} satisfies Required<LocalTimeLabels>;

/** One line of the list: a zone, and the moment as that zone's clock shows it. */
export interface ZoneRow {
  /** The IANA name of the zone. */
  id: string;
  /** What people call the place. */
  label: string;
  /** The viewer's own zone. */
  you: boolean;
  /** The time of day: "18:00", or "6:00 PM" where the locale counts that way. */
  time: string;
  /** The weekday and the date: "Thu 22 Oct". */
  date: string;
  /** How many days this zone's date is from the event zone's date: -1, 0 or 1 (very rarely 2). */
  shift: number;
  /** The distance from UTC: "UTC+2", "UTC−7", "UTC+5:30". */
  offset: string;
}

/** Puts values into a template: `fill("{title}: {time}", { title, time })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** A moment as milliseconds, or NaN when it is not a date at all. */
export function toTimestamp(time: LocalTime): number {
  return new Date(time).getTime();
}

const MINUTE = 60_000;
const DAY = 86_400_000;
const HOUR = 3_600_000;

const wallFormats = new Map<string, Intl.DateTimeFormat>();

function wallFormat(timeZone: string): Intl.DateTimeFormat {
  let found = wallFormats.get(timeZone);
  if (!found) {
    try {
      found = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    } catch {
      // An unknown zone is read as UTC: a typo must not take the page down.
      found = wallFormat("UTC");
    }
    wallFormats.set(timeZone, found);
  }
  return found;
}

/** How far a zone's wall clock is ahead of UTC at a moment, in minutes. */
export function offsetMinutes(at: number, timeZone: string): number {
  const parts = wallFormat(timeZone).formatToParts(at);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Math.round((Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second")) - Math.floor(at / 1000) * 1000) / MINUTE);
}

/** The number of the calendar day a moment falls on in a zone, for comparing the days of two zones. */
export function dayNumber(at: number, timeZone: string): number {
  const parts = wallFormat(timeZone).formatToParts(at);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Math.floor(Date.UTC(get("year"), get("month") - 1, get("day")) / DAY);
}

/** An offset for a glance, with tabular digits in mind: "UTC+2", "UTC−7" with a real minus sign, "UTC+5:30". */
export function offsetText(minutes: number): string {
  const total = Math.abs(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `UTC${minutes < 0 ? "−" : "+"}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}

/** "America/Los_Angeles" as "Los Angeles": the place in a zone's name. */
export function cityOf(timeZone: string): string {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

function format(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions, at: number): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}

/** The way the locale writes a time: 24 hours with two digits where it counts that way ("08:00"), otherwise 12 hours ("8:00 AM"). */
export function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  let cycle: string | undefined;
  try {
    cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  } catch {
    cycle = "h12";
  }
  return cycle === "h23" || cycle === "h24" ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : { hour: "numeric", minute: "2-digit" };
}

/** The moment as the trigger writes it: the time and the zone's short name, "18:00 CEST", unless `options` say otherwise. */
export function triggerText(at: number, locale: string, timeZone: string, options?: Intl.DateTimeFormatOptions): string {
  return format(locale, timeZone, options ?? { ...clockOptions(locale), timeZoneName: "short" }, at);
}

/** The day of the event in words, for the head of the list: "Thursday 22 October 2026". */
export function dayText(at: number, locale: string, timeZone: string): string {
  return format(locale, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, at);
}

/** How far off the moment is, in the reader's language: "in 3 days", "tomorrow", "2 hours ago". */
export function relativeText(at: number, now: number, locale: string): string {
  if (Number.isNaN(at)) return "";
  const diff = at - now;
  const [unit, size] = Math.abs(diff) >= DAY ? (["day", DAY] as const) : Math.abs(diff) >= HOUR ? (["hour", HOUR] as const) : (["minute", MINUTE] as const);
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  }
  // From a day up the count is rounded: 47 hours is "in 2 days". Hours and minutes are cut, so 59.6 minutes never reads "in 60 minutes".
  return words.format(unit === "day" ? Math.round(diff / size) : Math.trunc(diff / size), unit);
}

/** The browser's own zone. Only the browser knows it, so call it after the page is live. */
export function browserZone(locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale).resolvedOptions().timeZone;
  } catch {
    return new Intl.DateTimeFormat("en-US").resolvedOptions().timeZone;
  }
}

/**
 * The same moment in every zone, as lines of the list. The viewer's zone comes first and is marked, whether or not it is one of
 * `zones`; the others follow in the order they were given. A zone is listed once, however often it was given.
 */
export function zoneRows(at: number, zones: readonly LocalZone[], eventZone: string, viewerZone: string | null, locale: string): ZoneRow[] {
  const given: LocalZone[] = [];
  for (const zone of zones) if (!given.some((entry) => entry.id === zone.id)) given.push(zone);
  const mine = viewerZone === null ? undefined : (given.find((zone) => zone.id === viewerZone) ?? { id: viewerZone });
  const ordered = mine ? [mine, ...given.filter((zone) => zone.id !== mine.id)] : given;
  const eventDay = dayNumber(at, eventZone);
  return ordered.map((zone) => ({
    id: zone.id,
    label: zone.label ?? cityOf(zone.id),
    you: mine !== undefined && zone.id === mine.id,
    time: format(locale, zone.id, clockOptions(locale), at),
    date: format(locale, zone.id, { weekday: "short", day: "numeric", month: "short" }, at),
    shift: dayNumber(at, zone.id) - eventDay,
    offset: offsetText(offsetMinutes(at, zone.id)),
  }));
}

/** The times as one line to paste into a chat: "Product sync: Thu 22 Oct, 18:00 Amsterdam (UTC+2) / 09:00 San Francisco (UTC−7)". A zone on another day says which. */
export function copyLine(at: number, rows: readonly ZoneRow[], eventZone: string, locale: string, title?: string): string {
  const event = rows.find((row) => row.id === eventZone);
  const segments = [
    ...(event ? [`${format(locale, eventZone, { weekday: "short", day: "numeric", month: "short", ...clockOptions(locale) }, at)} ${event.label} (${event.offset})`] : []),
    ...rows.filter((row) => row.id !== eventZone).map((row) => `${row.shift === 0 ? "" : `${row.date}, `}${row.time} ${row.label} (${row.offset})`),
  ];
  const line = segments.join(" / ");
  return title ? `${title}: ${line}` : line;
}

/**
 * The old way of copying, for pages where the Clipboard API is missing or blocked: the text in a hidden element, selected, and the
 * copy command. The element is selected as a range and never focused, because focus that leaves a popover closes it, and the
 * confirmation would never be seen. What was selected on the page before comes back afterwards.
 */
function legacyCopy(text: string): boolean {
  const holder = document.createElement("span");
  holder.textContent = text;
  Object.assign(holder.style, { position: "fixed", top: "0", left: "0", opacity: "0", pointerEvents: "none", userSelect: "text", whiteSpace: "pre" });
  document.body.append(holder);
  const selection = document.getSelection();
  const before = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
  const range = document.createRange();
  range.selectNodeContents(holder);
  selection?.removeAllRanges();
  selection?.addRange(range);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  selection?.removeAllRanges();
  if (before) selection?.addRange(before);
  holder.remove();
  return copied;
}

/** Puts text on the clipboard. Rejects when the browser refused. */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    if (!legacyCopy(text)) throw error;
  }
}
