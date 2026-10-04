"use client";

import { useState, type ReactNode } from "react";

import { IconCheck, IconChevronDown } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  /** The button that does the step: "Connect a domain". */
  action?: ReactNode;
}

export interface OnboardingChecklistProps {
  title?: string;
  steps: readonly OnboardingStep[];
  /** Hide the whole list; you keep the choice. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Getting started, as a checklist that opens on the first unfinished step.
 * Progress is a count and a bar; done steps fold down to one line; each
 * open step carries the one button that completes it.
 */
export function OnboardingChecklist({ title = "Get started", steps, onDismiss, className }: OnboardingChecklistProps) {
  const done = steps.filter((step) => step.done).length;
  const firstOpen = steps.find((step) => !step.done)?.id ?? null;
  const [open, setOpen] = useState<string | null>(firstOpen);
  return (
    <section data-slot="onboarding-checklist" className={cn("rounded-xl border border-border", className)}>
      <header className="flex items-center justify-between gap-4 p-5">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground tabular-nums">{done} of {steps.length} done</p>
        </div>
        {onDismiss ? <button type="button" onClick={onDismiss} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Hide</button> : null}
      </header>
      <div className="mx-5 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${(done / Math.max(1, steps.length)) * 100}%` }} />
      </div>
      <ol className="mt-3 divide-y divide-border border-t border-border">
        {steps.map((step) => {
          const expanded = open === step.id;
          return (
            <li key={step.id}>
              <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : step.id)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left outline-none hover:bg-muted/60 focus-visible:bg-muted">
                <span className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full border [&_svg]:size-3", step.done ? "border-foreground bg-foreground text-background" : "border-border")}>
                  {step.done ? <IconCheck /> : null}
                </span>
                <span className={cn("flex-1 text-sm", step.done && "text-muted-foreground line-through decoration-border")}>{step.title}</span>
                <span className="sr-only">{step.done ? "Done" : "To do"}</span>
                <span className={cn("text-muted-foreground transition-transform duration-200 [&_svg]:size-4", expanded && "rotate-180")}><IconChevronDown /></span>
              </button>
              {expanded ? (
                <div className="px-5 pb-4 pl-13">
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.action && !step.done ? <div className="mt-3">{step.action}</div> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
