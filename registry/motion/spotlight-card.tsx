"use client";

import type { PointerEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SpotlightCardProps {
  children: ReactNode;
  /** Radius of the light in pixels. */
  size?: number;
  className?: string;
}

/**
 * A card with a soft light that follows the pointer, on the surface and on
 * the border. Put several in a grid and the light reads as one lamp moving
 * over the whole set. Touch and reduced motion show a plain card.
 */
export function SpotlightCard({ children, size = 320, className }: SpotlightCardProps) {
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
  }
  return (
    <div
      data-slot="spotlight-card"
      onPointerMove={move}
      style={{ "--spot-size": `${size}px` } as React.CSSProperties}
      className={cn(
        "group/spot relative overflow-hidden rounded-2xl border border-border bg-card p-px",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 motion-reduce:before:hidden",
        "before:[background:radial-gradient(var(--spot-size)_circle_at_var(--spot-x,50%)_var(--spot-y,50%),color-mix(in_oklch,var(--foreground)_28%,transparent),transparent_60%)]",
        className,
      )}
    >
      <div className="relative h-full rounded-[calc(1rem-1px)] bg-card">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100 motion-reduce:hidden [background:radial-gradient(var(--spot-size)_circle_at_var(--spot-x,50%)_var(--spot-y,50%),color-mix(in_oklch,var(--foreground)_6%,transparent),transparent_60%)]"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
