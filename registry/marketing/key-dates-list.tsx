import type { ComponentProps, ElementType, ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface KeyDate {
  /** The first day, as an ISO date: "2026-12-21". */
  start: string;
  /** The last day of a range, as an ISO date. Leave it out for a single day. */
  end?: string;
  /** What happens: the main text of the row. */
  label: string;
  /** One line of detail: "Lessons resume on Monday 4 January." */
  note?: string;
  /** A short word for the kind of date: "Holiday", "Exam", "Deadline", "Closed". */
  type?: string;
  /** The term or season this date belongs to. Used when grouping by term: "Autumn term". */
  term?: string;
  /** Turns the label into a link to the page about this date. */
  href?: string;
  /** A slot at the end of the row for an "Add to calendar" link. */
  calendar?: ReactNode;
}

export interface KeyDatesLabels {
  /** Marks the first date that has not started yet. */
  next: string;
  /** Marks a range that is under way today. */
  now: string;
  /** Marks a single day that is today. */
  today: string;
  /** Read out before a date that has passed. */
  past: string;
  /** The word between the two ends of a range. */
  to: string;
}

export interface KeyDatesListProps extends Omit<ComponentProps<"section">, "children"> {
  /** The dates, in any order. They are sorted by their first day. */
  dates: readonly KeyDate[];
  /** Today as an ISO date. Pass a fixed one for stable rendering; without it the current day in `timeZone` is used. */
  today?: string;
  /** How rows are grouped: by month (the default), by the term each date names, or not at all. */
  groupBy?: "month" | "term" | "none";
  /** The level of each group heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the markers, for a site that is not in English. */
  labels?: Partial<KeyDatesLabels>;
  /** Locale for the dates. A day-first locale such as "en-GB" writes "24 Dec", a month-first one "Dec 24". */
  locale?: string;
  /** Only decides which day "today" is when you do not pass one. The dates themselves are calendar days and are never shifted. */
  timeZone?: string;
}

const LABELS: KeyDatesLabels = { next: "Next", now: "Now", today: "Today", past: "Past", to: "to" };

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const format = (locale: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });

/**
 * The calendar day of a value as "2026-12-21", or null when it is not a real
 * day. A date-time keeps its date part. A date that only the parser would
 * accept (the 31st of February) is not a day either.
 */
function dayOf(value: string | undefined): string | null {
  const day = value?.slice(0, 10) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = utc(day);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day ? null : day;
}

/** The calendar day in a time zone, as an ISO date. */
function todayIn(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Whether the locale writes the day before the month ("24 Dec") rather than after it ("Dec 24"). */
const isDayFirst = (locale: string) => format(locale, { day: "numeric", month: "short" }).formatToParts(utc("2026-01-05")).find((part) => part.type === "day" || part.type === "month")?.type === "day";

/** One date or a range, written once with each date in its own time element. A value that is not a day is shown as it was given. */
function When({ raw, start, end, locale, to }: { raw: string; start: string | null; end: string | null; locale: string; to: string }): ReactNode {
  if (!start) return raw;
  if (!end) return <time dateTime={start}>{format(locale, { weekday: "short", day: "numeric", month: "short" }).format(utc(start))}</time>;
  const a = utc(start);
  const b = utc(end);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth();
  const long = format(locale, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  const dayOnly = format(locale, { day: "numeric" });
  const dayFirst = isDayFirst(locale);
  const left = sameMonth && dayFirst ? dayOnly.format(a) : long.format(a);
  const right = sameMonth && !dayFirst ? dayOnly.format(b) : long.format(b);
  return (
    <>
      <time dateTime={start}>{left}</time> {to} <time dateTime={end}>{right}</time>
    </>
  );
}

type State = "past" | "current" | "upcoming";

/**
 * Term dates, deadlines and closures as a list a person can scan in seconds:
 * the date or range sits in the same place on every row, then the label, a
 * line of detail and a word for the kind of date. Rows are grouped by month
 * or by term, the next date that has not started is marked Next in words,
 * and past dates are muted but stay readable and are read out as past. Dates
 * are calendar days, so a range crossing the new year or a time zone never
 * shifts one. The layout follows the width of its column, not the screen, so
 * it holds in a prose column as well as across a page. For schools, clubs,
 * studios and offices that publish the year in advance.
 */
export function KeyDatesList({
  dates,
  today,
  groupBy = "month",
  headingLevel = 2,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: KeyDatesListProps) {
  const labels = { ...LABELS, ...custom };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const now = dayOf(today) ?? todayIn(timeZone);

  const rows = dates
    .map((date) => {
      const start = dayOf(date.start);
      const end = dayOf(date.end);
      // A range that ends before it starts, or on the same day, is one day.
      const range = start && end && end > start ? end : null;
      const last = range ?? start;
      const state: State = !start || !last ? "upcoming" : last < now ? "past" : start <= now ? "current" : "upcoming";
      return { date, start, end: range, state };
    })
    .sort((a, b) => {
      const x = a.start ?? a.date.start;
      const y = b.start ?? b.date.start;
      return x < y ? -1 : x > y ? 1 : 0;
    });
  // Only a real day can be next; a value that is not a day stays in the list without a marker.
  const next = rows.find((row) => row.start && row.state === "upcoming");

  const monthFormat = format(locale, { month: "long", year: "numeric" });
  const groups: { key: string; title?: string; rows: typeof rows }[] = [];
  for (const row of rows) {
    const key = groupBy === "month" ? (row.start?.slice(0, 7) ?? "") : groupBy === "term" ? (row.date.term ?? "") : "all";
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = { key, title: groupBy === "month" ? (key ? monthFormat.format(utc(`${key}-01`)) : undefined) : groupBy === "term" && key ? key : undefined, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  return (
    <section data-slot="key-dates-list" className={cn("@container w-full break-words", className)} {...props}>
      <div className="divide-y divide-border border-y border-border">
        {groups.map((group) => (
          <section key={group.key} className={cn("grid grid-cols-1 gap-x-10", group.title && "@4xl:grid-cols-[11rem_minmax(0,1fr)]")}>
            {group.title ? <Heading className="pt-8 text-base leading-6 font-medium tracking-[-0.01em]">{group.title}</Heading> : null}
            <ul role="list" className="divide-y divide-border">
              {group.rows.map(({ date, start, end, state }) => {
                const isNext = next?.date === date;
                const marker = isNext ? labels.next : state === "current" ? (end ? labels.now : labels.today) : null;
                const past = state === "past";
                return (
                  <li
                    key={`${date.start}-${date.end ?? ""}-${date.label}`}
                    aria-current={state === "current" ? "date" : undefined}
                    className={cn(
                      "grid grid-cols-1 gap-x-8 gap-y-2 border-l-2 py-5 pl-4 last:pb-8 @2xl:grid-cols-[13rem_minmax(0,1fr)_fit-content(16rem)]",
                      // The rows own the vertical padding of the group, so the marker bar runs from rule to rule. The first row takes the group's top padding unless a heading sits above the list, which brings its own.
                      group.title ? "@4xl:first:pt-8" : "first:pt-8",
                      // Only the left edge takes the colour: the row divider below is a border of the same element.
                      isNext || state === "current" ? "border-l-foreground" : "border-l-transparent",
                      past && "text-muted-foreground",
                    )}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <p className="text-sm leading-6 font-medium tabular-nums">
                        {past ? <span className="sr-only">{labels.past}: </span> : null}
                        <When raw={date.start} start={start} end={end} locale={locale} to={labels.to} />
                      </p>
                      {marker ? <Badge variant={isNext ? "default" : "secondary"}>{marker}</Badge> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base leading-6 font-medium">
                        {date.href ? (
                          <Link
                            href={date.href}
                            className="rounded-sm underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                          >
                            {date.label}
                          </Link>
                        ) : (
                          date.label
                        )}
                      </p>
                      {date.note ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{date.note}</p> : null}
                    </div>
                    {date.type || date.calendar ? (
                      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 @2xl:justify-end @2xl:self-start">
                        {date.type ? (
                          <Badge variant={past ? "muted" : "outline"} className="max-w-full truncate">
                            {date.type}
                          </Badge>
                        ) : null}
                        {date.calendar ? (
                          <div className="max-w-full min-w-0 text-sm [&_a]:rounded-sm [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:decoration-current">{date.calendar}</div>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
