import type { ComponentProps, CSSProperties } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

export type ScrollAwayEffect = "fade" | "lift" | "scale";

/** Where each effect ends. All of them end invisible; they differ in how they get there. */
function endTransform(effect: ScrollAwayEffect, distance: number): string {
  switch (effect) {
    case "lift": return `translate3d(0, ${-distance}px, 0)`;
    case "scale": return `translate3d(0, ${-Math.round(distance / 3)}px, 0) scale(0.9)`;
    default: return "none";
  }
}

/**
 * Two animations on one view timeline, longhands only (the `animation`
 * shorthand would reset the timeline). The first dims, moves and softens the
 * element. The second only switches pointer events off, stepping at the very
 * end of the range, so a link that has faded out cannot be pressed by mistake
 * while one that is still visible always can. Gated twice: reduced motion and
 * a browser without scroll timelines both leave the element as it is.
 */
const scrollAwayClass = [
  "motion-safe:supports-[animation-timeline:view()]:[animation-name:var(--animate-rhs-scroll-away),var(--animate-rhs-scroll-away-inert)]",
  "motion-safe:supports-[animation-timeline:view()]:[animation-timeline:view(),view()]",
  "motion-safe:supports-[animation-timeline:view()]:[animation-range:var(--away-range),var(--away-range)]",
  "motion-safe:supports-[animation-timeline:view()]:[animation-fill-mode:both,both]",
  "motion-safe:supports-[animation-timeline:view()]:[animation-timing-function:linear,step-end]",
].join(" ");

export interface ScrollAwayProps extends ComponentProps<"div"> {
  /** How it leaves. `fade` only dims, `lift` rises as it dims, `scale` shrinks away. */
  effect?: ScrollAwayEffect;
  /** Travel in pixels for `lift`, a third of it for `scale`. */
  distance?: number;
  /** Blur in pixels reached by the time it is gone: 0 stays sharp, 6 to 10 softens it. */
  blur?: number;
  /** When it runs, as CSS `animation-range`. The default starts as the element reaches the top of the screen and ends when 80% of it has gone. */
  range?: string;
  /** Put the effect on your own element (a heading, a link) instead of a wrapping div. */
  asChild?: boolean;
}

/**
 * The exit counterpart to Reveal: content that fades, lifts and softens as it
 * scrolls off the top, so a hero or a page header makes way instead of being
 * cut by the edge of the screen. Pure CSS on a view timeline, no scroll
 * handler and no layout shift; the server renders the element at rest, and
 * reduced motion or a browser without scroll timelines keeps it fully visible.
 */
export function ScrollAway({ effect = "lift", distance = 64, blur = 0, range = "exit 0% exit 80%", asChild = false, className, style, ...props }: ScrollAwayProps) {
  const Comp = asChild ? Slot.Root : "div";
  const vars = {
    "--away-transform": endTransform(effect, distance),
    "--away-filter": blur > 0 ? `blur(${blur}px)` : "none",
    "--away-range": range,
  } as CSSProperties;
  return <Comp data-slot="scroll-away" data-effect={effect} className={cn(scrollAwayClass, className)} style={{ ...vars, ...style }} {...props} />;
}
