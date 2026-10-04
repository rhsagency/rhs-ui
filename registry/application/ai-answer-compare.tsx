"use client";

import { useId, useState, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CompareAnswer {
  id: string;
  /** "Response A", or the model's name when you show it. */
  label: string;
  body: ReactNode;
}

export interface AiAnswerCompareProps {
  prompt: string;
  answers: readonly [CompareAnswer, CompareAnswer];
  /** Called with the preferred answer, or "tie". */
  onPick: (choice: string) => void;
  className?: string;
}

/**
 * Two answers to the same prompt side by side, for preference feedback or a
 * model bake-off: pick the better one or call a tie, and the choice locks
 * with a check. Stacked on a phone; the pick is a radio group, so it is one
 * decision, said as one.
 */
export function AiAnswerCompare({ prompt, answers, onPick, className }: AiAnswerCompareProps) {
  const id = useId();
  const [choice, setChoice] = useState<string | null>(null);
  const pick = (value: string) => {
    setChoice(value);
    onPick(value);
  };
  const option = "relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 [&_svg]:size-3.5";
  return (
    <section data-slot="ai-answer-compare" aria-label="Compare two answers" className={cn("grid gap-4", className)}>
      <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm"><span className="text-muted-foreground">Prompt: </span>{prompt}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {answers.map((answer) => (
          <article key={answer.id} aria-label={answer.label} className={cn("rounded-2xl border p-4 transition-colors", choice === answer.id ? "border-foreground" : "border-border")}>
            <p className="flex items-center justify-between text-xs font-medium text-muted-foreground">{answer.label}{choice === answer.id ? <IconCheck aria-hidden="true" className="size-4 text-foreground" /> : null}</p>
            <div className="mt-2 text-sm leading-relaxed">{answer.body}</div>
          </article>
        ))}
      </div>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="mr-2 float-left py-1.5 text-sm font-medium">Which is better?</legend>
        {[...answers.map((answer) => ({ value: answer.id, label: answer.label })), { value: "tie", label: "About the same" }].map((item) => (
          <label key={item.value} className={option}>
            <input type="radio" name={id} value={item.value} checked={choice === item.value} onChange={() => pick(item.value)} className="sr-only" />
            {choice === item.value ? <IconCheck aria-hidden="true" /> : null}{item.label}
          </label>
        ))}
      </fieldset>
    </section>
  );
}
