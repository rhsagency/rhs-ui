"use client";

import { useState } from "react";

import { IconThumbsDown, IconThumbsUp } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AiFeedbackProps {
  /** Called once with the rating and, for a thumbs down, the chosen reason. */
  onFeedback: (feedback: { rating: "up" | "down"; reason?: string }) => void;
  reasons?: readonly string[];
  className?: string;
}

/**
 * Thumbs up or down on an answer. A thumbs down asks one optional follow-up
 * with ready-made reasons, then thanks the person and gets out of the way.
 */
export function AiFeedback({ onFeedback, reasons = ["Not accurate", "Not helpful", "Too long", "Unsafe"], className }: AiFeedbackProps) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [done, setDone] = useState(false);
  const button = "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:bg-muted aria-pressed:text-foreground [&_svg]:size-3.5";
  function rate(value: "up" | "down") {
    setRating(value);
    if (value === "up") {
      onFeedback({ rating: "up" });
      setDone(true);
    }
  }
  function reason(value?: string) {
    onFeedback({ rating: "down", reason: value });
    setDone(true);
  }
  return (
    <div data-slot="ai-feedback" className={cn("text-sm", className)}>
      <div role="group" aria-label="Rate this answer" className="flex items-center gap-1">
        <button type="button" className={button} aria-pressed={rating === "up"} aria-label="Good answer" disabled={done} onClick={() => rate("up")}><IconThumbsUp /></button>
        <button type="button" className={button} aria-pressed={rating === "down"} aria-label="Bad answer" disabled={done} onClick={() => rate("down")}><IconThumbsDown /></button>
        {done ? <span role="status" className="ml-2 text-xs text-muted-foreground">Thanks for the feedback.</span> : null}
      </div>
      {rating === "down" && !done ? (
        <div className="mt-2 rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">What went wrong?</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reasons.map((value) => (
              <button key={value} type="button" onClick={() => reason(value)} className="rounded-full border border-border px-2.5 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">{value}</button>
            ))}
            <button type="button" onClick={() => reason()} className="rounded-full px-2.5 py-1 text-xs text-muted-foreground underline-offset-4 hover:underline">Skip</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
