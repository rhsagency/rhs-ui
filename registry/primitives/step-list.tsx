import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface StepListProps extends Omit<ComponentProps<"ol">, "children"> {
  /** `Step` components, and nothing else: each one becomes a list item. */
  children: ReactNode;
  /** The marker, title and gaps: 24, 28 or 32px markers. Default "md". */
  size?: "sm" | "md" | "lg";
  /** The number of the first step, for a guide that continues one: 5 starts at "5". Default 1. */
  start?: number;
  /** Collapse every step to its title, for an overview at the top of a guide ("What you will do"). The content stays in your markup but is hidden. */
  summaryOnly?: boolean;
}

export interface StepProps extends Omit<ComponentProps<"li">, "title"> {
  /** The name of the step: "Install the package". */
  title: ReactNode;
  /** The element the title is written in. Pick the level that fits your page outline. Default "h3". */
  as?: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  /** The step itself: text, a code block, an image, a note. Anything goes. */
  children?: ReactNode;
  /** Link target for this step, so a page can point at "#step-3". */
  id?: string;
}

// The text size on the list is the size of a step's content; the title and the marker are in em, so they follow it.
const SIZE = {
  sm: "[--step-marker:1.5rem] text-[0.8125rem]",
  md: "[--step-marker:1.75rem] text-sm",
  lg: "[--step-marker:2rem] text-base",
} as const;

/**
 * How-to steps for a tutorial or an install guide: numbered markers on a
 * hairline that joins one step to the next and stops after the last. It is a
 * real `<ol>`, so assistive technology reads the list and the position of every
 * step, and the numbers are drawn by a CSS counter, so any content between the
 * steps keeps its place and no step has to count itself. Each `Step` has a title
 * and any content: text, code, an image. `summaryOnly` folds every step to its
 * title for an overview, and a step with an `id` can be linked to. It explains
 * a procedure; for progress through a flow, use a stepper. A Server Component.
 */
export function StepList({ children, size = "md", start = 1, summaryOnly = false, className, style, ...props }: StepListProps) {
  return (
    <ol
      role="list"
      data-slot="step-list"
      data-size={size}
      data-summary={summaryOnly ? "" : undefined}
      start={start}
      style={{ counterReset: `rhs-step ${start - 1}`, ...style }}
      className={cn("group/steps grid", SIZE[size], className)}
      {...props}
    >
      {children}
    </ol>
  );
}

/** One step of a `StepList`: a numbered marker, a title and the content. */
export function Step({ title, as: Title = "h3", children, className, ...props }: StepProps) {
  return (
    <li
      data-slot="step"
      className={cn(
        "relative grid scroll-mt-24 grid-cols-[var(--step-marker)_minmax(0,1fr)] gap-x-4 pb-8 [counter-increment:rhs-step] last:pb-0",
        "group-data-[summary]/steps:pb-5 group-data-[summary]/steps:last:pb-0",
        // The hairline runs from just under this marker to just above the next one, and the last step has none.
        "after:absolute after:top-[calc(var(--step-marker)+0.375rem)] after:bottom-1.5 after:start-[calc(var(--step-marker)/2)] after:w-px after:-translate-x-1/2 after:bg-border after:content-[''] last:after:hidden rtl:after:translate-x-1/2",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="step-marker"
        className="grid size-(--step-marker) place-items-center rounded-full border border-border bg-card font-medium tabular-nums text-foreground shadow-xs [font-size:0.86em] before:content-[counter(rhs-step)]"
      />
      <div className="min-w-0">
        <Title data-slot="step-title" className="flex min-h-(--step-marker) items-center text-[1.14em] leading-snug font-medium tracking-[-0.01em] text-foreground">
          {title}
        </Title>
        {children ? (
          <div data-slot="step-body" className="mt-1.5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 leading-6 text-muted-foreground group-data-[summary]/steps:hidden">
            {children}
          </div>
        ) : null}
      </div>
    </li>
  );
}
