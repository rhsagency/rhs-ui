/**
 * What the standings table works out, as plain functions with no state, so a Server Component can read a run of
 * results or write a goal difference the way the table does (a line of text next to it, a feed, an export) and so the
 * rules can be tested alone.
 */

/** One result of a match for the club in question. */
export type StandingsResult = "win" | "draw" | "loss";

/** The true minus sign. A hyphen is half the width and reads as a dash. */
export const MINUS = "−";

const WORDS: Readonly<Record<string, StandingsResult>> = { win: "win", won: "win", draw: "draw", drew: "draw", drawn: "draw", loss: "loss", lost: "loss", lose: "loss" };
const LETTERS: Readonly<Record<string, StandingsResult>> = { w: "win", d: "draw", l: "loss" };

/**
 * A run of results, as the last five matches, oldest first. It reads `"WWDLW"`, `["W", "W", "D", "L", "W"]` and the
 * words `["win", "win", "draw", "loss", "win"]` (or `"win, win, draw"`) alike, in any case. A word is one match and any
 * other text is read a letter at a time, where a W, a D and an L count and every other letter (a P for a postponed
 * match) is left out. Only the last `limit` results are kept, because a form guide is a glance and not a history.
 */
export function parseForm(form: string | readonly string[] | undefined, limit = 5): StandingsResult[] {
  if (form === undefined) return [];
  const tokens = (typeof form === "string" ? form.trim().split(/[\s,;/|-]+/) : [...form]).map((token) => token.trim().toLowerCase());
  const results = tokens.flatMap((token): StandingsResult[] => {
    const word = WORDS[token];
    if (word) return [word];
    return [...token].flatMap((letter) => {
      const result = LETTERS[letter];
      return result ? [result] : [];
    });
  });
  return results.slice(-Math.max(0, limit));
}

/** A zone of the table: the places between `from` and `to`, both included. */
export interface ZoneRange {
  from: number;
  to: number;
}

/** The first zone that holds a position, or undefined for a position in none. */
export function zoneAt<Z extends ZoneRange>(position: number, zones: readonly Z[]): Z | undefined {
  return zones.find((zone) => position >= Math.min(zone.from, zone.to) && position <= Math.max(zone.from, zone.to));
}

/** The writers of the figures: a plain count, and a signed one for goal difference. Built once per render, not once per cell. */
export interface FigureFormats {
  /** 12, 1,204 or 1.204, as the locale writes it. */
  count: (value: number) => string;
  /** +12, 0 or a true minus: −3. The sign is always there, so a gain and a loss cannot be mistaken for each other. */
  signed: (value: number) => string;
}

export function makeFormats(locale: string): FigureFormats {
  const count = new Intl.NumberFormat(locale);
  const signed = new Intl.NumberFormat(locale, { signDisplay: "exceptZero" });
  return {
    count: (value) => count.format(value),
    signed: (value) =>
      signed
        .formatToParts(value)
        .map((part) => (part.type === "minusSign" ? MINUS : part.value))
        .join(""),
  };
}

/** `{name}` placeholders filled in. A placeholder with no value is left as it is, so a missing word shows up in review. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
