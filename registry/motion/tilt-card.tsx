"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TiltCardProps {
  children: ReactNode;
  /** Maximum tilt in degrees. */
  max?: number;
  /** A soft light that follows the pointer across the surface. */
  glare?: boolean;
  className?: string;
}

/**
 * A surface that tilts toward the pointer in 3D, with an optional glare. The
 * tilt is small and springs back on leave; touch, keyboard and reduced
 * motion get a flat card.
 */
export function TiltCard({ children, max = 8, glare = true, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  function move(event: PointerEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    node.style.setProperty("--tilt-x", `${(0.5 - y) * max * 2}deg`);
    node.style.setProperty("--tilt-y", `${(x - 0.5) * max * 2}deg`);
    node.style.setProperty("--glare-x", `${x * 100}%`);
    node.style.setProperty("--glare-y", `${y * 100}%`);
    node.dataset.active = "true";
  }
  function leave() {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    delete node.dataset.active;
  }
  return (
    <div className={cn("[perspective:900px]", className)}>
      <div
        ref={ref}
        data-slot="tilt-card"
        onPointerMove={move}
        onPointerLeave={leave}
        className="group/tilt relative overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 ease-out [transform:rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))] [transform-style:preserve-3d] data-[active]:duration-100"
      >
        {children}
        {glare ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-data-[active]/tilt:opacity-100 [background:radial-gradient(circle_at_var(--glare-x,50%)_var(--glare-y,50%),color-mix(in_oklch,var(--foreground)_10%,transparent),transparent_55%)]"
          />
        ) : null}
      </div>
    </div>
  );
}
