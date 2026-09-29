import type { ComponentProps, CSSProperties } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

export interface ParallaxLayerProps extends ComponentProps<"div"> {
  /** How much faster (positive) or slower (negative) than the page the layer travels. 0.2 is subtle, 0.6 is dramatic. */
  speed?: number;
  /** Extra scale added by the time the layer leaves the screen: 0.15 grows it by 15% on the way through. */
  zoom?: number;
  /** Turn in degrees over the whole passage. */
  rotate?: number;
  asChild?: boolean;
}

/**
 * A layer that moves at its own pace while the page scrolls past it, for
 * depth in heroes, product shots and collages. Pure CSS on a view timeline;
 * reduced motion and browsers without scroll timelines keep it in place.
 */
export function ParallaxLayer({ speed = 0.25, zoom = 0, rotate = 0, asChild = false, className, style, ...props }: ParallaxLayerProps) {
  const Comp = asChild ? Slot.Root : "div";
  const travel = Math.round(Math.max(-1.5, Math.min(1.5, speed)) * 160);
  const vars = {
    "--parallax-from": `translate3d(0, ${travel}px, 0) scale(1) rotate(${-rotate / 2}deg)`,
    "--parallax-to": `translate3d(0, ${-travel}px, 0) scale(${1 + zoom}) rotate(${rotate / 2}deg)`,
  } as CSSProperties;
  return (
    <Comp
      data-slot="parallax-layer"
      className={cn(
        "will-change-transform motion-safe:supports-[animation-timeline:view()]:[animation-name:var(--animate-rhs-parallax)] motion-safe:supports-[animation-timeline:view()]:[animation-timeline:view()] motion-safe:supports-[animation-timeline:view()]:[animation-range:cover] motion-safe:supports-[animation-timeline:view()]:[animation-fill-mode:both] motion-safe:supports-[animation-timeline:view()]:[animation-timing-function:linear]",
        className,
      )}
      style={{ ...vars, ...style }}
      {...props}
    />
  );
}
