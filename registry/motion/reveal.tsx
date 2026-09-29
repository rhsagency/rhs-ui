import type { ComponentProps, CSSProperties } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

export type RevealEffect = "rise" | "scale" | "tilt" | "blur" | "slide-left" | "slide-right";

/** Where each effect starts; it always ends at rest. */
function startOf(effect: RevealEffect, distance: number): { transform: string; opacity: number; filter: string } {
  switch (effect) {
    case "scale": return { transform: "scale(0.86)", opacity: 0.2, filter: "none" };
    case "tilt": return { transform: `perspective(1200px) translate3d(0, ${distance}px, 0) rotateX(22deg) scale(0.92)`, opacity: 0.15, filter: "none" };
    case "blur": return { transform: `translate3d(0, ${Math.round(distance / 3)}px, 0)`, opacity: 0, filter: "blur(12px)" };
    case "slide-left": return { transform: `translate3d(${-distance}px, 0, 0)`, opacity: 0, filter: "none" };
    case "slide-right": return { transform: `translate3d(${distance}px, 0, 0)`, opacity: 0, filter: "none" };
    default: return { transform: `translate3d(0, ${distance}px, 0) scale(0.96)`, opacity: 0, filter: "none" };
  }
}

/**
 * The scroll-driven animation in class form. Longhands only: the `animation`
 * shorthand would reset the timeline. Gated twice, so reduced motion and a
 * browser without scroll timelines both simply show the content at rest.
 */
export const revealClass =
  "motion-safe:supports-[animation-timeline:view()]:[animation-name:var(--animate-rhs-reveal)] motion-safe:supports-[animation-timeline:view()]:[animation-timeline:view()] motion-safe:supports-[animation-timeline:view()]:[animation-range:var(--reveal-range)] motion-safe:supports-[animation-timeline:view()]:[animation-fill-mode:both] motion-safe:supports-[animation-timeline:view()]:[animation-timing-function:linear]";

export interface RevealProps extends ComponentProps<"div"> {
  /** How the element arrives. `tilt` swings it forward in 3D, like a screen lifting off the page. */
  effect?: RevealEffect;
  /** Travel in pixels for rise, tilt, blur and the slides. */
  distance?: number;
  /** Position in a row of reveals: each step starts a little later, so a grid lands in sequence. */
  order?: number;
  /** The scroll range as CSS `animation-range`. The default finishes when the element is a third of the way up the screen. */
  range?: string;
  asChild?: boolean;
}

/**
 * Brings an element forward as it scrolls into view, tied to the scroll
 * itself: scroll back and it steps back. Pure CSS (scroll-driven animations),
 * no JavaScript and no layout shift; the server renders the element at rest,
 * so nothing is hidden before hydration or without support.
 */
export function Reveal({ effect = "rise", distance = 48, order = 0, range, asChild = false, className, style, ...props }: RevealProps) {
  const Comp = asChild ? Slot.Root : "div";
  const start = startOf(effect, distance);
  const offset = Math.max(0, order) * 6;
  const vars = {
    "--reveal-transform": start.transform,
    "--reveal-opacity": start.opacity,
    "--reveal-filter": start.filter,
    "--reveal-range": range ?? `entry ${offset}% cover ${30 + offset}%`,
  } as CSSProperties;
  return <Comp data-slot="reveal" data-effect={effect} className={cn(revealClass, className)} style={{ ...vars, ...style }} {...props} />;
}
