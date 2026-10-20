"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconCalendar, IconCalendarCheck, IconClock, IconNavigation, IconPin, IconVideo } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { clockTime, dayName, dayOffset, durationWords, knownZone, mapsUrl, toMs, zoneName, type MomentInput } from "@rhs-ui/dashboard/next-up-card/schedule";
import { cn } from "@/lib/utils";

export interface NextUpAttendee {
  /** The person's full name. The card names the first two by first name. */
  name: string;
  /** A photo. Without one, or until it loads, the initials are drawn. */
  image?: string;
}

export interface NextUpEvent {
  /** Stable identity, so a new event starts from a clean card. */
  id?: string;
  /** The event's name. */
  title: string;
  /** When it starts: a Date, an ISO 8601 string with an offset, or epoch milliseconds. */
  start: MomentInput;
  /** When it ends. Same formats as `start`. */
  end: MomentInput;
  /** Where it is: a room, an address. Turns on Directions. */
  place?: string;
  /** The meeting link. Turns on Join. */
  link?: string;
  /** Who is in it. */
  attendees?: readonly NextUpAttendee[];
}

export interface NextUpLabels {
  /** The card's heading. */
  eyebrow: string;
  /** `{time}` becomes the length of time: "Starts in {time}". */
  startsIn: string;
  /** The chip while the event is on. */
  happeningNow: string;
  /** `{time}` becomes what is left of the event: "{time} left". */
  timeLeft: string;
  /** The label of the button that opens the meeting link. */
  join: string;
  /** The label of the button that opens a map. */
  directions: string;
  /** `{count}` becomes the number of people not named: "{count} others". */
  others: string;
  /** The heading of the all-clear state. */
  emptyTitle: string;
  /** The line under it. */
  emptyText: string;
  /** `{title}` and `{time}`: shown under the empty state after the last event. */
  endedAt: string;
  /** Said by screen readers after Join and Directions. */
  newTab: string;
}

const LABELS: NextUpLabels = {
  eyebrow: "Next up",
  startsIn: "Starts in {time}",
  happeningNow: "Happening now",
  timeLeft: "{time} left",
  join: "Join",
  directions: "Directions",
  others: "{count} others",
  emptyTitle: "Nothing else today",
  emptyText: "Your calendar is clear for the rest of the day.",
  endedAt: "{title} ended at {time}.",
  newTab: "opens in a new tab",
};

export interface NextUpCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The event to show. It can be one that has not started, is on now or is over: the card works out which. `null` or nothing shows the all-clear. */
  event?: NextUpEvent | null;
  /** The moment to measure from. Pass it from the server for a first render that matches the browser's; without it the card reads the clock and ticks once a minute. */
  now?: MomentInput;
  /** IANA zone the times are shown in. */
  timeZone?: string;
  /** BCP 47 locale for times, dates and lists of names. */
  locale?: string;
  /** Called when Join is pressed. Join is a link to `event.link`; this is for tracking or your own handling. */
  onJoin?: (event: NextUpEvent) => void;
  /** Where Directions goes. Without it, Google Maps directions to `event.place` are used. */
  directionsHref?: string;
  /** Replaces the words of the all-clear state. */
  emptyState?: ReactNode;
  /** Your own words, for another language. */
  labels?: Partial<NextUpLabels>;
}

/** The clock, once a minute, unless a moment was passed in. */
function useClock(controlled: MomentInput | undefined): number {
  const [clock, setClock] = useState<number | null>(null);
  const external = controlled === undefined ? Number.NaN : toMs(controlled);
  const given = Number.isFinite(external);
  useEffect(() => {
    if (given) return;
    const sync = (): void => setClock(Date.now());
    sync();
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        sync();
        interval = setInterval(sync, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    // A sleeping tab misses its timers: catch up when it is looked at again.
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [given]);
  return given ? external : (clock ?? Date.now());
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * A dashboard card that answers "what is next?": the next event with its time
 * range and zone, where it is, who is in it, and how long until it starts in
 * words ("Starts in 25 minutes"). Join shows when the event has a link and
 * Directions when it has a place. During the event the card says "Happening
 * now" and how much is left; afterwards it settles into a calm "Nothing else
 * today". The countdown moves every minute without being announced, and the
 * start and end are `<time>` elements.
 */
export function NextUpCard({ event, now, timeZone = "UTC", locale = "en-US", onJoin, directionsHref, emptyState, labels, className, ...props }: NextUpCardProps) {
  const l = { ...LABELS, ...labels };
  const headingId = useId();
  const clock = useClock(now);
  const zone = knownZone(timeZone);
  // Server and first browser render can differ by a minute when the clock is not passed in.
  const volatile = now === undefined;

  const start = event ? toMs(event.start) : Number.NaN;
  const end = event ? Math.max(toMs(event.end), start) : Number.NaN;
  const valid = event !== null && event !== undefined && Number.isFinite(start) && Number.isFinite(end);
  const phase = !valid ? "clear" : clock < start ? "upcoming" : clock < end ? "live" : "over";
  const show = valid && (phase === "upcoming" || phase === "live") ? event : null;

  const offset = show ? dayOffset(start, clock, zone) : 0;
  const minutesToStart = Math.max(1, Math.ceil((start - clock) / 60_000));
  const minutesLeft = Math.max(1, Math.ceil((end - clock) / 60_000));
  const progress = end > start ? Math.min(1, Math.max(0, (clock - start) / (end - start))) : 1;

  // The chip never wraps (it is the card's key string): in a narrow card it drops under the heading, and a label too long for the card gives way with an ellipsis.
  const chip =
    phase === "live" ? (
      <span className="inline-flex min-h-6 max-w-full shrink-0 items-center gap-1.5 rounded-full bg-foreground px-2.5 text-xs font-medium whitespace-nowrap text-background">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current motion-safe:animate-pulse" />
        <span className="truncate">{l.happeningNow}</span>
      </span>
    ) : phase === "upcoming" ? (
      <span className="inline-flex min-h-6 max-w-full shrink-0 items-center rounded-full bg-muted px-2.5 text-xs font-medium whitespace-nowrap tabular-nums">
        <span className="truncate" suppressHydrationWarning={volatile}>
          {offset > 0 ? dayName(offset, start, locale, zone) : fill(l.startsIn, { time: durationWords(minutesToStart, locale) })}
        </span>
      </span>
    ) : null;

  const people = show?.attendees ?? [];
  // Up to five faces; a longer list shows four and a count, never a lone "+1".
  const faces = people.length > 5 ? 4 : people.length;
  const named = people.length > 3 ? 2 : people.length;
  const rest = people.length - named;
  const roster = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format([
    ...people.slice(0, named).map((person) => person.name.split(/\s+/)[0] ?? person.name),
    ...(rest > 0 ? [fill(l.others, { count: new Intl.NumberFormat(locale).format(rest) })] : []),
  ]);

  return (
    <Card role="region" aria-labelledby={headingId} data-slot="next-up-card" data-state={phase} className={cn("w-full gap-5 py-5", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5">
        <h3 id={headingId} className="flex min-w-0 items-center gap-2 text-sm font-medium whitespace-nowrap text-muted-foreground">
          <IconCalendar aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{l.eyebrow}</span>
        </h3>
        {chip}
      </div>

      {show ? (
        <>
          <div className="grid gap-4 px-5">
            <p className="text-lg leading-snug font-medium tracking-[-0.02em] break-words text-balance">{show.title}</p>
            <ul className="grid gap-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="tabular-nums">
                  <time dateTime={new Date(start).toISOString()}>{clockTime(start, locale, zone)}</time>
                  <span aria-hidden="true"> &ndash; </span>
                  <span className="sr-only"> to </span>
                  <time dateTime={new Date(end).toISOString()}>{clockTime(end, locale, zone)}</time>{" "}
                  <span className="text-muted-foreground">{zoneName(start, locale, zone)}</span>
                </span>
              </li>
              {show.place ? (
                <li className="flex items-start gap-2.5">
                  <IconPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 break-words">{show.place}</span>
                </li>
              ) : null}
              {people.length ? (
                <li className="flex items-center gap-2.5 pt-0.5">
                  <AvatarGroup aria-hidden="true" className="-space-x-1 *:data-[slot=avatar]:ring-card">
                    {people.slice(0, faces).map((person, index) => (
                      <Avatar key={`${person.name}-${index}`} size="sm">
                        {person.image ? <AvatarImage src={person.image} alt="" /> : null}
                        <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {people.length > faces ? <AvatarGroupCount className="size-7 text-[0.6875rem] ring-card">+{people.length - faces}</AvatarGroupCount> : null}
                  </AvatarGroup>
                  <span className="min-w-0 text-muted-foreground">{roster}</span>
                </li>
              ) : null}
            </ul>

            {phase === "live" ? (
              <div className="flex items-center gap-3">
                <div aria-hidden="true" className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                    suppressHydrationWarning={volatile}
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums" suppressHydrationWarning={volatile}>
                  {fill(l.timeLeft, { time: durationWords(minutesLeft, locale) })}
                </span>
              </div>
            ) : null}
          </div>

          {show.link || show.place ? (
            <div className="flex flex-wrap gap-2 px-5">
              {show.link ? (
                <Button asChild className="flex-1 sm:flex-none">
                  <a href={show.link} target="_blank" rel="noopener noreferrer" onClick={() => onJoin?.(show)}>
                    <IconVideo />
                    {l.join}
                    <span className="sr-only">
                      {" "}
                      ({show.title}, {l.newTab})
                    </span>
                  </a>
                </Button>
              ) : null}
              {show.place ? (
                <Button asChild variant={show.link ? "outline" : "default"} className="flex-1 sm:flex-none">
                  <a href={directionsHref ?? mapsUrl(show.place)} target="_blank" rel="noopener noreferrer">
                    <IconNavigation />
                    {l.directions}
                    <span className="sr-only">
                      {" "}
                      ({show.place}, {l.newTab})
                    </span>
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <div data-slot="next-up-empty" className="flex flex-col items-start gap-4 px-5">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-muted">
            <IconCalendarCheck className="size-5" />
          </span>
          {emptyState ?? (
            <div>
              <p className="text-lg leading-snug font-medium tracking-[-0.02em]">{l.emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{l.emptyText}</p>
              {phase === "over" && event ? (
                <p className="mt-4 text-xs text-muted-foreground">{fill(l.endedAt, { title: event.title, time: clockTime(end, locale, zone) })}</p>
              ) : null}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
