"use client";

import { useEffect, useLayoutEffect, useState, type ComponentProps, type ReactNode } from "react";

import { IconBan, IconClock, IconReturn } from "@rhs-ui/icons";
import { knownZone, lastDayOf, returnWindowAt, type ReturnMoment, type ReturnState } from "@rhs-ui/commerce/return-window/window";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { ReturnMoment, ReturnState } from "@rhs-ui/commerce/return-window/window";

export interface ReturnWindowLabels {
  /** The sentence while returns are possible. `{date}` is the last day: "Free returns until 14 November". */
  open?: string;
  /** The sentence once the window is over. */
  closed?: string;
  /** Under it, once the window is over. `{date}`. */
  closedOn?: string;
  /** The badge on a window that is about to close. */
  closing?: string;
  /** Under the sentence. `{count}` is how many days are left. */
  daysLeftOne?: string;
  daysLeftOther?: string;
  /** Under the sentence, on the last day itself. */
  lastDay?: string;
  /** The button. */
  start?: string;
}

const WORDS = {
  open: "Free returns until {date}",
  closed: "Return window closed",
  closedOn: "It ended on {date}.",
  closing: "Closing soon",
  daysLeftOne: "{count} day left",
  daysLeftOther: "{count} days left",
  lastDay: "Last day to return",
  start: "Start return",
} satisfies Required<ReturnWindowLabels>;

export interface ReturnWindowProps extends Omit<ComponentProps<"div">, "children"> {
  /** When the order was delivered: an ISO date-time, or a date such as "2026-10-20" for a calendar day that no time zone moves. The window starts on that day. */
  deliveredAt: ReturnMoment;
  /** How many days after the delivery day returns are accepted. The last day is the delivery day plus this many. */
  windowDays: number;
  /** The moment to measure from. Pass it from the server for a first render that matches the browser's; without it the page reads the browser's clock once it has loaded, and again when the tab comes back or an hour passes. */
  now?: ReturnMoment;
  /** The time zone whose calendar days count. Defaults to "UTC". Use the shop's, so the window closes at midnight where the shop is. */
  timeZone?: string;
  /** Always pass your application locale, so the server and the browser write the same date. */
  locale?: string;
  /** With fewer days left than this the window is closing soon. Defaults to 3. */
  soonDays?: number;
  /** Called when the Start return button is pressed. The button is only there while the window is open. */
  onStartReturn?: () => void;
  /** Where the return starts, when that is a page: the button then is a link. */
  startReturnHref?: string;
  /** The words, for another language. */
  labels?: ReturnWindowLabels;
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The browser's clock, read once the page has loaded (never on the server), and again when the tab is looked at or an hour has passed. */
function useClock(given: ReturnMoment | undefined): ReturnMoment | undefined {
  const [clock, setClock] = useState<number | undefined>(undefined);
  useBrowserLayoutEffect(() => {
    if (given !== undefined) return;
    const read = () => setClock(Date.now());
    read();
    const visible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", visible);
    const interval = window.setInterval(read, 3_600_000);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(interval);
    };
  }, [given]);
  return given ?? clock;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A sentence with a `<time>` element where `{date}` is. */
function withDate(template: string, date: ReactNode): ReactNode {
  const [before = "", after = ""] = template.split("{date}");
  return (
    <>
      {before}
      {date}
      {after}
    </>
  );
}

const LOOK = {
  open: { icon: IconReturn, tile: "border-border bg-muted text-foreground" },
  closing: { icon: IconClock, tile: "border-border bg-muted text-foreground" },
  closed: { icon: IconBan, tile: "border-border bg-muted text-muted-foreground" },
} as const;

/**
 * How long an order can still be returned, for an order or item page: "Free returns until 14 November" with the
 * days that are left, a thin bar for the part of the window still ahead, and the Start return button. Whole
 * calendar days are counted in the shop's time zone, so the window closes at midnight where the shop is. Under
 * three days left it says "Closing soon", and after the last day it says the window is closed and takes the
 * button away. The state is always written as well as drawn, and the date is a `<time>` element. Without a
 * `now` the first render shows only the date, so a cached page never claims "12 days left" it cannot know.
 */
export function ReturnWindow({ deliveredAt, windowDays, now, timeZone = "UTC", locale = "en-US", soonDays = 3, onStartReturn, startReturnHref, labels, className, ...props }: ReturnWindowProps) {
  const words = { ...WORDS, ...labels };
  const zone = knownZone(timeZone);
  const reference = useClock(now);
  const lastDay = lastDayOf(deliveredAt, windowDays, zone);
  if (!lastDay) return null;

  const info = reference === undefined ? null : returnWindowAt(deliveredAt, windowDays, reference, zone, soonDays);
  const state: ReturnState = info?.state ?? "open";
  const look = LOOK[state];
  const Icon = look.icon;

  // The year is only written when the last day is not in the year it is now.
  const sameYear = info === null || info.lastDay.getUTCFullYear() === (reference === undefined ? lastDay.getUTCFullYear() : new Date(reference).getUTCFullYear());
  const dateText = new Intl.DateTimeFormat(locale, { timeZone: "UTC", day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) }).format(lastDay);
  const date = <time dateTime={lastDay.toISOString().slice(0, 10)} className="whitespace-nowrap">{dateText}</time>;

  const plural = new Intl.PluralRules(locale);
  const left = info?.daysLeft ?? 0;
  const sub =
    state === "closed"
      ? withDate(words.closedOn, date)
      : info === null
        ? null
        : left === 0
          ? words.lastDay
          : fill(plural.select(left) === "one" ? words.daysLeftOne : words.daysLeftOther, { count: new Intl.NumberFormat(locale).format(left) });

  const startable = state !== "closed" && Boolean(onStartReturn || startReturnHref);
  const action = startable ? (
    startReturnHref ? (
      <Button asChild size="sm" variant={state === "closing" ? "default" : "outline"}>
        <a href={startReturnHref} onClick={onStartReturn}>
          <IconReturn />
          {words.start}
        </a>
      </Button>
    ) : (
      <Button type="button" size="sm" variant={state === "closing" ? "default" : "outline"} onClick={onStartReturn}>
        <IconReturn />
        {words.start}
      </Button>
    )
  ) : null;

  return (
    <div data-slot="return-window" data-state={state} className={cn("@container rounded-xl border border-border bg-card p-4 shadow-xs", state === "closed" && "bg-muted/40 shadow-none", className)} {...props}>
      {/* The button sits under the text on a narrow card, lined up with it, and at the end of the row on a wide one. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 @md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span aria-hidden="true" className={cn("grid size-10 shrink-0 place-items-center rounded-full border", look.tile)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-snug font-medium text-pretty", state === "closed" && "text-muted-foreground")}>
            <span>{state === "closed" ? words.closed : withDate(words.open, date)}</span>
            {state === "closing" ? (
              <Badge variant="default">
                <IconClock />
                {words.closing}
              </Badge>
            ) : null}
          </p>
          <p className="mt-0.5 min-h-4 text-xs text-muted-foreground tabular-nums">{sub}</p>
          {/* A closed window has nothing ahead of it, so it has no bar: an empty track would read like a loader that is not moving. */}
          {info && state !== "closed" ? (
            <div aria-hidden="true" className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.round(info.remaining * 100)}%` }} />
            </div>
          ) : null}
        </div>
        {action ? <div className="col-start-2 @md:col-start-3 @md:row-start-1">{action}</div> : null}
      </div>
    </div>
  );
}
