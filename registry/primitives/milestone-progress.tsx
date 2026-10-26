import { Fragment, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconCheckCircle } from "@rhs-ui/icons";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** One stop along the way: the value it sits at, and its name. */
export interface ProgressMilestone {
  /** Where the stop is, on the same scale as `value` and `max`. */
  at: number;
  /** Its name: "Silver", "Free shipping". Keep it short, it is written under the track. */
  label: string;
}

export interface MilestoneProgressProps extends Omit<ComponentProps<"div">, "children"> {
  /** How far along the goal is, on the same scale as `max`. */
  value: number;
  /** The end of the track: the whole goal. */
  max: number;
  /** The stops, in any order. They are drawn where `at` puts them and sorted for screen readers. */
  milestones: readonly ProgressMilestone[];
  /** What the bar measures, written above it and used as the bar's name: "Loyalty status". */
  label: string;
  /** Turns a number into words for the value, the stops and the next-stop line: (n) => `${n} points`. Default: the number, formatted for the locale. */
  formatValue?: (value: number) => string;
  /** The line under the bar. {remaining} is what is left to the next stop, {milestone} its name. Default "{remaining} to {milestone}". */
  nextLabel?: string;
  /** The line once every stop is reached. Default "Goal reached". */
  doneLabel?: string;
  /** What a screen reader hears after a stop that has been reached. Default "reached". */
  reachedLabel?: string;
  /** What a screen reader hears after a stop that has not. Default "not reached yet". */
  upcomingLabel?: string;
  /** Write each stop's value under its name. Default true. */
  showValues?: boolean;
  /** The locale the default number format uses. Default "en-US". */
  locale?: string;
}

/** Replaces {slots} in a template with text. */
function fillText(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
}

/** Replaces {slots} in a template with elements, so the figures can carry their own weight. */
function fillNodes(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((piece, index) => {
    const key = /^\{(\w+)\}$/.exec(piece)?.[1];
    return key !== undefined && key in nodes ? <Fragment key={index}>{nodes[key]}</Fragment> : piece;
  });
}

/**
 * A progress bar for goals that come in steps: a funding target with stretch
 * goals, a loyalty ladder, the tiers of free shipping. Each stop is drawn on
 * the track with its name, and says whether it has been reached by a check or
 * an open ring and in words, never by colour alone. The line under the bar
 * names the next stop from your data ("220 points to Gold") and the last stop
 * reads "Goal reached"; with no stops to name it is just the value. It is one
 * progressbar for assistive technology, whose value text is that same line, and
 * the stops are a list. In a narrow container the labels alternate above and
 * below the track so they never collide.
 */
export function MilestoneProgress({
  value,
  max,
  milestones,
  label,
  formatValue,
  nextLabel = "{remaining} to {milestone}",
  doneLabel = "Goal reached",
  reachedLabel = "reached",
  upcomingLabel = "not reached yet",
  showValues = true,
  locale = "en-US",
  className,
  ...props
}: MilestoneProgressProps) {
  const format = formatValue ?? ((amount: number) => new Intl.NumberFormat(locale).format(amount));
  const end = max > 0 ? max : 1;
  const current = Math.min(end, Math.max(0, value));
  const stops = [...milestones].sort((a, b) => a.at - b.at);
  const next = stops.find((stop) => stop.at > current);
  const remaining = next ? format(next.at - current) : "";
  // No stop left is only a finished goal if there were stops, or the bar is full: with none (or none yet) the line is just the value.
  const finished = !next && (stops.length > 0 || current >= end);
  const sentence = next ? fillText(nextLabel, { remaining, milestone: next.label }) : finished ? doneLabel : format(current);
  const room = showValues ? "pb-[3.25rem] @max-md:pt-[3.25rem]" : "pb-9 @max-md:pt-9";

  return (
    <div data-slot="milestone-progress" data-state={finished ? "complete" : "in-progress"} className={cn("@container grid gap-3", className)} {...props}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{format(current)}</span>
      </div>
      <div className={cn("relative mx-3 pt-2", room)}>
        <div className="relative">
          <Progress value={current} max={end} aria-label={label} getValueLabel={() => sentence} className="h-1.5" />
          <ol className="absolute inset-0 m-0 list-none p-0">
            {stops.map((stop, index) => {
              const place = Math.min(100, Math.max(0, (stop.at / end) * 100));
              const reached = current >= stop.at;
              const upNext = stop === next;
              // Labels at the ends hang inward from the marker, so they stay inside the component.
              const align = place <= 6 ? "left-[-0.625rem] text-left" : place >= 94 ? "right-[-0.625rem] text-right" : "left-1/2 -translate-x-1/2 text-center";
              const side = index % 2 === 1 ? "top-[1.125rem] @max-md:top-auto @max-md:bottom-[1.125rem]" : "top-[1.125rem]";
              return (
                <li key={`${stop.label}-${stop.at}`} data-state={reached ? "reached" : "upcoming"} className="absolute top-1/2 size-0" style={{ left: `${place}%` }}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 left-1/2 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 transition-colors duration-300 motion-reduce:transition-none",
                      reached ? "border-primary bg-primary text-primary-foreground" : upNext ? "border-foreground bg-card" : "border-muted-foreground/45 bg-card",
                    )}
                  >
                    {reached ? <IconCheck size={12} strokeWidth={2.75} /> : null}
                  </span>
                  <span className={cn("absolute grid gap-0.5 text-xs leading-tight whitespace-nowrap", align, side)}>
                    <span className={cn("font-medium", reached || upNext ? "text-foreground" : "text-muted-foreground")}>{stop.label}</span>
                    {showValues ? <span className="tabular-nums text-muted-foreground">{format(stop.at)}</span> : null}
                    <span className="sr-only">, {reached ? reachedLabel : upcomingLabel}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <p className={cn("flex items-center gap-2 text-sm", finished ? "font-medium text-foreground" : "text-muted-foreground")}>
        {finished ? <IconCheckCircle size={16} aria-hidden="true" /> : null}
        <span className={next || finished ? undefined : "tabular-nums"}>
          {next
            ? fillNodes(nextLabel, {
                remaining: <span className="font-medium text-foreground tabular-nums">{remaining}</span>,
                milestone: <span className="font-medium text-foreground">{next.label}</span>,
              })
            : sentence}
        </span>
      </p>
    </div>
  );
}
