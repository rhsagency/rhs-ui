"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconClock, IconPause, IconWarning } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

import { readSla, spanText, type BusinessHours, type SlaState, type SlaThresholds } from "./time";

export type { BusinessHours, SlaState, SlaThresholds } from "./time";

type DateInput = Date | string | number;

/** The words the timer uses, for translation. `{time}`, `{reason}`, `{state}` and `{text}` are filled in. */
export interface SlaTimerLabels {
  /** The state beside the time while there is plenty left. Default "On track". */
  onTrack?: string;
  /** Default "At risk". */
  atRisk?: string;
  /** Default "Breached". */
  breached?: string;
  /** Default "Paused". */
  paused?: string;
  /** The time left when there is no `label`. Default "{time} left". */
  left?: string;
  /** The line after the deadline has passed. Default "Breached by {time}". */
  breachedBy?: string;
  /** The line while the clock is stopped. Default "Paused: {reason}". */
  pausedLine?: string;
  /** The line before the clock is known, for the server render. Default "Due {time}". */
  due?: string;
  /** What less than a minute is called. Default "under a minute". */
  underMinute?: string;
  /** Said when the state changes, for a line that does not already name the state (on track, at risk). A line that does, like "Breached by 8 min", is said as it stands. Default "{state}: {text}". */
  stateChanged?: string;
  /** In the tooltip, the deadline. Default "Due {time}". */
  dueAt?: string;
  /** In the tooltip, when the clock started. Default "Started {time}". */
  startedAt?: string;
  /** In the tooltip, when the clock stopped. Default "Paused since {time}". */
  pausedSince?: string;
  /** In the tooltip, how much was left at that moment. Default "{time} were left". */
  leftWhenPaused?: string;
  /** In the tooltip, when only working hours count. Default "Working hours only, {start} to {end}". */
  workingHours?: string;
}

export interface SlaTimerProps extends Omit<ComponentProps<"div">, "children"> {
  /** When the target falls due: a Date, a timestamp or an ISO string. */
  deadline: DateInput;
  /** When the clock started. It sets how much of the target has gone, which is what "at risk" is measured against. */
  startedAt: DateInput;
  /** When the clock was stopped, for a ticket that waits on the customer. The timer then shows what was left at that moment and does not tick. Leave it out while the clock runs. */
  pausedAt?: DateInput | null;
  /** Why the clock is stopped, said after "Paused:". Default "waiting on customer". */
  pausedReason?: string;
  /** The moment time is measured from. Leave it out to use the browser's clock, read once the page is live and then every minute; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** Count working hours only: time outside them does not run down the clock. Without it the target runs around the clock. */
  businessHours?: BusinessHours;
  /** When the target counts as at risk: a share of it left, or a number of minutes. Default a quarter. */
  thresholds?: SlaThresholds;
  /** The words before the time while the target is running, with the preposition: "First response in", "Resolve within". Without it the line reads "12 min left". */
  label?: string;
  /** Draw the thin bar under the line that shows how much of the target has gone. Default true. */
  showProgress?: boolean;
  /** The language of the times and numbers. Default "en-US". */
  locale?: string;
  /** The time zone the dates in the tooltip are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the timer uses, for translation. */
  labels?: SlaTimerLabels;
}

const DEFAULT_LABELS = {
  onTrack: "On track",
  atRisk: "At risk",
  breached: "Breached",
  paused: "Paused",
  left: "{time} left",
  breachedBy: "Breached by {time}",
  pausedLine: "Paused: {reason}",
  due: "Due {time}",
  underMinute: "under a minute",
  stateChanged: "{state}: {text}",
  dueAt: "Due {time}",
  startedAt: "Started {time}",
  pausedSince: "Paused since {time}",
  leftWhenPaused: "{time} were left",
  workingHours: "Working hours only, {start} to {end}",
} satisfies Required<SlaTimerLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const toMs = (value: DateInput | null | undefined): number => (value === undefined || value === null ? Number.NaN : new Date(value).getTime());

function dateIn(at: number, locale: string, timeZone: string): string {
  const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/** The failure text, darkened toward the foreground so the small red words reach 4.5:1 on the page and on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * The browser's clock, read as soon as the page is live and then once a minute
 * while the target runs, and again the moment a sleeping tab is looked at.
 * Null on the server and before hydration, so both write the same text.
 */
function useNow(fixed: DateInput | undefined, running: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    if (!running) return;
    const timer = window.setInterval(read, 60_000);
    document.addEventListener("visibilitychange", read);
    window.addEventListener("focus", read);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", read);
      window.removeEventListener("focus", read);
    };
  }, [pinned, running]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

const LOOK: Record<SlaState, { variant: BadgeProps["variant"]; className?: string; icon: ReactNode; bar: string }> = {
  "on-track": { variant: "outline", icon: <IconClock />, bar: "bg-foreground/55" },
  "at-risk": { variant: "default", icon: <IconWarning />, bar: "bg-foreground" },
  breached: { variant: "destructive", className: cn("font-semibold", DANGER_TEXT), icon: <IconAlertCircle />, bar: "bg-destructive" },
  paused: { variant: "muted", className: "border-dashed border-muted-foreground/50 bg-transparent", icon: <IconPause />, bar: "bg-muted-foreground/40" },
};

/**
 * How much time is left on a service target, in words and in a state you can
 * read without colour: "First response in 12 min" with an On track, At risk or
 * Breached tag, "Breached by 25 min" once the deadline has gone, and "Paused:
 * waiting on customer" while the clock is stopped. Time is worked out from
 * timestamps, so it is right again the moment a sleeping tab wakes, and it can
 * count working hours only. The line ticks once a minute without being read
 * out; only a change of state (at risk, breached, paused, back on track) is
 * announced, politely and once, with the state said once. A thin bar shows how
 * much of the target has gone, and the tooltip (on hover, on focus and on a
 * tap) gives the exact deadline.
 */
export function SlaTimer({
  deadline,
  startedAt,
  pausedAt,
  pausedReason = "waiting on customer",
  now,
  businessHours,
  thresholds,
  label,
  showProgress = true,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: SlaTimerProps) {
  const text: Required<SlaTimerLabels> = { ...DEFAULT_LABELS, ...labels };
  const due = toMs(deadline);
  const began = toMs(startedAt);
  const stoppedAt = toMs(pausedAt);
  const stopped = !Number.isNaN(stoppedAt);
  const clock = useNow(now, !stopped);

  // A fingertip has no hover and no focus ring to open the tooltip: a tap opens it, a second tap or a tap elsewhere closes it. Mouse, pen and keyboard keep the tooltip's own hover and focus.
  const [tipOpen, setTipOpen] = useState(false);
  const press = useRef({ touch: false, wasOpen: false });

  const reading = clock === null || Number.isNaN(due) || Number.isNaN(began) ? null : readSla({ deadline: due, startedAt: began, pausedAt: stopped ? stoppedAt : undefined, now: clock, businessHours, thresholds });
  const state = reading?.state ?? null;
  const span = (ms: number, round: "up" | "down") => spanText(ms, locale, { hoursOnly: Boolean(businessHours), underMinute: text.underMinute, round });

  let line = "";
  if (reading === null) line = Number.isNaN(due) ? "" : fill(text.due, { time: dateIn(due, locale, timeZone) });
  else if (reading.state === "paused") line = fill(text.pausedLine, { reason: pausedReason });
  else if (reading.state === "breached") line = fill(text.breachedBy, { time: span(-reading.remaining, "down") });
  else line = label ? `${label} ${span(reading.remaining, "up")}` : fill(text.left, { time: span(reading.remaining, "up") });

  const stateWord = state === null ? text.onTrack : { "on-track": text.onTrack, "at-risk": text.atRisk, breached: text.breached, paused: text.paused }[state];

  // Said once when the state changes, never on the way in and never for the minute-by-minute ticks: the effect runs on the state alone.
  // A line that already names the state ("Breached by 8 min", "Paused: waiting on customer") is spoken as it stands, so the word is not said twice.
  const [said, setSaid] = useState("");
  const previous = useRef<SlaState | null>(null);
  const named = line.toLowerCase().includes(stateWord.toLowerCase());
  const sentence = named ? line : fill(text.stateChanged, { state: stateWord, text: line });
  useEffect(() => {
    if (state === null) return;
    if (previous.current !== null && previous.current !== state) setSaid(sentence);
    previous.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of state is announced, not a change of the words
  }, [state]);

  const look = state === null ? null : LOOK[state];
  const tip = [
    Number.isNaN(due) ? "" : fill(text.dueAt, { time: dateIn(due, locale, timeZone) }),
    Number.isNaN(began) ? "" : fill(text.startedAt, { time: dateIn(began, locale, timeZone) }),
    reading?.state === "paused" ? `${fill(text.pausedSince, { time: dateIn(stoppedAt, locale, timeZone) })}. ${fill(text.leftWhenPaused, { time: span(Math.max(0, reading.remaining), "up") })}` : "",
    businessHours ? fill(text.workingHours, { start: businessHours.start, end: businessHours.end }) : "",
  ].filter(Boolean);

  return (
    <div data-slot="sla-timer" data-state={state ?? "unknown"} className={cn("max-w-full", className)} {...props}>
      <div role="timer" className="grid w-full gap-1.5">
        <TooltipProvider>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {look ? (
              <Badge variant={look.variant} className={cn("shrink-0 gap-1", look.className)}>
                {look.icon}
                {stateWord}
              </Badge>
            ) : (
              // The state is not known until the clock is, so the tag keeps its place and says nothing.
              <Badge variant="outline" aria-hidden="true" className="invisible shrink-0 gap-1">
                <IconClock />
                {text.onTrack}
              </Badge>
            )}
            <Tooltip open={tip.length > 0 && tipOpen} onOpenChange={setTipOpen}>
              <TooltipTrigger
                asChild
                onPointerDown={(event) => {
                  press.current = { touch: event.pointerType === "touch", wasOpen: tipOpen };
                }}
                onClick={(event) => {
                  if (!press.current.touch) return;
                  press.current.touch = false;
                  // The tooltip would close on this click: the tap decides instead.
                  event.preventDefault();
                  setTipOpen(!press.current.wasOpen);
                }}
              >
                <span
                  tabIndex={0}
                  className={cn(
                    "min-w-0 rounded-sm text-[0.8125rem] leading-5 tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    state === "paused" || state === null ? "text-muted-foreground" : "text-foreground",
                    state === "at-risk" && "font-semibold",
                    state === "breached" && cn("font-semibold", DANGER_TEXT),
                    state === "on-track" && "font-medium",
                  )}
                >
                  {line}
                </span>
              </TooltipTrigger>
              {tip.length ? (
                <TooltipContent side="top" align="start" className="grid gap-0.5 tabular-nums">
                  {tip.map((row) => (
                    <span key={row}>{row}</span>
                  ))}
                </TooltipContent>
              ) : null}
            </Tooltip>
          </div>
        </TooltipProvider>
        {showProgress ? (
          <span aria-hidden="true" className="block h-1 w-full overflow-hidden rounded-full bg-muted">
            <span className={cn("block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none", look?.bar ?? "bg-transparent")} style={{ width: `${Math.round((reading?.elapsed ?? 0) * 100)}%` }} />
          </span>
        ) : null}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
