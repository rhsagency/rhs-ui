"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface OrbitItemsProps {
  /** The thing in the middle: your logo or product mark. */
  center: ReactNode;
  /** Marks that circle around it, each about 40px. */
  items: readonly { id: string; label: string; node: ReactNode }[];
  /** Seconds per revolution. */
  duration?: number;
  /** Diameter of the orbit in pixels. */
  size?: number;
  className?: string;
}

/**
 * Integrations or team members circling a centre, on a thin ring. The ring
 * turns with Web Animations while each item counter-turns to stay upright;
 * it pauses on hover, and stands still under reduced motion.
 */
export function OrbitItems({ center, items, duration = 40, size = 320, className }: OrbitItemsProps) {
  const ring = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const node = ring.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const options = { duration: duration * 1000, iterations: Infinity, easing: "linear" } as const;
    const spin = node.animate([{ transform: "rotate(0turn)" }, { transform: "rotate(1turn)" }], options);
    const counters = [...node.querySelectorAll<HTMLElement>("[data-orbit-item]")].map((item) => item.animate([{ rotate: "0turn" }, { rotate: "-1turn" }], options));
    const all = [spin, ...counters];
    const pause = () => all.forEach((animation) => animation.pause());
    const play = () => all.forEach((animation) => animation.play());
    node.addEventListener("pointerenter", pause);
    node.addEventListener("pointerleave", play);
    return () => {
      node.removeEventListener("pointerenter", pause);
      node.removeEventListener("pointerleave", play);
      all.forEach((animation) => animation.cancel());
    };
  }, [duration, items.length]);
  return (
    <div data-slot="orbit-items" className={cn("relative mx-auto", className)} style={{ width: size, height: size, maxWidth: "100%" }}>
      <div aria-hidden="true" className="absolute inset-[20px] rounded-full border border-dashed border-border" />
      <div className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">{center}</div>
      <ul ref={ring} className="absolute inset-0" aria-label="Connected">
        {items.map((item, index) => {
          const angle = (index / items.length) * Math.PI * 2;
          const r = size / 2 - 20;
          return (
            <li
              key={item.id}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `translate(calc(-50% + ${Math.cos(angle) * r}px), calc(-50% + ${Math.sin(angle) * r}px))` }}
            >
              <span data-orbit-item className="flex size-10 items-center justify-center rounded-full border border-border bg-background [&_svg]:size-5">
                {item.node}
                <span className="sr-only">{item.label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
