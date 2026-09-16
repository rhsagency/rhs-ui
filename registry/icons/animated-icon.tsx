"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { Glyph, type IconProps } from "@rhs-ui/icons";

/**
 * The motion engine behind RHS UI's animated icons. An icon names its moving
 * parts with `data-part` and describes their keyframes; this file decides
 * when they run. The keyframes go through the Web Animations API, so there is
 * no animation library and no CSS to install, and a visitor who asks for
 * reduced motion always sees the still glyph.
 */

export type IconTrigger = "hover" | "loop" | "appear" | "static";

export interface AnimatedIconProps extends Omit<IconProps, "ref"> {
  /**
   * When the icon moves.
   * - `hover` (default): the pointer enters, or keyboard focus reaches, the
   *   closest button, link or `[data-rhs-icon-trigger]` element around the
   *   icon, or the icon itself when there is none.
   * - `loop`: repeats while the icon is on screen and the tab is visible.
   * - `appear`: once, the first time the icon scrolls into view.
   * - `static`: never.
   */
  trigger?: IconTrigger;
}

export interface IconMotionStep {
  /** The `data-part` of the element that moves. */
  part: string;
  keyframes: Keyframe[];
  duration: number;
  delay?: number;
  easing?: string;
  /** transform-origin in grid units, e.g. "12px 5px" for the top centre. */
  origin?: string;
}

export interface IconMotion {
  steps: readonly IconMotionStep[];
  /** Rest between two runs when `trigger` is `loop`, in ms. */
  pause?: number;
}

/** Elements that hand their hover and focus to an icon inside them. */
const TRIGGER_ZONE = "[data-rhs-icon-trigger], button, a[href], [role='button'], summary, label";
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

/**
 * One of our own motions, as opposed to a CSS transition or a CSS animation.
 * Exported so code that drives an icon can tell them apart too: cancelling a
 * motion is fine, cancelling a state transition would leave the icon half way.
 */
export const isIconMotion = (animation: Animation): boolean =>
  animation.playState === "running" && !("transitionProperty" in animation) && !("animationName" in animation);

/**
 * Plays one motion on a glyph and resolves when every part has finished.
 * Nothing moves for a visitor who asks for reduced motion, and a motion that
 * is already running is never doubled. Use it to drive an icon from your own
 * code (a check that draws when a save succeeds, for example); `trigger` on
 * the icon covers hover, focus, loop and first view without this.
 */
export function playIconMotion(svg: SVGSVGElement, motion: IconMotion): Promise<void> {
  if (typeof svg.animate !== "function") return Promise.resolve();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  // Only a motion of our own blocks the next one. A CSS transition inside the
  // same icon (a state icon switching, a part fading) is not a reason to skip:
  // that cost the first run of every motion that starts with a state change.
  if (svg.getAnimations({ subtree: true }).some(isIconMotion)) return Promise.resolve();
  return Promise.all(
    motion.steps.flatMap((step) =>
      Array.from(svg.querySelectorAll(`[data-part="${step.part}"]`), (el) =>
        el
          .animate(step.origin ? step.keyframes.map((frame) => ({ transformOrigin: step.origin, ...frame })) : step.keyframes, {
            duration: step.duration,
            delay: step.delay ?? 0,
            easing: step.easing ?? EASE,
            fill: "backwards",
          })
          .finished.catch(() => undefined),
      ),
    ),
  ).then(() => undefined);
}

export function useIconMotion(ref: RefObject<SVGSVGElement | null>, motion: IconMotion, trigger: IconTrigger): void {
  useEffect(() => {
    const svg = ref.current;
    // Test environments without the Web Animations API render the still glyph.
    if (!svg || trigger === "static" || typeof svg.animate !== "function") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const moving = (): boolean => svg.getAnimations({ subtree: true }).some(isIconMotion);
    const play = (): Promise<unknown> => playIconMotion(svg, motion);
    let disposed = false;
    let visible = false;
    let timer = 0;
    const run = (): void => {
      timer = 0;
      if (disposed || !visible || document.hidden || reduced.matches) return;
      void play().then(() => {
        if (trigger === "loop" && !disposed && !timer) timer = window.setTimeout(run, motion.pause ?? 1400);
      });
    };
    const onReducedChange = (): void => {
      if (reduced.matches) svg.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      else if (trigger === "loop" && !timer) run();
    };
    reduced.addEventListener("change", onReducedChange);

    if (trigger === "hover") {
      const zone = svg.closest(TRIGGER_ZONE) ?? svg;
      const onPointer = (): void => void play();
      const onFocus = (event: Event): void => {
        if (event.target instanceof Element && event.target.matches(":focus-visible")) void play();
      };
      zone.addEventListener("pointerenter", onPointer);
      zone.addEventListener("focusin", onFocus);
      return () => {
        zone.removeEventListener("pointerenter", onPointer);
        zone.removeEventListener("focusin", onFocus);
        reduced.removeEventListener("change", onReducedChange);
      };
    }

    if (typeof IntersectionObserver === "undefined") return () => reduced.removeEventListener("change", onReducedChange);
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (!visible) return;
      if (trigger === "appear") {
        observer.disconnect();
        run();
      } else if (!timer && !moving()) run();
    });
    observer.observe(svg);
    const onVisibility = (): void => {
      if (!document.hidden && visible && !timer && !moving()) run();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onReducedChange);
    };
  }, [ref, motion, trigger]);
}

/** A glyph whose parts move on a trigger. `motion` should be a module constant. */
export function AnimatedGlyph({
  motion,
  trigger = "hover",
  children,
  ...props
}: AnimatedIconProps & { motion: IconMotion; children: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null);
  useIconMotion(ref, motion, trigger);
  return (
    <Glyph {...props} ref={ref} data-trigger={trigger}>
      {children}
    </Glyph>
  );
}
