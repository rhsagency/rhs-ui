/** What a courier is driving. It picks the small icon on the photo. */
export type CourierVehicle = "bike" | "car" | "van";

/** The first name of whatever was passed in. The card shows a first name only, whoever filled in the form. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** A length of time in words: "6 minutes", "1 hour", "1 hour 5 minutes". */
export function durationWords(minutes: number, locale: string): string {
  const unit = (value: number, name: "hour" | "minute"): string => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "long" }).format(value);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour"));
  if (rest > 0 || hours === 0) parts.push(unit(rest, "minute"));
  return new Intl.ListFormat(locale, { type: "unit", style: "narrow" }).format(parts);
}

/**
 * Whether a new arrival time is worth saying out loud: it moved by two minutes or more since the last one said,
 * or it has just got close ("1 minute") or is now ("arriving now"). The minutes in between are only drawn.
 */
export function worthSaying(previous: number | undefined, next: number | undefined): boolean {
  if (next === undefined || previous === undefined) return next !== previous;
  if (next < 1 && previous >= 1) return true;
  if (next <= 1 && previous > 1) return true;
  return Math.abs(next - previous) >= 2;
}
