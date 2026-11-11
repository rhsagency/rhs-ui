"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconChevronDown, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

import { clockString, fill, minutesIn, timeParts, tripStates, type DateInput, type TripState } from "./times";

export type { DateInput } from "./times";

export interface TimetableStop {
  /** Stable and unique: the key that `TimetableTrip.times` and `highlightStop` go by. */
  id: string;
  /** The stop's name, the heading of its row: "Harbour Gate". */
  name: string;
  /** A second, quieter line: a platform, a pier, a landmark. */
  note?: string;
}

export interface TimetableTrip {
  /** Stable and unique. */
  id: string;
  /** The heading of the trip's column: "Kestrel 41", "08:00 sailing", "Tour A". Keep it short. */
  label: string;
  /** A line under the label for what is different about this trip: "Fridays only", "Express". */
  note?: string;
  /** The time of day at each stop it serves, on the 24-hour clock, by stop id: `{ harbour: "08:00", marina: "08:12" }`. A stop that is left out, or null, is one the trip does not stop at. */
  times: Readonly<Record<string, string | null | undefined>>;
}

/** The words the timetable says on its own, for another language or your own wording. `{stop}`, `{name}`, `{time}`, `{count}`, `{hours}` and `{minutes}` are filled in. */
export interface RouteTimetableLabels {
  /** The heading of the column of stops. Default "Stop". */
  stop: string;
  /** The label of the stop picker. Default "Your stop". */
  yourStop: string;
  /** The name of the timetable when there is no `caption`. Default "Timetable". */
  table: string;
  /** The name of the table's scrolling box, which a keyboard can scroll. Default "{name}, scrolls sideways". */
  scrollable: string;
  /** The word on the next trip at your stop. Default "Next". */
  next: string;
  /** Introduces the next departure in the line above the timetable. Default "Next departure". */
  nextDeparture: string;
  /** Said when every trip at your stop has gone. Default "No more departures today". */
  noMore: string;
  /** Said in place of the timetable when there are no stops or no trips to show. Default "No timetable to show." */
  empty: string;
  /** Said of a trip that has gone from your stop, for a screen reader, and in the list on a phone. Default "Departed". */
  departed: string;
  /** Said where a trip does not stop. Default "Does not stop". */
  doesNotStop: string;
  /** The key under the grid for the dash. Default "A dash means the trip does not stop there." */
  dashKey: string;
  /** Said after the name of your stop, for a screen reader. Default "your stop". */
  chosen: string;
  /** How long until the next departure. Default "in {time}". */
  in: string;
  /** What the wait is called when the trip leaves this minute. Default "now". */
  now: string;
  /** A wait under an hour. Default "{count} min". */
  minutes: string;
  /** A wait of an hour or more. Default "{hours} h {minutes} min". */
  hoursMinutes: string;
  /** A wait of whole hours. Default "{hours} h". */
  hours: string;
  /** The name of the list of times on a phone. Default "Times at {stop}". */
  timesAt: string;
  /** The button on a phone that opens the trips that left long ago. Default "Show {count} earlier trips". */
  showEarlier: string;
  /** The same button once they are open. Default "Hide earlier trips". */
  hideEarlier: string;
}

export interface RouteTimetableProps extends Omit<ComponentProps<"section">, "children"> {
  /** The stops in the order the route runs, each one a row. */
  stops: readonly TimetableStop[];
  /** The trips, in the order you want them across, each one a column. */
  trips: readonly TimetableTrip[];
  /** The moment the timetable is read at: a Date, a timestamp or an ISO string. It decides which trip is next and which have gone. Leave it out to use the browser's clock, read once the page is live and then every half minute; pass it to get the same page on the server, in tests and in previews. */
  now?: DateInput;
  /** The id of your stop, when you control it: its row is set on a plate, and the next trip there is marked "Next". The phone shows this stop's times. */
  highlightStop?: string;
  /** The stop to start on, when you do not control it. Default: the first stop. */
  defaultHighlightStop?: string;
  /** Called with the id of the stop picked in the stop picker. */
  onHighlightStopChange?: (stopId: string) => void;
  /** The locale that writes the times: en-US writes "7:42 AM", en-GB and most others "07:42". Default "en-US". */
  locale?: string;
  /** The time zone the timetable's times are in, which is also the zone `now` is read in. Default "UTC", so the server and the browser agree. */
  timeZone?: string;
  /** What the timetable is, shown above the grid (above the stop picker on a phone) and read out as its name: "Harbour Line, weekdays". */
  caption?: ReactNode;
  /** A line under the timetable: where the times are from, what to do if a trip is cancelled. */
  note?: ReactNode;
  /** The words the timetable says, for translation. */
  labels?: Partial<RouteTimetableLabels>;
}

const LABELS: RouteTimetableLabels = {
  stop: "Stop",
  yourStop: "Your stop",
  table: "Timetable",
  scrollable: "{name}, scrolls sideways",
  next: "Next",
  nextDeparture: "Next departure",
  noMore: "No more departures today",
  empty: "No timetable to show.",
  departed: "Departed",
  doesNotStop: "Does not stop",
  dashKey: "A dash means the trip does not stop there.",
  chosen: "your stop",
  in: "in {time}",
  now: "now",
  minutes: "{count} min",
  hoursMinutes: "{hours} h {minutes} min",
  hours: "{hours} h",
  timesAt: "Times at {stop}",
  showEarlier: "Show {count} earlier trips",
  hideEarlier: "Hide earlier trips",
};

/** How often the clock is read when `now` is not given, so "Next" moves on as the day does. */
const TICK_MS = 30_000;

/** A trip that has gone. The muted colour is already near the text colour in the dark theme, so there it is stepped back once more (it stays above 6:1). */
const PAST = "text-muted-foreground dark:text-muted-foreground/75";

// A cell that sticks while the trips scroll under it has a solid fill, so nothing shows through it; a row on a plate fills it with the plate's colour laid over the card.
const FILL = "bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)]";
const PINNED =
  "sticky left-0 z-10 border-r border-border group-data-[scrolled]/timetable:shadow-[4px_0_6px_-4px_oklch(0_0_0/0.14)] dark:group-data-[scrolled]/timetable:shadow-[4px_0_6px_-4px_oklch(0_0_0/0.6)]";

/** A time as the locale writes it, with the period (AM, PM) set smaller beside the digits. The `time` element carries the 24-hour value. */
function Time({ minutes, locale, className }: { minutes: number; locale: string; className?: string }) {
  return (
    <time dateTime={clockString(minutes)} className={cn("whitespace-nowrap tabular-nums", className)}>
      {timeParts(minutes, locale).map((part, index) =>
        part.kind === "period" ? (
          <span key={index} className="text-[0.6875rem] font-normal tracking-wide uppercase">
            {part.value}
          </span>
        ) : (
          part.value
        ),
      )}
    </time>
  );
}

/** What a cell holds when the trip does not stop: a short drawn dash for the eye, and the words for a screen reader. */
function Dash({ children, title }: { children?: ReactNode; title?: string }) {
  return (
    <span className="text-muted-foreground">
      <span aria-hidden="true" title={title} className="inline-block h-px w-3.5 bg-muted-foreground/70 align-middle" />
      {children ? <span className="sr-only">{children}</span> : null}
    </span>
  );
}

/**
 * The timetable of a line, for buses, ferries, shuttles and tours: the stops down the side, the trips across and the time
 * of each trip at each stop in the cells, as a real table with stops as row headers and trips as column headers. Pick your
 * stop and the next trip there is marked "Next" in words, the trips that have gone are muted but stay readable, your row
 * is set on a plate, and a line above says how long to wait. A trip that skips a stop shows a dash, and says "does not
 * stop" to a screen reader. The stop column stays pinned while the trips scroll sideways, and the grid opens scrolled to
 * the next trip. In a box narrower than 36rem the grid gives way to the stop picker and that stop's list of times, with
 * the caption above the picker so the line and the day are still named. Times are written in the locale and compared in
 * the time zone you pass.
 */
export function RouteTimetable({
  stops,
  trips,
  now,
  highlightStop,
  defaultHighlightStop,
  onHighlightStopChange,
  locale = "en-US",
  timeZone = "UTC",
  caption,
  note,
  labels: custom,
  className,
  ...props
}: RouteTimetableProps) {
  const words = { ...LABELS, ...custom };
  const selectId = useId();
  const captionId = useId();
  const phoneCaptionId = useId();
  const phoneStopId = useId();
  const [ownStop, setOwnStop] = useState(defaultHighlightStop ?? stops[0]?.id ?? "");
  const stop = stops.find((entry) => entry.id === (highlightStop ?? ownStop)) ?? stops[0];

  // Without a `now` the clock is read in the browser: the server and the first paint say nothing about the time.
  const [clock, setClock] = useState<number | null>(null);
  const ticking = now === undefined;
  useEffect(() => {
    if (!ticking) return;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [ticking]);
  const current = minutesIn(ticking ? (clock ?? Number.NaN) : now, timeZone);

  const { states, minutes, next } = tripStates(trips, stop?.id ?? "", current);
  const nextTrip = next >= 0 ? trips[next] : undefined;
  const nextMinutes = next >= 0 ? (minutes[next] ?? null) : null;

  const wait = nextMinutes !== null && current !== null ? nextMinutes - current : null;
  const waitText =
    wait === null
      ? ""
      : wait <= 0
        ? words.now
        : fill(words.in, {
            time:
              wait < 60
                ? fill(words.minutes, { count: wait })
                : wait % 60 === 0
                  ? fill(words.hours, { hours: Math.floor(wait / 60) })
                  : fill(words.hoursMinutes, { hours: Math.floor(wait / 60), minutes: wait % 60 }),
          });

  function choose(id: string) {
    setOwnStop(id);
    onHighlightStopChange?.(id);
  }

  // On a phone the morning is not what you came for: everything behind the last trip that has left is one line to open, and that trip stays in the list as context. That includes a run that never stops at your stop, which would otherwise float above the last departure as if it were current. A trip that has not left is never folded, whatever order the trips were given in. Two or three trips that have left are not worth a line of their own, so a short past is left alone.
  const [showEarlier, setShowEarlier] = useState(false);
  const left = states.flatMap((state, index) => (state === "past" ? [index] : []));
  const last = left.at(-1);
  const earlier =
    last !== undefined && left.length >= 4
      ? new Set(states.flatMap((state, index) => (index < last && (state === "past" || state === "none") ? [index] : [])))
      : new Set<number>();
  // The line counts the trips that left, not the runs that never stopped here: those are folded with them but were never a trip you could have taken.
  const earlierCount = left.length - 1;
  const folded = earlier.size > 0 && !showEarlier;

  // Which edges of the grid have more to scroll to, so the pinned column can lift off and the right edge can say there is more.
  const region = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = useCallback(() => {
    const element = region.current;
    if (!element) return;
    const left = element.scrollLeft > 0.5;
    const right = element.scrollLeft + element.clientWidth < element.scrollWidth - 4;
    setEdges((before) => (before.left === left && before.right === right ? before : { left, right }));
  }, []);
  useEffect(() => {
    measure();
    const element = region.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  // The grid opens at the next trip, and follows your stop when you pick another: one trip of the past stays in view, so the muted look is seen too. It does not move again as the minutes pass, so a reader who scrolled away is left there.
  const scrolledFor = useRef<string | null>(null);
  const nextId = nextTrip?.id;
  const stopId = stop?.id;
  useEffect(() => {
    const element = region.current;
    if (!element || stopId === undefined || nextId === undefined || scrolledFor.current === stopId) return;
    const first = scrolledFor.current === null;
    scrolledFor.current = stopId;
    const cell = element.querySelector<HTMLElement>("th[data-next]");
    const pinned = element.querySelector<HTMLElement>("thead th");
    if (!cell || !pinned) return;
    const x = cell.getBoundingClientRect().left - element.getBoundingClientRect().left + element.scrollLeft;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: Math.max(0, x - pinned.offsetWidth - cell.offsetWidth), behavior: first || reduced ? "auto" : "smooth" });
  }, [stopId, nextId]);

  if (!stop || trips.length === 0) {
    return (
      <section data-slot="route-timetable" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{words.empty}</p>
      </section>
    );
  }

  const tableName = caption ? undefined : words.table;
  const rowName = fill(words.timesAt, { stop: stop.name });

  return (
    <section data-slot="route-timetable" className={cn("@container w-full min-w-0", className)} {...props}>
      {/* On a phone the caption has no card to sit in, so it leads the section: the line and the day pattern are named before the stop is picked. From 36rem it moves into the card, above the grid. */}
      {caption ? (
        <p id={phoneCaptionId} className="mb-3 text-base font-medium tracking-[-0.01em] text-foreground @xl:hidden">
          {caption}
        </p>
      ) : null}
      <div className="mb-4 flex flex-col gap-3 @xl:flex-row @xl:items-end @xl:justify-between">
        <div className="grid gap-2 @xl:w-72">
          <Label htmlFor={selectId} className="text-xs text-muted-foreground">
            {words.yourStop}
          </Label>
          <Select value={stop.id} onValueChange={choose}>
            <SelectTrigger id={selectId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stops.map((entry) => (
                <SelectItem key={entry.id} value={entry.id} description={entry.note}>
                  {entry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* The line is there from the first paint and empty until the clock is known, so nothing below it jumps. */}
        <p className="flex min-h-9 items-center gap-2.5 text-sm">
          {current === null ? null : (
            <>
              <IconClock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              {nextTrip && nextMinutes !== null ? (
                <span className="min-w-0">
                  <span className="text-muted-foreground">{words.nextDeparture}</span>
                  <span className="sr-only">: </span> <Time minutes={nextMinutes} locale={locale} className="font-semibold text-foreground" />
                  <span className="text-muted-foreground">
                    <span className="sr-only">, </span> {waitText}
                    <span aria-hidden="true"> &middot; </span>
                    <span className="sr-only"> (</span>
                    {/* The label stays whole, so a line that has to break never leaves "8" of "Run 8" alone. */}
                    <span className="whitespace-nowrap">{nextTrip.label}</span>
                    <span className="sr-only">)</span>
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">{words.noMore}</span>
              )}
            </>
          )}
        </p>
      </div>

      {/* From 36rem wide: the grid. */}
      <div className="hidden @xl:block">
        {/* The focus ring of the scrolling box is drawn on the card, where nothing inside, such as the pinned column, can cover it. */}
        <div
          data-scrolled={edges.left || undefined}
          className="group/timetable relative overflow-hidden rounded-xl border border-border bg-card shadow-xs has-[[role=region]:focus-visible]:ring-[3px] has-[[role=region]:focus-visible]:ring-ring/40"
        >
          {caption ? (
            <p id={captionId} className="px-5 pt-5 pb-4 text-base font-medium tracking-[-0.01em] text-foreground">
              {caption}
            </p>
          ) : null}
          <div className="relative">
            {/* A table that scrolls sideways takes the keyboard too. The scroll padding is the width of the pinned column, so a cell the browser scrolls into view lands beside it and not beneath it. */}
            <div
              ref={region}
              role="region"
              aria-label={fill(words.scrollable, { name: typeof caption === "string" ? caption : words.table })}
              tabIndex={0}
              onScroll={measure}
              className="relative scroll-pl-[9.75rem] overflow-x-auto outline-none @2xl:scroll-pl-[12.75rem]"
            >
              <table
                data-slot="table"
                aria-labelledby={caption ? captionId : undefined}
                aria-label={tableName}
                className="w-full min-w-max border-separate border-spacing-0 text-sm [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:last-child_th]:border-b-0"
              >
                <TableHeader className="[&_tr]:border-b-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className={cn(PINNED, "z-20 h-auto w-37 min-w-37 max-w-37 border-y bg-card py-3 pr-4 pl-5 align-top @2xl:w-49 @2xl:min-w-49 @2xl:max-w-49")}>
                      {/* The same slot as the word over a trip, so "Stop" and the labels of the trips share a baseline. */}
                      <span className="flex flex-col gap-1">
                        <span aria-hidden="true" className="h-5" />
                        <span className="text-sm leading-tight">{words.stop}</span>
                      </span>
                    </TableHead>
                    {trips.map((trip, index) => {
                      const state = states[index];
                      return (
                        <TableHead
                          key={trip.id}
                          scope="col"
                          data-next={state === "next" || undefined}
                          className={cn(
                            "h-auto min-w-28 border-y border-border px-3 py-3 text-right align-top font-normal whitespace-normal",
                            state === "next" && "bg-muted/50",
                          )}
                        >
                          <span className="flex flex-col items-end gap-1">
                            {/* The slot for the word is the same height on every trip, so the labels share a baseline. */}
                            <span className="flex h-5 items-center">{state === "next" ? <Badge>{words.next}</Badge> : null}</span>
                            <span className={cn("text-sm leading-tight font-medium", state === "past" ? PAST : "text-foreground")}>
                              {trip.label}
                              {state === "past" ? <span className="sr-only">, {words.departed}</span> : null}
                            </span>
                            {trip.note ? <span className="text-xs leading-tight text-muted-foreground">{trip.note}</span> : null}
                          </span>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stops.map((entry) => {
                    const chosen = entry.id === stop.id;
                    const row = tripStates(trips, entry.id, current);
                    return (
                      <TableRow key={entry.id} data-chosen={chosen || undefined} className="group/row hover:bg-transparent">
                        <TableHead
                          scope="row"
                          className={cn(
                            PINNED,
                            "h-auto w-37 min-w-37 max-w-37 border-b bg-card py-3 pr-4 pl-5 text-left font-normal whitespace-normal text-foreground @2xl:w-49 @2xl:min-w-49 @2xl:max-w-49",
                            chosen ? FILL : "group-hover/row:bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)]",
                            chosen && "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-foreground",
                          )}
                        >
                          <span className={cn("block text-sm leading-snug", chosen ? "font-semibold" : "font-medium")}>
                            {entry.name}
                            {chosen ? <span className="sr-only">, {words.chosen}</span> : null}
                          </span>
                          {entry.note ? <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{entry.note}</span> : null}
                        </TableHead>
                        {trips.map((trip, index) => {
                          const at = row.minutes[index] ?? null;
                          // Whether a trip has gone is read at the stop of the row, so a trip can be past at one stop and still ahead at the next.
                          const state: TripState = row.states[index] ?? "none";
                          const isNextColumn = states[index] === "next";
                          const isNextHere = chosen && state === "next";
                          return (
                            <TableCell
                              key={trip.id}
                              className={cn(
                                "border-b border-border px-3 py-3 text-right align-middle whitespace-nowrap tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                                chosen ? "bg-muted/55" : isNextColumn ? "bg-muted/50" : "group-hover/row:bg-muted/45",
                                state === "past" && PAST,
                                isNextColumn && !isNextHere && "font-medium",
                              )}
                            >
                              {at === null ? (
                                <Dash title={words.doesNotStop}>{words.doesNotStop}</Dash>
                              ) : isNextHere ? (
                                <span className="-mx-2 -my-1 inline-block rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground">
                                  <Time minutes={at} locale={locale} />
                                </span>
                              ) : (
                                <Time minutes={at} locale={locale} />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </table>
            </div>
            <span
              aria-hidden="true"
              data-on={edges.right || undefined}
              className="pointer-events-none absolute inset-y-0 right-0 w-3 opacity-0 shadow-[inset_-8px_0_8px_-8px_rgb(0_0_0/0.16)] transition-opacity duration-150 data-[on]:opacity-100 motion-reduce:transition-none dark:shadow-[inset_-8px_0_8px_-8px_rgb(0_0_0/0.6)]"
            />
          </div>
        </div>
      </div>

      {/* Narrower: the stop picked above, and every time at it, in a list. */}
      <div className="@xl:hidden">
        {/* The list is named by the caption and by the stop, so a reader who jumps to the list still hears both. The stop's line is hidden so it is not read twice. */}
        {caption ? (
          <span id={phoneStopId} hidden>
            {rowName}
          </span>
        ) : null}
        <ol
          aria-labelledby={caption ? `${phoneCaptionId} ${phoneStopId}` : undefined}
          aria-label={caption ? undefined : rowName}
          className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        >
          {earlier.size > 0 ? (
            <li className="border-b border-border">
              <button
                type="button"
                aria-expanded={showEarlier}
                onClick={() => setShowEarlier((value) => !value)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-safe:transition-colors motion-safe:duration-150"
              >
                {showEarlier ? words.hideEarlier : fill(words.showEarlier, { count: earlierCount })}
                <IconChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-150", showEarlier && "rotate-180")} />
              </button>
            </li>
          ) : null}
          {trips.map((trip, index) => {
            if (folded && earlier.has(index)) return null;
            const state = states[index] ?? "none";
            const at = minutes[index] ?? null;
            return (
              <li
                key={trip.id}
                data-state={state}
                className={cn(
                  "relative grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-4 border-b border-border px-4 py-3.5 last:border-b-0",
                  state === "next" && "bg-muted/60 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-foreground",
                  state === "past" && PAST,
                )}
              >
                <span className={cn("text-base tabular-nums", state === "next" ? "font-semibold" : "font-medium")}>
                  {at === null ? <Dash /> : <Time minutes={at} locale={locale} />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm leading-snug font-medium", state !== "past" && "text-foreground")}>{trip.label}</span>
                  {trip.note ? <span className="block text-xs leading-snug text-muted-foreground">{trip.note}</span> : null}
                </span>
                <span className="text-right text-xs">
                  {state === "next" ? <Badge>{words.next}</Badge> : state === "past" ? words.departed : at === null ? words.doesNotStop : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
        <p className="hidden items-center gap-2 @xl:flex">
          <span aria-hidden="true" className="inline-block h-px w-3.5 bg-muted-foreground/70" />
          {words.dashKey}
        </p>
        {note ? <p className="max-w-2xl leading-relaxed">{note}</p> : null}
      </div>
    </section>
  );
}
