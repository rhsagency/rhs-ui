/**
 * The dates and words behind TimetableHero, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every
 * function takes the locale and the time zone, so the same input gives the
 * same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string with its offset ("2026-11-04T18:30:00+01:00") or a timestamp in ms. */
export type MomentInput = Date | string | number;

/** The words the hero says. `{name}` and `{count}` are filled in. */
export interface TimetableHeroLabels {
  /** The tag on a class that has begun. */
  started: string;
  /** The name of the meter of places, and the words in front of the number. */
  spotsLeft: string;
  /** What a full class says in place of the meter. */
  full: string;
  /** The coach, under the class name. `{name}` is the coach. */
  coach: string;
  /** Names the row of tiles for assistive technology. */
  sessions: string;
  /** Said when nothing is left today, unless the `emptyMessage` prop says it. */
  empty: string;
}

export const LABELS: TimetableHeroLabels = {
  started: "Started",
  spotsLeft: "Spots left",
  full: "Full, join waitlist",
  coach: "with {name}",
  sessions: "Classes",
  empty: "No more classes today.",
};

/** "{name}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** A moment as milliseconds, or NaN when it is not one. */
export function momentMs(value: MomentInput): number {
  return new Date(value).getTime();
}

const zones = new Map<string, string>();

/** The zone as given, or UTC when Intl does not know it: a typo must not take the page down. */
export function zoneOrUtc(zone: string): string {
  let known = zones.get(zone);
  if (known === undefined) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone });
      known = zone;
    } catch {
      known = "UTC";
    }
    zones.set(zone, known);
  }
  return known;
}

/** The calendar day of a moment in the zone, as "2026-11-04": days compare as text. */
export function dayKey(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: zoneOrUtc(timeZone) }).formatToParts(ms);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Intl writes some spaces as thin or narrow no-break spaces, and the Unicode data of the engine decides which: a plain space looks the same and every engine agrees on it. */
const plain = (text: string) => text.replace(/\s/g, " ");

/** The clock time of a moment, as the locale writes it, with the day period split off ("6:30" and "PM") so it can be set small. 24-hour times have none. */
export function clockParts(ms: number, locale: string, timeZone: string, hourCycle: "h12" | "h23"): { text: string; period: string | null } {
  const format = new Intl.DateTimeFormat(locale, { hour: hourCycle === "h23" ? "2-digit" : "numeric", minute: "2-digit", hourCycle, timeZone: zoneOrUtc(timeZone) });
  let text = "";
  let period: string | null = null;
  for (const part of format.formatToParts(ms)) {
    if (part.type === "dayPeriod") period = plain(part.value).trim();
    else text += plain(part.value);
  }
  return { text: text.trim(), period };
}

/** The day as people say it: "Wednesday 4 November" or "Wednesday, November 4", whichever the locale writes. */
export function dayText(ms: number, locale: string, timeZone: string): string {
  return plain(new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: zoneOrUtc(timeZone) }).format(ms));
}
