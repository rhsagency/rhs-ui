import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

export interface DateTileProps extends Omit<ComponentProps<"span">, "children"> {
  /** The date: a Date, a timestamp or an ISO string. A date-only string such as "2026-03-12" is a calendar date and never shifts with the time zone. */
  date: DateInput;
  /** The last day of a range, written "Mar 12–15". Leave it out, or pass the same day, for a single date. */
  endDate?: DateInput | null;
  /** Defaults to "en-US". Month and weekday are written in this language. */
  locale?: string;
  /** The time zone whose calendar day is shown. Defaults to "UTC". */
  timeZone?: string;
  /** The width of the tile: 48, 56 or 80px. Every tile of one size is as wide as the next, so a list lines up. Default "md". */
  size?: "sm" | "md" | "lg";
  /** `today` inverts the tile and tells a screen reader "Today", `muted` quietens a past date. Default "default". Whether a date is today depends on the reader's clock, so you decide. */
  tone?: "default" | "today" | "muted";
  /** Write the year on the bottom line instead of the weekday, for a list that spans years. */
  showYear?: boolean;
  /** The words only a screen reader hears, for another language. */
  labels?: { today?: string; to?: string };
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Intl writes some spaces as thin or narrow no-break spaces, and the version of
 * the Unicode data decides which: a server and a browser with different
 * versions then write different text, and React throws the server markup away.
 * A plain space looks the same and every engine agrees on it.
 */
const tidy = (text: string) => text.replace(/[\u00a0\u2009\u202f]/g, " ");

const cache = new Map<string, Intl.DateTimeFormat>();
function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    cache.set(key, format);
  }
  return format;
}

interface Leaf {
  month: string;
  day: string;
  weekday: string;
  year: string;
  /** "2026-03-12", the calendar day in the zone. */
  iso: string;
  /** "Thursday, 12 March 2026". */
  long: string;
}

/** The pieces of a calendar day, written in the reader's language. A date-only string is its own calendar day, so it is read in UTC and never shifts. Null for an invalid date. */
function leafOf(input: DateInput, locale: string, timeZone: string): Leaf | null {
  const calendar = typeof input === "string" && DATE_ONLY.test(input);
  const instant = new Date(calendar ? `${input}T00:00:00Z` : input);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = calendar ? "UTC" : timeZone;
  // Some languages abbreviate with a full stop ("mrt.", "do."); on a tile that is noise.
  const write = (options: Intl.DateTimeFormatOptions) => tidy(dateFormat(locale, { timeZone: zone, ...options }).format(instant)).replace(/\.$/, "");
  // The day is the number alone: Japanese writes "12日", and a big numeral wants no unit after it.
  const part = (options: Intl.DateTimeFormatOptions, type: Intl.DateTimeFormatPartTypes) => tidy(dateFormat(locale, { timeZone: zone, ...options }).formatToParts(instant).find((entry) => entry.type === type)?.value ?? "");
  const numbers = dateFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const number = (type: string) => numbers.find((entry) => entry.type === type)?.value ?? "";
  return {
    month: write({ month: "short" }),
    day: part({ day: "numeric" }, "day"),
    weekday: write({ weekday: "short" }),
    year: part({ year: "numeric" }, "year"),
    iso: `${number("year")}-${number("month")}-${number("day")}`,
    long: tidy(dateFormat(locale, { timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(instant)),
  };
}

const DASH = "–";

// A range has to fit the same fixed width as a single day, so each of its lines has a size of its own: `monthSpan` is the month line across two months
// ("FEB–MAR"), `dayRange` the numerals ("12–15", two thirds of a single day) and `footRange` the line of two weekdays or two years ("Thu–Sun"). Together they
// leave about 4px on each side of the widest of them.
const SIZE = {
  sm: { box: "w-12 gap-0 rounded-md py-1", month: "text-[0.625rem] leading-3", monthSpan: "text-[0.5625rem] leading-3 tracking-normal", day: "text-xl leading-5", dayRange: "text-[0.8125rem] leading-5", foot: "text-[0.625rem] leading-3", footRange: "text-[0.5625rem] leading-3" },
  md: { box: "w-14 gap-0 rounded-lg py-[5px]", month: "text-[0.6875rem] leading-3.5", monthSpan: "text-[0.625rem] leading-3.5 tracking-normal", day: "text-2xl leading-7", dayRange: "text-base leading-7", foot: "text-[0.6875rem] leading-3.5", footRange: "text-[0.6875rem] leading-3.5" },
  lg: { box: "w-20 gap-0.5 rounded-xl py-2", month: "text-xs leading-4", monthSpan: "text-[0.6875rem] leading-4 tracking-[0.04em]", day: "text-4xl leading-10", dayRange: "text-2xl leading-10", foot: "text-xs leading-4", footRange: "text-xs leading-4" },
} as const;

const TONE = {
  default: { box: "border-border bg-card text-foreground shadow-xs", month: "text-muted-foreground", foot: "text-muted-foreground" },
  today: { box: "border-primary bg-primary text-primary-foreground", month: "text-primary-foreground/70", foot: "text-primary-foreground/70" },
  muted: { box: "border-border bg-muted/50 text-muted-foreground", month: "text-muted-foreground", foot: "text-muted-foreground/80" },
} as const;

/**
 * The little calendar leaf: the month in small capitals, the day large in
 * tabular numerals, the weekday underneath, in a small square for event lists,
 * deadlines and invoices. Every tile of one size has the same width, so a
 * column of them lines up whatever the date, and a range writes "Mar 12–15".
 * It is a `<time>` element with the calendar day in `dateTime`, and a screen
 * reader hears the whole date ("Thursday, 12 March 2026"), not three scraps.
 * `today` inverts the tile and adds "Today" to what is heard. Month and weekday
 * come from Intl in the locale you name, in the time zone you name, so the
 * server and the browser agree. A Server Component.
 */
export function DateTile({ date, endDate, locale = "en-US", timeZone = "UTC", size = "md", tone = "default", showYear = false, labels, className, ...props }: DateTileProps) {
  const first = leafOf(date, locale, timeZone);
  if (!first) return null;
  const second = endDate === null || endDate === undefined ? null : leafOf(endDate, locale, timeZone);
  // The earlier day first, and a second day that is the same day is no range at all.
  const [from, to]: [Leaf, Leaf | null] = second && second.iso < first.iso ? [second, first] : [first, second && second.iso !== first.iso ? second : null];
  const look = SIZE[size];
  const colors = TONE[tone];

  const range = to !== null;
  const month = range && (from.month !== to.month || from.year !== to.year) ? `${from.month}${DASH}${to.month}` : from.month;
  const day = range ? `${from.day}${DASH}${to.day}` : from.day;
  const years = range && from.year !== to.year ? `${from.year}${DASH}${to.year.slice(-2)}` : from.year;
  const foot = showYear ? years : range ? `${from.weekday}${DASH}${to.weekday}` : from.weekday;

  const spoken = tone === "today" ? `${labels?.today ?? "Today"}, ` : "";
  const classes = cn("inline-flex shrink-0 flex-col items-center justify-center overflow-hidden border text-center whitespace-nowrap", look.box, colors.box, className);
  const visible = (
    <>
      <span aria-hidden="true" className={cn("font-medium tracking-[0.08em] uppercase", month.includes(DASH) ? look.monthSpan : look.month, colors.month)}>
        {month}
      </span>
      <span aria-hidden="true" className={cn("font-semibold tracking-[-0.04em] tabular-nums", range ? look.dayRange : look.day)}>
        {day}
      </span>
      <span aria-hidden="true" className={cn("font-normal tabular-nums", range ? look.footRange : look.foot, colors.foot)}>
        {foot}
      </span>
    </>
  );

  // A <time> holds one date; a range is a span with a <time> for each end, so both stay machine-readable.
  if (to) {
    return (
      <span data-slot="date-tile" data-tone={tone} data-size={size} data-range="true" className={classes} {...props}>
        {visible}
        <span className="sr-only select-none">
          {spoken}
          <time dateTime={from.iso}>{from.long}</time> {labels?.to ?? "to"} <time dateTime={to.iso}>{to.long}</time>
        </span>
      </span>
    );
  }
  return (
    <time data-slot="date-tile" data-tone={tone} data-size={size} dateTime={from.iso} className={classes} {...(props as ComponentProps<"time">)}>
      {visible}
      <span className="sr-only select-none">{`${spoken}${from.long}`}</span>
    </time>
  );
}
