"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** The words of the loader, for another language or your own wording. */
export interface SlowLoadingStateLabels {
  /** The reassuring line after the first threshold. Default "This is taking longer than usual". */
  slow: string;
  /** What a screen reader is told when the buttons arrive. Default "You can cancel or try again." */
  options: string;
  /** The text on the first button. Default "Cancel". */
  cancel: string;
  /** The text on the second. Default "Try again". */
  retry: string;
}

export interface SlowLoadingStateProps extends Omit<ComponentProps<"div">, "children"> {
  /** True while the wait lasts. Everything starts over each time it turns true. */
  loading: boolean;
  /** What is being waited for, in the present tense: "Generating your report". Default "Loading". */
  label?: string;
  /** When the loader says more, in ms from the start of the wait: first the reassuring line, then Cancel and Try again. Default [8000, 20000]. */
  thresholds?: readonly [number, number];
  /** How long the wait is silent before anything shows, in ms, so a quick one never flashes. Default 300. */
  delay?: number;
  /** Adds a Cancel button once the second threshold has passed. Stop the work and set `loading` to false here. Focus rests on this component until you move it to the content, or to the control that started the wait. */
  onCancel?: () => void;
  /** Adds a Try again button once the second threshold has passed. Start the work again here; the stages start over. */
  onRetry?: () => void;
  /** The words of the loader. */
  labels?: Partial<SlowLoadingStateLabels>;
  /** What to show when the wait is over. */
  children?: ReactNode;
}

const LABELS: SlowLoadingStateLabels = { slow: "This is taking longer than usual", options: "You can cancel or try again.", cancel: "Cancel", retry: "Try again" };

/** -1 is silent, 0 is the spinner and the label, 1 adds the reassuring line, 2 adds the buttons. */
type Stage = -1 | 0 | 1 | 2;

function stageAt(elapsed: number, delay: number, slow: number, stuck: number): Stage {
  return elapsed >= stuck ? 2 : elapsed >= slow ? 1 : elapsed >= delay ? 0 : -1;
}

/**
 * A loader that gets more honest the longer the wait. For the first moments
 * (`delay`, 300 ms) it shows nothing, so a quick load never flashes. Then a
 * spinner and what is being waited for. After the first threshold (8 s) it adds
 * "This is taking longer than usual", and after the second (20 s) it offers
 * Cancel and Try again, so a bare spinner never leaves anyone guessing. Each
 * stage is announced politely; the thresholds are plain numbers you can change;
 * and everything starts over when `loading` flips or Try again is pressed, which
 * goes straight to the spinner because the person has just acted. The two
 * buttons go when they are used, so keyboard focus rests on the component
 * itself and nobody is thrown back to the top of the page. Use it for blocking
 * waits, such as generating a report or opening a large file, and give it the
 * content that appears when the wait is over.
 */
export function SlowLoadingState({ loading, label = "Loading", thresholds = [8000, 20000], delay = 300, onCancel, onRetry, labels, children, className, ...props }: SlowLoadingStateProps) {
  const words = { ...LABELS, ...labels };
  const [slowAt, stuckAt] = thresholds;
  const [attempt, setAttempt] = useState(0);
  const retried = useRef(false);
  const [stage, setStage] = useState<Stage>(() => (loading ? stageAt(0, delay, slowAt, stuckAt) : -1));

  useEffect(() => {
    if (!loading) {
      setStage(-1);
      return;
    }
    // After Try again there is no silent moment: the person has just asked for something and should see it happen.
    const quiet = retried.current ? 0 : delay;
    retried.current = false;
    const timers: number[] = [];
    let now: Stage = -1;
    for (const [at, next] of [[quiet, 0], [slowAt, 1], [stuckAt, 2]] as const) {
      if (at <= 0) now = next;
      else timers.push(window.setTimeout(() => setStage(next), at));
    }
    setStage(now);
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [loading, delay, slowAt, stuckAt, attempt]);

  const said = !loading ? "" : stage === 0 ? label : stage === 1 ? words.slow : stage === 2 ? words.options : "";

  /** The button that was pressed is about to go: park focus on the component so a keyboard user keeps their place. */
  function holdFocus(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.closest<HTMLElement>('[data-slot="slow-loading-state"]')?.focus({ preventScroll: true });
  }

  return (
    <>
      <div
        data-slot="slow-loading-state"
        data-stage={loading && stage >= 0 ? stage : undefined}
        aria-busy={loading || undefined}
        // Never in the tab order: only a place for focus to rest while a button is gone.
        tabIndex={-1}
        className={cn("relative outline-none", className)}
        {...props}
      >
        {loading ? (
          <div className="flex flex-col items-center px-6 py-10 text-center text-sm">
            {stage >= 0 ? (
              <div className="grid justify-items-center gap-1 motion-safe:animate-rhs-fade-in">
                <Spinner size={22} label="" aria-hidden="true" role="presentation" className="mb-2 text-foreground" />
                <p className="font-medium">{label}</p>
              </div>
            ) : null}
            {stage >= 1 ? <p className="mt-1 text-muted-foreground motion-safe:animate-rhs-fade-in">{words.slow}</p> : null}
            {stage >= 2 ? (
              <div className="mt-5 flex flex-wrap justify-center gap-2 motion-safe:animate-rhs-fade-in">
                {onCancel ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      holdFocus(event);
                      onCancel();
                    }}
                  >
                    {words.cancel}
                  </Button>
                ) : null}
                {onRetry ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      holdFocus(event);
                      retried.current = true;
                      setAttempt((count) => count + 1);
                      onRetry();
                    }}
                  >
                    <IconRefresh />
                    {words.retry}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          children
        )}
      </div>
      {/* Outside the busy region: a live region inside aria-busy is held back by some screen readers until the region is no longer busy. */}
      <span role="status" className="sr-only">
        {said}
      </span>
    </>
  );
}
