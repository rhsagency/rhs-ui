"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BorderBeamProps {
  children: ReactNode;
  /** Seconds for one lap around the border. */
  duration?: number;
  /** Length of the beam, as a share of the lap. */
  length?: number;
  className?: string;
}

/**
 * A short light that travels around a card's border, to mark the one item
 * that matters: the recommended plan, the live session. A conic gradient
 * turned with Web Animations; under reduced motion the border stays plain.
 */
export function BorderBeam({ children, duration = 6, length = 0.18, className }: BorderBeamProps) {
  const beam = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = beam.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = node.animate([{ transform: "translate(-50%, -50%) rotate(0turn)" }, { transform: "translate(-50%, -50%) rotate(1turn)" }], { duration: duration * 1000, iterations: Infinity, easing: "linear" });
    return () => animation.cancel();
  }, [duration]);
  const stop = Math.round(length * 360);
  return (
    <div data-slot="border-beam" className={cn("relative isolate overflow-hidden rounded-2xl p-px", className)}>
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-border" />
      <span
        ref={beam}
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-10 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden"
        style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent ${360 - stop}deg, var(--foreground) 360deg)` }}
      />
      <div className="relative h-full rounded-[calc(1rem-1px)] bg-card">{children}</div>
    </div>
  );
}
