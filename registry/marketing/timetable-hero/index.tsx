"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCalendar, IconInfo, IconUsers } from "@rhs-ui/icons";
import { clockParts, dayKey, dayText, fill, LABELS, momentMs, type MomentInput, type TimetableHeroLabels } from "@rhs-ui/marketing/timetable-hero/time";
import { Badge } from "@rhs-ui/primitives/badge";
import { Meter } from "@rhs-ui/primitives/meter";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { cn } from "@/lib/utils";

export type { MomentInput, TimetableHeroLabels } from "@rhs-ui/marketing/timetable-hero/time";

export interface TimetableSession {
  /** Stable and unique. */
  id: string;
  /** When the class starts, as an ISO string with its offset ("2026-11-04T18:30:00+01:00"), a Date or a timestamp. It is written in the studio's `timeZone`, not the visitor's. */
  startsAt: MomentInput;
  /** The class: "Reformer Pilates". */
  name: string;
  /** Who teaches it. */
  coach?: string;
  /** The places left. 0 means full and says so in words; leave it out to say nothing about places. */
  spots?: number;
  /** The places in all. With it the places left are drawn as a thin meter; without it they are written only. */
  capacity?: number;
  /** Where the class is booked, or its waitlist when it is full. The whole tile is this link. */
  href: string;
}

export interface TimetableHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The opening line: "Today at Halcyon Studio". */
  title: string;
  /** One or two sentences on what the studio teaches and who it is for. */
  description?: string;
  /** The actions beside the title: a Book button and a link to the full timetable. Pass your own elements. */
  actions?: ReactNode;
  /** The coming classes, in any order: today's, and the next day's if you have them. Only today's are shown, and when none are left the first class of the next day with any. Three to five tiles read best. */
  sessions: readonly TimetableSession[];
  /** The studio's own time zone as an IANA name: "Europe/Amsterdam". "Today" and every time are worked out there, not on the visitor's clock. Default "UTC". */
  timeZone?: string;
  /** The language of the times and the date. Default "en-US". */
  locale?: string;
  /** "h23" writes 18:30 whatever the locale, "h12" writes 6:30 with a small PM. Default "h23". */
  hourCycle?: "h12" | "h23";
  /** A fixed moment to work "today" and "started" out for, for previews and tests. Leave it out and the visitor's own clock is read once the page is live, so the server never prints a stale "Started". */
  now?: MomentInput;
  /** The most tiles shown. Past it, classes that have started drop out first. Default 5. */
  limit?: number;
  /** Said above the row when nothing is left today. Default "No more classes today." */
  emptyMessage?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TimetableHeroLabels>;
}

interface Row extends TimetableSession {
  at: number;
  day: string;
}

/**
 * Today's classes for a studio, as a row of tiles that does the arithmetic:
 * the start in large tabular figures, the class and its coach, and the places
 * left as a thin meter with the number beside it. A full class says "Full,
 * join waitlist" and a class that has begun is dimmed and tagged Started, both
 * in words, so no state is carried by tone alone. Every tile is one link. The
 * day and the times are worked out in the studio's own time zone, so a visitor
 * on the other side of the world sees the studio's day; when the last class
 * of today has begun, the row shows the first class of the next day and says
 * so. The row scrolls sideways with snap on small screens, and opens on the
 * first class that has not begun. For gyms, yoga studios, dance schools and
 * climbing halls.
 */
export function TimetableHero({
  titleAs: Title = "h2",
  title,
  description,
  actions,
  sessions,
  timeZone = "UTC",
  locale = "en-US",
  hourCycle = "h23",
  now,
  limit = 5,
  emptyMessage,
  labels,
  className,
  ...props
}: TimetableHeroProps) {
  const words = { ...LABELS, ...labels };
  const id = useId();
  const pinned = now !== undefined && !Number.isNaN(momentMs(now));
  const [tick, setTick] = useState<number | null>(null);

  // The browser's clock, read once the page is live and then every half minute: null on the server and until then, so both write the same text.
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 30_000);
    return () => window.clearInterval(timer);
  }, [pinned]);
  const clock = pinned ? momentMs(now as MomentInput) : tick;

  const rows: Row[] = sessions
    .map((session) => ({ ...session, at: momentMs(session.startsAt), day: "" }))
    .filter((row) => !Number.isNaN(row.at))
    .sort((a, b) => a.at - b.at)
    .map((row) => ({ ...row, day: dayKey(row.at, timeZone) }));

  // Before the clock is known the first day in the list is "today", which is what a list that starts today holds.
  const today = clock === null ? (rows[0]?.day ?? "") : dayKey(clock, timeZone);
  const todays = rows.filter((row) => row.day === today);
  const started = (row: Row) => clock !== null && row.at <= clock;
  const upcoming = todays.filter((row) => !started(row));
  let tiles: Row[];
  let message: string | null = null;
  if (clock === null || upcoming.length) {
    // Past the limit the classes that have begun drop out first, the latest of them last.
    const room = Math.max(0, limit - upcoming.length);
    tiles = todays.length <= limit ? todays : [...todays.filter(started).slice(Math.max(0, todays.filter(started).length - room)), ...upcoming].slice(0, limit);
  } else {
    // Nothing left today: say so, and show how tomorrow starts.
    message = emptyMessage ?? words.empty;
    const next = rows.find((row) => row.day > today);
    tiles = next ? [next] : [];
  }
  const first = tiles[0];

  // Once the clock is known the row opens on the first class that can still be booked. On a phone the classes that have begun would lead, and the next one would sit half off the edge. It happens once: later ticks never move a row somebody is already scrolling.
  const strip = useRef<HTMLUListElement>(null);
  const opened = useRef(false);
  const next = clock === null ? undefined : tiles.find((row) => !started(row))?.id;
  useEffect(() => {
    if (next === undefined || opened.current) return;
    opened.current = true;
    const list = strip.current;
    const viewport = list?.closest<HTMLElement>("[data-slot=scroll-area-viewport]");
    const lead = list?.querySelector<HTMLElement>("li:not([data-state=started])");
    const start = list?.firstElementChild;
    // A row that fits has nothing to scroll.
    if (!viewport || !lead || !start || viewport.scrollWidth <= viewport.clientWidth) return;
    viewport.scrollLeft = lead.getBoundingClientRect().left - start.getBoundingClientRect().left;
  }, [next]);

  return (
    <section data-slot="timetable-hero" className={cn("py-14 sm:py-20", className)} {...props}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0 max-w-2xl">
          <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
          {description ? <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3 max-sm:[&>*]:grow">{actions}</div> : null}
      </div>

      <div className="mt-10 sm:mt-12">
        {message ? (
          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <IconInfo className="size-4 shrink-0" />
            {message}
          </p>
        ) : null}
        {first ? (
          <p id={`${id}-day`} className="mb-4 flex items-center gap-2 text-sm font-medium">
            <IconCalendar className="size-4 shrink-0 text-muted-foreground" />
            {dayText(first.at, locale, timeZone)}
          </p>
        ) : null}

        {tiles.length ? (
          // The viewport scrolls and snaps; the list has a little padding and the box the same amount of negative margin, so a focus ring or a shadow at the edge is not cut. The snap keeps that padding, so a tile settles level with the title.
          <ScrollArea
            role="region"
            aria-labelledby={`${id}-day`}
            className="-m-1 [&>[data-slot=scroll-area-viewport]]:scroll-ps-1 [&>[data-slot=scroll-area-viewport]]:snap-x [&>[data-slot=scroll-area-viewport]]:snap-mandatory"
          >
            <ul ref={strip} aria-label={words.sessions} className="flex gap-3 p-1">
              {tiles.map((row) => {
                const time = clockParts(row.at, locale, timeZone, hourCycle);
                const begun = started(row);
                const full = row.spots !== undefined && row.spots <= 0;
                const coach = row.coach ? fill(words.coach, { name: row.coach }) : null;
                const label = row.name;
                return (
                  <li
                    key={row.id}
                    data-state={begun ? "started" : full ? "full" : "open"}
                    className={cn(
                      // Width 0 with a minimum: the tile asks the row for exactly its minimum (never for the length of its words), so the row only scrolls when the tiles really do not fit, and otherwise they share the width, up to a limit.
                      "relative flex w-0 max-w-[24rem] min-w-[16.5rem] shrink-0 grow snap-start flex-col rounded-xl border bg-card p-5 sm:min-w-[13rem]",
                      begun
                        ? "border-dashed border-border bg-card/60"
                        : "border-border shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-foreground/30 hover:shadow-sm has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/40 motion-reduce:transition-none",
                    )}
                  >
                    {/* A class that has begun goes quiet by colour, not by opacity: it is information, not a disabled control, and opacity would take the coach line under AA. The dashed border and the tag still say it. */}
                    <div className="min-w-0">
                      <time dateTime={new Date(row.at).toISOString()} className={cn("block text-4xl leading-none font-medium tracking-[-0.04em] tabular-nums sm:text-[2.5rem]", begun && "text-muted-foreground")}>
                        {time.text}
                        {time.period ? <span className="ml-1.5 text-base tracking-normal text-muted-foreground">{time.period}</span> : null}
                      </time>
                      <p className={cn("mt-5 text-base leading-snug font-medium tracking-[-0.01em] text-pretty", begun && "text-muted-foreground")}>
                        {begun ? (
                          label
                        ) : (
                          <a href={row.href} className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']">
                            {label}
                            {/* What a list of links needs to tell them apart: the class, its time and whether it is full. The coach is read right after. */}
                            <span className="sr-only">
                              , {time.text}
                              {time.period ? ` ${time.period}` : ""}
                              {full ? `, ${words.full}` : ""}
                            </span>
                          </a>
                        )}
                      </p>
                      {coach ? <p className="mt-1 text-sm leading-snug text-muted-foreground">{coach}</p> : null}
                    </div>

                    {begun ? (
                      <Badge variant="outline" className="absolute top-4 right-4">
                        {words.started}
                      </Badge>
                    ) : full ? (
                      <p className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium">
                        <IconUsers className="size-4 shrink-0 text-muted-foreground" />
                        {words.full}
                      </p>
                    ) : row.spots !== undefined && row.capacity ? (
                      <Meter
                        label={words.spotsLeft}
                        value={Math.min(row.spots, row.capacity)}
                        max={row.capacity}
                        valueText={String(row.spots)}
                        className="mt-auto gap-1.5 pt-6 [&>div:first-child]:text-xs [&>div:first-child>span:first-child]:font-normal [&>div:first-child>span:first-child]:text-muted-foreground [&>div:first-child>span:last-child]:font-medium [&>div:first-child>span:last-child]:text-foreground [&_[role=meter]]:h-1"
                      />
                    ) : row.spots !== undefined ? (
                      <p className="mt-auto pt-6 text-sm">
                        <span className="text-muted-foreground">{words.spotsLeft}:</span> <span className="font-medium tabular-nums">{row.spots}</span>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : null}
      </div>
    </section>
  );
}
