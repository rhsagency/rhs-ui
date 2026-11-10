/** "2:14" is 134 seconds and "1:02:30" is 3750. Anything else is NaN. */
export function secondsOf(duration: string): number {
  const parts = duration.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || !parts.every((part) => /^\d{1,2}$/.test(part))) return Number.NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

type Unit = "hour" | "minute" | "second";

/** One amount in one unit, in the reader's words: the names come from Intl, not from a list of ours. */
function unitText(amount: number, unit: Unit, locale: string): string {
  const options: Intl.NumberFormatOptions = { style: "unit", unit, unitDisplay: "long", maximumFractionDigits: 0 };
  try {
    return new Intl.NumberFormat(locale, options).format(amount);
  } catch {
    // A locale the browser does not know must not take the page down.
    return new Intl.NumberFormat("en-US", options).format(amount);
  }
}

/** "2:14" as it is spoken: "2 minutes 14 seconds". Text that is not a length is returned as it came. */
export function spokenDuration(duration: string, locale: string): string {
  const total = secondsOf(duration);
  if (Number.isNaN(total)) return duration;
  const amounts: readonly (readonly [Unit, number])[] = [
    ["hour", Math.floor(total / 3600)],
    ["minute", Math.floor((total % 3600) / 60)],
    ["second", total % 60],
  ];
  const parts = amounts.filter(([, amount]) => amount > 0).map(([unit, amount]) => unitText(amount, unit, locale));
  if (!parts.length) return unitText(0, "second", locale);
  try {
    return new Intl.ListFormat(locale, { style: "narrow", type: "unit" }).format(parts);
  } catch {
    return new Intl.ListFormat("en-US", { style: "narrow", type: "unit" }).format(parts);
  }
}
