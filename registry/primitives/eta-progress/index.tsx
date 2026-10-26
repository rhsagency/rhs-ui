"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Progress } from "@rhs-ui/primitives/progress";
import { formatDuration, nextDisplay, type EtaDisplay, type EtaSample, type EtaUnits } from "@rhs-ui/primitives/eta-progress/estimate";
import { cn } from "@/lib/utils";

export type { EtaDisplay, EtaSample, EtaUnits } from "@rhs-ui/primitives/eta-progress/estimate";

/** The words of the line under the bar, for another language or your own wording. */
export interface EtaLabels {
  /** For the first seconds, before there is a pace to read. Default "Calculating". */
  calculating: string;
  /** In the last seconds. Default "Almost done". */
  almostDone: string;
  /** The time left. {time} is "40 s", "2 min" or "1 hr 20 min". Default "About {time} left". */
  left: string;
  /** When the work is done. {time} is how long it took. Default "Finished in {time}". */
  finished: string;
  /** When it is done and nobody saw how long it took. Default "Finished". */
  finishedNow: string;
  /** The units in {time}. Default s, min and hr. */
  units: EtaUnits;
}

export interface EtaProgressProps extends Omit<ComponentProps<"div">, "children"> {
  /** How far along the work is, from 0 to 1. */
  value: number;
  /** When the work began, as a timestamp in ms or a Date. The pace is measured from here. */
  startedAt: number | Date;
  /** When the work finished, if you know it. Otherwise the time it took is read from the moment the value reached 1, and a bar that first appears finished just says "Finished". */
  finishedAt?: number | Date;
  /** What is being worked on, written above the bar and used as its name: "Exporting 4,820 orders". */
  label?: string;
  /** The current time in ms. Pass it to freeze the clock for a test or a snapshot. Default: the real time, read each second. */
  now?: number;
  /** The words of the line under the bar. */
  labels?: Partial<Omit<EtaLabels, "units">> & { units?: Partial<EtaUnits> };
  /** The locale the percentage is written in. Default "en-US". */
  locale?: string;
  /** For this long after the start it only says "Calculating", in ms. Default 4000. */
  calculatingFor?: number;
  /** The least time between two announcements of the sentence, in ms. Default 15000. */
  announceEvery?: number;
  /** Show the percentage next to the label. Default true. */
  showValue?: boolean;
}

const LABELS: EtaLabels = {
  calculating: "Calculating",
  almostDone: "Almost done",
  left: "About {time} left",
  finished: "Finished in {time}",
  finishedNow: "Finished",
  units: { s: "s", min: "min", hr: "hr" },
};

const toMs = (moment: number | Date): number => (typeof moment === "number" ? moment : moment.getTime());

/** A beat every second while the work runs, so the estimate keeps moving when the value does not. Nothing on the server or in the first paint: they never guess a clock. */
function useBeat(fixed: number | undefined, running: boolean): number {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (fixed !== undefined || !running) return;
    const timer = window.setInterval(() => setBeat((count) => count + 1), 1000);
    return () => window.clearInterval(timer);
  }, [fixed, running]);
  return beat;
}

/** The sentence, said at most once in `every` ms: the first as soon as there is one, the rest on that beat, and always the latest. `urgent` skips the wait. */
function useSpoken(text: string, every: number, urgent: boolean): string {
  const [said, setSaid] = useState("");
  const last = useRef(Number.NEGATIVE_INFINITY);
  useEffect(() => {
    if (!text) return;
    const wait = urgent ? 0 : last.current + every - Date.now();
    if (wait <= 0) {
      last.current = Date.now();
      setSaid(text);
      return;
    }
    const timer = window.setTimeout(() => {
      last.current = Date.now();
      setSaid(text);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [text, every, urgent]);
  return said;
}

/**
 * A progress bar that says how long is left, from the real pace so far. The
 * estimate blends the recent pace with the pace of the whole run, rounds to
 * friendly steps (5 seconds, then 10, then minutes) and only changes when it has
 * moved meaningfully, so the text stays calm. It says "Calculating" for the first
 * seconds instead of a wild guess, "Almost done" near the end and "Finished in
 * 1 min 20 s" on completion. The bar is a progressbar whose value text holds the
 * sentence, and the sentence is announced at most every 15 seconds, the finish
 * at once. Feed it `value` as your work reports it and the time it started; the
 * clock is its own.
 */
export function EtaProgress({ value, startedAt, finishedAt, label, now, labels, locale = "en-US", calculatingFor = 4000, announceEvery = 15000, showValue = true, className, ...props }: EtaProgressProps) {
  const id = useId();
  const words: EtaLabels = { ...LABELS, ...labels, units: { ...LABELS.units, ...labels?.units } };
  const fraction = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const done = fraction >= 1;
  const started = toMs(startedAt);
  const ended = finishedAt === undefined ? null : toMs(finishedAt);
  const beat = useBeat(now, !done);

  const samples = useRef<EtaSample[]>([]);
  const saw = useRef(false);
  // With a frozen clock the first paint already has the answer; with the real one it says "Calculating", the same on the server and in the browser.
  const [shown, setShown] = useState<EtaDisplay>(() =>
    nextDisplay({ kind: "calculating" }, { samples: now === undefined ? [] : [{ at: now, value: fraction }], startedAt: started, now: now ?? started, value: fraction, calculatingFor, finishedAt: ended }),
  );

  // A different start is a different run: forget the pace of the last one.
  const run = useRef(started);
  useEffect(() => {
    if (run.current === started) return;
    run.current = started;
    samples.current = [];
    saw.current = false;
    setShown({ kind: "calculating" });
  }, [started]);

  useEffect(() => {
    const at = now ?? Date.now();
    const list = samples.current;
    const last = list[list.length - 1];
    // The bar went back: a new run, so the old pace is no use.
    if (last && fraction < last.value - 0.02) list.length = 0;
    if (fraction < 1) saw.current = true;
    if (fraction < 1 && (!last || last.value !== fraction || at - last.at >= 1000)) list.push({ at, value: fraction });
    while (list.length > 1 && list[0] && at - list[0].at > 30_000) list.shift();
    const finish = ended ?? (saw.current ? at : null);
    setShown((previous) => nextDisplay(previous, { samples: list, startedAt: started, now: at, value: fraction, calculatingFor, finishedAt: finish }));
  }, [beat, now, fraction, started, ended, calculatingFor]);

  const sentence =
    shown.kind === "calculating"
      ? words.calculating
      : shown.kind === "almost"
        ? words.almostDone
        : shown.kind === "left"
          ? words.left.replace("{time}", formatDuration(shown.seconds, words.units))
          : shown.seconds === null
            ? words.finishedNow
            : words.finished.replace("{time}", formatDuration(shown.seconds, words.units));
  const percent = done ? 100 : Math.min(99, Math.floor(fraction * 100));
  const percentText = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(percent / 100);
  const said = useSpoken(shown.kind === "calculating" ? "" : sentence, announceEvery, shown.kind === "finished");

  return (
    <div data-slot="eta-progress" data-state={done ? "complete" : "loading"} className={cn("grid gap-2", className)} {...props}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        {label ? (
          <span id={`${id}-label`} className="min-w-0 font-medium">
            {label}
          </span>
        ) : (
          <span />
        )}
        {showValue ? (
          <span aria-hidden="true" className="shrink-0 tabular-nums text-muted-foreground">
            {percentText}
          </span>
        ) : null}
      </div>
      <Progress
        value={percent}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={label ? undefined : "Progress"}
        getValueLabel={() => `${percentText}. ${sentence}`}
        className="h-2"
      />
      <p className={cn("flex min-h-5 items-center gap-1.5 text-[0.8125rem] tabular-nums", done ? "font-medium text-foreground" : "text-muted-foreground")}>
        {done ? <IconCheck size={14} strokeWidth={2.5} aria-hidden="true" /> : null}
        <span key={sentence} className="motion-safe:animate-rhs-fade-in">
          {sentence}
        </span>
      </p>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
