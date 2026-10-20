/** A moment as a Date, an ISO 8601 string (with an offset, or the reader's clock is guessed) or epoch milliseconds. */
export type MomentInput = Date | string | number;

export const toMs = (value: MomentInput): number => (value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value));

/** An unknown zone name would throw while rendering; fall back to UTC instead. */
export function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** Calendar days from the day of `now` to the day of `ms`, counted in the zone: 0 is today, 1 tomorrow. */
export function dayOffset(ms: number, now: number, timeZone: string): number {
  const days = (value: number): number => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(value);
    const pick = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
    return Date.UTC(pick("year"), pick("month") - 1, pick("day")) / 86_400_000;
  };
  return Math.round(days(ms) - days(now));
}

/** A length of time in words: "35 minutes", "1 hour", "1 hour 5 minutes". The spaces are non-breaking, so a line never ends between the number and its unit. */
export function durationWords(minutes: number, locale: string): string {
  const unit = (value: number, name: "hour" | "minute"): string => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "long" }).format(value);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour"));
  if (rest > 0 || hours === 0) parts.push(unit(rest, "minute"));
  return new Intl.ListFormat(locale, { type: "unit", style: "narrow" }).format(parts).replace(/ /g, "\u00A0");
}

/** A 24-hour locale writes "08:00", a 12-hour one "8:00 AM". The browser's own "numeric" is not consistent about the zero. */
function hourStyle(locale: string): "2-digit" | "numeric" {
  const cycle = new Intl.DateTimeFormat(locale, { timeZone: "UTC", hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric";
}

/** A time for a shift: "18:00" today, "Wed 08:00" on another day, in the zone. */
export function shiftTime(ms: number, now: number, locale: string, timeZone: string): string {
  const hour = hourStyle(locale);
  const sameDay = dayOffset(ms, now, timeZone) === 0;
  return new Intl.DateTimeFormat(locale, sameDay ? { timeZone, hour, minute: "2-digit" } : { timeZone, weekday: "short", hour, minute: "2-digit" }).format(ms);
}

/** The zone as people write it next to a time: "CEST" or "GMT+2". */
export function zoneName(ms: number, locale: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" }).formatToParts(ms);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

/** A phone number as a tel: link target: digits and a leading plus only. */
export const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, "")}`;
