"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface NpsScaleProps {
  /** The question: "How likely are you to recommend us to a friend?" */
  question: string;
  value: number | null;
  onValueChange: (score: number) => void;
  /** Words at the ends of the scale. */
  lowLabel?: string;
  highLabel?: string;
  /** Lowest and highest score; 0 to 10 is the Net Promoter scale. */
  min?: number;
  max?: number;
  name?: string;
  className?: string;
}

/**
 * The 0 to 10 "would you recommend us" scale as a real radio group: one tab
 * stop, arrow keys between scores, the end labels tied to the question, and
 * eleven targets that wrap into two rows on a narrow phone instead of
 * shrinking below a finger's width.
 */
export function NpsScale({ question, value, onValueChange, lowLabel = "Not likely", highLabel = "Very likely", min = 0, max = 10, name, className }: NpsScaleProps) {
  const id = useId();
  const scores = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return (
    <fieldset data-slot="nps-scale" aria-describedby={`${id}-ends`} className={cn("grid gap-3", className)}>
      <legend className="text-sm font-medium">{question}</legend>
      <div className="grid grid-cols-6 gap-1.5 sm:[grid-template-columns:repeat(var(--scores),minmax(0,1fr))]" style={{ "--scores": scores.length } as React.CSSProperties}>
        {scores.map((score) => (
          <label key={score} className="relative flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border text-sm tabular-nums transition-colors hover:bg-muted has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40">
            <input type="radio" name={name ?? id} value={score} checked={value === score} onChange={() => onValueChange(score)} className="sr-only" />
            {score}
          </label>
        ))}
      </div>
      <p id={`${id}-ends`} className="flex justify-between text-xs text-muted-foreground">
        <span>{min}: {lowLabel}</span>
        <span>{max}: {highLabel}</span>
      </p>
    </fieldset>
  );
}
