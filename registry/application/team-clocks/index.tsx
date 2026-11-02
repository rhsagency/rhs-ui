"use client";

import { useEffect, useState, useSyncExternalStore, type ComponentProps } from "react";

import { IconMoon, IconSun } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

import { browserZone, cityOf, DEFAULT_HOURS, dayDifference, durationWords, handAngles, isWorking, offsetMinutes, offsetText, timeText, weekdayText, type WorkHours } from "./zones";

export type { WorkHours } from "./zones";

/** The words the clocks use, for translation. `{time}` is filled in. */
export interface TeamClocksLabels {
  /** The list's name for a screen reader. Default "Local times of the team". */
  list?: string;
  /** Next to the sun, while someone is inside their working hours. Default "Working". */
  working?: string;
  /** Next to the moon, outside them. Default "Off hours". */
  off?: string;
  /** Instead of an offset, for someone on your time. Default "Same time".  */
  sameTime?: string;
  /** What a screen reader hears for an offset ahead of you. Default "{time} ahead of you". */
  ahead?: string;
  /** And behind you. Default "{time} behind you". */
  behind?: string;
}

/** One teammate. */
export interface ClockPerson {
  /** A stable key for the list. Default the name and the zone. */
  id?: string;
  name: string;
  /** Where they are: "Lisbon". Default the place in the time zone's name ("Los Angeles" for America/Los_Angeles). */
  city?: string;
  /** A picture for the list, where each row starts with a face; the initials stand in until it loads or when there is none. The analog card is the clock face and the name, and has no picture. */
  image?: string;
  /** Their IANA zone, such as "Europe/Amsterdam". Daylight saving follows from it. */
  timeZone: string;
  /** When they work in that zone. Default 09:00 to 17:00, Monday to Friday. */
  workHours?: WorkHours;
}

export interface TeamClocksProps extends Omit<ComponentProps<"div">, "children"> {
  /** The team. */
  people: readonly ClockPerson[];
  /** "list" is one row per person; "analog" is a card with a clock face. Default "list". */
  variant?: "list" | "analog";
  /** Write the time as "8:30 AM" instead of "08:30". Default false. */
  hour12?: boolean;
  /** Sorts the team by how far ahead of UTC each zone is, behind first. Default "given": the order you pass. */
  sort?: "given" | "offset";
  /** Pins the moment, for previews and tests: the clocks then do not tick. Leave it out to use the browser's clock, read once the page is live and then every minute on the minute. */
  now?: Date | string | number;
  /** The zone the offsets are measured from. Leave it out to use the reader's own, read once the page is live. */
  viewerTimeZone?: string;
  /** The language of the weekdays and the times. Default "en-US". */
  locale?: string;
  /** The words the clocks use, for translation. */
  labels?: TeamClocksLabels;
}

const DEFAULT_LABELS = {
  list: "Local times of the team",
  working: "Working",
  off: "Off hours",
  sameTime: "Same time",
  ahead: "{time} ahead of you",
  behind: "{time} behind you",
} satisfies Required<TeamClocksLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const subscribeNever = (): (() => void) => () => undefined;

/**
 * The browser's clock, read as soon as the page is live and then once a minute,
 * on the minute, so every clock changes together. It is read again the moment a
 * sleeping tab is looked at. Null on the server and before hydration, so both
 * write the same text.
 */
function useClock(pinned: number | null): number | null {
  const [tick, setTick] = useState<number | null>(null);
  useEffect(() => {
    if (pinned !== null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      const at = Date.now();
      setTick(at);
      timer = setTimeout(sync, 60_000 - (at % 60_000) + 20);
    };
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      sync();
    };
    sync();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [pinned]);
  return pinned ?? tick;
}

/** The face of an analog clock: twelve ticks and two hands, drawn from the wall clock of the zone. The hands wait for the clock, so the server draws an empty face. */
function Face({ at, timeZone, working }: { at: number | null; timeZone: string; working: boolean }) {
  const angles = at === null ? null : handAngles(at, timeZone);
  // Two decimals: the sine of the same angle can differ in the last digits between the server's engine and the browser's, and a longer number is a hydration mismatch.
  const spot = (radius: number, degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return { x: Number((50 + radius * Math.sin(radians)).toFixed(2)), y: Number((50 - radius * Math.cos(radians)).toFixed(2)) };
  };
  const hand = (degrees: number, length: number) => {
    const { x, y } = spot(length, degrees);
    return { x2: x, y2: y };
  };
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="size-[4.5rem] shrink-0">
      <circle cx="50" cy="50" r="47" strokeWidth="2" className={cn("stroke-border", working ? "fill-card" : "fill-muted")} />
      {Array.from({ length: 12 }, (_, index) => {
        const quarter = index % 3 === 0;
        const from = spot(quarter ? 36 : 39.5, index * 30);
        const to = spot(43, index * 30);
        return <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={quarter ? 2.5 : 1.5} strokeLinecap="round" className="stroke-foreground/45" />;
      })}
      {angles ? (
        <>
          <line x1="50" y1="50" {...hand(angles.hour, 23)} strokeWidth="4.5" strokeLinecap="round" className="stroke-foreground" />
          <line x1="50" y1="50" {...hand(angles.minute, 34)} strokeWidth="3" strokeLinecap="round" className="stroke-foreground" />
          <circle cx="50" cy="50" r="3.5" className="fill-foreground" />
        </>
      ) : null}
    </svg>
  );
}

/**
 * The time for each teammate, so nobody has to open a converter: their name
 * and city, their local time, and "Working" or "Off hours" in words with a sun
 * or a moon. A day that differs from yours is written in front of the time
 * ("Tue 08:30"), and the offset to you after the city ("+6 h"), said in full to
 * a screen reader. The clocks tick once a minute on the minute, read again when
 * a sleeping tab wakes, and wait for the browser's clock before they show a
 * time so the server and the browser never disagree. As a list it is one row
 * per person; as analog it is a card with an SVG clock face and the digital
 * time beside it as text, in as many columns as the box it sits in has room
 * for, not as many as the screen has. A long city wraps, and the offset beside
 * it always shows in full. It can sort the team by offset.
 */
export function TeamClocks({ people, variant = "list", hour12 = false, sort = "given", now, viewerTimeZone, locale = "en-US", labels, className, ...props }: TeamClocksProps) {
  const text: Required<TeamClocksLabels> = { ...DEFAULT_LABELS, ...labels };
  const pinned = now === undefined || Number.isNaN(new Date(now).getTime()) ? null : new Date(now).getTime();
  const at = useClock(pinned);
  // The reader's zone is known only in the browser, so the offsets wait for it. One passed in is known everywhere.
  const viewer = useSyncExternalStore(
    subscribeNever,
    () => viewerTimeZone ?? browserZone(locale),
    () => viewerTimeZone ?? null,
  );

  const reference = at ?? pinned ?? Date.now();
  const ordered = sort === "offset" ? people.map((person, index) => ({ person, index, offset: offsetMinutes(reference, person.timeZone) })).sort((a, b) => a.offset - b.offset || a.index - b.index).map((entry) => entry.person) : people;

  return (
    // The box is the container: the analog cards pick their columns, and a face beside the words or above them, by the width of the box they sit in and not by the width of the screen.
    <div data-slot="team-clocks" data-variant={variant} className={cn("w-full", variant === "list" ? "overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs" : "@container", className)} {...props}>
      <ul role="list" aria-label={text.list} className={variant === "list" ? "divide-y divide-border" : "grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-3"}>
        {ordered.map((person) => {
          const known = at !== null;
          const working = known && isWorking(at, person.timeZone, person.workHours ?? DEFAULT_HOURS);
          const differs = known && viewer !== null && dayDifference(at, person.timeZone, viewer) !== 0;
          const shift = known && viewer !== null ? offsetMinutes(at, person.timeZone) - offsetMinutes(at, viewer) : null;
          const clock = known ? timeText(at, person.timeZone, locale, hour12) : null;
          const city = person.city ?? cityOf(person.timeZone);

          const offset =
            shift === null ? (
              <span aria-hidden="true" className="invisible">
                +0 h
              </span>
            ) : shift === 0 ? (
              text.sameTime
            ) : (
              <>
                <span aria-hidden="true">{offsetText(shift)}</span>
                <span className="sr-only">{fill(shift > 0 ? text.ahead : text.behind, { time: durationWords(shift, locale) })}</span>
              </>
            );

          // The city may wrap, after the dot when it can, and the offset never does: it is the point of the line, so it is not the part that is cut.
          const where = (
            <>
              {city}
              <span className="mx-1" aria-hidden="true">
                ·
              </span>
              <wbr />
              <span className="sr-only">, </span>
              <span className="whitespace-nowrap tabular-nums">{offset}</span>
            </>
          );

          const time =
            clock === null ? (
              <span aria-hidden="true" className="text-muted-foreground/60">
                --:--
              </span>
            ) : (
              <>
                {differs ? <span className="font-normal text-muted-foreground">{weekdayText(at, person.timeZone, locale)} </span> : null}
                {clock}
              </>
            );

          const status = known ? (
            <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", working ? "font-medium text-foreground" : "text-muted-foreground")}>
              {working ? <IconSun className="size-3.5" /> : <IconMoon className="size-3.5" />}
              {working ? text.working : text.off}
            </span>
          ) : null;

          if (variant === "analog") {
            // One card to a row in a narrow box, with the face beside the words; two and then three to a row as the box widens, with the face above them.
            return (
              <li key={person.id ?? `${person.name}|${person.timeZone}`} className="flex min-w-0 items-center gap-4 rounded-xl border border-border bg-card p-4 text-left text-card-foreground shadow-xs @sm:flex-col @sm:gap-3 @sm:text-center">
                <Face at={at} timeZone={person.timeZone} working={working} />
                <div className="grid min-w-0 flex-1 gap-1.5 @sm:w-full @sm:flex-none @sm:justify-items-center">
                  <div className="grid min-w-0 max-w-full gap-0.5">
                    <p className="text-sm leading-5 font-medium [overflow-wrap:anywhere]">{person.name}</p>
                    <p className="text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]">{where}</p>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 @sm:flex-col @sm:items-center @sm:gap-y-1">
                    <p className="text-base leading-6 font-medium tracking-[-0.01em] whitespace-nowrap tabular-nums">{time}</p>
                    <p className="min-h-5 text-xs leading-5">{status}</p>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={person.id ?? `${person.name}|${person.timeZone}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3">
              <Avatar className="row-span-2">
                {person.image ? <AvatarImage src={person.image} alt="" /> : null}
                <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
              </Avatar>
              <p className="min-w-0 text-sm leading-5 font-medium [overflow-wrap:anywhere]">{person.name}</p>
              <p className="text-right text-[0.9375rem] leading-5 font-medium tracking-[-0.01em] whitespace-nowrap tabular-nums">{time}</p>
              <p className="min-w-0 text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">{where}</p>
              <p className="text-right text-xs leading-5">{status}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
