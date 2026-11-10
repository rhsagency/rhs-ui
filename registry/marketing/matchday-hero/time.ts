/**
 * The dates and the words behind MatchdayHero, as plain functions: they hold no state and call no hook, so a Server Component can use
 * them too. Every function takes the locale and the time zone, so the same input gives the same text on the server and in the browser.
 */

/** A moment: a Date, an ISO string with its offset ("2026-11-14T15:00:00+01:00") or a timestamp in ms. */
export type MomentInput = Date | string | number;

/** The words the hero says. `{n}`, `{league}`, `{count}`, `{time}`, `{home}`, `{away}`, `{homeScore}`, `{awayScore}` and `{opponent}` are filled in. */
export interface MatchdayHeroLabels {
  /** The heading while the match is still to come. */
  next: string;
  /** The heading while the match is live. */
  liveNow: string;
  /** The word between the teams. */
  versus: string;
  /** The word on the status of a live match. */
  live: string;
  /** The minute of a live match as it is written: "{minute}'" gives 67'. */
  minute: string;
  /** The minute of a live match as assistive technology hears it: "minute {minute}". */
  minuteSpoken: string;
  /** What assistive technology hears for the score. */
  score: string;
  /** The countdown. `{time}` is "2 days, 4 hours". */
  countdown: string;
  /** The countdown when less than an hour is left. */
  soon: string;
  tickets: string;
  watchLive: string;
  /** Names the form guide for assistive technology. */
  form: string;
  /** The small title over the form guide. */
  formTitle: string;
  win: string;
  draw: string;
  loss: string;
  /** What assistive technology hears after the score. `{opponent}` is the other team. */
  against: string;
  /** The league position after its number. `{league}` is the league. */
  inLeague: string;
  /** The rank as an ordinal, by plural form of the language: "3rd". Give the forms your language needs. */
  ordinals: { other: string } & Partial<Record<"zero" | "one" | "two" | "few" | "many", string>>;
  /** The points, by plural form of the language. */
  points: { one: string; other: string } & Partial<Record<"zero" | "two" | "few" | "many", string>>;
}

export const LABELS: MatchdayHeroLabels = {
  next: "Next match",
  liveNow: "Live now",
  versus: "vs",
  live: "Live",
  minute: "{minute}'",
  minuteSpoken: "minute {minute}",
  score: "{home} {homeScore}, {away} {awayScore}",
  countdown: "In {time}",
  soon: "Kick-off soon",
  tickets: "Tickets",
  watchLive: "Watch live",
  form: "Last five results, most recent last",
  formTitle: "Form",
  win: "Win",
  draw: "Draw",
  loss: "Loss",
  against: "against {opponent}",
  inLeague: "in {league}",
  ordinals: { one: "{n}st", two: "{n}nd", few: "{n}rd", other: "{n}th" },
  points: { one: "{count} point", other: "{count} points" },
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
function zoneOrUtc(zone: string): string {
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

/** Intl writes some spaces as thin or narrow no-break spaces, and the engine decides which: a plain space looks the same and every engine agrees on it. */
const plain = (text: string) => text.replace(/\s/g, " ");

/** The day as people say it: "Saturday 14 November" or "Saturday, November 14", whichever the locale writes. */
export function dayText(ms: number, locale: string, timeZone: string): string {
  return plain(new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: zoneOrUtc(timeZone) }).format(ms));
}

/** The clock time, as the locale writes it: "15:00" for 24-hour times, "3:00 PM" for 12-hour. */
export function clockText(ms: number, locale: string, timeZone: string, hourCycle: "h12" | "h23"): string {
  return plain(new Intl.DateTimeFormat(locale, { hour: hourCycle === "h23" ? "2-digit" : "numeric", minute: "2-digit", hourCycle, timeZone: zoneOrUtc(timeZone) }).format(ms));
}

/** The kick-off as the value of a time element. A string that already carries its offset is kept as it was written. */
export function kickoffIso(value: MomentInput, ms: number): string {
  return typeof value === "string" ? value : new Date(ms).toISOString();
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A countdown appears only inside this many days. */
export const COUNTDOWN_DAYS = 7;

/** The time left to kick-off in whole days and hours, or null when it is over a week away or already past. */
export function countdownOf(kickoff: number, now: number): { days: number; hours: number } | null {
  const ahead = kickoff - now;
  if (!(ahead > 0) || ahead > COUNTDOWN_DAYS * DAY) return null;
  return { days: Math.floor(ahead / DAY), hours: Math.floor((ahead % DAY) / HOUR) };
}

/** The countdown as text: "2 days, 4 hours", "5 hours" or "3 days". Null when under an hour is left. */
export function countdownText(left: { days: number; hours: number }, locale: string): string | null {
  const unit = (value: number, name: "day" | "hour") => plain(new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "long" }).format(value));
  const parts = [left.days ? unit(left.days, "day") : "", left.hours ? unit(left.hours, "hour") : ""].filter(Boolean);
  return parts.length ? plain(new Intl.ListFormat(locale, { style: "long", type: "unit" }).format(parts)) : null;
}

/** The countdown as an ISO 8601 duration for a time element: "P2DT4H". */
export function countdownIso(left: { days: number; hours: number }): string {
  const text = `P${left.days ? `${left.days}D` : ""}${left.hours ? `T${left.hours}H` : ""}`;
  return text === "P" ? "PT0H" : text;
}

/** The form of a counted word the language uses for this number. */
export function plural<T extends { other: string }>(forms: T, count: number, locale: string, type: Intl.PluralRuleType = "cardinal"): string {
  const category = new Intl.PluralRules(locale, { type }).select(count);
  return (forms as Record<string, string | undefined>)[category] ?? forms.other;
}

/** A number in the reader's language: "1,284". */
export function countText(count: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(count);
}
