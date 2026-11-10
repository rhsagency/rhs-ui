import type { ComponentProps, ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/** Where a step stands. `current` and `upcoming` follow from the `current` prop; `done` and `error` can be set on the step. */
export type CompactStepState = "done" | "current" | "upcoming" | "error";

export interface CompactStep {
  /** What `onStepSelect` hands back. Unique among the steps. */
  id: string;
  /** The name of the step: "Shipping". */
  label: string;
  /** One line about it, shown in the list of all steps: "Standard delivery, 2 to 3 days". */
  description?: string;
  /** Set `error` for a step that needs attention, or `done` to override. Left out, a step before `current` is done and one after it is upcoming. */
  state?: CompactStepState;
  /** Where a finished step goes back to, when it is a real page. `onStepSelect` is called as well. */
  href?: string;
}

export interface CompactStepperLabels {
  /** The line over the bar; `{current}` and `{total}` are the numbers. Default "Step {current} of {total}". */
  step?: string;
  /** The button that opens the list, and the name of the list. Default "All steps". */
  all?: string;
  /** The state word of a finished step in the list. Default "Done". */
  done?: string;
  /** The state word of the step in progress in the list. Default "Current". */
  current?: string;
  /** The state word of a step that needs attention, in the list and beside the current step's name. Default "Needs attention". */
  error?: string;
  /** Said under the bar for a step that needs attention and is not the current one; `{label}` is its name. Default "{label} needs attention". */
  attention?: string;
}

export interface CompactStepperProps extends Omit<ComponentProps<"div">, "children"> {
  /** Every step, in order. */
  steps: readonly CompactStep[];
  /** The step in progress, counted from 0. */
  current: number;
  /** Called with a step's id and index when a finished step is chosen from the list. A function cannot come from a Server Component: there, give the steps an `href` and leave this out. */
  onStepSelect?: (id: string, index: number) => void;
  /** Lets people go back: finished steps and steps that need attention become links in the list, when they have an `href` or there is an `onStepSelect`. Default false, a read-only list. */
  allowJumpBack?: boolean;
  /** `md` (default) or the smaller `sm`. */
  size?: "sm" | "md";
  /** The words used, for another language. */
  labels?: CompactStepperLabels;
}

/** The marker of a row in the list: a check, a ring, a number or a warning. */
function Marker({ state, number, active }: { state: CompactStepState; number: number; active: boolean }): ReactNode {
  if (state === "error") return <IconAlertCircle aria-hidden="true" className="col-start-1 row-start-1 size-5 shrink-0 text-destructive" />;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "col-start-1 row-start-1 grid size-5 shrink-0 place-items-center rounded-full border text-[0.6875rem] font-semibold tabular-nums",
        state === "done" && "border-foreground bg-foreground text-background",
        state === "current" && "border-foreground bg-background text-foreground ring-4 ring-foreground/10",
        state === "upcoming" && "border-border text-muted-foreground",
      )}
    >
      {state === "done" ? <IconCheck size={12} /> : active ? <span className="size-1.5 rounded-full bg-foreground" /> : number}
    </span>
  );
}

/**
 * The responsive answer to a long horizontal stepper: the current step's name over a counter ("Step 2
 * of 5") and a segmented bar with one segment per step, and one button that opens the whole list in a
 * popover, each step with its state in words. Finished steps are links back only when
 * `allowJumpBack` is set; upcoming steps are plain text, and a step that needs attention says so in
 * words next to its row and under the bar, not only in colour. The counter and the name are one polite
 * live region, so the move to the next step is announced once. It keeps no state of its own and a
 * read-only stepper, or one whose steps have an `href`, can be rendered from a Server Component;
 * `onStepSelect` is a function and needs a client parent.
 */
export function CompactStepper({ steps, current, onStepSelect, allowJumpBack = false, size = "md", labels, className, ...props }: CompactStepperProps) {
  const words = {
    step: labels?.step ?? "Step {current} of {total}",
    all: labels?.all ?? "All steps",
    done: labels?.done ?? "Done",
    current: labels?.current ?? "Current",
    error: labels?.error ?? "Needs attention",
    attention: labels?.attention ?? "{label} needs attention",
  };
  const total = steps.length;
  const at = Math.min(Math.max(Math.round(current), 0), Math.max(total - 1, 0));
  const here = steps[at];
  if (!here) return null;
  const stateOf = (step: CompactStep, index: number): CompactStepState => step.state ?? (index < at ? "done" : index === at ? "current" : "upcoming");
  const failing = steps.map((step, index) => ({ step, index })).filter(({ step, index }) => step.state === "error" && index !== at);
  const small = size === "sm";

  return (
    <div data-slot="compact-stepper" data-size={size} className={cn("grid min-w-0 gap-3", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div aria-live="polite" aria-atomic="true" className="grid min-w-0 gap-0.5">
          <p className="text-xs text-muted-foreground tabular-nums">{words.step.replace("{current}", String(at + 1)).replace("{total}", String(total))}</p>
          <p className={cn("flex min-w-0 items-center gap-2 font-medium tracking-[-0.01em]", small ? "text-[0.8125rem]" : "text-sm")}>
            <span className="truncate">{here.label}</span>
            {here.state === "error" ? <span className="shrink-0 text-xs font-medium text-destructive">{words.error}</span> : null}
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="-my-1 -mr-2 shrink-0 gap-1 text-muted-foreground hover:text-foreground">
              {words.all}
              <IconChevronDown />
            </Button>
          </PopoverTrigger>
          {/* The dialog needs a name of its own: without one, focus lands on a dialog a screen reader can only call "dialog". */}
          <PopoverContent align="end" aria-label={words.all} className="w-72 max-w-(--radix-popover-content-available-width) p-1.5">
            <ol className="grid gap-0.5">
              {steps.map((step, index) => {
                const state = stateOf(step, index);
                // A step is a link only when it can go somewhere: it has an address or somebody listens for the choice.
                const jump = allowJumpBack && index < at && (state === "done" || state === "error") && Boolean(step.href || onStepSelect);
                const choose = onStepSelect ? () => onStepSelect(step.id, index) : undefined;
                // A grid: the marker, the name and the state word share the first row, and the description gets the second row to itself, so the state word never squeezes it.
                const row = (
                  <>
                    <Marker state={state} number={index + 1} active={index === at} />
                    <span className={cn("col-start-2 row-start-1 min-w-0 text-sm leading-5 font-medium tracking-[-0.01em]", state === "upcoming" && "text-muted-foreground")}>{step.label}</span>
                    {step.description ? <span className="col-span-2 col-start-2 row-start-2 text-xs leading-snug text-pretty text-muted-foreground">{step.description}</span> : null}
                    {state === "done" || state === "error" || index === at ? (
                      <span className={cn("col-start-3 row-start-1 text-xs leading-5 whitespace-nowrap", state === "error" ? "font-medium text-destructive" : index === at ? "font-medium text-foreground" : "text-muted-foreground")}>
                        <span className="sr-only">, </span>
                        {state === "error" ? words.error : index === at ? words.current : words.done}
                      </span>
                    ) : null}
                  </>
                );
                const shared = "grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 rounded-md px-2.5 py-2 text-left";
                return (
                  <li key={step.id} aria-current={index === at ? "step" : undefined}>
                    {jump ? (
                      <PopoverClose asChild>
                        {step.href ? (
                          <a href={step.href} onClick={choose} className={cn(shared, "outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40")}>
                            {row}
                          </a>
                        ) : (
                          <button type="button" onClick={choose} className={cn(shared, "outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40")}>
                            {row}
                          </button>
                        )}
                      </PopoverClose>
                    ) : (
                      <div className={cn(shared, index === at && "bg-muted/60")}>{row}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </PopoverContent>
        </Popover>
      </div>
      {/* The bar is a picture of the counter above it: the text carries the meaning, so it is hidden from assistive technology. */}
      <div aria-hidden="true" className="flex gap-1">
        {steps.map((step, index) => {
          const state = stateOf(step, index);
          return (
            <span
              key={step.id}
              data-state={state}
              className={cn(
                "flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
                small ? "h-1" : "h-1.5",
                state === "done" && "bg-foreground/50",
                state === "current" && "bg-foreground",
                state === "upcoming" && "bg-foreground/10",
                state === "error" && "bg-destructive",
              )}
            />
          );
        })}
      </div>
      {failing.length ? (
        <ul className="grid gap-1">
          {failing.map(({ step }) => (
            <li key={step.id} className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
              {words.attention.replace("{label}", step.label)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
