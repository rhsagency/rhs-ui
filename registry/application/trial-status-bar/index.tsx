"use client";

import { useEffect, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconClock, IconHourglass } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

import { dayCount, dayText, momentOf, trialStatus, type TrialStatus } from "./days";

/** The words the bar uses, for translation. `{count}` and `{date}` are filled in. */
export interface TrialStatusBarLabels {
  /** The sentence with four days or more left. Default "Trial: {count} days left". */
  left?: string;
  /** With two or three days left, in a firmer tone. Default "Trial ends in {count} days". */
  endsIn?: string;
  /** The day before the end. Default "Trial ends tomorrow". */
  tomorrow?: string;
  /** The last day. Default "Trial ends today". */
  today?: string;
  /** After the end. Default "Your trial has ended". */
  ended?: string;
  /** The date of the end, in quieter type beside the sentence. Default "Ends {date}". */
  endsOn?: string;
  /** The same after the end. Default "Ended {date}". */
  endedOn?: string;
  /** The button. Default "Upgrade". */
  upgrade?: string;
  /** The name of the bar for a screen reader. Default "Trial status". */
  region?: string;
}

export interface TrialStatusBarProps extends Omit<ComponentProps<"section">, "children"> {
  /** When the trial started, as an ISO moment: "2026-10-31T09:00:00Z". It sets how much of the trial has gone. */
  startedAt: string | number | Date;
  /** When the trial ends, as an ISO moment. The days left are counted from it in calendar days. */
  endsAt: string | number | Date;
  /** Called when Upgrade is pressed. */
  onUpgrade?: () => void;
  /** Makes Upgrade a link to your pricing or checkout instead of a button. `onUpgrade` still runs first. */
  upgradeHref?: string;
  /** The time zone the days are counted in, so the number does not flicker around midnight and the server and the browser agree. Default "UTC". Pass the zone the account lives in. */
  timeZone?: string;
  /** Pins the moment the days are counted from, for previews and tests. Leave it out to use the browser's clock, read once the page is live and then every minute. */
  now?: string | number | Date;
  /** The language of the numbers and of the date. Default "en-US". */
  locale?: string;
  /** The words the bar uses, for translation. */
  labels?: TrialStatusBarLabels;
}

const DEFAULT_LABELS = {
  left: "Trial: {count} days left",
  endsIn: "Trial ends in {count} days",
  tomorrow: "Trial ends tomorrow",
  today: "Trial ends today",
  ended: "Your trial has ended",
  endsOn: "Ends {date}",
  endedOn: "Ended {date}",
  upgrade: "Upgrade",
  region: "Trial status",
} satisfies Required<TrialStatusBarLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * The browser's clock, read as soon as the page is live and then every minute,
 * and again the moment a sleeping tab is looked at. Null on the server and
 * before hydration, so both draw the same bar.
 */
function useClock(pinned: number | null): number | null {
  const [tick, setTick] = useState<number | null>(null);
  useEffect(() => {
    if (pinned !== null) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    const wake = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [pinned]);
  return pinned ?? tick;
}

/** The icon says how close the end is before a word is read. */
const ICON: Record<TrialStatus["tone"], React.JSX.Element> = {
  calm: <IconClock />,
  firm: <IconHourglass />,
  ended: <IconAlertCircle />,
};

/**
 * A header strip that counts the days left in a trial: "Trial: 12 days left",
 * the date it ends, a thin track of how much of the trial has gone, and an
 * Upgrade button. It gets firmer as the end comes: from three days on the
 * sentence changes ("Trial ends in 3 days", "Trial ends tomorrow", "Trial ends
 * today"), the bar turns solid and Upgrade stands out, and after the end it
 * reads "Your trial has ended" with the same action. Days are counted as
 * calendar days in the time zone you give, so the number never flickers around
 * midnight. The strip keeps its height until the browser's clock is read, so
 * the page does not jump, and the track is hidden from assistive technology
 * because the sentence already says the same.
 */
export function TrialStatusBar({ startedAt, endsAt, onUpgrade, upgradeHref, timeZone = "UTC", now, locale = "en-US", labels, className, ...props }: TrialStatusBarProps) {
  const text: Required<TrialStatusBarLabels> = { ...DEFAULT_LABELS, ...labels };
  const pinned = now === undefined ? null : momentOf(now);
  const at = useClock(pinned);
  const started = momentOf(startedAt);
  const ends = momentOf(endsAt);
  const status = at === null || ends === null ? null : trialStatus({ now: at, startedAt: started, endsAt: ends, timeZone });

  const count = status ? dayCount(status.daysLeft, locale) : "";
  const sentence = status
    ? { calm: fill(text.left, { count }), firm: status.daysLeft === 0 ? text.today : status.daysLeft === 1 ? text.tomorrow : fill(text.endsIn, { count }), ended: text.ended }[status.tone]
    : "";
  const date = ends === null ? null : dayText(ends, locale, timeZone);

  const inverted = status !== null && status.tone !== "calm";
  // Upgrade is an outline while there is time, and a solid button in the page's inverse once the bar turns solid.
  // The solid bar is the colour of the focus ring, so on it the ring takes the opposite token: a halo of the page background.
  const loud = cn("shrink-0", inverted && "border-transparent bg-background text-foreground hover:bg-background/90 focus-visible:border-background focus-visible:ring-background/70");

  return (
    <section
      data-slot="trial-status-bar"
      data-tone={status?.tone}
      aria-label={text.region}
      className={cn(
        "relative w-full border-b border-border",
        inverted ? "bg-foreground text-background" : "bg-card text-card-foreground",
        "transition-colors duration-200 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <div className="flex min-h-12 items-center px-4 py-2 sm:px-6">
        {status ? (
          // The words come in with a short fade once the clock is read, so the strip does not pop.
          <div className="flex w-full items-center justify-between gap-x-4 gap-y-2 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
            <p className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm leading-5">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="grid shrink-0 place-items-center [&_svg]:size-4">
                  {ICON[status.tone]}
                </span>
                <span className={cn("min-w-0 tabular-nums", status.tone === "calm" ? "font-medium" : "font-semibold")}>{sentence}</span>
              </span>
              {date ? <span className={cn("text-xs tabular-nums", inverted ? "text-background/75" : "text-muted-foreground")}>{fill(status.tone === "ended" ? text.endedOn : text.endsOn, { date })}</span> : null}
            </p>
            {upgradeHref ? (
              <Button asChild size="sm" variant={inverted ? "default" : "outline"} onClick={onUpgrade} className={loud}>
                <a href={upgradeHref}>{text.upgrade}</a>
              </Button>
            ) : (
              <Button type="button" size="sm" variant={inverted ? "default" : "outline"} onClick={onUpgrade} className={loud}>
                {text.upgrade}
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {status && status.elapsed !== null ? (
        <div aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-[3px]", inverted ? "bg-background/20" : "bg-muted")}>
          <div className={cn("h-full rounded-r-full transition-[width] duration-500 motion-reduce:transition-none", inverted ? "bg-background/60" : "bg-foreground/60")} style={{ width: `${Math.round(status.elapsed * 100)}%` }} />
        </div>
      ) : null}
    </section>
  );
}
