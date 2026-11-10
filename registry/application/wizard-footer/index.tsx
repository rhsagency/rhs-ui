"use client";

import { useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconArrowLeft, IconInfo, IconSpinner } from "@rhs-ui/icons";
import { clampStep, DEFAULT_LABELS, fill, messageOf, type WizardFooterLabels } from "@rhs-ui/application/wizard-footer/footer";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { WizardFooterLabels } from "@rhs-ui/application/wizard-footer/footer";

export interface WizardFooterProps extends Omit<ComponentProps<"div">, "children"> {
  /** The step in progress, counted from 1: 2 on the second step. */
  step: number;
  /** How many steps there are. */
  stepCount: number;
  /** Goes to the previous step. Back is drawn from the second step on, and only when this is given. */
  onBack?: () => void;
  /** Skips an optional step. Give it only on a step that can be skipped: Skip is drawn when it is here. It may return a promise, like `onContinue`. */
  onSkip?: () => void | Promise<void>;
  /** Goes on. May return a promise: the button shows a spinner and says `savingLabel` until it settles, keeps the keyboard's focus, and the other buttons are locked. If it throws, the message of the error is shown in a row of its own above the bar and the step stays. */
  onContinue: () => void | Promise<void>;
  /** The text of the Continue button. Default "Next", and "Finish" on the last step. */
  continueLabel?: string;
  /** Whether the step is complete enough to go on. Default true. */
  canContinue?: boolean;
  /** What is missing, in words. Shown in place of the Continue button while `canContinue` is false, never a dead button with no explanation. */
  canContinueReason?: string;
  /** The text of the Continue button while it runs. Default "Saving". */
  savingLabel?: string;
  /** Keeps the bar at the bottom of the area it scrolls in: a sheet, a dialog or the page. Default false. */
  sticky?: boolean;
  /** The words the footer says, for translation. */
  labels?: WizardFooterLabels;
}

type Running = "continue" | "skip" | null;

/** A button that is running stays focusable: it says so with aria-busy and aria-disabled and is never `disabled`, which would drop the keyboard's focus to the page. It is dimmed and inert like a disabled one. */
const BUSY = "aria-busy:pointer-events-none aria-busy:opacity-50";

/** Below 28rem of room a button is a full-width row of at least 44px, and its label may wrap, so a long translation is read whole instead of cut off on both sides. */
const STACKED = "@max-md:h-auto @max-md:min-h-11 @max-md:py-2 @max-md:whitespace-normal @max-md:text-center";

/**
 * The bar at the bottom of a wizard, a dialog or a sheet that has steps: Back
 * (not on the first step), Skip (only when the step is optional) and Continue,
 * with "Step 2 of 5" and a row of segments beside them. Continue may be async:
 * it shows a spinner, says what it is doing, keeps the keyboard's focus and
 * locks the other buttons until it settles, and if it throws the message
 * appears in a row of its own above the bar, as wide as the bar, and the step
 * stays. A Continue that cannot be pressed yet is replaced by the reason in
 * words, not a dead button. The step context is a polite live region, so a
 * screen reader hears the new step. On a phone the buttons stack with
 * Continue on top, full width, and the bar keeps clear of the home indicator.
 */
export function WizardFooter({
  step,
  stepCount,
  onBack,
  onSkip,
  onContinue,
  continueLabel,
  canContinue = true,
  canContinueReason,
  savingLabel = "Saving",
  sticky = false,
  labels,
  className,
  ...props
}: WizardFooterProps) {
  const text: Required<WizardFooterLabels> = { ...DEFAULT_LABELS, ...labels };
  const count = Math.max(1, Math.floor(stepCount));
  const current = clampStep(step, count);
  const last = current === count;
  const [running, setRunning] = useState<Running>(null);
  // A failure belongs to the step it happened on; on another step it is not shown.
  const [failure, setFailure] = useState<{ step: number; message: string } | null>(null);
  const shownFailure = failure && failure.step === current ? failure.message : null;
  const busy = running !== null;
  const continuing = running === "continue";
  const skipping = running === "skip";
  // Set at once, where state would only change on the next render: a second press in the same moment must not start a second run.
  const locked = useRef(false);

  async function run(which: Exclude<Running, null>, action: () => void | Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setFailure(null);
    setRunning(which);
    try {
      await action();
    } catch (error) {
      setFailure({ step: current, message: messageOf(error, text.failed) });
    } finally {
      locked.current = false;
      setRunning(null);
    }
  }

  const showReason = !canContinue && Boolean(canContinueReason);

  return (
    <div data-slot="wizard-footer" aria-busy={busy || undefined} className={cn("@container w-full border-t border-border bg-background text-foreground", sticky && "sticky bottom-0 z-10", className)} {...props}>
      <div className="flex w-full flex-col gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] @md:px-6">
        {shownFailure ? (
          // A row of its own above everything, at every width: beside the buttons it would get only what they leave, a column of a few words.
          <p role="alert" className="flex items-start gap-2 text-sm leading-5 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]">
            <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{shownFailure}</span>
          </p>
        ) : null}

        <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-6">
          <div className="flex shrink-0 items-center justify-between gap-4 @xl:justify-start">
            <p role="status" aria-atomic="true" className="text-sm leading-5 text-muted-foreground tabular-nums">
              {fill(text.stepOf, { step: current, count })}
            </p>
            {count <= 8 ? (
              <span aria-hidden="true" data-slot="wizard-footer-segments" className="flex items-center gap-1">
                {Array.from({ length: count }, (_, index) => (
                  <span key={index} className={cn("h-1 w-5 rounded-full transition-colors duration-200 motion-reduce:transition-none", index < current ? "bg-foreground" : "bg-foreground/15")} />
                ))}
              </span>
            ) : null}
          </div>

          {/* The buttons are in reading order, Back first. Below 28rem of room they stack and the column is reversed, so Continue is on top; from there they are a row, which wraps rather than overflow when the labels are long. */}
          <div className="flex min-w-0 flex-col-reverse gap-2 @md:flex-row @md:flex-wrap @md:items-center @md:justify-end">
            {current > 1 && onBack ? (
              <Button type="button" variant="outline" disabled={busy} onClick={onBack} className={STACKED}>
                <IconArrowLeft className="rtl:-scale-x-100" />
                {text.back}
              </Button>
            ) : null}
            {onSkip ? (
              <Button type="button" variant="ghost" disabled={busy && !skipping} aria-busy={skipping || undefined} aria-disabled={skipping || undefined} onClick={() => run("skip", onSkip)} className={cn(STACKED, BUSY)}>
                {skipping ? <IconSpinner data-slot="button-spinner" /> : null}
                {text.skip}
              </Button>
            ) : null}
            {showReason ? (
              <p role="status" className="flex items-start gap-2 text-sm leading-5 text-muted-foreground @md:max-w-[22rem]">
                <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>{canContinueReason}</span>
              </p>
            ) : (
              <Button type="button" disabled={!canContinue || skipping} aria-busy={continuing || undefined} aria-disabled={continuing || undefined} onClick={() => run("continue", onContinue)} className={cn(STACKED, "@md:min-w-24", BUSY)}>
                {continuing ? <IconSpinner data-slot="button-spinner" /> : null}
                {continuing ? savingLabel : (continueLabel ?? (last ? text.finish : text.next))}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
