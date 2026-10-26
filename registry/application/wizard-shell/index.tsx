"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowLeft, IconInfo } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { Stepper, type StepperStep } from "@rhs-ui/primitives/stepper";
import { cn } from "@/lib/utils";

export type WizardStep = StepperStep;

export interface WizardShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark, left of the header. */
  brand?: ReactNode;
  /** The steps in order. Each title is in the rail and becomes the heading of its step; the description sits under that heading. */
  steps: readonly WizardStep[];
  /** The step heading's element: "h1" (the default) because the step is the page, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  /** The step in progress, from 0. */
  current: number;
  /** Someone went back to a finished step from the rail. Without it the rail is read-only. */
  onStepChange?: (index: number) => void;
  /** The Back button. Without it Back goes to the previous step through onStepChange. */
  onBack?: () => void;
  /** The Back button's text. Default "Back". */
  backLabel?: string;
  /** The primary button. May return a promise: the button shows a spinner until it settles. Handle errors inside it. */
  onContinue: () => void | Promise<void>;
  /** The primary button's text. Default "Continue", and "Finish" on the last step. */
  continueLabel?: string;
  /** Whether the step is complete enough to go on. Default true. */
  canContinue?: boolean;
  /** What is missing, in words. Shown in place of the button while `canContinue` is false, never a dead button with no explanation. */
  canContinueReason?: string;
  /** Adds a "Skip for now" button for an optional step. */
  onSkip?: () => void;
  /** The skip button's text. Default "Skip for now". */
  skipStepLabel?: string;
  /** Adds the header's "Save and exit" button. */
  onExit?: () => void;
  /** The exit button's text. Default "Save and exit". */
  exitLabel?: string;
  /** A help link or button, next to the exit button. */
  help?: ReactNode;
  /** The skip link's text. Default "Skip to content". */
  skipLabel?: string;
  /** The id of the main landmark, which the skip link points at. Default "main". */
  mainId?: string;
  /** The content of the current step. */
  children: ReactNode;
}

/**
 * The frame for a multi-step task: a slim header with "Save and exit", a
 * step rail (vertical from lg, a compact "Step 2 of 5" with a progress bar
 * on a phone), the step in a 36rem column and a sticky footer with Back,
 * an optional Skip and the primary button. The step's heading takes focus
 * on every change of step, so the new step is announced; finished steps in
 * the rail take you back; and when the step is not complete the footer says
 * what is missing instead of showing a dead button (on a phone that sentence
 * gets a row of its own above the buttons). The content and the validation
 * of each step are yours.
 */
export function WizardShell({
  brand,
  steps,
  titleAs: Title = "h1",
  current,
  onStepChange,
  onBack,
  backLabel = "Back",
  onContinue,
  continueLabel,
  canContinue = true,
  canContinueReason,
  onSkip,
  skipStepLabel = "Skip for now",
  onExit,
  exitLabel = "Save and exit",
  help,
  skipLabel = "Skip to content",
  mainId = "main",
  children,
  className,
  ...props
}: WizardShellProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(current);
  // The step fades in when it changes, never on the first render.
  const startStep = useRef(current);
  const moved = useRef(false);
  if (startStep.current !== current) moved.current = true;
  const [busy, setBusy] = useState(false);
  const step = steps[current];
  const last = current === steps.length - 1;

  // The new step's heading takes focus, but never on the first render.
  useEffect(() => {
    if (shownStep.current === current) return;
    shownStep.current = current;
    heading.current?.focus();
  }, [current]);

  async function proceed() {
    if (busy) return;
    setBusy(true);
    try {
      await onContinue();
    } finally {
      setBusy(false);
    }
  }

  const columns = "lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-16";
  const frame = "mx-auto w-full max-w-5xl px-4 sm:px-6";

  return (
    <div data-slot="wizard-shell" className={cn("flex min-h-dvh flex-col bg-background text-foreground", className)} {...props}>
      <SkipLink target={mainId} label={skipLabel} />
      <header className="border-b border-border">
        <div className={cn(frame, "flex h-14 items-center gap-3")}>
          <div className="flex items-center text-sm font-semibold">{brand}</div>
          <div className="ml-auto flex items-center gap-2">
            {help}
            {onExit ? (
              <Button type="button" variant="outline" size="sm" onClick={onExit}>
                {exitLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className={cn(frame, "grid flex-1 content-start", columns)}>
        <div className="hidden lg:block">
          <div className="sticky top-8 py-12">
            <Stepper orientation="vertical" steps={steps.map(({ title }) => ({ title }))} current={current} onStepClick={onStepChange} />
          </div>
        </div>
        <main id={mainId} tabIndex={-1} className="w-full min-w-0 max-w-[36rem] py-8 outline-none max-lg:mx-auto lg:py-12">
          <div className="mb-6 lg:hidden">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <p className="font-medium">
                Step {current + 1} of {steps.length}
              </p>
              <p className="min-w-0 truncate text-muted-foreground">{last ? "Last step" : `Next: ${steps[current + 1]?.title ?? ""}`}</p>
            </div>
            <Progress
              value={((current + 1) / steps.length) * 100}
              aria-label="Progress"
              getValueLabel={() => `Step ${current + 1} of ${steps.length}`}
              className="mt-2.5 h-1.5"
            />
          </div>
          <div key={current} className={cn(moved.current && "motion-safe:animate-rhs-step-in")}>
            {step ? (
              <div className="mb-7">
                <Title ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-[-0.03em] outline-none">
                  <span className="sr-only">
                    Step {current + 1} of {steps.length}:{" "}
                  </span>
                  {step.title}
                </Title>
                {step.description ? <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p> : null}
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>

      <footer className="sticky bottom-0 z-10 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
        <div className={cn(frame, "grid", columns)}>
          <div className="hidden lg:block" />
          {/* One flat row, so the buttons keep their place: below sm the reason leaves it for a row of its own above (order-first), instead of being squeezed beside them. */}
          <div className="flex w-full max-w-[36rem] items-center gap-x-2 gap-y-2.5 py-3 max-lg:mx-auto max-sm:flex-wrap">
            {current > 0 && (onBack || onStepChange) ? (
              // The ghost button pulls out by its own padding, so its arrow lines up with the column.
              <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={() => (onBack ? onBack() : onStepChange?.(current - 1))} className="-ml-3 px-3">
                <IconArrowLeft />
                {backLabel}
              </Button>
            ) : null}
            {onSkip ? (
              <Button type="button" variant="ghost" size="lg" disabled={busy} onClick={onSkip} className="ml-auto max-sm:px-3">
                {skipStepLabel}
              </Button>
            ) : null}
            {!canContinue && canContinueReason ? (
              <p role="status" className={cn("flex min-w-0 items-start gap-2 text-sm leading-snug text-muted-foreground max-sm:order-first max-sm:basis-full", !onSkip && "sm:ml-auto")}>
                <IconInfo className="mt-px size-4 shrink-0" />
                <span>{canContinueReason}</span>
              </p>
            ) : (
              // With Skip beside it the button also takes the free space on a phone, so when the row is too narrow and wraps, it lands on the right of its own row.
              <Button type="button" size="lg" loading={busy} disabled={!canContinue} onClick={proceed} className={onSkip ? "max-sm:ml-auto" : "ml-auto"}>
                {continueLabel ?? (last ? "Finish" : "Continue")}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
