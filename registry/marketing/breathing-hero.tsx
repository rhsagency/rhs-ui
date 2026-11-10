"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface BreathingPattern {
  /** Seconds of breathing in. */
  in: number;
  /** Seconds of holding. 0 skips it. */
  hold: number;
  /** Seconds of breathing out. */
  out: number;
}

export interface BreathingHeroLabels {
  /** The words in the ring while the ring grows. */
  in: string;
  /** The words while it rests. */
  hold: string;
  /** The words while it shrinks. */
  out: string;
  /** What a screen reader hears when the ring is paused. */
  paused: string;
  /** The pause button. */
  pause: string;
  /** The button that continues. */
  resume: string;
  /** The caption under the first part of the timing line, with its length. {count} stands for the seconds. Default "In {count}s". */
  timeIn: string;
  /** The caption under the second part. {count} stands for the seconds. Default "Hold {count}s". */
  timeHold: string;
  /** The caption under the third part. {count} stands for the seconds. Default "Out {count}s". */
  timeOut: string;
}

export interface BreathingHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** Seconds in, hold and out. Default 4, 4 and 6. */
  pattern?: BreathingPattern;
  /** The promise under the ring. */
  title: string;
  /** One line under the title. */
  description?: string;
  /** The label of the main button. */
  cta?: string;
  /** Called when the main button is pressed: start the session in your app. */
  onStart?: () => void;
  /** Where the main button goes, when it is a link rather than an action. */
  ctaHref?: string;
  /** Stops the ring and the clock. Give it to control the pause yourself, with onPausedChange; leave it out to let the button do it. */
  paused?: boolean;
  /** Whether the ring starts paused, when `paused` is not given. */
  defaultPaused?: boolean;
  /** Called with the new state when the pause button is pressed. */
  onPausedChange?: (paused: boolean) => void;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<BreathingHeroLabels>;
  /** Classes for the section. */
  className?: string;
}

type Phase = "in" | "hold" | "out";

const PHASES: readonly Phase[] = ["in", "hold", "out"];
const PATTERN: BreathingPattern = { in: 4, hold: 4, out: 6 };
const LABELS: BreathingHeroLabels = {
  in: "Breathe in",
  hold: "Hold",
  out: "Breathe out",
  paused: "Paused",
  pause: "Pause",
  resume: "Resume",
  timeIn: "In {count}s",
  timeHold: "Hold {count}s",
  timeOut: "Out {count}s",
};

/**
 * A wellness opening where the demo is the pitch: a ring that breathes. It
 * grows while you breathe in, rests, and shrinks while you breathe out on a 4,
 * 4 and 6 second rhythm (or yours), the phase is written in the ring and
 * announced politely each time it changes, and under it come the title, a line
 * and the button that starts a session. The ring is driven by CSS animations
 * that take their length from the pattern, so there is no script per frame;
 * the one timer only wakes at each change of phase to update the words. A
 * Pause and Resume button is always there, as WCAG asks of anything that moves
 * by itself. Under reduced motion the ring stays still, and the words and a
 * thin progress line in three named parts, one per phase ("In 4s", "Hold 4s",
 * "Out 6s"), carry the timing instead. Other props, an id for a nav anchor,
 * aria or data attributes and a ref, go to the section.
 */
export function BreathingHero({
  titleAs: Title = "h2",
  pattern = PATTERN,
  title,
  description,
  cta = "Start a 3-minute session",
  onStart,
  ctaHref,
  paused: controlled,
  defaultPaused = false,
  onPausedChange,
  labels: custom,
  className,
  ...props
}: BreathingHeroProps) {
  const words = { ...LABELS, ...custom };
  /** The caption under each part of the timing line. */
  const timing: Record<Phase, string> = { in: words.timeIn, hold: words.timeHold, out: words.timeOut };
  const id = useId();
  const seconds: Record<Phase, number> = { in: Math.max(0.5, pattern.in), hold: Math.max(0, pattern.hold), out: Math.max(0.5, pattern.out) };
  const steps = PHASES.filter((phase) => seconds[phase] > 0);
  const [phase, setPhase] = useState<Phase>("in");
  // The ring waits for the page to be alive, so its clock and the words start together.
  const [live, setLive] = useState(false);
  const [resting, setResting] = useState(defaultPaused);
  const paused = controlled ?? resting;
  /** How long is left of the current phase, so a pause continues where it stopped. */
  const left = useRef(0);
  const shape = `${seconds.in}/${seconds.hold}/${seconds.out}`;

  useEffect(() => setLive(true), []);

  useEffect(() => {
    left.current = 0;
  }, [shape]);

  useEffect(() => {
    if (!live || paused) return;
    const wait = left.current > 0 ? left.current : (seconds[phase] || 0) * 1000;
    const began = performance.now();
    let fired = false;
    const timer = window.setTimeout(() => {
      fired = true;
      left.current = 0;
      setPhase((now) => steps[(steps.indexOf(now) + 1) % steps.length] ?? "in");
    }, wait);
    return () => {
      window.clearTimeout(timer);
      if (!fired) left.current = Math.max(0, wait - (performance.now() - began));
    };
    // steps and seconds follow shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, paused, phase, shape]);

  const toggle = () => {
    const next = !paused;
    if (controlled === undefined) setResting(next);
    onPausedChange?.(next);
  };

  const order = steps.indexOf(phase);

  return (
    <section data-slot="breathing-hero" aria-labelledby={`${id}-title`} className={cn("py-14 text-center sm:py-20", className)} {...props}>
      <div className="relative mx-auto grid size-[min(78vw,19rem)] place-items-center sm:size-[21rem]">
        {/* The full breath is the outer line; the dashed line is the smallest one. The ring moves between them. */}
        <span aria-hidden="true" className="absolute inset-0 rounded-full border border-border" />
        <span
          aria-hidden="true"
          data-phase={phase}
          data-live={live}
          data-paused={paused}
          // Length and play state are inline: they have to win over the animation shorthand of the class, in whatever order the styles land.
          style={{ animationDuration: `${phase === "out" ? seconds.out : seconds.in}s`, animationPlayState: paused ? "paused" : "running" }}
          className={cn(
            "absolute inset-0 rounded-full border border-foreground/25 bg-foreground/[0.05] scale-[0.6] motion-reduce:scale-100",
            "data-[phase=hold]:scale-100",
            "motion-safe:data-[live=true]:data-[phase=in]:animate-rhs-breathe-in motion-safe:data-[live=true]:data-[phase=out]:animate-rhs-breathe-out",
          )}
        >
          {/* A second disc inside the first, so the ring has a depth that scales with it. */}
          <span className="absolute inset-[14%] rounded-full bg-foreground/[0.05]" />
        </span>
        <span aria-hidden="true" className="absolute inset-[20%] rounded-full border border-dashed border-foreground/25 motion-reduce:hidden" />
        <p aria-hidden="true" className="relative text-xl font-medium tracking-[-0.025em] sm:text-2xl">
          {words[phase]}
        </p>
        <p role="status" className="sr-only">
          {live ? (paused ? words.paused : words[phase]) : ""}
        </p>
      </div>

      <div className="mx-auto mt-6 grid w-[min(78vw,19rem)] gap-2 sm:w-[21rem]" style={{ gridTemplateColumns: steps.map((step) => `${seconds[step]}fr`).join(" ") }} aria-hidden="true">
        {steps.map((step, index) => {
          const state = !live ? "idle" : index < order ? "done" : index === order ? "active" : "idle";
          return (
            <div key={step} className="grid gap-1.5 text-left">
              <span className="relative h-0.5 overflow-hidden rounded-full bg-border">
                <span
                  data-state={state}
                  style={{ animationDuration: `${seconds[step]}s`, animationPlayState: paused ? "paused" : "running" }}
                  className="absolute inset-0 origin-left scale-x-0 rounded-full bg-foreground data-[state=active]:animate-rhs-breathe-fill data-[state=done]:scale-x-100"
                />
              </span>
              <span className={cn("text-xs tabular-nums transition-colors duration-200 motion-reduce:transition-none", step === phase ? "font-medium text-foreground" : "text-muted-foreground")}>
                {timing[step].replace("{count}", String(seconds[step]))}
              </span>
            </div>
          );
        })}
      </div>

      <Title id={`${id}-title`} className="mx-auto mt-10 max-w-xl text-4xl leading-[1.04] font-medium tracking-[-0.045em] text-balance sm:text-5xl">
        {title}
      </Title>
      {description ? <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {ctaHref ? (
          <Button asChild size="lg">
            <a href={ctaHref}>{cta}</a>
          </Button>
        ) : (
          <Button size="lg" onClick={onStart}>
            {cta}
          </Button>
        )}
        <Button type="button" variant="outline" size="lg" onClick={toggle}>
          {paused ? <IconPlay fill="currentColor" /> : <IconPause />}
          {paused ? words.resume : words.pause}
        </Button>
      </div>
    </section>
  );
}
