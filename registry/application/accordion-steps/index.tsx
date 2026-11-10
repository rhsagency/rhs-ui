"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconChevronDown, IconLock, IconSpinner } from "@rhs-ui/icons";
import { DEFAULT_LABELS, fill, frontierOf, messageOf, nextAfter, type AccordionStep, type AccordionStepsLabels } from "@rhs-ui/application/accordion-steps/steps";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export type { AccordionStep, AccordionStepsLabels, StepState } from "@rhs-ui/application/accordion-steps/steps";

export interface AccordionStepsProps extends Omit<ComponentProps<"ol">, "children"> {
  /** The steps, in order. Each has an `id`, a `title`, its `content`, whether it is `complete` (the `state`) and, for a completed step, a one-line `summary`. */
  steps: readonly AccordionStep[];
  /** The `id` of the step that is open, or null for none. Only one is open at a time. Controlled: pair it with `onStepChange`. */
  current?: string | null;
  /** The step open at the start, when you do not control it. Default the first step that is not complete. */
  defaultCurrent?: string | null;
  /** The person opened a step (null: closed the open one), or Continue moved on. It receives the `id` of the step that should be open. */
  onStepChange?: (id: string | null) => void;
  /**
   * The step's Continue was pressed. It may be async: the button shows a pending state and the other headers wait until it settles.
   * Return normally to move on (mark the step complete in `steps` yourself). To keep the step open, throw an Error, or return a
   * string: the message appears in the step, above the button. After a move, the next step that is not complete opens.
   */
  onContinue?: (id: string) => void | string | Promise<void | string>;
  /** Whether a completed step can be opened again, with an Edit button. Turn it off once the flow is over. Default true. */
  editable?: boolean;
  /** Draws the line under a completed step's title. It receives the step; without it the step's own `summary` is used. Keep it to inline content, it sits in a button. */
  renderSummary?: (step: AccordionStep) => ReactNode;
  /** The level of the step headings, so they fit the page. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5;
  /** The words the list says, for translation. */
  labels?: AccordionStepsLabels;
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A multi-step form on one page, the checkout and onboarding pattern: the step
 * in hand is open, finished steps fold into a one-line summary with an Edit
 * button, and the steps after the first unfinished one wait, locked, with a
 * line that says what must come first. The list is ordered and every header is
 * a button with aria-expanded inside a heading, so a screen reader can walk the
 * steps by heading and hear "Step 2 of 4: Delivery, current step". Opening a
 * step moves focus to its heading. Continue may be async to validate before it
 * advances: it shows a pending state without giving up the keyboard's focus,
 * and when the check fails it keeps the step open, says why and leaves focus on
 * the button. Editing a completed step does not reset the steps after it,
 * because completion is yours: the component only opens, closes and asks.
 */
export function AccordionSteps({
  steps,
  current,
  defaultCurrent,
  onStepChange,
  onContinue,
  editable = true,
  renderSummary,
  headingLevel = 3,
  labels,
  className,
  ...props
}: AccordionStepsProps) {
  const text: Required<AccordionStepsLabels> = { ...DEFAULT_LABELS, ...labels };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5";
  const [own, setOwn] = useState<string | null>(() => (defaultCurrent !== undefined ? defaultCurrent : (steps.find((step) => step.state !== "complete") ?? steps[0])?.id ?? null));
  // The step whose Continue is running, and the failure of the last one that failed: it belongs to its step and goes when the step is left.
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const headers = useRef(new Map<string, HTMLButtonElement>());
  // Set at once, where state would only change on the next render: a second press in the same moment must not start a second check.
  const locked = useRef(false);
  // The step that was open when focus last moved: undefined until the first render has said which one is.
  const shown = useRef<string | null | undefined>(undefined);

  const open = current !== undefined ? current : own;
  const frontier = frontierOf(steps);
  const frontierTitle = frontier === -1 ? "" : (steps[frontier]?.title ?? "");
  if (shown.current === undefined) shown.current = open;

  // The step that opens takes focus on its heading: the button inside it. Never on the first render.
  useEffect(() => {
    if (shown.current === open) return;
    shown.current = open;
    const header = open === null ? undefined : headers.current.get(open);
    if (!header) return;
    header.focus({ preventScroll: true });
    // The step that was open folds up while this one opens, which moves the page. Once it has settled, bring the heading into view if it is not.
    const timer = window.setTimeout(() => {
      const box = header.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) header.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    }, 260);
    return () => window.clearTimeout(timer);
  }, [open]);

  function go(id: string | null) {
    if (current === undefined) setOwn(id);
    onStepChange?.(id);
  }

  async function proceed(id: string, index: number) {
    if (locked.current) return;
    locked.current = true;
    setFailure(null);
    setPending(id);
    try {
      const result = await onContinue?.(id);
      if (typeof result === "string" && result.trim()) {
        setFailure({ id, message: result.trim() });
        return;
      }
      go(nextAfter(steps, index));
    } catch (error) {
      setFailure({ id, message: messageOf(error, text.failed) });
    } finally {
      locked.current = false;
      setPending(null);
    }
  }

  return (
    <ol data-slot="accordion-steps" aria-label={text.list} className={cn("divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      {steps.map((step, index) => {
        const complete = step.state === "complete";
        const isOpen = step.id === open;
        // A step that is not done and comes after the first one that is not done waits. The one that is open is never locked.
        const locked = !complete && !isOpen && frontier !== -1 && index > frontier;
        const reachable = !locked && (!complete || editable);
        const running = pending === step.id;
        const last = index === steps.length - 1;
        const problem = failure?.id === step.id ? failure.message : null;
        const summary = renderSummary ? renderSummary(step) : step.summary;
        return (
          <li key={step.id} data-state={complete ? "complete" : "incomplete"} data-open={isOpen || undefined} data-locked={locked || undefined} aria-current={isOpen ? "step" : undefined}>
            <Collapsible
              open={isOpen}
              onOpenChange={(next) => {
                // Nothing moves while a check runs, and a step that cannot be reached stays shut.
                if (pending || !reachable) return;
                setFailure(null);
                go(next ? step.id : null);
              }}
            >
              <Heading className="m-0">
                <CollapsibleTrigger
                  ref={(node) => {
                    if (node) headers.current.set(step.id, node);
                    else headers.current.delete(step.id);
                  }}
                  aria-disabled={!reachable || undefined}
                  className={cn(
                    "group/header flex w-full items-center gap-3 px-4 py-4 text-start outline-none sm:px-5",
                    "transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset",
                    reachable ? "cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40" : "cursor-default",
                  )}
                >
                  <span
                    aria-hidden="true"
                    data-slot="accordion-steps-marker"
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border text-xs leading-none font-semibold tabular-nums transition-[background-color,border-color,color,box-shadow] duration-200 motion-reduce:transition-none",
                      complete && "border-foreground bg-foreground text-background",
                      !complete && isOpen && "border-foreground text-foreground ring-4 ring-foreground/10",
                      !complete && !isOpen && "border-border text-muted-foreground",
                    )}
                  >
                    {complete ? <IconCheck size={14} strokeWidth={2.5} /> : index + 1}
                  </span>
                  {/* The lines are `relative`: a screen-reader-only child is absolutely placed, and without a positioned parent it escapes the clip of its line and widens the page. The title wraps, so a long heading is read whole at 320px. */}
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className={cn("relative block text-sm leading-6 tracking-[-0.01em] text-pretty [overflow-wrap:anywhere]", locked ? "font-medium text-muted-foreground" : "font-semibold text-foreground")}>
                      <span className="sr-only">{fill(text.stepOf, { step: index + 1, count: steps.length })}: </span>
                      {step.title}
                      <span className="sr-only">, {complete ? text.completed : isOpen ? text.current : text.notStarted}</span>
                    </span>
                    {complete && !isOpen && summary ? (
                      <span className="relative line-clamp-2 text-sm leading-5 [overflow-wrap:anywhere] text-muted-foreground">
                        <span className="sr-only">, </span>
                        {summary}
                      </span>
                    ) : null}
                    {locked ? (
                      <span className="relative block text-sm leading-5 [overflow-wrap:anywhere] text-muted-foreground">
                        <span className="sr-only">, </span>
                        {fill(text.lockedReason, { title: frontierTitle })}
                      </span>
                    ) : null}
                  </span>
                  {locked ? <IconLock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
                  {complete && !isOpen && editable ? (
                    <span className="shrink-0 text-sm font-medium text-foreground underline-offset-4 group-hover/header:underline group-focus-visible/header:underline">
                      <span className="sr-only">, </span>
                      {text.edit}
                    </span>
                  ) : null}
                  {!locked && !complete ? (
                    <IconChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", isOpen && "rotate-180")} />
                  ) : null}
                </CollapsibleTrigger>
              </Heading>
              <CollapsibleContent>
                <div className="grid gap-5 px-4 pt-1 pb-5 sm:ps-[3.75rem] sm:pe-5">
                  {step.content}
                  {problem ? (
                    <p role="alert" className="flex items-start gap-2 text-sm leading-5 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]">
                      <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <span>{problem}</span>
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3">
                    {/* While the check runs the button stays focusable: aria-busy and aria-disabled, never `disabled`, which would drop the keyboard's focus to the page and leave it there after a failure. A press in that time is ignored by `proceed`. */}
                    <Button
                      type="button"
                      disabled={pending !== null && !running}
                      aria-busy={running || undefined}
                      aria-disabled={running || undefined}
                      onClick={() => proceed(step.id, index)}
                      className="aria-busy:pointer-events-none aria-busy:opacity-50"
                    >
                      {running ? <IconSpinner data-slot="button-spinner" /> : null}
                      {running ? text.checking : (step.continueLabel ?? (last ? text.finish : text.continue))}
                    </Button>
                    <span role="status" className="sr-only">
                      {running ? text.checking : ""}
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        );
      })}
    </ol>
  );
}
