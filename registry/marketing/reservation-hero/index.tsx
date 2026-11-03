"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent } from "react";

import { IconAlertCircle, IconCheck, IconInfo } from "@rhs-ui/icons";
import {
  addDays,
  dateOfDay,
  dayName,
  dayOfDate,
  dayPhrase,
  dayText,
  fill,
  firstOpen,
  isClosed,
  isDay,
  LABELS,
  plural,
  timeText,
  todayIn,
  type ClosedDay,
  type ReservationHeroLabels,
} from "@rhs-ui/marketing/reservation-hero/dates";
import { Button } from "@rhs-ui/primitives/button";
import { DatePicker } from "@rhs-ui/primitives/date-picker";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type { ClosedDay, ReservationHeroLabels } from "@rhs-ui/marketing/reservation-hero/dates";

export interface ReservationSlot {
  /** The time of day on the 24-hour clock, in the restaurant's own time: "18:30". */
  time: string;
  /** True when the time is taken. It stays in the row, disabled and tagged "Full" in words. */
  full?: boolean;
}

/** What the visitor chose, handed to you when they press Reserve. The booking is yours. */
export interface ReservationChoice {
  /** How many people the table is for. */
  party: number;
  /** The day, as "2026-11-06": the restaurant's own calendar date. */
  date: string;
  /** The time, as the slot gave it: "18:30". */
  time: string;
}

export interface ReservationImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What it shows. Leave it empty when the picture only decorates, which is the usual case: the restaurant's name is written next to it. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the real one loads. */
  blurDataUrl?: string;
}

export interface ReservationHeroProps extends Omit<ComponentProps<"section">, "title" | "children" | "onChange"> {
  /** The name's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The restaurant's name. It is the heading. */
  name: string;
  /** One line on the food and the room. */
  description?: string;
  /** The photograph, tall, on the left. */
  image: ReservationImage;
  /** The same times for every open day. Use `slotsFor` when they depend on the day or the party. */
  slots?: readonly ReservationSlot[];
  /** The times for a day and a party size, from your booking system: an array, or a promise of one. It is asked again whenever the party or the day changes, and an answer that arrives after they have changed again is ignored. It wins over `slots`. A function cannot be passed from a Server Component: use the hero inside a Client Component. */
  slotsFor?: (date: string, party: number) => readonly ReservationSlot[] | Promise<readonly ReservationSlot[]>;
  /** The days the restaurant is shut: weekdays (0 is Sunday, 1 is Monday) it is always shut, and dates ("2026-12-25") it is shut on. They cannot be picked, and the date starts on the first open day. */
  closedDays?: readonly ClosedDay[];
  /** How many guests to start with. Default 2. */
  defaultParty?: number;
  /** The largest party the stepper allows. Default 12. */
  maxParty?: number;
  /** The day to start on, as "2026-11-06". Default: today, or the first open day after it. */
  defaultDate?: string;
  /** How far ahead a table can be reserved, in days. Default 90. */
  daysAhead?: number;
  /** The restaurant's own time zone as an IANA name: "Europe/Amsterdam". "Today" is worked out there, not on the visitor's clock. Default "UTC". */
  timeZone?: string;
  /** A fixed day to treat as today ("2026-11-06"), for server HTML, previews and tests. Leave it out and the day is read from the browser's clock once the page is live: until then the date shows its placeholder and the times a skeleton, so a page built days ago never shows the day it was built. */
  today?: string;
  /** The language of the dates and times. Default "en-US". */
  locale?: string;
  /** "h23" writes 18:30 whatever the locale, "h12" writes 6:30 PM. Default "h23". */
  hourCycle?: "h12" | "h23";
  /** Which day the calendar's week starts on: 1 for Monday (the default), 0 for Sunday. */
  weekStartsOn?: 0 | 1;
  /** Called when the visitor presses Reserve with a time chosen. The booking is yours: this only hands you the choice. If it returns a promise, the button shows it is busy until the promise settles; handle errors inside it. */
  onReserve: (choice: ReservationChoice) => void | Promise<void>;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ReservationHeroLabels>;
}

type Load = { status: "loading" | "ready" | "error"; slots: readonly ReservationSlot[] };

/** What the times are until the clock says which day it is: still to come. */
const WAITING: Load = { status: "loading", slots: [] };

/** Written out whole: Tailwind only generates the classes it can read in the source. Chosen so a row is never left with one chip on its own. */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-3",
  2: "grid-cols-3",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-3",
  6: "grid-cols-3",
  9: "grid-cols-3",
};
const MANY_COLUMNS = "grid-cols-3 sm:grid-cols-4";

const NO_SLOTS: readonly ReservationSlot[] = [];
const NO_DAYS: readonly ClosedDay[] = [];

/**
 * A restaurant's opening with the table first: a tall photograph beside the
 * name, one line and a compact form. The visitor sets the party (a stepper,
 * one to twelve) and a day (starting on today, or the first open day), and the
 * times for that day appear as chips in a toggle group the arrow keys move
 * through. A time that is taken stays in the row, disabled and tagged "Full"
 * in words. Whenever the party or the day changes the chips are asked for
 * again, and a polite message says what is shown: "Showing 4 times for 2
 * guests on Friday". Until a time is chosen the button waits, and the reason
 * is written under it. "Today" is the restaurant's own and is read from the
 * browser's clock once the page is live, so a page built days ago never
 * shows the day it was built: until then the date is a placeholder and the
 * times a skeleton. There is no booking engine in here: you give it the
 * times, and it gives you back the choice.
 */
export function ReservationHero({
  titleAs: Title = "h2",
  name,
  description,
  image,
  slots,
  slotsFor,
  closedDays = NO_DAYS,
  defaultParty = 2,
  maxParty = 12,
  defaultDate,
  daysAhead = 90,
  timeZone = "UTC",
  today,
  locale = "en-US",
  hourCycle = "h23",
  weekStartsOn = 1,
  onReserve,
  labels,
  className,
  ...props
}: ReservationHeroProps) {
  const words = { ...LABELS, ...labels, showing: { ...LABELS.showing, ...labels?.showing }, guestCount: { ...LABELS.guestCount, ...labels?.guestCount } };
  const id = useId();

  // The restaurant's today comes from the browser's clock, and only once the page is live: a server or a build would print its own day and the browser would keep it. `today` pins it.
  const fixed = today !== undefined && isDay(today) ? today : null;
  const [clock, setClock] = useState<string | null>(null);
  useEffect(() => {
    if (fixed !== null) return;
    const read = () => setClock(todayIn(timeZone));
    read();
    // And again now and then, so a page left open past midnight moves on to the new day.
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [fixed, timeZone]);
  const dayNow = fixed ?? clock;

  const [party, setParty] = useState(() => Math.min(Math.max(Math.round(defaultParty), 1), Math.max(maxParty, 1)));
  const [pick, setPick] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [load, setLoad] = useState<Load>({ status: slotsFor ? "loading" : "ready", slots: NO_SLOTS });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);

  // Everything that depends on the day, worked out together and only once the clock is known: the day shown is the visitor's pick (until it is behind us), else `defaultDate`, else the first open day.
  const view =
    dayNow === null
      ? null
      : {
          today: dayNow,
          day: pick !== null && pick >= dayNow ? pick : defaultDate !== undefined && isDay(defaultDate) ? defaultDate : firstOpen(dayNow, closedDays, daysAhead),
          last: addDays(dayNow, daysAhead),
        };
  const day = view?.day ?? null;

  const source = useRef(slotsFor);
  useEffect(() => {
    source.current = slotsFor;
  });
  const asked = slotsFor !== undefined;
  const closed = day !== null && isClosed(day, closedDays);

  // Ask for the times again whenever the party or the day changes. An answer that comes back after they have changed once more is dropped.
  useEffect(() => {
    if (!asked || closed || day === null) return;
    let current = true;
    setLoad((before) => ({ status: "loading", slots: before.slots }));
    Promise.resolve()
      .then(() => source.current?.(day, party))
      .then(
        (answer) => {
          if (current) setLoad({ status: "ready", slots: answer ?? NO_SLOTS });
        },
        () => {
          if (current) setLoad((before) => ({ status: "error", slots: before.slots }));
        },
      );
    return () => {
      current = false;
    };
  }, [asked, closed, day, party, attempt]);

  const shown: Load = view === null ? WAITING : closed ? { status: "ready", slots: NO_SLOTS } : asked ? load : { status: "ready", slots: slots ?? NO_SLOTS };
  const loading = shown.status === "loading";
  const open = new Set(shown.slots.filter((slot) => !slot.full).map((slot) => slot.time));
  // A time that is no longer on offer (another party, another day) is no longer chosen.
  const chosen = time !== null && shown.status === "ready" && open.has(time) ? time : null;
  useEffect(() => {
    if (time !== null && shown.status === "ready" && !open.has(time)) setTime(null);
  });
  // What the visitor has chosen, in words: a time is only ever chosen once the day is known.
  const choice = chosen !== null && day !== null ? { time: timeText(chosen, locale, hourCycle), date: dayText(day, locale) } : null;

  const when = view ? dayPhrase(view.day, view.today, locale, words.onDay) : "";
  const guests = fill(plural(words.guestCount, party, locale), { count: party });
  const empty = !loading && shown.status !== "error" && open.size === 0;
  // Nothing is said until the clock is known; the skeleton and the reason under the button cover that moment.
  const message =
    view === null
      ? ""
      : closed
        ? fill(words.closed, { day: when })
        : loading
          ? fill(words.checking, { guests, day: when })
          : shown.status === "error"
            ? words.error
            : open.size === 0
              ? fill(words.none, { guests, day: when })
              : fill(plural(words.showing, open.size, locale), { count: open.size, guests, day: when });
  const reason = loading ? words.waiting : empty || shown.status === "error" ? words.noTimes : words.chooseTime;
  const columns = COLUMNS[shown.slots.length] ?? MANY_COLUMNS;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (chosen === null || day === null || busy) return;
    const result: unknown = onReserve({ party, date: day, time: chosen });
    if (result instanceof Promise) {
      setBusy(true);
      result.then(
        () => setBusy(false),
        () => setBusy(false),
      );
    }
  }

  return (
    <section data-slot="reservation-hero" aria-labelledby={`${id}-name`} className={cn("grid grid-cols-1 items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16", className)} {...props}>
      <div data-slot="reservation-hero-photo" className="relative aspect-[5/4] w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[16/9] lg:aspect-[4/5]">
        {image.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${image.blurDataUrl}")` }} /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is any URL or data URI */}
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          srcSet={image.srcSet}
          sizes={image.sizes ?? "(min-width: 1024px) 34rem, 100vw"}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <Title id={`${id}-name`} className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">
          {name}
        </Title>
        {description ? <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}

        <form aria-label={words.form} noValidate onSubmit={submit} className="mt-8 flex flex-col gap-6 sm:mt-10">
          {/* Side by side from about 22rem; on the narrowest phones one under the other, so the day is never wrapped onto two lines. */}
          <div className="grid grid-cols-1 gap-4 min-[22rem]:grid-cols-2 min-[22rem]:gap-3 sm:gap-4">
            <div className="min-w-0">
              <Label htmlFor={`${id}-guests`}>{words.guests}</Label>
              <NumberInput id={`${id}-guests`} min={1} max={Math.max(maxParty, 1)} value={party} onValueChange={setParty} className="mt-2.5 h-11 w-full text-base" />
            </div>
            {/* A group, not a <label for>: a label would become the whole name of the button and hide the chosen day from a screen reader. */}
            <div role="group" aria-labelledby={`${id}-date-label`} className="min-w-0">
              <p id={`${id}-date-label`} className="text-sm leading-none font-medium">
                {words.date}
              </p>
              <DatePicker
                id={`${id}-date`}
                value={view ? dateOfDay(view.day) : null}
                onValueChange={(next) => setPick(dayOfDate(next))}
                disabled={view === null}
                min={view ? dateOfDay(view.today) : undefined}
                max={view ? dateOfDay(view.last) : undefined}
                isDisabled={(date) => isClosed(dayOfDate(date), closedDays)}
                weekStartsOn={weekStartsOn}
                locale={locale}
                placeholder={words.datePlaceholder}
                format={{ weekday: "short", day: "numeric", month: "short" }}
                className="mt-2.5 h-11 min-w-0 text-base"
              />
            </div>
          </div>

          <div>
            <p id={`${id}-times`} className="min-h-5 text-sm font-medium">
              {view ? fill(words.timesFor, { day: dayName(view.day, view.today, locale).name }) : <span aria-hidden="true" className="mt-0.5 block h-4 w-32 rounded bg-muted motion-safe:animate-pulse" />}
            </p>

            {shown.slots.length ? (
              <ToggleGroup
                type="single"
                variant="outline"
                aria-labelledby={`${id}-times`}
                aria-busy={loading || undefined}
                disabled={loading}
                value={chosen ?? ""}
                onValueChange={(next) => {
                  // A pressed chip cannot be pressed off: choosing a time is not a switch.
                  if (next) setTime(next);
                }}
                className={cn("mt-2.5 grid w-full gap-2 data-[variant=outline]:shadow-none", columns)}
              >
                {shown.slots.map((slot) => (
                  // A taken time is dimmed by its colour, not by the chip's opacity: the tag that says "Full" is the one cue besides tone, so it stays at full strength and readable. While the times are asked for again the whole row is disabled and dims as one.
                  <ToggleGroupItem
                    key={slot.time}
                    value={slot.time}
                    disabled={slot.full}
                    className={cn("h-12 flex-col gap-0.5 rounded-lg border-l px-2 first:rounded-lg last:rounded-lg", slot.full && !loading && "disabled:opacity-100")}
                  >
                    <span className={cn("text-[0.9375rem] leading-none tabular-nums", slot.full && "text-muted-foreground/60")}>{timeText(slot.time, locale, hourCycle)}</span>
                    {slot.full ? <span className="text-xs leading-none font-normal text-muted-foreground">{words.full}</span> : null}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : loading ? (
              <div aria-hidden="true" className={cn("mt-2.5 grid w-full gap-2", COLUMNS[6])}>
                {Array.from({ length: 6 }, (_, index) => (
                  <span key={index} className="h-12 rounded-lg bg-muted motion-safe:animate-pulse" />
                ))}
              </div>
            ) : null}

            <div
              aria-live="polite"
              aria-busy={loading || undefined}
              className={cn(
                "text-sm",
                shown.slots.length || loading ? "mt-3 text-muted-foreground" : "mt-2.5 rounded-lg border border-dashed border-border px-4 py-5 text-center text-muted-foreground",
                shown.status === "error" && "border-destructive/40 text-destructive",
              )}
            >
              {shown.status === "error" ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <IconAlertCircle className="size-4 shrink-0" />
                    {message}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttempt((count) => count + 1)}
                    className="rounded-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    {words.retry}
                  </button>
                </p>
              ) : (
                <p className="min-h-5">{message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <Button type="submit" size="lg" loading={busy} disabled={choice === null} aria-describedby={`${id}-reason`} className="h-12 w-full text-base">
              {choice === null ? words.reserve : fill(words.reserveAt, { guests: party, time: choice.time })}
            </Button>
            <p id={`${id}-reason`} className="flex items-start gap-2 text-sm">
              {choice === null ? (
                <>
                  <IconInfo className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{reason}</span>
                </>
              ) : (
                <>
                  <IconCheck className="mt-0.5 size-4 shrink-0" />
                  <span className="font-medium">{fill(words.chosen, { guests, date: choice.date, time: choice.time })}</span>
                </>
              )}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
