"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface CoachmarkStep {
  id: string;
  title: string;
  body: string;
}

export interface CoachmarkProps {
  /** The element the tip points at. */
  children: ReactNode;
  steps: readonly CoachmarkStep[];
  /** Shown until finished or dismissed; remember that on your side. */
  open: boolean;
  onFinish: () => void;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * A guided tip pinned to one control after a release: a pulsing ring on the
 * target, a popover with a step counter, back, next and "got it", and skip
 * that ends the tour for good. Not modal, so the page still works; focus is
 * not stolen, the popover is announced as a dialog when it opens.
 */
export function Coachmark({ children, steps, open, onFinish, side = "bottom", className }: CoachmarkProps) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;
  return (
    <Popover open={open && Boolean(step)}>
      <PopoverAnchor asChild>
        <span className={cn("relative inline-flex", className)}>
          {children}
          {open ? <span aria-hidden="true" className="pointer-events-none absolute -inset-1.5 rounded-xl ring-2 ring-foreground/60 motion-safe:animate-pulse" /> : null}
        </span>
      </PopoverAnchor>
      <PopoverContent side={side} align="start" role="dialog" aria-label={step?.title} onOpenAutoFocus={(event) => event.preventDefault()} className="w-72">
        {step ? (
          <>
            <p className="text-xs text-muted-foreground tabular-nums">{index + 1} of {steps.length}</p>
            <p className="mt-1 font-medium">{step.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" onClick={onFinish} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Skip tour</button>
              <div className="flex gap-2">
                {index > 0 ? <Button size="sm" variant="ghost" onClick={() => setIndex((value) => value - 1)}>Back</Button> : null}
                <Button size="sm" onClick={() => (last ? onFinish() : setIndex((value) => value + 1))}>{last ? "Got it" : "Next"}</Button>
              </div>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
