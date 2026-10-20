"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactElement, type ReactNode } from "react";

import { IconAlarm, IconAlertCircle, IconCalendar, IconCheckCircle, IconClock } from "@rhs-ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

export type DueState = "upcoming" | "soon" | "today" | "overdue" | "done" | "none";

export interface DueDateLabelProps extends Omit<ComponentProps<"span">, "children"> {
  /** When it is due: a Date, a timestamp or an ISO string. A date-only string such as "2026-10-24" is a calendar date and never shifts with the time zone. `null` reads "No due date". */
  date: DateInput | null | undefined;
  /** When it was finished. Any value turns the label into "Done on 12 Oct". */
  doneAt?: DateInput | null;
  /** The moment to compare with. Leave it out to use the browser's clock, read once the page has hydrated (and again when the tab comes back). Pass it in tests and previews. */
  now?: DateInput;
  /** A due date this many days away or fewer is "soon" and gets more weight. Default 2. */
  soonDays?: number;
  /** Defaults to "en-US". Used for the dates the label writes out. */
  locale?: string;
  /** The time zone whose calendar days are compared. Defaults to "UTC". */
  timeZone?: string;
  /** "3d", "Today" or "−2d" instead of the sentence; the sentence stays as its accessible name. */
  compact?: boolean;
  /** Show the full date in a tooltip. On by default. It opens on hover and, with `focusable`, on keyboard focus; a tap or a click on the label toggles it, so it also works on a touch screen. */
  tooltip?: boolean;
  /** Write the date after the words, as in "Due in 3 days · Fri 23 Oct", so it is on the page without hovering: on a phone, on paper, for everyone. Left out when the words already say it ("Done on 12 Oct"). */
  showDate?: boolean;
  /** Make the label a tab stop, so the tooltip opens on keyboard focus too. Off by default: a list of dates would otherwise add one tab stop to every row. Needs the tooltip. */
  focusable?: boolean;
}

interface Description {
  state: DueState;
  /** The sentence: "Due in 3 days". */
  words: string;
  /** The compact form: "3d". */
  brief: string;
  /** The tooltip: "Due Friday, 23 October 2026". */
  said: string;
  /** The date alone, for screen readers. */
  date: string;
  /** The date with its weekday, "Fri 23 Oct", for `showDate`. Empty when the text on show already carries the date. */
  more: string;
  /** What the time element holds. */
  stamp?: DateInput;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY = 86_400_000;
const MINUS = "−";

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

/** The moment to format and the zone to format it in. A date-only string is its own calendar day, so it is read in UTC and never shifts. */
function resolve(input: DateInput, timeZone: string): { instant: Date; zone: string } {
  const calendar = typeof input === "string" && DATE_ONLY.test(input);
  return { instant: new Date(calendar ? `${input}T00:00:00Z` : input), zone: calendar ? "UTC" : timeZone };
}

/** Days since 1970-01-01 of the calendar day the moment falls on in the zone. NaN for an invalid date. */
function dayOf(input: DateInput, timeZone: string): number {
  const { instant, zone } = resolve(input, timeZone);
  if (Number.isNaN(instant.getTime())) return Number.NaN;
  const parts = dateFormat("en-US", { timeZone: zone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(instant);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / DAY;
}

const isoOf = (input: DateInput) => (typeof input === "string" && DATE_ONLY.test(input) ? input : new Date(input).toISOString());
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const yearOf = (day: number) => new Date(day * DAY).getUTCFullYear();

function describe({ date, doneAt, reference, soonDays, locale, timeZone, compact }: { date: DateInput | null | undefined; doneAt: DateInput | null | undefined; reference: DateInput | undefined; soonDays: number; locale: string; timeZone: string; compact: boolean }): Description {
  const today = reference === undefined ? Number.NaN : dayOf(reference, timeZone);
  // A date written with the year only when it is not this year.
  const dated = (input: DateInput, options: Intl.DateTimeFormatOptions) => {
    const { instant, zone } = resolve(input, timeZone);
    const elsewhere = !Number.isNaN(today) && yearOf(dayOf(input, timeZone)) !== yearOf(today);
    return dateFormat(locale, { timeZone: zone, ...options, ...(elsewhere ? { year: "numeric" } : {}) }).format(instant);
  };
  // "12 Oct"
  const short = (input: DateInput) => dated(input, { day: "numeric", month: "short" });
  // "Fri 23 Oct", the date `showDate` writes after the words.
  const withDay = (input: DateInput) => dated(input, { weekday: "short", day: "numeric", month: "short" });
  const long = (input: DateInput) => {
    const { instant, zone } = resolve(input, timeZone);
    return dateFormat(locale, { timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(instant);
  };

  if (doneAt !== null && doneAt !== undefined && !Number.isNaN(dayOf(doneAt, timeZone))) {
    return { state: "done", words: `Done on ${short(doneAt)}`, brief: "Done", said: `Done on ${long(doneAt)}`, date: long(doneAt), more: compact ? short(doneAt) : "", stamp: doneAt };
  }
  if (date === null || date === undefined || Number.isNaN(dayOf(date, timeZone))) {
    return { state: "none", words: "No due date", brief: "No date", said: "", date: "", more: "" };
  }
  const when = long(date);
  const diff = dayOf(date, timeZone) - today;
  // The browser's clock is not known yet: the plain date is right on the server and before hydration.
  if (Number.isNaN(diff)) return { state: "upcoming", words: `Due ${short(date)}`, brief: short(date), said: `Due ${when}`, date: when, more: "", stamp: date };
  if (diff < 0) return { state: "overdue", words: `Overdue by ${plural(-diff, "day")}`, brief: `${MINUS}${-diff}d`, said: `Was due ${when}`, date: when, more: withDay(date), stamp: date };
  if (diff === 0) return { state: "today", words: "Due today", brief: "Today", said: `Due ${when}`, date: when, more: withDay(date), stamp: date };
  return {
    state: diff <= soonDays ? "soon" : "upcoming",
    words: diff === 1 ? "Due tomorrow" : diff <= 30 ? `Due in ${plural(diff, "day")}` : `Due ${short(date)}`,
    brief: diff <= 99 ? `${diff}d` : short(date),
    said: `Due ${when}`,
    date: when,
    // Far away, the words (or the compact form) already hold the date.
    more: diff > (compact ? 99 : 30) ? "" : withDay(date),
    stamp: date,
  };
}

const LOOK: Record<DueState, { icon: typeof IconClock; className: string }> = {
  upcoming: { icon: IconCalendar, className: "font-normal text-muted-foreground" },
  soon: { icon: IconClock, className: "font-medium text-foreground" },
  today: { icon: IconAlarm, className: "font-semibold text-foreground" },
  overdue: { icon: IconAlertCircle, className: "font-semibold text-destructive" },
  done: { icon: IconCheckCircle, className: "font-normal text-muted-foreground" },
  none: { icon: IconCalendar, className: "font-normal text-muted-foreground" },
};

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The ring of a label that is a tab stop. The negative margin gives it room without moving the text. */
const FOCUSABLE = "-mx-1 rounded-sm px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * A tooltip that a tap can open. Radix opens one on hover and on keyboard focus
 * only, and closes it on every click, so on a touch screen the full date would
 * never show. Here a press toggles it, and hover and focus work as they do in
 * every tooltip.
 */
function TapTooltip({ content, focusable, children }: { content: ReactNode; focusable: boolean; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);
  const pressing = useRef(false);
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip
        open={open}
        onOpenChange={(next) => {
          // The trigger closes its own tooltip on every click; while a press is toggling it, that close is not wanted.
          if (!next && pressing.current) return;
          setOpen(next);
        }}
      >
        <TooltipTrigger
          asChild
          tabIndex={focusable ? 0 : undefined}
          // iOS Safari only sends a click to an element it takes for clickable, and a pointer cursor says so. Touch only: a mouse keeps its arrow.
          className="[@media(hover:none)]:cursor-pointer"
          // A press closes an open tooltip before its click arrives, so the click has to know how it started.
          onPointerDown={() => {
            wasOpen.current = open;
          }}
          onClick={() => {
            pressing.current = true;
            setOpen(!wasOpen.current);
            queueMicrotask(() => {
              pressing.current = false;
            });
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A due date in words that matter: "Due today", "Due in 3 days", "Overdue by
 * 2 days" or "Done on 12 Oct", each with its own icon and weight (only overdue
 * uses the destructive token). Days are compared as calendar days in the zone
 * you name, so a task due today never reads overdue at one minute past
 * midnight. The date itself sits in a `<time>` element and in a tooltip that a
 * hover, a tap or, with `focusable`, keyboard focus opens; `showDate` writes it
 * into the line itself, for a phone or a page on paper. Compact mode shows "3d"
 * with the sentence as its accessible name. Without a `now` it writes the plain
 * date for the server and the first paint, then switches to words once the
 * browser's clock is known, so a cached page never shows a stale "Due in 3 days".
 */
export function DueDateLabel({ date, doneAt, now, soonDays = 2, locale = "en-US", timeZone = "UTC", compact = false, tooltip = true, showDate = false, focusable = false, className, ...props }: DueDateLabelProps) {
  const [clock, setClock] = useState<number | undefined>(undefined);
  useBrowserLayoutEffect(() => {
    if (now !== undefined) return;
    const read = () => setClock(Date.now());
    read();
    const visible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [now]);

  const { state, words, brief, said, date: written, more, stamp } = describe({ date, doneAt, reference: now !== undefined ? now : clock, soonDays, locale, timeZone, compact });
  const look = LOOK[state];
  const Icon = look.icon;
  const tip = tooltip && said !== "";
  const label = (
    <span data-slot="due-date-label" data-state={state} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums", look.className, tip && focusable && FOCUSABLE, className)} {...props}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <time dateTime={stamp === undefined ? undefined : isoOf(stamp)} suppressHydrationWarning>
        {compact ? (
          <>
            <span aria-hidden="true">{brief}</span>
            <span className="sr-only">{words}</span>
          </>
        ) : (
          words
        )}
      </time>
      {/* The sr-only date below already says it to a screen reader, so the visible one is hidden from it. */}
      {showDate && more ? (
        <span aria-hidden="true" className="inline-flex items-center gap-1.5 font-normal text-muted-foreground">
          <span>·</span>
          <span>{more}</span>
        </span>
      ) : null}
      {written ? <span className="sr-only">{`, ${written}`}</span> : null}
    </span>
  );
  if (!tip) return label;
  return (
    <TapTooltip content={said} focusable={focusable}>
      {label}
    </TapTooltip>
  );
}
