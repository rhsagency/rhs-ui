import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface TimetableClass {
  /** The start, on the 24-hour clock: "18:30", or "9:30" for a morning class. It is shown the way `locale` writes times. */
  start: string;
  /** The end, on the 24-hour clock: "19:30". */
  end: string;
  /** The class: "Mobility flow". */
  name: string;
  /** Who teaches it. */
  trainer?: string;
  /** "Beginner", "All levels". */
  level?: string;
  /** The places left. 0 means full and says so in words; leave it out to say nothing about places. */
  spots?: number;
  /** The class's page, or where to book it. The name becomes one link, stretched over the whole card. */
  href?: string;
  /** Where to join the waitlist. Only shown for a class that is full. */
  waitlistHref?: string;
}

export interface TimetableDay {
  /** Stable and URL-safe: "mon". The `today` prop matches it. */
  id: string;
  /** The day's name: "Monday". */
  label: string;
  /** The tab on a phone: "Mon". The first three letters of the label by default. */
  short?: string;
  /** The day's classes, in any order. They are listed by start time. */
  classes: readonly TimetableClass[];
}

export interface ClassTimetableLabels {
  /** Marks the current day. */
  today: string;
  /** The flag on a class with no places left. */
  full: string;
  /** What a class with places left says, in the card: "3 left". */
  spotsLeft: (count: number) => string;
  /** The same, in full, for screen readers: "3 spots left". */
  spotsLeftLong: (count: number) => string;
  /** The text of the waitlist link. */
  waitlist: string;
  /** Read after the waitlist link's text, for screen readers, so every link has a name of its own: "for Spin". */
  waitlistFor: (name: string) => string;
  /** Said for a day without classes. */
  noClasses: string;
  /** Read between the start and the end of a class: "to". */
  to: string;
  /** The noun after a count of one: "1 class". */
  class: string;
  /** The noun after any other count: "5 classes". */
  classes: string;
  /** The accessible name of the row of day tabs on a phone. */
  days: string;
}

export interface ClassTimetableProps extends Omit<ComponentProps<"section">, "children"> {
  /** The days of the week, Monday first. Seven read best; the week view takes any number up to seven. */
  days: readonly TimetableDay[];
  /** The id of today's day. It opens first on a phone and is marked in words in both views. Leave it out for no marker: the page then renders the same everywhere. */
  today?: string;
  /** A line under the timetable: how often the places are updated, how to cancel. */
  legend?: ReactNode;
  /** The level of the day headings: 3 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the class and waitlist links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ClassTimetableLabels>;
  /** Locale for the times. en-US writes "6:30 PM", en-GB and most others "18:30". */
  locale?: string;
}

const LABELS: ClassTimetableLabels = {
  today: "Today",
  full: "Full",
  spotsLeft: (count) => `${count} left`,
  spotsLeftLong: (count) => (count === 1 ? "1 spot left" : `${count} spots left`),
  waitlist: "Join the waitlist",
  waitlistFor: (name) => `for ${name}`,
  noClasses: "No classes",
  to: "to",
  class: "class",
  classes: "classes",
  days: "Day of the week",
};

// Written out whole: Tailwind only generates the classes it can read in the source.
// The week needs about 9rem a day, so it starts once the timetable itself is 64rem wide (@5xl). The container decides, not the screen: a narrow column on a wide screen gets the day tabs too.
const COLUMNS: Record<number, string> = {
  1: "@5xl:grid-cols-1",
  2: "@5xl:grid-cols-2",
  3: "@5xl:grid-cols-3",
  4: "@5xl:grid-cols-4",
  5: "@5xl:grid-cols-5",
  6: "@5xl:grid-cols-6",
  7: "@5xl:grid-cols-7",
};

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

const TIME = /^(\d{1,2}):(\d{2})$/;

/** A time of day written as 18:30: its minutes since midnight, and the valid time string for the time element. Anything else is null. */
function clock(value: string): { minutes: number; dateTime: string } | null {
  const match = TIME.exec(value.trim());
  const hours = Number(match?.[1]);
  const minutes = Number(match?.[2]);
  if (!match || hours > 23 || minutes > 59) return null;
  return { minutes: hours * 60 + minutes, dateTime: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` };
}

const at = (minutes: number) => Date.UTC(2000, 0, 1, 0, minutes);

const clockFormat = (locale: string) => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });

/** The time as the locale writes it, and as a valid time string for the time element. A value that is not a time is shown as it was given. */
function timeOf(value: string, locale: string): { text: string; dateTime?: string } {
  const time = clock(value);
  return time ? { text: clockFormat(locale).format(at(time.minutes)), dateTime: time.dateTime } : { text: value };
}

/**
 * A class's hours as the locale writes them, with a shared period said once:
 * "7:00 – 7:45 AM" where both ends are in the morning, "11:30 AM – 12:30 PM"
 * where they are not. Each end keeps its own time element, the start in the
 * strong colour. Only single times are formatted, never a range, because the
 * server and the browser can word a range differently (the dash, the spaces)
 * and a text that differs between them fails hydration. A range that crosses
 * midnight, or a value that is not a time, is written as two plain times.
 * A time never breaks inside itself, and the space before the dash cannot
 * break: a range that does not fit its card wraps after the dash.
 */
function Range({ start, end, locale, to }: { start: string; end: string; locale: string; to: string }) {
  const a = clock(start);
  const b = clock(end);
  let from = timeOf(start, locale);
  let until = timeOf(end, locale);
  if (a && b && b.minutes > a.minutes) {
    const format = clockFormat(locale);
    const first = format.formatToParts(at(a.minutes));
    const second = format.formatToParts(at(b.minutes));
    const i = first.findIndex((part) => part.type === "dayPeriod");
    const j = second.findIndex((part) => part.type === "dayPeriod");
    if (i >= 0 && j >= 0 && first[i]?.value === second[j]?.value) {
      const text = (parts: Intl.DateTimeFormatPart[]) => parts.map((part) => part.value).join("");
      if (i > first.findIndex((part) => part.type === "hour")) {
        // The period follows the time: leave it off the start, keep it on the end.
        const kept = first.slice(0, i);
        while (kept[kept.length - 1]?.type === "literal") kept.pop();
        from = { text: text(kept), dateTime: a.dateTime };
      } else {
        // The period leads the time: say it on the start, leave it off the end.
        const kept = second.slice(j + 1);
        while (kept[0]?.type === "literal") kept.shift();
        until = { text: text(kept), dateTime: b.dateTime };
      }
    }
  }
  return (
    <>
      <time dateTime={from.dateTime} className="font-medium whitespace-nowrap text-foreground">
        {from.text}
      </time>
      <span aria-hidden="true">&nbsp;&ndash; </span>
      <span className="sr-only"> {to} </span>
      <time dateTime={until.dateTime} className="whitespace-nowrap">
        {until.text}
      </time>
    </>
  );
}

/** Where a time falls in the day, in minutes. A value that is not a time sorts last. */
const rank = (value: string): number => clock(value)?.minutes ?? Number.MAX_SAFE_INTEGER;

/** By the clock, not by the text: "9:30" comes before "10:15". */
const byStart = (a: TimetableClass, b: TimetableClass) => rank(a.start) - rank(b.start) || rank(a.end) - rank(b.end);

/**
 * A weekly timetable for a gym, school or studio. When it is wide enough (64rem,
 * about 9rem a day) it is the week at a glance: one column per day, Monday
 * first, with the classes as cards in time order, each with its time, name,
 * trainer and level and a note on the places left. Narrower, and on a phone, it
 * is one day at a time under day tabs, opening on today. A class with no
 * places left is not hidden: it stays in the list, flagged "Full" in words and
 * with a dashed edge, and offers the waitlist when you give a link. Every day
 * is a list rather than a table, so it reads in order on every screen, and
 * today is marked with a word, never only a tint.
 */
export function ClassTimetable({ days, today, legend, headingLevel = 3, linkAs: Link = "a", labels: custom, locale = "en-US", className, ...props }: ClassTimetableProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Day = `h${headingLevel}` as "h2" | "h3" | "h4";
  const week = days.map((day) => ({ day, classes: [...day.classes].sort(byStart), isToday: day.id === today }));
  const first = week.find((entry) => entry.isToday)?.day.id ?? week.find((entry) => entry.classes.length)?.day.id ?? week[0]?.day.id ?? "";
  const count = (n: number) => `${n} ${n === 1 ? labels.class : labels.classes}`;

  const name = (cls: TimetableClass) =>
    cls.href ? (
      <Link
        href={cls.href}
        className="rounded-sm decoration-foreground/40 underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-xl hover:underline focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40"
      >
        {cls.name}
      </Link>
    ) : (
      cls.name
    );

  const availability = (cls: TimetableClass) => {
    if (cls.spots === undefined) return null;
    if (cls.spots <= 0) {
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Badge variant="outline">{labels.full}</Badge>
          {cls.waitlistHref ? (
            <Link
              href={cls.waitlistHref}
              className={cn("relative z-10 rounded-sm text-xs font-medium underline decoration-foreground/40 underline-offset-4 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none", FOCUS)}
            >
              {labels.waitlist}
              <span className="sr-only"> {labels.waitlistFor(cls.name)}</span>
            </Link>
          ) : null}
        </div>
      );
    }
    return (
      <div>
        <Badge variant="secondary">
          <span aria-hidden="true">{labels.spotsLeft(cls.spots)}</span>
          <span className="sr-only">{labels.spotsLeftLong(cls.spots)}</span>
        </Badge>
      </div>
    );
  };

  const full = (cls: TimetableClass) => cls.spots !== undefined && cls.spots <= 0;

  return (
    <section data-slot="class-timetable" className={cn("@container w-full break-words", className)} {...props}>
      {/* From 64rem wide: the whole week. */}
      <div className={cn("hidden @5xl:grid @5xl:gap-x-1", COLUMNS[week.length] ?? "@5xl:grid-cols-7")}>
        {week.map(({ day, classes, isToday }) => (
          <div key={day.id} className={cn("min-w-0 rounded-xl p-2", isToday && "bg-muted/50")}>
            <header className="mb-3 px-1">
              <Day id={`${id}-${day.id}`} className="text-sm leading-snug font-medium tracking-[-0.01em]">
                {day.label}
              </Day>
              {/* A fixed height, so the pill for today never pushes one column's cards below the others. */}
              <p className="mt-0.5 flex h-5 items-center gap-2 text-xs text-muted-foreground tabular-nums">
                <span>{count(classes.length)}</span>
                {isToday ? <Badge variant="default">{labels.today}</Badge> : null}
              </p>
            </header>
            {classes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">{labels.noClasses}</p>
            ) : (
              <ul role="list" aria-labelledby={`${id}-${day.id}`} className="grid grid-cols-1 gap-2">
                {classes.map((cls) => (
                  <li
                    key={`${cls.start}-${cls.end}-${cls.name}`}
                    className={cn(
                      "relative flex flex-col gap-1.5 rounded-xl border bg-card p-3 transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
                      full(cls) ? "border-dashed border-border bg-card/60" : "border-border shadow-xs",
                      cls.href && "hover:border-foreground/25 hover:shadow-sm",
                    )}
                  >
                    <p className="text-xs text-muted-foreground tabular-nums">
                      <Range start={cls.start} end={cls.end} locale={locale} to={labels.to} />
                    </p>
                    <p className="text-sm leading-snug font-medium tracking-[-0.01em] text-pretty">{name(cls)}</p>
                    {cls.trainer || cls.level ? (
                      <p className="text-xs leading-snug text-muted-foreground">
                        {cls.trainer ? <span className="block">{cls.trainer}</span> : null}
                        {cls.trainer && cls.level ? <span className="sr-only">, </span> : null}
                        {cls.level ? <span className="block">{cls.level}</span> : null}
                      </p>
                    ) : null}
                    {availability(cls)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Narrower: one day at a time. */}
      <div className="@5xl:hidden">
        <Tabs defaultValue={first} className="gap-5">
          <TabsList variant="pill" aria-label={labels.days} className="h-auto w-full">
            {week.map(({ day, isToday }) => (
              <TabsTrigger
                key={day.id}
                value={day.id}
                className="min-w-0 flex-1 group-data-[variant=pill]/list:h-auto group-data-[variant=pill]/list:px-1 group-data-[variant=pill]/list:py-2"
              >
                <span className="relative">
                  {day.short ?? Array.from(day.label).slice(0, 3).join("")}
                  {isToday ? <span aria-hidden="true" className="absolute -top-1 -right-2 size-1.5 rounded-full bg-foreground" /> : null}
                </span>
                {isToday ? <span className="sr-only"> ({labels.today})</span> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {week.map(({ day, classes, isToday }) => (
            <TabsContent key={day.id} value={day.id} className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Day className="text-lg leading-snug font-medium tracking-[-0.02em]">{day.label}</Day>
                {isToday ? <Badge variant="default">{labels.today}</Badge> : null}
                <p className="ml-auto text-sm text-muted-foreground tabular-nums">{count(classes.length)}</p>
              </div>
              {classes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{labels.noClasses}</p>
              ) : (
                <ul role="list" className="grid grid-cols-1 gap-2.5">
                  {classes.map((cls) => {
                    const start = timeOf(cls.start, locale);
                    const end = timeOf(cls.end, locale);
                    return (
                      <li
                        key={`${cls.start}-${cls.end}-${cls.name}`}
                        className={cn(
                          "relative grid grid-cols-[5.25rem_minmax(0,1fr)] gap-x-4 rounded-xl border bg-card p-4",
                          full(cls) ? "border-dashed border-border bg-card/60" : "border-border shadow-xs",
                        )}
                      >
                        <p className="text-sm leading-snug tabular-nums">
                          <time dateTime={start.dateTime} className="block font-medium">
                            {start.text}
                          </time>
                          <span className="sr-only">{labels.to}</span>
                          <time dateTime={end.dateTime} className="block text-muted-foreground">
                            {end.text}
                          </time>
                        </p>
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <p className="text-base leading-snug font-medium tracking-[-0.01em] text-pretty">{name(cls)}</p>
                          {cls.trainer || cls.level ? (
                            <p className="text-sm leading-snug text-muted-foreground">
                              {cls.trainer}
                              {cls.trainer && cls.level ? (
                                <>
                                  <span aria-hidden="true"> &middot; </span>
                                  <span className="sr-only">, </span>
                                </>
                              ) : null}
                              {cls.level}
                            </p>
                          ) : null}
                          {availability(cls)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {legend ? (
        <p className="mt-6 flex max-w-2xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{legend}</span>
        </p>
      ) : null}
    </section>
  );
}
