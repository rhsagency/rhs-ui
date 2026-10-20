/*
 * The pure half of the add-to-calendar button: one event object in, links and
 * an .ics file out. Nothing here touches the page, the network or the clock
 * (the .ics stamp takes `now` as an option), so every function can be tested
 * with plain inputs. The button in index.tsx only decides what to show.
 */

export type CalendarProvider = "google" | "outlook" | "apple" | "ics";

export interface CalendarEvent {
  /** What the event is called. */
  title: string;
  /**
   * When it starts. A string without an offset ("2026-11-12T19:00") is read as a wall-clock time in `timeZone`;
   * a Date, or a string that ends in Z or +01:00, is an exact moment. For an all-day event, the day ("2026-11-12").
   */
  start: string | Date;
  /** When it ends, in the same forms as `start`. For an all-day event it is the last day, inclusive. */
  end?: string | Date;
  /** Instead of `end`: how long it lasts, in minutes. Default 60 (one day for an all-day event). */
  durationMinutes?: number;
  /** The IANA time zone the wall-clock times are in, "Europe/Amsterdam". Default "UTC". */
  timeZone?: string;
  /** Where it happens: an address, a room or a video link. */
  location?: string;
  /** What to expect, in plain text. Line breaks are kept. */
  description?: string;
  /** A page about the event. It goes into the .ics URL field and under the description of the web links. */
  url?: string;
  /** A date with no time. */
  allDay?: boolean;
  /** Your own stable id. It becomes the UID of the .ics file, so adding an edited event again updates the first one instead of making a copy. */
  uid?: string;
}

/** An event after reading its dates: exact moments in UTC milliseconds, ready to be written in any format. */
export interface ResolvedEvent {
  title: string;
  timeZone: string;
  allDay: boolean;
  /** UTC milliseconds. For an all-day event: midnight UTC of the first day. */
  start: number;
  /** UTC milliseconds. For an all-day event: midnight UTC of the day after the last one, as iCalendar writes it. */
  end: number;
  location?: string;
  description?: string;
  url?: string;
  uid?: string;
}

export type ResolveResult = { ok: true; event: ResolvedEvent } | { ok: false; reason: string };

const MINUTE = 60_000;
const DAY = 86_400_000;
const pad = (value: number, width = 2) => String(value).padStart(width, "0");

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;
// A time followed by Z or an offset. A bare date such as 2026-11-12 ends in -12 and must not count as an offset.
const HAS_OFFSET = /[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/** The offset of a zone from UTC at one instant, in milliseconds: what a wall clock there reads minus UTC. */
function zoneOffset(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(instant));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asIfUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
  return asIfUtc - Math.floor(instant / 1000) * 1000;
}

/** A wall-clock time in a zone, as UTC milliseconds. Two passes settle the offset around a daylight saving change. */
function wallClockToUtc(year: number, month: number, day: number, hour: number, minute: number, second: number, timeZone: string): number | null {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(guess);
  // Date.UTC rolls over (the 31st of February becomes March); a real date reads back the same.
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  if (timeZone === "UTC") return guess;
  const first = guess - zoneOffset(guess, timeZone);
  return guess - zoneOffset(first, timeZone);
}

/** The calendar day of an instant in a zone, as midnight UTC of that day. */
function dayInZone(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(instant));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(read("year"), read("month") - 1, read("day"));
}

function knownZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** A moment in time from any accepted form, or null when it is not one. */
function parseMoment(input: string | Date, timeZone: string): number | null {
  if (input instanceof Date) return Number.isFinite(input.getTime()) ? input.getTime() : null;
  const text = input.trim();
  if (HAS_OFFSET.test(text)) {
    const parsed = Date.parse(text.replace(" ", "T"));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const match = WALL_CLOCK.exec(text);
  if (!match) return null;
  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  return wallClockToUtc(Number(year), Number(month), Number(day), Number(hour), Number(minute), Number(second), timeZone);
}

/** A calendar day (midnight UTC) from a date string or a Date, in the event's zone. */
function parseDay(input: string | Date, timeZone: string): number | null {
  if (input instanceof Date) return Number.isFinite(input.getTime()) ? dayInZone(input.getTime(), timeZone) : null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const value = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const check = new Date(value);
  return check.getUTCMonth() === Number(month) - 1 && check.getUTCDate() === Number(day) ? value : null;
}

/**
 * Reads an event's dates once, so every format agrees. Returns the reason in
 * words when it cannot: the button shows it next to the disabled state.
 */
export function resolveEvent(event: CalendarEvent): ResolveResult {
  const title = event.title?.trim();
  if (!title) return { ok: false, reason: "Give the event a title to add it." };
  const timeZone = event.timeZone?.trim() || "UTC";
  if (!knownZone(timeZone)) return { ok: false, reason: `"${timeZone}" is not a time zone this button knows.` };
  const base = { title, timeZone, location: event.location?.trim() || undefined, description: event.description?.trim() || undefined, url: event.url?.trim() || undefined, uid: event.uid?.trim() || undefined };

  if (event.allDay) {
    const first = parseDay(event.start, timeZone);
    if (first === null) return { ok: false, reason: "The start date is not a valid day." };
    let last = first;
    if (event.end !== undefined) {
      const parsed = parseDay(event.end, timeZone);
      if (parsed === null) return { ok: false, reason: "The end date is not a valid day." };
      last = parsed;
    } else if (event.durationMinutes && event.durationMinutes > 0) {
      last = first + (Math.max(1, Math.ceil(event.durationMinutes / 1440)) - 1) * DAY;
    }
    if (last < first) return { ok: false, reason: "The event ends before it starts." };
    return { ok: true, event: { ...base, allDay: true, start: first, end: last + DAY } };
  }

  const start = parseMoment(event.start, timeZone);
  if (start === null) return { ok: false, reason: "The start is not a valid date and time." };
  let end: number | null;
  if (event.end !== undefined) {
    end = parseMoment(event.end, timeZone);
    if (end === null) return { ok: false, reason: "The end is not a valid date and time." };
  } else {
    const minutes = event.durationMinutes !== undefined && event.durationMinutes > 0 ? event.durationMinutes : 60;
    end = start + minutes * MINUTE;
  }
  if (end <= start) return { ok: false, reason: "The event has to end after it starts." };
  return { ok: true, event: { ...base, allDay: false, start, end } };
}

/** 20261112T180000Z */
function utcStamp(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/** 20261112 */
function utcDay(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** 2026-11-12 */
function isoDay(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** 2026-11-12T18:00:00Z */
function isoInstant(ms: number): string {
  return `${new Date(ms).toISOString().slice(0, 19)}Z`;
}

const query = (pairs: readonly (readonly [string, string | undefined])[]) =>
  pairs
    .filter((pair): pair is readonly [string, string] => pair[1] !== undefined && pair[1] !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

/** The description with the event page under it, for the web links that have no field for a URL. */
function detailsOf(event: ResolvedEvent): string | undefined {
  return [event.description, event.url].filter(Boolean).join("\n\n") || undefined;
}

/**
 * A link that opens Google Calendar with the event filled in. The moments are
 * written in UTC and `ctz` names the zone to show them in. Returns null when the
 * event is not valid.
 */
export function buildGoogleUrl(event: CalendarEvent): string | null {
  const result = resolveEvent(event);
  if (!result.ok) return null;
  const { event: e } = result;
  const dates = e.allDay ? `${utcDay(e.start)}/${utcDay(e.end)}` : `${utcStamp(e.start)}/${utcStamp(e.end)}`;
  const rest = query([
    ["text", e.title],
    ["details", detailsOf(e)],
    ["location", e.location],
    ["ctz", e.allDay ? undefined : e.timeZone],
  ]);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${dates}${rest ? `&${rest}` : ""}`;
}

export interface OutlookOptions {
  /** Open Outlook for work or school (outlook.office.com) instead of the personal calendar (outlook.live.com). */
  work?: boolean;
}

/** A link that opens the Outlook calendar's new-event form, filled in. Returns null when the event is not valid. */
export function buildOutlookUrl(event: CalendarEvent, options: OutlookOptions = {}): string | null {
  const result = resolveEvent(event);
  if (!result.ok) return null;
  const { event: e } = result;
  const host = options.work ? "outlook.office.com" : "outlook.live.com";
  const rest = query([
    ["path", "/calendar/action/compose"],
    ["rru", "addevent"],
    ["subject", e.title],
    ["startdt", e.allDay ? isoDay(e.start) : isoInstant(e.start)],
    ["enddt", e.allDay ? isoDay(e.end) : isoInstant(e.end)],
    ["allday", e.allDay ? "true" : undefined],
    ["body", detailsOf(e)],
    ["location", e.location],
  ]);
  return `https://${host}/calendar/0/deeplink/compose?${rest}`;
}

/** Escapes a TEXT value: backslash, semicolon and comma get a backslash, a line break becomes \n (RFC 5545, 3.3.11). */
export function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

const encoder = new TextEncoder();

/**
 * Folds a content line so no physical line is longer than 75 octets (RFC 5545,
 * 3.1). Every continuation starts with one space, which counts toward the
 * limit, and a character is never cut in the middle of its UTF-8 bytes.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const rows: string[] = [];
  let row = "";
  let size = 0;
  for (const char of line) {
    const width = encoder.encode(char).length;
    if (size + width > 75) {
      rows.push(row);
      row = "";
      size = 1;
    }
    row += char;
    size += width;
  }
  rows.push(row);
  return rows.join("\r\n ");
}

/** A short stable hash (cyrb53), so the same event always gets the same UID. */
function hashOf(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export interface IcsOptions {
  /** The moment written into DTSTAMP. Default: now. Pass a fixed date to get the same text every time. */
  now?: Date;
  /** What follows the @ in a generated UID. Default "rhs-ui". */
  uidDomain?: string;
}

/**
 * The text of an .ics file (iCalendar, RFC 5545) for one event: CRLF line
 * ends, escaped text, lines folded at 75 octets, times converted to UTC and a
 * UID that stays the same for the same event. Returns null when the event is
 * not valid.
 */
export function buildIcs(event: CalendarEvent, options: IcsOptions = {}): string | null {
  const result = resolveEvent(event);
  if (!result.ok) return null;
  const { event: e } = result;
  // A UID is one line of the file: a line break in it would let text in as a new property.
  const uid = (e.uid ?? `${hashOf([e.title, e.start, e.end, e.allDay, e.location ?? ""].join("|"))}@${options.uidDomain ?? "rhs-ui"}`).replace(/[\r\n]+/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RHS UI//Add to calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp((options.now ?? new Date()).getTime())}`,
    e.allDay ? `DTSTART;VALUE=DATE:${utcDay(e.start)}` : `DTSTART:${utcStamp(e.start)}`,
    e.allDay ? `DTEND;VALUE=DATE:${utcDay(e.end)}` : `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${escapeIcsText(e.title)}`,
    e.description ? `DESCRIPTION:${escapeIcsText(e.description)}` : "",
    e.location ? `LOCATION:${escapeIcsText(e.location)}` : "",
    e.url ? `URL:${e.url.replace(/[\r\n]+/g, "")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/** "Halcyon Summit 2026" becomes "halcyon-summit-2026.ics". */
export function icsFileName(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "event"}.ics`;
}

/** The event in words for a menu header: "Thu, Nov 12, 2026, 7:00 PM to 8:30 PM CET". Always names the zone, so nobody has to guess. */
export function describeWhen(event: ResolvedEvent, locale = "en-US"): string {
  if (event.allDay) {
    const day = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    const last = event.end - DAY;
    return last > event.start ? `${day.format(event.start)} to ${day.format(last)}` : `${day.format(event.start)}, all day`;
  }
  const day = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: event.timeZone });
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: event.timeZone });
  const zoned = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: event.timeZone, timeZoneName: "short" });
  if (day.format(event.start) === day.format(event.end)) return `${day.format(event.start)}, ${time.format(event.start)} to ${zoned.format(event.end)}`;
  return `${day.format(event.start)}, ${time.format(event.start)} to ${day.format(event.end)}, ${zoned.format(event.end)}`;
}

/** Hands text to the browser as a file download, with no server involved. */
export function downloadTextFile(contents: string, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  // Safari needs the address to stay valid a little after the click.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
