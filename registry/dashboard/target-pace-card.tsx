import type { ComponentProps } from "react";

import { IconCalendar, IconCheckCircle, IconTrendDown, IconTrendUp } from "@rhs-ui/icons";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

export interface TargetPaceCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The goal, in a few words: "Revenue this month", "Sign-ups this quarter". */
  label: string;
  /** Where you are now, in the same unit as `target`. */
  value: number;
  /** What you are aiming for by the end of the period. */
  target: number;
  /** First day of the period. A date-only string ("2026-10-01") is a calendar day. */
  start: DateInput;
  /** Last day of the period, included. */
  end: DateInput;
  /** Today. Pass the same instant on the server and in the browser; defaults to the current time. */
  now?: DateInput;
  /** Intl.NumberFormat options for every figure: currency, percent, compact. Whole numbers by default. */
  format?: Intl.NumberFormatOptions;
  /** BCP 47 locale for figures and dates. */
  locale?: string;
  /** Days are counted as calendar days in this IANA time zone. */
  timeZone?: string;
}

const DAY = 86_400_000;

/** A calendar day as a day number, counted in `timeZone`, so "today" means the same thing everywhere. */
function calendarDay(input: DateInput, timeZone: string): number {
  if (typeof input === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return Number.NaN;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / DAY;
}

/**
 * Where an even pace would have you today, and what the rest of the period
 * has to deliver. Today counts as half a day, so the answer is the same
 * all day long and the server and the browser always agree.
 */
function paceOf(value: number, target: number, startDay: number, endDay: number, today: number) {
  const totalDays = Math.max(1, endDay - startDay + 1);
  // Dates that cannot be read leave a figure and a bar, and no pace.
  const phase = ![startDay, endDay, today].every(Number.isFinite) ? "unknown" : today < startDay ? "upcoming" : today > endDay ? "over" : "running";
  const dayNumber = phase === "running" ? today - startDay + 1 : phase === "over" ? totalDays + 1 : 0;
  const share = phase === "running" ? (dayNumber - 0.5) / totalDays : phase === "over" ? 1 : 0;
  const daysLeft = phase === "running" ? totalDays - dayNumber + 1 : phase === "upcoming" ? totalDays : 0;
  const expected = target * share;
  const remaining = Math.max(0, target - value);
  return {
    phase,
    totalDays,
    daysLeft,
    share,
    expected,
    remaining,
    perDay: daysLeft > 0 && remaining > 0 ? remaining / daysLeft : null,
    /** How far ahead (positive) or behind (negative) an even pace you are, as a ratio. */
    ratio: expected > 0 ? value / expected - 1 : null,
  };
}

/**
 * A goal with a deadline: revenue this month, sign-ups this quarter. The
 * figure is large, the bar fills towards the target, and a tick marks where
 * you would be today if progress were even. The verdict is written out
 * ("Ahead of pace by 6 percent", "Well ahead of pace" once you are past twice
 * the even pace, "Behind: needs 412 per day") with the daily rate still
 * needed, worked out from the dates. A value beyond the target fills the bar
 * and no more.
 */
export function TargetPaceCard({ label, value: rawValue, target, start, end, now, format, locale = "en-US", timeZone = "UTC", className, ...props }: TargetPaceCardProps) {
  const value = Number.isFinite(rawValue) ? rawValue : 0;
  const options = format ?? { maximumFractionDigits: 0 };
  const number = new Intl.NumberFormat(locale, options);
  const rate = (amount: number) => new Intl.NumberFormat(locale, { ...options, minimumFractionDigits: 0, maximumFractionDigits: amount < 10 ? 1 : 0 }).format(amount);
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const day = (n: number) => (Number.isFinite(n) ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(n * DAY)) : "–");

  const startDay = calendarDay(start, timeZone);
  const endDay = calendarDay(end, timeZone);
  const pace = paceOf(value, target, startDay, endDay, calendarDay(now ?? new Date(), timeZone));
  const hasTarget = target > 0;
  const reached = hasTarget && value >= target;
  const percentOfTarget = hasTarget ? new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(Math.max(0, value / target)) : null;

  const valueText = number.format(value);
  const targetText = number.format(target);

  let verdict: string;
  let Icon = IconCheckCircle;
  if (!hasTarget) {
    verdict = "No target set";
    Icon = IconCalendar;
  } else if (reached) {
    const over = value / target - 1;
    verdict = over >= 0.01 ? `Target reached, ${whole.format(over * 100)} percent over` : "Target reached";
  } else if (pace.phase === "unknown") {
    verdict = "No schedule given";
    Icon = IconCalendar;
  } else if (pace.phase === "over") {
    verdict = `Missed by ${number.format(pace.remaining)}`;
    Icon = IconTrendDown;
  } else if (pace.phase === "upcoming") {
    verdict = `Starts on ${day(startDay)}`;
    Icon = IconCalendar;
  } else if (pace.ratio !== null && Math.abs(pace.ratio) < 0.02) {
    verdict = "On pace";
  } else if (pace.ratio !== null && pace.ratio > 0) {
    // Early in a period an even pace is tiny, so the ratio explodes: from double the pace on it is said in words, never as "4,042 percent".
    verdict = pace.ratio >= 1 ? "Well ahead of pace" : `Ahead of pace by ${whole.format(pace.ratio * 100)} percent`;
    Icon = IconTrendUp;
  } else {
    verdict = `Behind: needs ${rate(pace.perDay ?? 0)} per day`;
    Icon = IconTrendDown;
  }

  // The tick is left out in the first and last 2 percent of the period: it would sit on the end of the bar and its halo would notch the fill.
  const showTick = hasTarget && pace.phase === "running" && pace.share >= 0.02 && pace.share <= 0.98;
  // Before the start "days left" is the whole period, and the daily rate is what it takes once it begins.
  const upcoming = pace.phase === "upcoming";
  const facts = [
    { term: upcoming ? "Per day once started" : "Needed per day", detail: pace.perDay === null ? (reached || pace.phase === "over" ? "None" : "–") : rate(pace.perDay) },
    { term: upcoming ? "Days in period" : "Days left", detail: pace.phase === "unknown" ? "–" : whole.format(pace.daysLeft) },
    { term: "Ends", detail: day(endDay) },
  ];

  return (
    <Card data-slot="target-pace-card" data-verdict={reached ? "reached" : pace.phase} className={cn("w-full gap-5", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-sm leading-snug font-medium">{label}</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-4xl leading-none font-medium tracking-[-0.04em] tabular-nums">{valueText}</span>
            <span className="text-sm text-muted-foreground tabular-nums">of {targetText}</span>
          </p>
          {percentOfTarget ? <p className="text-sm font-medium text-muted-foreground tabular-nums">{percentOfTarget}</p> : null}
        </div>

        <div className="grid gap-2">
          <div className="relative flex h-5 items-center">
            <Progress
              value={Math.max(0, Math.min(value, hasTarget ? target : 0))}
              max={hasTarget ? target : 1}
              aria-label={`${label}, progress towards the target`}
              aria-valuetext={`${valueText} of ${targetText}${percentOfTarget ? `, ${percentOfTarget}` : ""}`}
              className="h-2.5"
            />
            {showTick ? (
              <span
                aria-hidden="true"
                data-slot="target-pace-tick"
                style={{ left: `${pace.share * 100}%` }}
                className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-card"
              />
            ) : null}
          </div>
          {showTick ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              <span aria-hidden="true" className="inline-block h-3 w-0.5 rounded-full bg-foreground" />
              Even pace today: {number.format(pace.expected)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground tabular-nums">
              {pace.phase === "unknown" ? "No dates to measure pace against" : `${day(startDay)} to ${day(endDay)}`}
            </p>
          )}
        </div>

        <p className="flex items-center gap-2 text-sm font-medium">
          <Icon size={16} className="shrink-0" />
          {verdict}
        </p>
      </CardContent>

      <CardFooter className="border-t border-border">
        <dl className="flex w-full flex-wrap justify-between gap-x-4 gap-y-3">
          {facts.map((fact) => (
            <div key={fact.term}>
              <dt className="text-xs whitespace-nowrap text-muted-foreground">{fact.term}</dt>
              <dd className="mt-1 text-base font-medium tracking-[-0.01em] whitespace-nowrap tabular-nums">{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </CardFooter>
    </Card>
  );
}
