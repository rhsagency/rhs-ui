/** The four units of an estimate, from the biggest to the smallest: weeks, days, hours and minutes. */
export type EstimateUnit = "w" | "d" | "h" | "m";

/** The order of the units, biggest first. */
export const UNIT_ORDER: readonly EstimateUnit[] = ["w", "d", "h", "m"];

/** What a working day and week are, and which units are used. */
export interface EstimateRules {
  /** Hours in a working day: 1d is this many hours. */
  hoursPerDay: number;
  /** Days in a working week: 1w is this many days. */
  daysPerWeek: number;
  /** The units that may be typed and are written back. */
  units: readonly EstimateUnit[];
}

/** The words the field says, in the line under it and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface EstimateLabels {
  /** The name of the field for a screen reader when it has no label, id or aria-label of its own. */
  name: string;
  /** What the line under the field says while nothing is typed. */
  hint: string;
  /** The forms that are understood, in the sentence below. */
  examples: string;
  /** Said when the text is not a duration. `examples` are forms that would work. */
  unreadable: (examples: string) => string;
  /** Said when a unit was typed that this field does not use. `unit` is its name, `allowed` the ones that are used. */
  unusedUnit: (unit: string, allowed: string) => string;
  /** The estimate is longer than `max`. `limit` is that length, written out. */
  atMost: (limit: string) => string;
  /** What a screen reader hears once the typing pauses. */
  said: (text: string) => string;
  /** What a working day and week are, shown beside an estimate that uses them: "1 d = 8 h". */
  day: (hours: string) => string;
  week: (days: string) => string;
  /** The short names of the units as they are written in the line under the field: "w", "d", "h", "min". */
  short: Readonly<Record<EstimateUnit, string>>;
  /** The names of the units for a message, plural: "weeks", "days", "hours", "minutes". */
  long: Readonly<Record<EstimateUnit, string>>;
}

export const DEFAULT_LABELS: EstimateLabels = {
  name: "Estimate",
  hint: "Try 1h 30m, 90m, 1.5h or 2:30.",
  examples: "1h 30m, 90m, 1.5h or 2:30",
  unreadable: (examples) => `That is not a time I can read. Try ${examples}.`,
  unusedUnit: (unit, allowed) => `This estimate does not use ${unit}. Use ${allowed}.`,
  atMost: (limit) => `Estimates go up to ${limit}.`,
  said: (text) => `Understood as ${text}`,
  day: (hours) => `1 d = ${hours}`,
  week: (days) => `1 w = ${days}`,
  short: { w: "w", d: "d", h: "h", m: "min" },
  long: { w: "weeks", d: "days", h: "hours", m: "minutes" },
};

export const DEFAULT_RULES: EstimateRules = { hoursPerDay: 8, daysPerWeek: 5, units: UNIT_ORDER };

const WORDS: Readonly<Record<string, EstimateUnit>> = {
  w: "w",
  wk: "w",
  wks: "w",
  week: "w",
  weeks: "w",
  d: "d",
  day: "d",
  days: "d",
  h: "h",
  hr: "h",
  hrs: "h",
  hour: "h",
  hours: "h",
  m: "m",
  min: "m",
  mins: "m",
  minute: "m",
  minutes: "m",
};

/** How many minutes one of each unit is, for these rules. A day is a working day and a week a working week, as in a task tracker. */
export function minutesPerUnit(rules: EstimateRules): Record<EstimateUnit, number> {
  const day = rules.hoursPerDay * 60;
  return { m: 1, h: 60, d: day, w: day * rules.daysPerWeek };
}

/**
 * Digits typed on a keyboard that writes them differently (Arabic-Indic,
 * Persian) as the digits 0 to 9, and the full-width colon and other spaces as
 * plain ones. Written by code point, so the source stays ASCII.
 */
function asciiText(text: string): string {
  let plain = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x660 && code <= 0x669) plain += String(code - 0x660);
    else if (code >= 0x6f0 && code <= 0x6f9) plain += String(code - 0x6f0);
    else if (code === 0x66b) plain += ".";
    else if (code === 0xff1a) plain += ":";
    else if (code === 0xa0 || code === 0x202f) plain += " ";
    else plain += char;
  }
  return plain;
}

/** What the text came to: nothing at all, a length, a unit this field does not use, or something that is not a duration. */
export type EstimateReading = { kind: "empty" } | { kind: "ok"; minutes: number; units: readonly EstimateUnit[] } | { kind: "unit"; unit: EstimateUnit } | { kind: "format" };

const TOKEN = /\s*(\d+(?:\.\d+)?|\.\d+)\s*([a-z]*)\s*/y;

/**
 * A length of time as minutes. It reads mixed forms with weeks, days, hours and
 * minutes ("1w 2d", "1d 2h 30m", "1h, 30m", "1 hour and 30 minutes"), decimals
 * ("1.5h", "1,5h": half a day is 4 hours with a working day of 8), a clock
 * ("2:30" is two and a half hours), and a number after a unit that stands for
 * the next smaller one ("1h30" is 1h 30m). A bare whole number is minutes and a
 * bare decimal is hours, so "90" and "1.5" both read as an hour and a half.
 * Everything is worked out on the digits, and the result is rounded to a whole
 * minute (or to the smallest unit the field uses).
 */
export function readEstimate(raw: string, rules: EstimateRules): EstimateReading {
  const text = asciiText(raw).toLowerCase().trim();
  if (!text) return { kind: "empty" };
  const per = minutesPerUnit(rules);
  const allowed = new Set(rules.units);
  const smallest = [...UNIT_ORDER].reverse().find((unit) => allowed.has(unit)) ?? "m";
  const clock = /^(\d+):(\d{1,2})$/.exec(text);
  if (clock) {
    const minutes = Number(clock[2]);
    if (minutes > 59 || !allowed.has("h")) return { kind: "format" };
    return { kind: "ok", minutes: roundToUnit(Number(clock[1]) * 60 + minutes, per[smallest]), units: ["h", "m"] };
  }
  // A comma between digits is a decimal sign, any other comma, an "and" or an ampersand only separates.
  const tidy = text.replace(/(\d),(\d)/g, "$1.$2").replace(/\band\b|[,&+]/g, " ");
  let total = 0;
  let last: EstimateUnit | null = null;
  const used: EstimateUnit[] = [];
  let at = 0;
  while (at < tidy.length) {
    TOKEN.lastIndex = at;
    const match = TOKEN.exec(tidy);
    if (!match) return { kind: "format" };
    at = TOKEN.lastIndex;
    const amount = Number(match[1]);
    const word = match[2] ?? "";
    let unit: EstimateUnit | undefined;
    if (word) unit = WORDS[word];
    else if (last === null) unit = (match[1] ?? "").includes(".") && allowed.has("h") ? "h" : smallest;
    else unit = UNIT_ORDER[UNIT_ORDER.indexOf(last) + 1];
    if (!unit || !Number.isFinite(amount)) return { kind: "format" };
    // A number after a unit is the next smaller one, so that unit has to be one this field uses: "1h30" needs minutes.
    if (!allowed.has(unit)) return word ? { kind: "unit", unit } : { kind: "format" };
    total += amount * per[unit];
    last = unit;
    used.push(unit);
  }
  if (!used.length || !Number.isFinite(total)) return { kind: "format" };
  return { kind: "ok", minutes: roundToUnit(total, per[smallest]), units: used };
}

/** A length rounded to a whole number of the smallest unit in use, half up. */
const roundToUnit = (minutes: number, unit: number): number => Math.round(Math.round(minutes * 1000) / 1000 / unit) * unit;

/** A length split into the units in use, biggest first, with the units that came to nothing left out. A length of nothing is "0" of the smallest unit. */
export function splitEstimate(minutes: number, rules: EstimateRules): { unit: EstimateUnit; value: number }[] {
  const per = minutesPerUnit(rules);
  const used = UNIT_ORDER.filter((unit) => rules.units.includes(unit));
  const parts: { unit: EstimateUnit; value: number }[] = [];
  let rest = Math.round(minutes);
  for (const unit of used) {
    const value = Math.floor(rest / per[unit]);
    rest -= value * per[unit];
    if (value > 0) parts.push({ unit, value });
  }
  if (!parts.length) parts.push({ unit: used[used.length - 1] ?? "m", value: 0 });
  return parts;
}

/** The estimate as it is typed and written back to the field: "1w 2d 3h 30m". */
export function writeShort(minutes: number, rules: EstimateRules): string {
  return splitEstimate(minutes, rules)
    .map((part) => `${part.value}${part.unit}`)
    .join(" ");
}

/** The estimate for the line under the field: "1 h 30 min". */
export function writeLong(minutes: number, rules: EstimateRules, labels: EstimateLabels): string {
  return splitEstimate(minutes, rules)
    .map((part) => `${part.value} ${labels.short[part.unit]}`)
    .join(" ");
}

/** The whole estimate in hours and minutes, for an estimate that is counted in days or weeks: "10 h", "41 h 30 min". */
export function writeHours(minutes: number, labels: EstimateLabels): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes - hours * 60);
  return rest ? `${hours} ${labels.short.h} ${rest} ${labels.short.m}` : `${hours} ${labels.short.h}`;
}

/** The units that are in use, written as a list for a message: "days, hours and minutes". */
export function listUnits(rules: EstimateRules, labels: EstimateLabels): string {
  const names = UNIT_ORDER.filter((unit) => rules.units.includes(unit)).map((unit) => labels.long[unit]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? "");
}
