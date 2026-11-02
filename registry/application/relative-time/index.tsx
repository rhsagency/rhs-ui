"use client";

import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactElement, type ReactNode } from "react";

import { dateText, exactText, isRelative, msUntilChange, relativeText, stableText, toTimestamp, type RelativeTimeFormat, type RelativeTimeInput } from "@rhs-ui/application/relative-time/format";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface RelativeTimeProps extends Omit<ComponentProps<"time">, "children" | "dateTime"> {
  /** The moment: a Date, an ISO string or a timestamp in ms. Something that is not a date renders nothing. */
  value: RelativeTimeInput;
  /** The moment to measure from. Leave it out to use the browser's clock, read once the page is live and kept current; pass it in tests, previews and server-rendered feeds to get words in the server HTML. */
  now?: RelativeTimeInput;
  /** The language of the words and the dates. Default "en-US". */
  locale?: string;
  /** The IANA time zone whose calendar days and clock the text uses, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The longest, in seconds, the words may go without being checked; they are rewritten the moment they change, never in between, and not while the tab is hidden. 0 reads the clock once and stops. Default 60. */
  updateEvery?: number;
  /** After this many days the words give way to a date. Infinity never does, 0 always does. Default 7. */
  threshold?: number;
  /** How that date is written: "short" (12 Mar), "medium" (12 Mar 2026), "long" (12 March 2026), "datetime" (12 Mar 2026, 14:30), or your own Intl options. Default "short". */
  format?: RelativeTimeFormat;
  /** What a time under a minute old is called. Default "just now". */
  justNow?: string;
  /** Show the exact date and time, with its zone, in a tooltip. A hover, a tap and (with `focusable`) keyboard focus open it. On by default; without it the exact time is the element's title. */
  tooltip?: boolean;
  /** Make the time a tab stop, so the tooltip opens on keyboard focus too. Off by default: a feed of timestamps would otherwise add one tab stop to every row. Screen readers get the exact time in the text either way. */
  focusable?: boolean;
  /** Open the tooltip at the first render: for a preview. */
  defaultOpen?: boolean;
}

/** The ring of a time that is a tab stop. The negative margin gives it room without moving the text. */
const FOCUSABLE = "-mx-1 rounded-sm px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * A tooltip that a tap can open. Radix opens one on hover and on keyboard focus
 * only, and closes it on every click, so on a touch screen the exact time would
 * never show. Here a press toggles it, and hover and focus work as they do in
 * every tooltip.
 */
function TapTooltip({ content, focusable, defaultOpen, children }: { content: ReactNode; focusable: boolean; defaultOpen: boolean; children: ReactElement }) {
  const [open, setOpen] = useState(defaultOpen);
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
        <TooltipContent collisionPadding={8} className="tabular-nums">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A time that says how long ago it was: "just now", "3 minutes ago",
 * "yesterday", "in 2 hours", then a date such as "12 Mar" once it is a week
 * old. It is a real `time` element whose `datetime` holds the exact moment,
 * and a tooltip (also opened by a tap) writes that moment out with its time
 * zone. Words are cut, never rounded up, and "yesterday" is the previous
 * calendar day in the zone you name. It rewrites itself at the moments its
 * text changes, with one timer that waits for the next change instead of
 * ticking, and not while the tab is hidden; updates are never announced.
 * Before the browser's clock is known (the server, the first paint) it writes
 * the date with its year, so both sides print the same text and nothing
 * mismatches; the words take over a moment later. A screen reader reads the
 * exact time after the words.
 */
export function RelativeTime({ value, now, locale = "en-US", timeZone = "UTC", updateEvery = 60, threshold = 7, format = "short", justNow = "just now", tooltip = true, focusable = false, defaultOpen = false, className, ...props }: RelativeTimeProps) {
  const at = toTimestamp(value);
  const valid = !Number.isNaN(at);
  const pinned = now === undefined ? Number.NaN : toTimestamp(now);
  const isPinned = !Number.isNaN(pinned);
  // Null on the server and while hydrating, so both write the same date. The layout effect fills it in before the browser paints a client-only render.
  const [clock, setClock] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (isPinned || !valid) return;
    let timer: number | undefined;
    const tick = () => {
      window.clearTimeout(timer);
      const time = Date.now();
      setClock(time);
      const wait = updateEvery > 0 ? msUntilChange(at, time, threshold) : null;
      if (wait !== null) timer = window.setTimeout(tick, Math.min(wait, updateEvery * 1000));
    };
    // A hidden tab keeps no timer; coming back reads the clock again.
    const visible = () => {
      if (document.visibilityState === "visible") tick();
      else window.clearTimeout(timer);
    };
    if (document.visibilityState === "visible") tick();
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [isPinned, valid, at, updateEvery, threshold]);

  if (!valid) return null;

  const current = isPinned ? pinned : clock;
  const exact = exactText(at, locale, timeZone);
  const text = current === null ? stableText(at, locale, timeZone, format) : isRelative(at, current, threshold) ? relativeText(at, current, locale, timeZone, justNow) : dateText(at, locale, timeZone, format, current);
  const label = (
    <time data-slot="relative-time" dateTime={new Date(at).toISOString()} title={tooltip ? undefined : exact} suppressHydrationWarning className={cn("tabular-nums", tooltip && focusable && FOCUSABLE, className)} {...props}>
      {text}
      <span className="sr-only" suppressHydrationWarning>{`, ${exact}`}</span>
    </time>
  );
  return tooltip ? (
    <TapTooltip content={exact} focusable={focusable} defaultOpen={defaultOpen}>
      {label}
    </TapTooltip>
  ) : (
    label
  );
}
