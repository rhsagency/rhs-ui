"use client";

import { useState, type ReactNode } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export interface AiReasoningProps {
  /** True while the model is still thinking. */
  thinking: boolean;
  /** Seconds it took, shown once done: "Thought for 4 seconds". */
  seconds?: number;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * The model's reasoning, folded away by default. While it thinks the label
 * shimmers and says so; when done it says how long it took. The steps sit
 * on a thin rail so they read as notes, not as the answer.
 */
export function AiReasoning({ thinking, seconds, children, defaultOpen = false, className }: AiReasoningProps) {
  const [open, setOpen] = useState(defaultOpen);
  const label = thinking ? "Thinking" : seconds !== undefined ? `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}` : "Reasoning";
  return (
    <Collapsible open={open} onOpenChange={setOpen} data-slot="ai-reasoning" className={cn("text-sm", className)}>
      <CollapsibleTrigger className="group inline-flex items-center gap-1.5 rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        <span className={cn(thinking && "motion-safe:animate-pulse")} aria-live="polite">{label}</span>
        <span className="transition-transform duration-200 group-data-[state=open]:rotate-180 [&_svg]:size-3.5"><IconChevronDown /></span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 border-l-2 border-border pl-4 text-muted-foreground [&_p+p]:mt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
