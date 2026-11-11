"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconCheck, IconClock, IconClose, IconLogIn } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

import { changesBetween, fill, plainTime, resolveDeparture, snapshotOf, sortResolved, timeParts, toMs, type Change, type DateInput, type DepartureStatus, type Resolved, type Snapshot } from "./board";

export type { DateInput, DepartureStatus } from "./board";

export interface Departure {
  /** Stable and unique. Rows are kept and compared by it, so the board can tell which row changed between two updates. */
  id: string;
  /** The planned departure: an ISO string with its offset (or Z), a timestamp or a Date. A time of day alone is not enough, because the board must know the day to know what has left. */
  scheduled: DateInput;
  /** When it is now expected to leave, if that is not the plan. When it is later than the plan the board shows both and counts the minutes. Default: as planned. */
  expected?: DateInput;
  /** Where it goes: "Rotterdam Centraal". It is the row's heading. */
  destination: string;
  /** What it calls at on the way: "Utrecht Centraal, Gouda". */
  via?: string;
  /** The platform, gate, pier or stand: "4b", "G12". Left out until it is known. */
  platform?: string;
  /** What it is doing. Leave it out and the board says "On time" or "Delayed" from the two times; give `cancelled` or `boarding` to say those. */
  status?: DepartureStatus;
  /** Who runs it: "Kestrel Rail". */
  operator?: string;
}

/** The words the board says on its own, for another language or your own wording. `{time}`, `{minutes}`, `{destination}`, `{change}`, `{platform}` and `{count}` are filled in. */
export interface DeparturesBoardLabels {
  /** Column heading. Default "Time". */
  time: string;
  /** Column heading. Default "Destination". */
  destination: string;
  /** Column heading. Default "Operator". */
  operator: string;
  /** Column heading, and the small word over the platform on a phone. Change it to "Gate", "Pier" or "Stand". Default "Platform". */
  platform: string;
  /** Column heading. Default "Status". */
  status: string;
  /** The name of the board when there is no `caption`. Default "Departures". */
  board: string;
  /** The stamp: when the data is from. Default "Updated {time}". */
  updated: string;
  /** Default "On time". */
  onTime: string;
  /** A delay in minutes. Default "Delayed {minutes} min". */
  delayed: string;
  /** A delay of unknown length. Default "Delayed". */
  delayedUnknown: string;
  /** Default "Cancelled". */
  cancelled: string;
  /** Default "Boarding". */
  boarding: string;
  /** What a row that has left says. Default "Departed". */
  departed: string;
  /** Said by a screen reader after an expected time, for the plan. Default "scheduled {time}". */
  scheduledAt: string;
  /** Written before a stop the departure calls at. Default "via {via}". */
  via: string;
  /** Said for a departure whose platform is not known yet. Default "Platform not announced". */
  noPlatform: string;
  /** Said for a departure whose time is not a time. Default "Time not known". */
  noTime: string;
  /** What a screen reader hears for a button that opens a row. Default "{time} to {destination}". */
  open: string;
  /** What is said when rows change: one sentence for each of the first three. Default "{time} to {destination}: {change}." */
  changed: string;
  /** Said when more than three rows changed. Default "And {count} more." */
  changedMore: string;
  /** A change: a new delay. Default "delayed {minutes} min". */
  changeDelayed: string;
  /** A change: it is delayed, by how much is not known. Default "delayed". */
  changeDelayedUnknown: string;
  /** A change: back on the plan. Default "back on time". */
  changeOnTime: string;
  /** A change. Default "cancelled". */
  changeCancelled: string;
  /** A change. Default "boarding now". */
  changeBoarding: string;
  /** A change: the platform was given or moved. Default "now on platform {platform}". */
  changePlatform: string;
  /** What shows when there is nothing to list. Default "No departures to show." */
  empty: string;
}

export interface DeparturesBoardProps extends Omit<ComponentProps<"section">, "children" | "onSelect"> {
  /** The departures, in any order. The board orders them by the time they leave. */
  departures: readonly Departure[];
  /** The moment the board is read at: a Date, a timestamp or an ISO string. It decides which departures have left. Leave it out to use the browser's clock, read once the page is live and then every half minute; pass it to get the same page on the server, in tests and in previews. */
  now?: DateInput;
  /** When the data was last refreshed, for the stamp. Default: `now`, or the moment the board went live. */
  updated?: DateInput;
  /** The locale that writes the times: en-US writes "2:10 PM", en-GB and most others "14:10". Default "en-US". */
  locale?: string;
  /** The time zone of the station, which times are written in. A zone that is not known falls back to UTC. Default "UTC", so the server and the browser agree. */
  timeZone?: string;
  /** What the board is, shown above it and read out as its name: "Departures from Utrecht Centraal". */
  caption?: ReactNode;
  /** Makes the destination of each row a button and calls this with the departure when it is pressed: to open the stops, the platform map or a ticket. */
  onSelect?: (departure: Departure) => void;
  /** The words the board says, for translation. */
  labels?: Partial<DeparturesBoardLabels>;
}

const LABELS: DeparturesBoardLabels = {
  time: "Time",
  destination: "Destination",
  operator: "Operator",
  platform: "Platform",
  status: "Status",
  board: "Departures",
  updated: "Updated {time}",
  onTime: "On time",
  delayed: "Delayed {minutes} min",
  delayedUnknown: "Delayed",
  cancelled: "Cancelled",
  boarding: "Boarding",
  departed: "Departed",
  scheduledAt: "scheduled {time}",
  via: "via {via}",
  noPlatform: "Platform not announced",
  noTime: "Time not known",
  open: "{time} to {destination}",
  changed: "{time} to {destination}: {change}.",
  changedMore: "And {count} more.",
  changeDelayed: "delayed {minutes} min",
  changeDelayedUnknown: "delayed",
  changeOnTime: "back on time",
  changeCancelled: "cancelled",
  changeBoarding: "boarding now",
  changePlatform: "now on platform {platform}",
  empty: "No departures to show.",
};

/** How often the clock is read when `now` is not given, so rows fade as they leave. */
const TICK_MS = 30_000;
/** How long a row that changed stays on its plate. */
const FLASH_MS = 2600;
/** How long updates are gathered before they are said, so a burst of them is one sentence and not a flood. */
const GATHER_MS = 900;
/** How long a sentence stays in the live region: long enough to be read, short enough that the same sentence can be said again later. */
const SAID_MS = 12_000;
/** How many changed rows are named in a sentence. */
const NAMED = 3;

/** The destructive tone darkened toward the foreground, so the small red word reaches 4.5:1 on its pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** What each status looks like: a glyph and a weight, never colour alone. Only a cancellation uses the destructive tone. */
const LOOK: Record<DepartureStatus | "departed", { icon: typeof IconCheck; variant: NonNullable<BadgeProps["variant"]>; className?: string }> = {
  "on-time": { icon: IconCheck, variant: "outline" },
  delayed: { icon: IconClock, variant: "secondary", className: "font-semibold" },
  cancelled: { icon: IconClose, variant: "destructive", className: cn("font-semibold", DANGER_TEXT) },
  boarding: { icon: IconLogIn, variant: "default", className: "font-semibold" },
  departed: { icon: IconArrowRight, variant: "muted" },
};

const BADGE = "h-6 gap-1.5 px-2.5 text-[0.8125rem] [&>svg]:size-3.5";

/** A time as the locale writes it, with the period (AM, PM) set smaller beside the digits. The `time` element carries the full moment. */
function Clock({ ms, locale, timeZone, className }: { ms: number; locale: string; timeZone: string; className?: string }) {
  return (
    <time dateTime={new Date(ms).toISOString()} className={cn("whitespace-nowrap tabular-nums", className)}>
      {timeParts(ms, locale, timeZone).map((part, index) =>
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

/** What a cell holds when there is nothing to say: a short drawn dash for the eye, and the words for a screen reader. */
function Dash({ children }: { children?: ReactNode }) {
  return (
    <span className="text-muted-foreground">
      <span aria-hidden="true" className="inline-block h-px w-3.5 bg-muted-foreground/70 align-middle" />
      {children ? <span className="sr-only">{children}</span> : null}
    </span>
  );
}

/**
 * A departures board for a station, a ferry terminal or an airport: when it leaves, where it goes, from which platform,
 * and what it is doing, in words with a glyph (On time, Delayed 5 min, Cancelled, Boarding) and never in colour alone.
 * A delayed departure shows the planned time struck through beside the time it now leaves, so the delay is seen
 * against the plan. Rows are ordered by the time they leave, and one that has left fades back to a quiet colour and
 * says "Departed". It is a real table, with the destination as each row's heading, and a visible "Updated 14:32" says how
 * old the data is. When new data arrives the rows that changed rest on a plate for a moment, and a polite live region
 * says what changed (a delay, a cancellation, a platform) in one sentence for the first three rows, gathered so a burst of
 * updates is never a flood. Narrower than 42rem every row is a card: two lines, or three when the stops and the operator
 * do not fit beside the status.
 */
export function DeparturesBoard({ departures, now, updated, locale = "en-US", timeZone = "UTC", caption, onSelect, labels: custom, className, ...props }: DeparturesBoardProps) {
  const words = { ...LABELS, ...custom };
  const captionId = useId();

  // Without a `now` the clock is read in the browser: the server and the first paint say nothing about the time.
  const [clock, setClock] = useState<number | null>(null);
  const [mountedAt, setMountedAt] = useState<number | null>(null);
  const ticking = now === undefined;
  useEffect(() => {
    if (!ticking) return;
    const first = Date.now();
    setClock(first);
    setMountedAt(first);
    const timer = window.setInterval(() => setClock(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [ticking]);
  const current = ticking ? clock : toMs(now);
  const stamp = toMs(updated) ?? (ticking ? mountedAt : current);

  const rows = sortResolved(departures.map((departure) => resolveDeparture(departure, current)));

  // What changed between two updates: the rows rest on a plate for a moment, and one sentence says what happened.
  const [flash, setFlash] = useState<ReadonlySet<string>>(new Set());
  const [said, setSaid] = useState("");
  const before = useRef<ReadonlyMap<string, Snapshot> | null>(null);
  const gathered = useRef(new Map<string, Change<Departure>>());
  const gatherTimer = useRef<number | undefined>(undefined);
  const flashTimer = useRef<number | undefined>(undefined);
  const saidTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(gatherTimer.current);
      window.clearTimeout(flashTimer.current);
      window.clearTimeout(saidTimer.current);
    },
    [],
  );
  useEffect(() => {
    const previous = before.current;
    before.current = new Map(rows.map((row) => [row.departure.id, snapshotOf(row)]));
    // The first paint is not news.
    if (!previous) return;
    const changes = changesBetween(previous, rows);
    if (changes.length === 0) return;

    setFlash(new Set(changes.map((change) => change.row.departure.id)));
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(new Set()), FLASH_MS);

    for (const change of changes) gathered.current.set(change.row.departure.id, change);
    window.clearTimeout(gatherTimer.current);
    gatherTimer.current = window.setTimeout(() => {
      // The first three are named, so the ones that matter most come first: a cancellation, then a delay, then a train that is boarding, then the rest, each group in the order the trains leave.
      const weight = (change: Change<Departure>) => (change.kinds.includes("cancelled") ? 0 : change.kinds.includes("delayed") ? 1 : change.kinds.includes("boarding") ? 2 : 3);
      const list = [...gathered.current.values()].sort((a, b) => weight(a) - weight(b) || a.row.sortAt - b.row.sortAt);
      gathered.current.clear();
      const say = (change: Change<Departure>) =>
        fill(words.changed, {
          time: change.row.scheduled === null ? "" : plainTime(change.row.scheduled, locale, timeZone),
          destination: change.row.departure.destination,
          change: change.kinds
            .map((kind) =>
              kind === "delayed"
                ? change.row.delay > 0
                  ? fill(words.changeDelayed, { minutes: change.row.delay })
                  : words.changeDelayedUnknown
                : kind === "on-time"
                  ? words.changeOnTime
                  : kind === "cancelled"
                    ? words.changeCancelled
                    : kind === "boarding"
                      ? words.changeBoarding
                      : fill(words.changePlatform, { platform: change.row.departure.platform ?? "" }),
            )
            .join(", "),
        });
      const sentences = list.slice(0, NAMED).map(say);
      if (list.length > NAMED) sentences.push(fill(words.changedMore, { count: list.length - NAMED }));
      setSaid(sentences.join(" "));
      window.clearTimeout(saidTimer.current);
      saidTimer.current = window.setTimeout(() => setSaid(""), SAID_MS);
    }, GATHER_MS);
    // Only new data counts as an update: the minutes passing change which rows have left, and that is not a change to say.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departures]);

  const statusOf = (row: Resolved<Departure>): DepartureStatus | "departed" => (row.departed ? "departed" : row.status);
  const statusText = (row: Resolved<Departure>): string => {
    const status = statusOf(row);
    if (status === "departed") return words.departed;
    if (status === "delayed") return row.delay > 0 ? fill(words.delayed, { minutes: row.delay }) : words.delayedUnknown;
    return status === "on-time" ? words.onTime : status === "cancelled" ? words.cancelled : words.boarding;
  };
  const status = (row: Resolved<Departure>) => {
    const look = LOOK[statusOf(row)];
    return (
      <Badge variant={look.variant} className={cn(BADGE, look.className)}>
        <look.icon aria-hidden="true" />
        {statusText(row)}
      </Badge>
    );
  };

  /** The time of a row: when it leaves, with the plan struck through beside it when that is not the same. Said in full to a screen reader. */
  const when = (row: Resolved<Departure>) => {
    if (row.expected === null || row.scheduled === null) return <Dash>{words.noTime}</Dash>;
    const late = row.status !== "cancelled" && row.delay > 0;
    if (row.status === "cancelled") {
      return (
        <Clock ms={row.scheduled} locale={locale} timeZone={timeZone} className="text-base font-semibold text-muted-foreground line-through decoration-muted-foreground/70" />
      );
    }
    return (
      <span className="inline-flex items-baseline gap-2">
        <Clock ms={row.expected} locale={locale} timeZone={timeZone} className="text-base font-semibold" />
        {late ? (
          <>
            <s aria-hidden="true" className="text-xs whitespace-nowrap text-muted-foreground tabular-nums decoration-muted-foreground/70">
              {plainTime(row.scheduled, locale, timeZone)}
            </s>
            <span className="sr-only">, {fill(words.scheduledAt, { time: plainTime(row.scheduled, locale, timeZone) })}</span>
          </>
        ) : null}
      </span>
    );
  };

  /** The time of a two-line card in two pieces, so the plan sits on the second line under the new time. */
  const whenCard = (row: Resolved<Departure>) => {
    if (row.expected === null || row.scheduled === null) return { main: <Dash>{words.noTime}</Dash>, planned: null };
    if (row.status === "cancelled") {
      return {
        main: <Clock ms={row.scheduled} locale={locale} timeZone={timeZone} className="text-lg leading-tight font-semibold text-muted-foreground line-through decoration-muted-foreground/70" />,
        planned: null,
      };
    }
    const late = row.delay > 0;
    return {
      main: (
        <>
          <Clock ms={row.expected} locale={locale} timeZone={timeZone} className="text-lg leading-tight font-semibold" />
          {late ? <span className="sr-only">, {fill(words.scheduledAt, { time: plainTime(row.scheduled, locale, timeZone) })}</span> : null}
        </>
      ),
      planned: late ? (
        <s aria-hidden="true" className="text-xs whitespace-nowrap text-muted-foreground tabular-nums decoration-muted-foreground/70">
          {plainTime(row.scheduled, locale, timeZone)}
        </s>
      ) : null,
    };
  };

  const via = (row: Resolved<Departure>) => (row.departure.via ? fill(words.via, { via: row.departure.via }) : null);
  const openLabel = (row: Resolved<Departure>) => fill(words.open, { time: row.scheduled === null ? "" : plainTime(row.scheduled, locale, timeZone), destination: row.departure.destination });

  if (rows.length === 0) {
    return (
      <section data-slot="departures-board" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{words.empty}</p>
      </section>
    );
  }

  const [stampBefore = "", stampAfter = ""] = words.updated.split("{time}");

  return (
    <section data-slot="departures-board" className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-5 pt-5 pb-4">
          {caption ? (
            <p id={captionId} className="text-base font-medium tracking-[-0.01em] text-foreground">
              {caption}
            </p>
          ) : null}
          {/* The stamp is there from the first paint and empty until the time is known, so nothing below it jumps. */}
          <p className="ml-auto flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
            {stamp === null ? null : (
              <>
                <IconClock aria-hidden="true" className="size-3.5" />
                <span>
                  {stampBefore}
                  <time dateTime={new Date(stamp).toISOString()} className="font-medium text-foreground">
                    {plainTime(stamp, locale, timeZone)}
                  </time>
                  {stampAfter}
                </span>
              </>
            )}
          </p>
        </div>

        {/* From 42rem wide: a table. */}
        <div className="hidden @2xl:block">
          <Table aria-labelledby={caption ? captionId : undefined} aria-label={caption ? undefined : words.board} className="border-t border-border">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead scope="col" className="w-44 pl-5">
                  {words.time}
                </TableHead>
                <TableHead scope="col" className="w-full">
                  {words.destination}
                </TableHead>
                <TableHead scope="col" className="hidden @4xl:table-cell">
                  {words.operator}
                </TableHead>
                <TableHead scope="col" className="w-28">
                  {words.platform}
                </TableHead>
                <TableHead scope="col" className="w-52 pr-5">
                  {words.status}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const id = row.departure.id;
                const sub = [via(row), row.departure.operator];
                return (
                  <TableRow
                    key={id}
                    data-departed={row.departed || undefined}
                    data-changed={flash.has(id) || undefined}
                    data-status={row.status}
                    className="transition-colors duration-500 hover:duration-150 data-[changed]:bg-muted data-[departed]:text-muted-foreground motion-reduce:transition-none"
                  >
                    <TableCell className="py-3.5 pl-5">{when(row)}</TableCell>
                    <th scope="row" className="px-3 py-3.5 text-left align-middle font-normal">
                      {onSelect ? (
                        <button
                          type="button"
                          aria-label={openLabel(row)}
                          onClick={() => onSelect(row.departure)}
                          className={cn(
                            "rounded-sm text-left text-base font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40",
                            !row.departed && "text-foreground",
                          )}
                        >
                          {row.departure.destination}
                        </button>
                      ) : (
                        <span className={cn("block text-base font-medium", !row.departed && "text-foreground")}>{row.departure.destination}</span>
                      )}
                      {sub.some(Boolean) ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {sub[0]}
                          {sub[0] && sub[1] ? (
                            <>
                              <span aria-hidden="true" className="@4xl:hidden">
                                {" "}
                                &middot;{" "}
                              </span>
                              <span className="sr-only @4xl:hidden">, </span>
                            </>
                          ) : null}
                          <span className="@4xl:hidden">{sub[1]}</span>
                        </span>
                      ) : null}
                    </th>
                    <TableCell className="hidden py-3.5 whitespace-nowrap text-muted-foreground @4xl:table-cell">{row.departure.operator ?? <Dash />}</TableCell>
                    <TableCell className="py-3.5">
                      {row.departure.platform ? (
                        <span className="inline-grid min-w-9 place-items-center rounded-md border border-border px-2 py-1 text-base leading-tight font-semibold tabular-nums">{row.departure.platform}</span>
                      ) : (
                        <Dash>{words.noPlatform}</Dash>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 pr-5">{status(row)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Narrower: each row is a card. The first line is the time, where it goes and the platform; the second is what it is doing, with the stops and the operator beside it. When they do not fit there they take a line of their own and wrap, never cut off: the stops are what a traveller reads the card for, and a phone has no tooltip to show the rest. */}
        <ul role="list" aria-labelledby={caption ? captionId : undefined} aria-label={caption ? undefined : words.board} className="border-t border-border @2xl:hidden">
          {rows.map((row) => {
            const id = row.departure.id;
            const card = whenCard(row);
            const stops = via(row);
            return (
              <li
                key={id}
                data-departed={row.departed || undefined}
                data-changed={flash.has(id) || undefined}
                data-status={row.status}
                className="relative grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-b border-border px-4 py-3.5 transition-colors duration-500 last:border-b-0 data-[changed]:bg-muted data-[departed]:text-muted-foreground motion-reduce:transition-none"
              >
                <span className="col-start-1 row-start-1">{card.main}</span>
                {onSelect ? (
                  <button
                    type="button"
                    aria-label={openLabel(row)}
                    onClick={() => onSelect(row.departure)}
                    className={cn(
                      "col-start-2 row-start-1 min-w-0 rounded-sm text-left text-base font-medium text-pretty outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 focus-visible:after:ring-inset",
                      !row.departed && "text-foreground",
                    )}
                  >
                    {row.departure.destination}
                  </button>
                ) : (
                  <p className={cn("col-start-2 row-start-1 min-w-0 text-base font-medium text-pretty", !row.departed && "text-foreground")}>{row.departure.destination}</p>
                )}
                <div className="col-span-2 col-start-2 row-start-2 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                  {status(row)}
                  {stops || row.departure.operator ? (
                    <span className="min-w-0 text-xs text-pretty text-muted-foreground">
                      {stops}
                      {stops && row.departure.operator ? (
                        <>
                          <span aria-hidden="true"> &middot; </span>
                          <span className="sr-only">, </span>
                        </>
                      ) : null}
                      {row.departure.operator}
                    </span>
                  ) : null}
                </div>
                <div className="col-start-3 row-start-1 grid min-w-10 content-center justify-items-end gap-1 text-right">
                  <span className="text-[0.6875rem] leading-none text-muted-foreground">{words.platform}</span>
                  <span className="text-xl leading-none font-semibold tabular-nums">{row.departure.platform ?? <Dash>{words.noPlatform}</Dash>}</span>
                </div>
                {/* Level with the status chip (24px tall) even when the stops wrap onto a line below it. */}
                {card.planned ? <span className="col-start-1 row-start-2 self-start pt-1">{card.planned}</span> : null}
              </li>
            );
          })}
        </ul>
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </p>
    </section>
  );
}
