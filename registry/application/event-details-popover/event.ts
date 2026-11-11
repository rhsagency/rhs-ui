/**
 * The facts and the words behind EventDetailsPopover, as plain types and
 * functions: they hold no state and call no hook, so a Server Component can
 * use them too. Every formatter takes the locale and the time zone, so the
 * server and the browser write the same text for the same moment.
 */

/** Something a moment can be written as: a Date, a timestamp or an ISO string. */
export type EventMoment = Date | string | number;

/** Whether the event is on, still a maybe, or called off. */
export type EventStatus = "confirmed" | "tentative" | "cancelled";

/** One person who is invited. */
export interface EventPerson {
  /** A stable identity from your own data. */
  id: string;
  /** Their name. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
}

/** The event a panel describes. */
export interface EventInfo {
  /** What it is: "Design review". */
  title: string;
  /** When it starts. For an all-day event, midnight of its first day in `timeZone`. */
  start: EventMoment;
  /** When it ends. Leave it out for an event that is only a moment. For an all-day event, midnight after its last day. */
  end?: EventMoment;
  /** An all-day event: the panel shows the date or dates and "All day", no clock times. */
  allDay?: boolean;
  /** The IANA time zone the event was made in: "Europe/Amsterdam". The times are shown in it first. Default "UTC". */
  timeZone?: string;
  /** Where it takes place: an address, a room. */
  location?: string;
  /** Where to join online. An http or https address becomes a link; anything else is shown as text. */
  link?: string;
  /** Who is invited. Shown as a stack of avatars with the count. */
  attendees?: readonly EventPerson[];
  /** More about it. Cut to four lines, with a button to read the rest. */
  description?: string;
  /** Default "confirmed". A cancelled event has its title struck through and says so. */
  status?: EventStatus;
}

/** The words the panel says, for translation. `{when}`, `{count}` and `{end}` are filled in. */
export interface EventDetailsLabels {
  /** The close button's name. Default "Close". */
  close?: string;
  /** Said instead of a clock time for an all-day event. Default "All day". */
  allDay?: string;
  /** The end of an event that runs over midnight: "to Sat 31 Oct, 02:00". Default "to {end}". */
  until?: string;
  /** In front of the time in the reader's own zone. Default "Your time". */
  yourTime?: string;
  /** The word for a cancelled event. Default "Cancelled". */
  cancelled?: string;
  /** The word for an event that is not confirmed yet. Default "Tentative". */
  tentative?: string;
  /** The word for an event that is on right now. Default "Happening now". */
  now?: string;
  /** The word for an event that is over. Default "Ended {when}", as in "Ended 3 days ago". */
  ended?: string;
  /** The link to join online. Default "Join video call". */
  join?: string;
  /** Said to screen readers after a link that opens a new tab. Default "(opens in a new tab)". */
  newTab?: string;
  /** The number of people when it is one. Default "{count} person". */
  attendeesOne?: string;
  /** The number of people otherwise. Default "{count} people". */
  attendeesOther?: string;
  /** The end of the names, for those not named. Default "{count} more". */
  andMore?: string;
  /** The name of the list of people for screen readers. Default "Attendees". */
  attendees?: string;
  /** The button that shows all of a long description. Default "Show more". */
  showMore?: string;
  /** The button that cuts it again. Default "Show less". */
  showLess?: string;
}

export const DEFAULT_LABELS = {
  close: "Close",
  allDay: "All day",
  until: "to {end}",
  yourTime: "Your time",
  cancelled: "Cancelled",
  tentative: "Tentative",
  now: "Happening now",
  ended: "Ended {when}",
  join: "Join video call",
  newTab: "(opens in a new tab)",
  attendeesOne: "{count} person",
  attendeesOther: "{count} people",
  andMore: "{count} more",
  attendees: "Attendees",
  showMore: "Show more",
  showLess: "Show less",
} satisfies Required<EventDetailsLabels>;

/** Puts values into a template: `fill("Ended {when}", { when: "yesterday" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** A moment as milliseconds since 1970, or null when it is missing or not a date. */
export function momentOf(value: EventMoment | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const at = value instanceof Date ? value.getTime() : typeof value === "number" ? value : new Date(value).getTime();
  return Number.isNaN(at) ? null : at;
}

// Intl writes some spaces as narrow or thin no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
const ODD_SPACES = new RegExp(`[${String.fromCharCode(0x00a0, 0x2009, 0x202f)}]`, "g");

/** A date or a time in a zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function format(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  return text.replace(ODD_SPACES, " ");
}

/** The way times are written: "09:00" on a 24-hour clock, so a column of them lines up, and "9:00 AM" on a 12-hour one. */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
    return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
  } catch {
    return { hour: "numeric", minute: "2-digit" };
  }
}

const FULL_DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
const SHORT_DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

/** The calendar day a moment falls on in a zone, as "2026-10-27". The format of en-CA is the one that sorts. */
export function dayKey(at: number, timeZone: string): string {
  return format(at, "en-CA", timeZone, { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** When an event happens, written for one zone. */
export interface When {
  /** The day: "Tuesday, 27 October". For an event over midnight it carries the start: "Fri 30 Oct, 22:00". */
  day: string;
  /** The short form of the day, for comparing and for a second line: "Tue 27 Oct". */
  shortDay: string;
  /** The clock: "10:00 – 11:30". For an event over midnight the end: "to Sat 31 Oct, 02:00". */
  time: string;
  /** Whether the event runs over midnight in this zone. */
  overnight: boolean;
}

export function whenOf(startAt: number, endAt: number | null, allDay: boolean, timeZone: string, locale: string, words: { allDay: string; until: string }): When {
  const clock = clockOptions(locale);
  const startDay = format(startAt, locale, timeZone, FULL_DAY);
  const startShort = format(startAt, locale, timeZone, SHORT_DAY);

  if (allDay) {
    // An all-day event ends at midnight after its last day, so its last day is the millisecond before.
    const last = endAt !== null && endAt > startAt ? endAt - 1 : startAt;
    const overnight = dayKey(last, timeZone) !== dayKey(startAt, timeZone);
    const lastShort = format(last, locale, timeZone, SHORT_DAY);
    return { day: overnight ? `${startShort} – ${lastShort}` : startDay, shortDay: overnight ? `${startShort} – ${lastShort}` : startShort, time: words.allDay, overnight };
  }

  const begin = format(startAt, locale, timeZone, clock);
  if (endAt === null || endAt <= startAt) return { day: startDay, shortDay: startShort, time: begin, overnight: false };
  const finish = format(endAt, locale, timeZone, clock);
  if (dayKey(endAt, timeZone) === dayKey(startAt, timeZone)) return { day: startDay, shortDay: startShort, time: `${begin} – ${finish}`, overnight: false };
  const endShort = format(endAt, locale, timeZone, SHORT_DAY);
  return { day: `${startShort}, ${begin}`, shortDay: startShort, time: fill(words.until, { end: `${endShort}, ${finish}` }), overnight: true };
}

/**
 * The event in the reader's zone, or null when the clock reads the same there. When only the day differs it carries the
 * day: "Wed 28 Oct, 00:30 – 02:00"; otherwise just the clock.
 */
export function viewerLine(own: When, theirs: When): string | null {
  if (own.day === theirs.day && own.time === theirs.time) return null;
  if (theirs.overnight) return `${theirs.day} ${theirs.time}`;
  return theirs.shortDay === own.shortDay ? theirs.time : `${theirs.shortDay}, ${theirs.time}`;
}

/** A zone for a caption: the city and the offset, "Amsterdam (GMT+1)". UTC is just UTC. */
export function zoneText(at: number, timeZone: string, locale: string): string {
  if (timeZone === "UTC") return "UTC";
  const city = (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
  let offset = "";
  for (const style of ["shortOffset", "short"] as const) {
    try {
      offset = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: style }).formatToParts(at).find((part) => part.type === "timeZoneName")?.value ?? "";
      if (offset) break;
    } catch {
      // An older engine does not know shortOffset, and a typo in a zone is not worth a crash: the city alone will do.
    }
  }
  // "GMT+0" is how some engines write no offset at all; "GMT" is how people do.
  offset = offset.replace(/^(GMT|UTC)[+-]0(?::00)?$/, "$1");
  return offset && offset !== city ? `${city} (${offset})` : city;
}

/** Whether the event is still to come, on right now, or over. An event with no end is over the moment it starts. */
export type EventPhase = "upcoming" | "live" | "past";

export function phaseOf(startAt: number, endAt: number | null, now: number): EventPhase {
  const end = endAt !== null && endAt > startAt ? endAt : startAt;
  if (now < startAt) return "upcoming";
  return now < end ? "live" : "past";
}

/** How long ago something was, in words: "5 minutes ago", "yesterday", "3 weeks ago". */
export function agoText(now: number, then: number, locale: string): string {
  const minutes = Math.max(1, Math.round((now - then) / 60_000));
  let value = -minutes;
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  if (minutes >= 60 * 24 * 60) [value, unit] = [-Math.round(minutes / (60 * 24 * 30)), "month"];
  else if (minutes >= 60 * 24 * 14) [value, unit] = [-Math.round(minutes / (60 * 24 * 7)), "week"];
  else if (minutes >= 60 * 24) [value, unit] = [-Math.round(minutes / (60 * 24)), "day"];
  else if (minutes >= 60) [value, unit] = [-Math.round(minutes / 60), "hour"];
  let text: string;
  try {
    text = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(value, unit);
  } catch {
    text = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(value, unit);
  }
  return text.replace(ODD_SPACES, " ");
}

/** An address that is safe to link to: http or https only, so a `javascript:` address from user data never becomes a link. */
export function safeLink(link: string): { href: string; text: string } | null {
  try {
    const url = new URL(link);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return { href: url.href, text: `${url.host}${url.pathname === "/" ? "" : url.pathname}` };
  } catch {
    return null;
  }
}

/** A number the way the locale writes it. */
export function numberText(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("en-US").format(value);
  }
}

/** The people in a line: all of them up to three, then two and a count. "Mara Visser, Tom Jansen and 4 more". */
export function peopleLine(names: readonly string[], locale: string, andMore: string): string {
  const parts = names.length <= 3 ? [...names] : [...names.slice(0, 2), fill(andMore, { count: numberText(names.length - 2, locale) })];
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts);
  } catch {
    return parts.join(", ");
  }
}
