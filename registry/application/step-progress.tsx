"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface StepProgressProps { steps: readonly string[]; current: number; label?: string; className?: string }

/** Progress through a task. Current is a zero-based index; steps.length is complete. */
export function StepProgress({ steps, current, label = "Progress", className }: StepProgressProps): React.JSX.Element {
  const id = useId();
  const index = Math.max(0, Math.min(steps.length, Math.floor(current)));
  return <section data-slot="step-progress" aria-label={label} className={cn("w-full", className)}>
    <p id={id} className="sr-only" aria-live="polite">{index === steps.length ? "Complete" : `Step ${index + 1} of ${steps.length}: ${steps[index]}`}</p>
    <ol className="flex gap-3" aria-describedby={id}>{steps.map((step, position) => <li key={`${position}-${step}`} aria-current={position === index ? "step" : undefined} className="min-w-0 flex-1">
      <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true"><span className={cn("block h-full origin-left bg-foreground transition-transform duration-700 ease-out motion-reduce:transition-none", position <= index ? "scale-x-100" : "scale-x-0")} /></div>
      <div className="mt-4 flex items-center gap-2"><span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors motion-reduce:transition-none", position <= index ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground")} aria-hidden="true">{position < index ? "✓" : position + 1}</span><span className="truncate text-xs">{step}</span></div>
    </li>)}</ol>
  </section>;
}
