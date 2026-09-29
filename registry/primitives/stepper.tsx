import type { ComponentProps } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface StepperStep {
  title: string;
  description?: string;
}

export interface StepperProps extends Omit<ComponentProps<"ol">, "children"> {
  steps: readonly StepperStep[];
  /** The step in progress, from 0. */
  current: number;
  orientation?: "horizontal" | "vertical";
  /** Lets people go back to a finished step. Leave it out for a read-only stepper. */
  onStepClick?: (index: number) => void;
  label?: string;
}

/**
 * Where someone is in a multi-step flow: finished steps carry a check, the
 * current one is marked for screen readers (aria-current="step"), later ones
 * wait. Finished steps become buttons when onStepClick is given, so people
 * can go back without losing their place.
 */
export function Stepper({ steps, current, orientation = "horizontal", onStepClick, label = "Progress", className, ...props }: StepperProps) {
  const vertical = orientation === "vertical";
  return (
    <ol data-slot="stepper" data-orientation={orientation} aria-label={label} className={cn(vertical ? "grid gap-0" : "flex w-full items-start", className)} {...props}>
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        const marker = (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums transition-colors duration-200",
              state === "done" && "border-foreground bg-foreground text-background",
              state === "current" && "border-foreground text-foreground ring-4 ring-foreground/10",
              state === "upcoming" && "border-border text-muted-foreground",
            )}
          >
            {state === "done" ? <IconCheck size={14} /> : index + 1}
          </span>
        );
        const text = (
          <span className={cn("grid gap-0.5", vertical ? "pt-1" : "mt-2 px-2 text-center")}>
            <span className={cn("text-sm font-medium", state === "upcoming" && "text-muted-foreground")}>{step.title}</span>
            {step.description ? <span className="text-xs text-muted-foreground">{step.description}</span> : null}
            <span className="sr-only">{state === "done" ? ", done" : state === "current" ? ", current step" : ", not started"}</span>
          </span>
        );
        const content = onStepClick && state === "done" ? (
          <button type="button" onClick={() => onStepClick(index)} className={cn("flex rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", vertical ? "gap-3" : "flex-col items-center")}>
            {marker}
            {text}
          </button>
        ) : (
          <span className={cn("flex", vertical ? "gap-3" : "flex-col items-center")}>
            {marker}
            {text}
          </span>
        );
        return (
          <li key={step.title} aria-current={state === "current" ? "step" : undefined} className={cn("relative", vertical ? "pb-6 last:pb-0" : "flex flex-1 flex-col items-center")}>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bg-border",
                  vertical ? "top-9 bottom-1 left-4 w-px" : "top-4 left-[calc(50%+1.5rem)] h-px w-[calc(100%-3rem)]",
                  index < current && "bg-foreground",
                )}
              />
            ) : null}
            {content}
          </li>
        );
      })}
    </ol>
  );
}
