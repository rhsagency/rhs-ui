import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DurationFormat = "narrow" | "short" | "long" | "clock";
export type DurationUnit = "day" | "hour" | "minute" | "second";

export interface DurationTextProps extends Omit<ComponentProps<"time">, "children" | "dateTime"> {
  /** The length in seconds. A fraction is cut to whole seconds. `null`, `undefined`, a negative number and `NaN` show the placeholder. */
  seconds: number | null | undefined;
  /** `narrow` writes "1h 30m", `short` "1 hr, 30 min", `long` "1 hour, 30 minutes" and `clock` "1:30:00" (minutes and seconds under an hour: "4:05"). Default "narrow". */
  format?: DurationFormat;
  /** The biggest unit that is used. With "minute", 5400 seconds is "90m"; with "day", 90000 seconds is "1d 1h". Default "hour". */
  largestUnit?: DurationUnit;
  /** How many units are written, counting from the biggest one that is not zero: 3725 seconds is "1h 2m" with 2 and "1h 2m 5s" with 3. The rest is cut, not rounded. Default 2. */
  maxUnits?: number;
  /** Defaults to "en-US". Unit names and digits come from this language. */
  locale?: string;
  /** Shown when there is no valid length. Defaults to an en dash, and screen readers hear "No duration". */
  placeholder?: ReactNode;
  /** The words only a screen reader hears when there is no length, for another language. */
  emptyLabel?: string;
}

/**
 * Intl writes some spaces as thin or narrow no-break spaces, and the version of
 * the Unicode data decides which: a server and a browser with different
 * versions then write different text, and React throws the server markup away.
 * A plain space looks the same and every engine agrees on it.
 */
const tidy = (text: string) => text.replace(/[\u00a0\u2009\u202f]/g, " ");

const ORDER: readonly DurationUnit[] = ["day", "hour", "minute", "second"];
const SECONDS: Record<DurationUnit, number> = { day: 86_400, hour: 3_600, minute: 60, second: 1 };
const ISO: Record<DurationUnit, string> = { day: "D", hour: "H", minute: "M", second: "S" };

const numbers = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = numbers.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numbers.set(key, format);
  }
  return format;
}

const lists = new Map<string, Intl.ListFormat>();
function listFormat(locale: string, style: "narrow" | "short" | "long"): Intl.ListFormat {
  const key = `${locale}|${style}`;
  let format = lists.get(key);
  if (!format) {
    format = new Intl.ListFormat(locale, { type: "unit", style });
    lists.set(key, format);
  }
  return format;
}

/** The whole seconds split into units, from `largest` down. Everything above it stays in it: 90 minutes with "minute" is 90. */
function split(total: number, largest: DurationUnit): Record<DurationUnit, number> {
  const out: Record<DurationUnit, number> = { day: 0, hour: 0, minute: 0, second: 0 };
  let rest = total;
  for (const unit of ORDER.slice(ORDER.indexOf(largest))) {
    out[unit] = Math.floor(rest / SECONDS[unit]);
    rest -= out[unit] * SECONDS[unit];
  }
  return out;
}

/** The ISO 8601 duration for a `<time>` element: "PT1H30M", "P1DT1H", "PT0S". */
function isoOf(total: number): string {
  const all = split(total, "day");
  const date = all.day ? `${all.day}${ISO.day}` : "";
  const time = (["hour", "minute", "second"] as const).map((unit) => (all[unit] ? `${all[unit]}${ISO[unit]}` : "")).join("");
  if (!date && !time) return "PT0S";
  return `P${date}${time ? `T${time}` : ""}`;
}

/** The units to write, as [unit, amount]: from the biggest one that is not zero, at most `maxUnits` of them, without trailing zeros. Zero is "0m" ("0s" when seconds are the biggest unit). */
function unitsOf(total: number, largest: DurationUnit, maxUnits: number): [DurationUnit, number][] {
  const parts = split(total, largest);
  const units = ORDER.slice(ORDER.indexOf(largest));
  const first = units.findIndex((unit) => parts[unit] > 0);
  if (first === -1) return [[largest === "second" ? "second" : "minute", 0]];
  const chosen = units.slice(first, first + Math.max(1, Math.floor(maxUnits)));
  while (chosen.length > 1 && parts[chosen[chosen.length - 1] as DurationUnit] === 0) chosen.pop();
  return chosen.map((unit) => [unit, parts[unit]]);
}

function words(total: number, largest: DurationUnit, maxUnits: number, style: "narrow" | "short" | "long", locale: string): string {
  const pieces = unitsOf(total, largest, maxUnits).map(([unit, amount]) => numberFormat(locale, { style: "unit", unit, unitDisplay: style }).format(amount));
  return tidy(listFormat(locale, style).format(pieces));
}

/** "1:30:00", or "4:05" under an hour; "5407" when seconds are the biggest unit. The first number is never padded. */
function clock(total: number, largest: DurationUnit, locale: string): string {
  if (largest === "second") return tidy(numberFormat(locale, { useGrouping: false }).format(total));
  const pad = numberFormat(locale, { useGrouping: false, minimumIntegerDigits: 2 });
  const plain = numberFormat(locale, { useGrouping: false });
  const hours = Math.floor(total / 3600);
  if (largest !== "minute" && hours > 0) {
    return `${plain.format(hours)}:${pad.format(Math.floor((total % 3600) / 60))}:${pad.format(total % 60)}`;
  }
  return `${plain.format(Math.floor(total / 60))}:${pad.format(total % 60)}`;
}

/**
 * A length of time in few characters that still reads in full aloud: "1h 30m"
 * for the eye, "1 hour, 30 minutes" for the ear. It writes a `<time>` element
 * with the ISO 8601 duration in `dateTime`, so the value survives for scripts
 * and search engines. The unit names and digits come from Intl in the locale you
 * name (narrow, short or long), joined as a list of units, and `clock` writes
 * "1:30:00" like a player does. Sub-minute lengths show seconds and zero shows
 * "0m". It uses only the Intl number and list formats every browser and Node
 * ship, not the newer duration format, so the server and the browser always
 * write the same text. Use it for video lengths, call logs, estimates and cook
 * times. A Server Component.
 */
export function DurationText({ seconds, format = "narrow", largestUnit = "hour", maxUnits = 2, locale = "en-US", placeholder = "–", emptyLabel = "No duration", className, ...props }: DurationTextProps) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return (
      <span data-slot="duration-text" data-empty="true" className={cn("text-muted-foreground", className)} {...(props as ComponentProps<"span">)}>
        <span aria-hidden="true">{placeholder}</span>
        <span className="sr-only">{emptyLabel}</span>
      </span>
    );
  }
  const total = Math.floor(seconds);
  const shown = format === "clock" ? clock(total, largestUnit, locale) : words(total, largestUnit, maxUnits, format, locale);
  // What is heard is always spelled out. A clock is exact, so everything it shows is spoken; the other forms say what they show.
  const spoken = format === "long" ? shown : words(total, largestUnit, format === "clock" ? 4 : maxUnits, "long", locale);
  return (
    <time data-slot="duration-text" data-format={format} dateTime={isoOf(total)} className={cn("whitespace-nowrap tabular-nums", className)} {...props}>
      {format === "long" ? (
        shown
      ) : (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only select-none">{spoken}</span>
        </>
      )}
    </time>
  );
}
