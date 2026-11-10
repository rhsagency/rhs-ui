/** The name of a month (1 to 12) in a language, with a capital: "October", "oktober" becomes "Oktober". */
export function monthName(month: number, locale: string, timeZone: string): string {
  // The middle of the month at midday UTC, so no time zone can move it into the next or the previous one.
  const name = new Intl.DateTimeFormat(locale, { month: "long", timeZone }).format(new Date(Date.UTC(2000, month - 1, 15, 12)));
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** Replaces {slots} in a template with text. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
}
