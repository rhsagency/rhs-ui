"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Names the card for the flip button: "Show the details of Team". */
  label: string;
  className?: string;
}

/**
 * A card with two faces that turns over on click, Enter or Space. The
 * hidden face is inert, so focus and screen readers only meet the side that
 * shows. Reduced motion swaps the faces without the turn.
 */
export function FlipCard({ front, back, label, className }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const face = "absolute inset-0 overflow-hidden rounded-2xl border border-border bg-card [backface-visibility:hidden]";
  return (
    <div data-slot="flip-card" className={cn("relative [perspective:1200px]", className)}>
      <div className={cn("relative size-full transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] [transform-style:preserve-3d] motion-reduce:transition-none", flipped && "[transform:rotateY(180deg)]")}>
        <div className={face} inert={flipped}>{front}</div>
        <div className={cn(face, "[transform:rotateY(180deg)]")} inert={!flipped}>{back}</div>
      </div>
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={label}
        onClick={() => setFlipped((value) => !value)}
        className="absolute right-3 bottom-3 z-10 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {flipped ? "Back" : "Flip"}
      </button>
    </div>
  );
}
