"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconCheck, IconClock, IconHourglass, IconLogOut } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { InlineConfirm } from "@rhs-ui/primitives/inline-confirm";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** The words the panel uses, for translation. `{position}`, `{total}`, `{time}`, `{low}`, `{high}`, `{moved}` and `{steps}` are filled in. */
export interface QueuePositionLabels {
  /** The small line above the number. Default "You are". */
  eyebrow?: string;
  /** After the number and its suffix. Default "in line". */
  inLine?: string;
  /** What a screen reader hears for your place. Default "You are {position} in line.". */
  sentence?: string;
  /** The line with when you joined, when you pass `joinedAt`. Default "In line since {time}". */
  joined?: string;
  /** How many are in line, when you pass `total`. Default "{total} in line". */
  waiting?: string;
  /** The name of the bar for a screen reader. Default "Progress through the line". */
  progressName?: string;
  /** The bar's text for a screen reader. Default "Moved up {moved} of {steps} places". */
  moved?: string;
  /** The wait, for under a minute. Default "Less than a minute". */
  estimateUnder?: string;
  /** The wait in minutes, as a range. Default "About {low} to {high} min". */
  estimateMinutes?: string;
  /** The wait in hours, as a range. Default "About {low} to {high} hours". */
  estimateHours?: string;
  /** The line under the wait. Default "An estimate, not a promise. It changes as the line moves.". */
  estimateNote?: string;
  /** The button that gives up the place. Default "Leave the line". */
  leave?: string;
  /** The question that replaces it. Default "Give up your place?". */
  leaveQuestion?: string;
  /** The button that confirms. Default "Leave". */
  leaveConfirm?: string;
  /** The heading when it is your turn. Default "It is your turn". */
  ready?: string;
  /** Under it, with the time left. Default "We are holding your spot for {time}.". */
  hold?: string;
  /** The action. Default "Enter now". */
  enter?: string;
  /** The heading once the hold ran out. Default "Your spot was released". */
  expired?: string;
  /** Under it. Default "The time to enter ran out, so the next person in line got the spot.". */
  expiredNote?: string;
  /** Said when your turn comes. Default "It is your turn. We are holding your spot for {time}.". */
  readySpoken?: string;
  /** Said when thirty seconds are left. Default "30 seconds left to enter.". */
  hurrySpoken?: string;
  /** Said when the hold ran out. Default "Your spot was released.". */
  expiredSpoken?: string;
}

export interface QueuePositionProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Your place in the line: 1 is next. */
  position: number;
  /** How many people are in the line, you included. Shown beside the bar. */
  total?: number;
  /** When you joined, as a Date or an ISO moment. Written as a time, in `timeZone`. */
  joinedAt?: Date | string | number;
  /** Your place when you joined: the bar fills from there to the front. Leave it out and the first place the panel sees is taken as the start; pass it when the page can reload mid-line. */
  startPosition?: number;
  /** How long the wait is likely to be, in seconds, as your server estimates it. It is written as a range ("About 3 to 5 min"), never as a promise. */
  estimateSeconds?: number;
  /** `waiting` shows the place and the wait; `ready` shows that it is your turn, with the action and the time the spot is held. Default `waiting`. */
  status?: "waiting" | "ready";
  /** Called when "Leave the line" is confirmed: the second press. Return a promise and the button waits for it. Leave it out and there is no Leave button. */
  onLeave?: () => unknown;
  /** Called when "Enter now" is pressed. Return a promise and the button shows a spinner meanwhile, and takes the focus back when it settles. */
  onEnter?: () => unknown;
  /** How long the spot is held once it is your turn, in seconds, counted from when the panel turns `ready`. Default 120. */
  holdSeconds?: number;
  /** When the held spot is released, as a moment from your server. Use it instead of `holdSeconds` when the page can reload while it is your turn. */
  holdEndsAt?: Date | string | number;
  /** Called once when the hold runs out. Take the spot away and set `status` back, or show your own message. */
  onExpire?: () => void;
  /** The suffixes for places, by the language's ordinal category: "14th". Default English: st, nd, rd, th. */
  ordinalSuffixes?: Partial<Record<Intl.LDMLPluralRule, string>>;
  /** The time zone the joining time is written in. Default "UTC". */
  timeZone?: string;
  /** The language of the numbers and the time. Default "en-US". */
  locale?: string;
  /** The words the panel uses, for translation. */
  labels?: QueuePositionLabels;
}

const DEFAULT_LABELS = {
  eyebrow: "You are",
  inLine: "in line",
  sentence: "You are {position} in line.",
  joined: "In line since {time}",
  waiting: "{total} in line",
  progressName: "Progress through the line",
  moved: "Moved up {moved} of {steps} places",
  estimateUnder: "Less than a minute",
  estimateMinutes: "About {low} to {high} min",
  estimateHours: "About {low} to {high} hours",
  estimateNote: "An estimate, not a promise. It changes as the line moves.",
  leave: "Leave the line",
  leaveQuestion: "Give up your place?",
  leaveConfirm: "Leave",
  ready: "It is your turn",
  hold: "We are holding your spot for {time}.",
  enter: "Enter now",
  expired: "Your spot was released",
  expiredNote: "The time to enter ran out, so the next person in line got the spot.",
  readySpoken: "It is your turn. We are holding your spot for {time}.",
  hurrySpoken: "30 seconds left to enter.",
  expiredSpoken: "Your spot was released.",
} satisfies Required<QueuePositionLabels>;

const DEFAULT_SUFFIXES: Record<string, string> = { one: "st", two: "nd", few: "rd", other: "th" };

/** The number counts through whole places only, never "11.852". A constant, because AnimatedNumber starts its count again whenever this object changes. */
const WHOLE = { maximumFractionDigits: 0 } as const;

/** How long the number takes to count to a new place, in ms: AnimatedNumber's own 0.7 s, and a little more. */
const COUNT_MS = 750;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/** A sentence with an element set in wherever `{name}` stands: the time left, the time joined. */
function Sentence({ template, name, value }: { template: string; name: string; value: ReactNode }) {
  const [before = "", ...rest] = template.split(`{${name}}`);
  if (!rest.length) return <>{before}</>;
  return (
    <>
      {before}
      {value}
      {rest.join(`{${name}}`)}
    </>
  );
}

/** The place at which a screen reader is told: every fifth place, then each of the last three. Between two steps nothing is said. */
function stepOf(position: number): number {
  return position <= 3 ? position : Math.ceil(position / 5) * 5;
}

/** Whether every place from `low` to `high` is written with `suffix`. Over a few hundred places it is not worth counting them out: the number is going too fast to read. */
function sameSuffix(low: number, high: number, suffix: string, suffixOf: (place: number) => string): boolean {
  if (high - low > 300) return false;
  for (let place = low; place <= high; place += 1) if (suffixOf(place) !== suffix) return false;
  return true;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/** A wait as a range of minutes or hours, a quarter either side of the estimate, so it reads as a likelihood and not a promise. */
function rangeOf(seconds: number): { kind: "under" | "minutes" | "hours"; low: number; high: number } {
  const minutes = seconds / 60;
  if (seconds < 45) return { kind: "under", low: 0, high: 1 };
  if (minutes < 10) {
    const low = Math.max(1, Math.round(minutes * 0.75));
    return { kind: "minutes", low, high: Math.max(low + 1, Math.round(minutes * 1.25)) };
  }
  if (minutes < 55) {
    const low = roundTo(minutes * 0.75, 5);
    return { kind: "minutes", low, high: Math.max(low + 5, roundTo(minutes * 1.25, 5)) };
  }
  // Hours are written to the half hour, so two hours is "1.5 to 2.5" and not "1 to 3".
  const hours = minutes / 60;
  const low = Math.max(0.5, roundTo(hours * 0.75, 0.5));
  return { kind: "hours", low, high: Math.max(low + 0.5, roundTo(hours * 1.25, 0.5)) };
}

function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function timeOf(input: Date | string | number | undefined, locale: string, timeZone: string): { iso: string; text: string } | null {
  if (input === undefined) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    // An unknown locale or zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return { iso: date.toISOString(), text: text.replace(/\s/g, " ") };
}

/**
 * A waiting-room panel for being in line: ticket drops, exports, rate-limited
 * jobs. It says "You are 14th in line" in large tabular figures that count
 * through whole places to the new place when it changes (the suffix steps
 * aside while it counts, when a place on the way would need another one: "3nd"
 * on the way from 5th to 2nd), a bar of how far you have moved since you
 * joined, and the wait as a range ("About 3 to 5 min"), never a promise. Leave
 * asks for a second press, because it gives up the place. When it is your
 * turn the panel changes to "It is your turn" with the action and the time
 * your spot is held, counting down, and says so if the time runs out. A screen
 * reader is told your place only at friendly steps (every fifth place, then
 * each of the last three) and the hold only when it starts, at thirty seconds
 * and at its end, so a line that moves fast does not flood it.
 */
export function QueuePosition({
  position,
  total,
  joinedAt,
  startPosition,
  estimateSeconds,
  status = "waiting",
  onLeave,
  onEnter,
  holdSeconds = 120,
  holdEndsAt,
  onExpire,
  ordinalSuffixes,
  timeZone = "UTC",
  locale = "en-US",
  labels,
  className,
  ...props
}: QueuePositionProps) {
  const text: Required<QueuePositionLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();

  const place = Math.max(1, Math.floor(Number.isFinite(position) ? position : 1));
  // The start of the bar is the place you joined at: given, or the farthest back this panel has seen.
  const [seenStart, setSeenStart] = useState(place);
  if (startPosition === undefined && place > seenStart) setSeenStart(place);
  const start = Math.max(place, Math.floor(startPosition ?? seenStart));
  const steps = Math.max(0, start - 1);
  const moved = start - place;

  const numbers = new Intl.NumberFormat(locale);
  const suffixes = { ...DEFAULT_SUFFIXES, ...ordinalSuffixes };
  const rules = new Intl.PluralRules(locale, { type: "ordinal" });
  const suffixOf = (value: number) => suffixes[rules.select(value)] ?? suffixes.other ?? "";
  const suffix = suffixOf(place);
  const placeText = `${numbers.format(place)}${suffix}`;
  const sentence = fill(text.sentence, { position: placeText });

  // The number counts to a new place for about 0.7 s, and it passes places that are written with another suffix than the new one: from 5th to 2nd it shows "4nd" and "3nd". So the suffix steps aside until the count is over, unless every place on the way takes the same one. It is worked out while rendering, so the new suffix is never on screen for a frame beside a number that is still on its way.
  const [trail, setTrail] = useState({ place, status, low: place, high: place, hidden: false });
  if (trail.place !== place || trail.status !== status) {
    // Only a number that stays on screen from one place to the next counts; one that has just appeared starts at its place.
    const counting = status === "waiting" && trail.status === "waiting";
    // A count that is interrupted goes on from where it was, so the places it has been heading for stay on the way.
    const low = counting ? Math.min(place, trail.place, trail.hidden ? trail.low : place) : place;
    const high = counting ? Math.max(place, trail.place, trail.hidden ? trail.high : place) : place;
    setTrail({ place, status, low, high, hidden: counting && !sameSuffix(low, high, suffix, suffixOf) });
  }
  useEffect(() => {
    if (!trail.hidden) return;
    const timer = window.setTimeout(() => setTrail((now) => ({ ...now, hidden: false })), COUNT_MS);
    return () => window.clearTimeout(timer);
  }, [trail]);

  // What is said when the place changes: only at a new step, and only forwards. The first place is the baseline, not news.
  const [said, setSaid] = useState({ id: 0, text: "" });
  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));
  const spoken = useRef(stepOf(place));
  useEffect(() => {
    if (status !== "waiting") return;
    const step = stepOf(place);
    if (step < spoken.current) say(sentence);
    spoken.current = step;
    // `sentence` follows `place`; only a change of place can speak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place, status]);

  // The hold: counted from when the panel turns ready, or to the moment your server gave.
  const [left, setLeft] = useState<number | null>(null);
  const [drain, setDrain] = useState(1);
  const [expired, setExpired] = useState(false);
  const expire = useRef(onExpire);
  const words = useRef(text);
  useEffect(() => {
    expire.current = onExpire;
    words.current = text;
  });
  // A number, so a Date made fresh on every render does not restart the hold.
  const given = holdEndsAt === undefined ? Number.NaN : new Date(holdEndsAt).getTime();
  useEffect(() => {
    if (status !== "ready") {
      setLeft(null);
      setDrain(1);
      setExpired(false);
      return;
    }
    const deadline = Number.isNaN(given) ? Date.now() + holdSeconds * 1000 : given;
    const length = Math.max(1, holdSeconds) * 1000;
    let hurried = false;
    let ended = false;
    const tick = () => {
      const remaining = Math.max(0, deadline - Date.now());
      const seconds = Math.ceil(remaining / 1000);
      setLeft(seconds);
      setDrain(Math.min(1, remaining / length));
      if (!hurried && seconds <= 30 && length > 40_000) {
        hurried = true;
        // A hold that starts under thirty seconds has nothing to hurry: the start already said so.
        if (remaining < length - 500) say(words.current.hurrySpoken);
      }
      if (remaining <= 0 && !ended) {
        ended = true;
        window.clearInterval(timer);
        setExpired(true);
        say(words.current.expiredSpoken);
        expire.current?.();
      }
    };
    say(fill(words.current.readySpoken, { time: clock(Math.ceil(Math.max(0, deadline - Date.now()) / 1000)) }));
    const timer = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(timer);
  }, [status, holdSeconds, given]);

  const joined = timeOf(joinedAt, locale, timeZone);
  const estimate = estimateSeconds === undefined || !Number.isFinite(estimateSeconds) ? null : rangeOf(Math.max(0, estimateSeconds));
  const estimateText = estimate
    ? fill(estimate.kind === "under" ? text.estimateUnder : estimate.kind === "minutes" ? text.estimateMinutes : text.estimateHours, { low: numbers.format(estimate.low), high: numbers.format(estimate.high) })
    : "";

  const [entering, setEntering] = useState(false);
  const enterButton = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  // A disabled button cannot keep the focus, so the browser lets go of it while the request runs. When the button is back the focus returns to it, unless the person has moved on by then.
  useEffect(() => {
    if (entering || !refocus.current) return;
    refocus.current = false;
    if (!document.activeElement || document.activeElement === document.body) enterButton.current?.focus({ preventScroll: true });
  }, [entering]);
  async function enter() {
    if (entering) return;
    const result = onEnter?.();
    if (!isThenable(result)) return;
    refocus.current = document.activeElement === enterButton.current;
    setEntering(true);
    try {
      await result;
    } catch {
      // Your app shows its own error; the button just comes back.
    } finally {
      setEntering(false);
    }
  }

  const shell = "w-full rounded-xl border bg-card p-5 text-card-foreground sm:p-6";
  const live = (
    <span role="status" className="sr-only">
      <span key={said.id}>{said.text}</span>
    </span>
  );

  if (status === "ready") {
    return (
      <section data-slot="queue-position" data-status={expired ? "expired" : "ready"} aria-labelledby={`${id}-title`} className={cn(shell, expired ? "border-border shadow-xs" : "border-foreground/80 shadow-xs", className)} {...props}>
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-full [&_svg]:size-5", expired ? "border border-border bg-muted text-muted-foreground" : "bg-foreground text-background")}>
            {expired ? <IconHourglass /> : <IconCheck />}
          </span>
          <div className="min-w-0 pt-px">
            <h3 id={`${id}-title`} className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">
              {expired ? text.expired : text.ready}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
              {expired ? (
                text.expiredNote
              ) : (
                // The time left is for the eye: a status line that changed every second would be read out every second.
                <Sentence template={text.hold} name="time" value={<span className="font-medium text-foreground tabular-nums">{left === null ? clock(holdSeconds) : clock(left)}</span>} />
              )}
            </p>
          </div>
        </div>
        {expired ? null : (
          <>
            <Progress value={Math.round(drain * 1000)} max={1000} aria-label={fill(text.hold, { time: left === null ? clock(holdSeconds) : clock(left) })} className="mt-5 h-1.5 [&>*]:duration-300 [&>*]:ease-linear" />
            {onEnter ? (
              <Button ref={enterButton} type="button" size="lg" loading={entering} onClick={() => void enter()} className="mt-5 w-full sm:w-auto">
                {text.enter}
              </Button>
            ) : null}
          </>
        )}
        {live}
      </section>
    );
  }

  return (
    <section data-slot="queue-position" data-status="waiting" aria-label={sentence} className={cn(shell, "border-border shadow-xs", className)} {...props}>
      {/* The big figures are for the eye: the sentence for a screen reader is the label of the panel, and the status below speaks at friendly steps only. */}
      <div aria-hidden="true">
        <p className="text-sm text-muted-foreground">{text.eyebrow}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-foreground">
          <span className="inline-flex items-baseline">
            <AnimatedNumber value={place} locale={locale} format={WHOLE} className="text-5xl leading-none font-semibold tracking-[-0.05em] sm:text-6xl" />
            <span
              className={cn(
                "ml-1 text-xl leading-none font-medium tracking-[-0.02em] text-muted-foreground transition-opacity motion-reduce:transition-none sm:text-2xl",
                // It goes at once and comes back softly. Under reduced motion the number jumps, so the suffix stays.
                trail.hidden ? "opacity-0 duration-0 motion-reduce:opacity-100" : "opacity-100 duration-200",
              )}
            >
              {suffix}
            </span>
          </span>
          <span className="text-xl leading-none font-medium tracking-[-0.02em] text-muted-foreground sm:text-2xl">{text.inLine}</span>
        </p>
      </div>

      <div className="mt-5">
        <Progress
          value={moved}
          max={Math.max(1, steps)}
          aria-label={text.progressName}
          getValueLabel={() => fill(text.moved, { moved: numbers.format(moved), steps: numbers.format(steps) })}
          className="h-1.5"
        />
        {joined || total !== undefined ? (
          <p className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs leading-snug text-muted-foreground tabular-nums">
            {joined ? (
              <span>
                <Sentence template={text.joined} name="time" value={<time dateTime={joined.iso} suppressHydrationWarning>{joined.text}</time>} />
              </span>
            ) : (
              <span />
            )}
            {total !== undefined ? <span>{fill(text.waiting, { total: numbers.format(total) })}</span> : null}
          </p>
        ) : null}
      </div>

      {estimate || onLeave ? (
        <div className="mt-5 grid gap-4 border-t border-border pt-5">
          {estimate ? (
            <div className="flex items-start gap-3">
              <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm leading-snug font-medium tabular-nums">{estimateText}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{text.estimateNote}</p>
              </div>
            </div>
          ) : null}
          {onLeave ? (
            // The ghost button is pulled back by its own padding so its words line up with the rest; the question that replaces it is not.
            <div className="flex [&>[data-slot=button]]:-ml-3">
              <InlineConfirm question={text.leaveQuestion} confirmLabel={text.leaveConfirm} onConfirm={async () => void (await onLeave())} className="text-muted-foreground [&>span]:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_28%)]">
                <IconLogOut />
                {text.leave}
              </InlineConfirm>
            </div>
          ) : null}
        </div>
      ) : null}
      {live}
    </section>
  );
}
