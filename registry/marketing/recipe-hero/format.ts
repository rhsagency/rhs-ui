/**
 * The words and numbers behind RecipeHero, as plain functions: they hold no state and call no hook, so a Server Component can use them
 * too. Every function takes the locale (and the time zone), so the server and the browser write the same text.
 */

/** The words the hero says. `{author}`, `{value}`, `{max}` and `{count}` are filled in. */
export interface RecipeHeroLabels {
  /** The byline. */
  by: string;
  /** What assistive technology hears for the stars and the score. */
  rated: string;
  /** The number of ratings, by plural form of the language: "1,284 ratings". Give the forms your language needs. */
  ratings: { one: string; other: string } & Partial<Record<"zero" | "two" | "few" | "many", string>>;
  /** Names the facts for assistive technology. The title of the recipe follows it after a colon, so two recipes on a page are told apart: "Recipe facts: Roasted tomato soup". */
  facts: string;
  prep: string;
  cook: string;
  total: string;
  servings: string;
  difficulty: string;
  jump: string;
  save: string;
  print: string;
}

export const LABELS: RecipeHeroLabels = {
  by: "By {author}",
  rated: "Rated {value} out of {max}",
  ratings: { one: "{count} rating", other: "{count} ratings" },
  facts: "Recipe facts",
  prep: "Prep",
  cook: "Cook",
  total: "Total",
  servings: "Servings",
  difficulty: "Difficulty",
  jump: "Jump to recipe",
  save: "Save",
  print: "Print",
};

/** "{name}" and friends in a template, filled in. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** The form of a counted word the language uses for this number. */
export function plural(forms: RecipeHeroLabels["ratings"], count: number, locale: string): string {
  return forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
}

/** A number in the reader's language: "1,284". */
export function countText(count: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(count);
}

/** A score with one decimal at most, in the reader's language: "4.8", "5". */
export function scoreText(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
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

/** A time in minutes as people write it on a recipe: "25 min" or "1 hr 5 min" (short), "25 minutes" or "1 hour 5 minutes" (long). */
export function minutesText(minutes: number, locale: string, display: "short" | "long"): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const unit = (value: number, name: "hour" | "minute") => plain(new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: display }).format(value));
  return [hours ? unit(hours, "hour") : "", rest || !hours ? unit(rest, "minute") : ""].filter(Boolean).join(" ");
}

/** The same time as an ISO 8601 duration for a time element: "PT25M", "PT1H5M". */
export function minutesIso(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `PT${hours ? `${hours}H` : ""}${rest || !hours ? `${rest}M` : ""}`;
}

/** A day as the locale writes it, with the value for the time element. A plain ISO day ("2026-10-12") is that calendar day wherever the reader is. */
export function dayText(value: string | Date, locale: string, timeZone: string): { text: string; iso: string } | null {
  const moment = new Date(value);
  if (Number.isNaN(moment.getTime())) return null;
  const calendarDay = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const text = plain(new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: calendarDay ? "UTC" : zoneOrUtc(timeZone) }).format(moment));
  return { text, iso: calendarDay ? value : moment.toISOString() };
}
