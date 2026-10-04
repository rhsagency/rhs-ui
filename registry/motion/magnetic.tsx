"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MagneticProps {
  children: ReactNode;
  /** How far the child follows the pointer, as a share of the offset. */
  strength?: number;
  /** Pixels around the element where the pull starts. */
  radius?: number;
  className?: string;
}

/**
 * Wrap a button or icon and it leans toward the pointer when it comes near,
 * then springs back. Only for a fine pointer and never under reduced
 * motion; keyboard and touch get the plain control.
 */
export function Magnetic({ children, strength = 0.3, radius = 80, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      const near = Math.abs(dx) < box.width / 2 + radius && Math.abs(dy) < box.height / 2 + radius;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.transform = near ? `translate3d(${dx * strength}px, ${dy * strength}px, 0)` : "";
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, [strength, radius]);
  return (
    <span ref={ref} data-slot="magnetic" className={cn("inline-block transition-transform duration-300 ease-[cubic-bezier(.2,.9,.3,1.3)] will-change-transform", className)}>
      {children}
    </span>
  );
}
