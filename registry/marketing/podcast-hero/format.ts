/**
 * The words and numbers behind PodcastHero, as plain functions: they hold no state and call no hook, so a Server Component can use them
 * too. Every function takes the locale (and the time zone), so the server and the browser write the same text.
 */

/** The words the hero says. `{number}`, `{show}` and `{hosts}` are filled in. */
export interface PodcastHeroLabels {
  /** The small word on a cover that is drawn from the show name. */
  podcast: string;
  /** The line under the show name. `{hosts}` is the names as a list: "Maya Okafor and Luis Brandt". */
  hostedBy: string;
  /** The tag over the latest episode. */
  latest: string;
  /** The tag over the latest episode while it plays. */
  nowPlaying: string;
  /** The episode number as it is written in the tag. */
  episode: string;
  /** The words on the button before a play. */
  play: string;
  /** The words on the button while it plays. */
  pause: string;
  /** What assistive technology hears on the button before a play. It starts with the visible word. `{number}` and `{title}` are filled in. */
  playEpisode: string;
  /** What assistive technology hears on the button while it plays. */
  pauseEpisode: string;
  /** The words in front of the listen links. */
  listenOn: string;
  /** What assistive technology hears as the name of the listen links, so two shows on one page are told apart. `{show}` is the name. */
  listenNav: string;
  /** What assistive technology hears for a cover drawn from the show name. `{show}` is the name. */
  coverAlt: string;
}

export const LABELS: PodcastHeroLabels = {
  podcast: "Podcast",
  hostedBy: "Hosted by {hosts}",
  latest: "Latest episode",
  nowPlaying: "Now playing",
  episode: "Episode {number}",
  play: "Play",
  pause: "Pause",
  playEpisode: "Play episode {number}: {title}",
  pauseEpisode: "Pause episode {number}: {title}",
  listenOn: "Listen on",
  listenNav: "Listen to {show} on",
  coverAlt: "Cover art for {show}",
};

/** "{name}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
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

/** A length of time as people say it: "48 min" or "1 hr 12 min" (short), "48 minutes" or "1 hour 12 minutes" (long). Whole minutes, at least one. */
export function durationText(seconds: number, locale: string, display: "short" | "long"): string {
  const total = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const unit = (value: number, name: "hour" | "minute") => plain(new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: display }).format(value));
  return [hours ? unit(hours, "hour") : "", minutes || !hours ? unit(minutes, "minute") : ""].filter(Boolean).join(" ");
}

/** The same length as an ISO 8601 duration for a time element: "PT48M35S". */
export function durationIso(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${rest || (!hours && !minutes) ? `${rest}S` : ""}`;
}

/** A day as the locale writes it, with the value for the time element. A plain ISO day ("2026-10-12") is that calendar day wherever the reader is. */
export function dayText(value: string | Date, locale: string, timeZone: string): { text: string; iso: string } | null {
  const moment = new Date(value);
  if (Number.isNaN(moment.getTime())) return null;
  const calendarDay = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const text = plain(new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: calendarDay ? "UTC" : zoneOrUtc(timeZone) }).format(moment));
  return { text, iso: calendarDay ? value : moment.toISOString() };
}

/** Names as a list in the reader's language: "A", "A and B", "A, B, and C". */
export function listText(items: readonly string[], locale: string): string {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
}

/**
 * The lines a show name is broken into for a cover drawn from it: one word to a line, and a word of three letters or fewer rides with
 * the next one ("The Long" over "Table"), so the cover reads like a poster and never leaves "of" alone on a line.
 */
export function coverLines(title: string): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let carry = "";
  words.forEach((word, index) => {
    const joined = carry ? `${carry} ${word}` : word;
    if (word.length <= 3 && index < words.length - 1) carry = joined;
    else {
      lines.push(joined);
      carry = "";
    }
  });
  if (carry) lines.push(carry);
  return lines;
}

/**
 * The size of the type on a drawn cover, in container-query units (1cqi is 1% of the cover's width): as large as the longest line and the
 * number of lines allow, and never past a quarter of the cover.
 */
export function coverSize(lines: readonly string[]): number {
  const longest = Math.max(1, ...lines.map((line) => line.length));
  const byWidth = 86 / (longest * 0.5);
  const byHeight = 66 / (Math.max(1, lines.length) * 0.92);
  return Math.round(Math.min(23, byWidth, byHeight) * 10) / 10;
}
