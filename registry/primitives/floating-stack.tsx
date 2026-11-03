"use client";

import { Children, useEffect, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The corner of the screen the stack grows from. `end` is the right in left-to-right text and the left in right-to-left text. */
export type FloatingStackCorner = "bottom-end" | "bottom-start" | "top-end" | "top-start";

/** The space between widgets: a step, or any CSS length such as `1rem`. `sm` 0.5rem, `md` 0.75rem, `lg` 1rem. */
export type FloatingStackGap = "sm" | "md" | "lg" | (string & {});

export interface FloatingStackProps extends Omit<ComponentProps<"div">, "children"> {
  /** The widgets, the first one nearest the corner. They are your own buttons: a back-to-top, a chat launcher, a feedback tab. */
  children: ReactNode;
  /** The corner of the screen to pin the stack to. Default `bottom-end`. */
  corner?: FloatingStackCorner;
  /** The space between widgets. Default `md`. */
  gap?: FloatingStackGap;
  /** The distance from the edges of the screen, in pixels or as any CSS length. The safe area is added on top. Default `20`. */
  offset?: number | string;
  /** Keep clear of a fixed bar and the on-screen keyboard: the stack sits above a bottom bar (or under a top one) that is published by `ChromeOffsets` as `--chrome-bottom` and `--chrome-top`, and rides above the keyboard. The keyboard covers the bar and the home indicator, so a bottom stack clears whichever reaches higher, not both added up. Default `false`. */
  respectChrome?: boolean;
  /** The height of the keyboard in pixels, when you know it and do not want it measured. It replaces the measured value. Only used with `respectChrome`. */
  keyboardInset?: number;
  /** A name for the group of widgets, for assistive technology. Without it the stack adds no landmark and no role. */
  label?: string;
}

const GAPS: Record<string, string> = { sm: "0.5rem", md: "0.75rem", lg: "1rem" };

/**
 * Written out whole, because Tailwind reads class names from the source. Every edge is the offset, plus the safe area, plus (for the
 * stack that respects the chrome) the bar or the keyboard that is there. The bottom corners stack upwards, so the first child is the one
 * in the corner. With the keyboard up the bottom safe area is zero: the keyboard covers the home indicator.
 */
const CORNER: Record<FloatingStackCorner, string> = {
  "bottom-end": "bottom-[calc(var(--fs-offset)_+_var(--fs-safe-bottom)_+_var(--fs-lift-bottom))] end-[calc(var(--fs-offset)_+_var(--fs-side))] flex-col-reverse items-end",
  "bottom-start": "bottom-[calc(var(--fs-offset)_+_var(--fs-safe-bottom)_+_var(--fs-lift-bottom))] start-[calc(var(--fs-offset)_+_var(--fs-side))] flex-col-reverse items-start",
  "top-end": "top-[calc(var(--fs-offset)_+_env(safe-area-inset-top,0px)_+_var(--fs-lift-top))] end-[calc(var(--fs-offset)_+_var(--fs-side))] flex-col items-end",
  "top-start": "top-[calc(var(--fs-offset)_+_env(safe-area-inset-top,0px)_+_var(--fs-lift-top))] start-[calc(var(--fs-offset)_+_var(--fs-side))] flex-col items-start",
};

/**
 * A corner for the things that float over a page, so they never collide:
 * the back-to-top button, a chat launcher and a feedback tab stack with an
 * even gap instead of sitting on top of each other. The stack ignores
 * pointer events and only its children receive them, so it never blocks a
 * click on the page behind the gaps. It adds the safe-area insets, hides when
 * the page is printed, and keeps the document order equal to the visual
 * order from the corner outwards, so Tab goes the way people expect: the
 * first child is the one nearest the corner and the first to be reached. With
 * `respectChrome` it lifts above a fixed bottom bar or the on-screen keyboard,
 * whichever reaches higher (it reads the offsets that `ChromeOffsets`
 * publishes, and the visual viewport; the keyboard covers the bar and the home
 * indicator, so the two are never added up), and a top stack drops under a
 * fixed header.
 */
export function FloatingStack({ children, corner = "bottom-end", gap = "md", offset = 20, respectChrome = false, keyboardInset, label, className, style, ...props }: FloatingStackProps) {
  const [measured, setMeasured] = useState(0);

  // The on-screen keyboard shrinks the visual viewport and nothing else, so what it covers is the gap between the bottoms of the two.
  // A pinch zoom shrinks the visual viewport too, which is not a keyboard.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!respectChrome || !viewport) return;
    const read = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setMeasured(viewport.scale > 1.05 || covered < 100 ? 0 : Math.round(covered));
    };
    read();
    viewport.addEventListener("resize", read);
    viewport.addEventListener("scroll", read);
    return () => {
      viewport.removeEventListener("resize", read);
      viewport.removeEventListener("scroll", read);
      setMeasured(0);
    };
  }, [respectChrome]);

  if (Children.toArray(children).length === 0) return null;
  const keyboard = Math.max(0, keyboardInset ?? (respectChrome ? measured : 0));
  // Only a stack that respects the chrome is lifted, and then only as far as the higher of the bar and the keyboard.
  const keyboardUp = respectChrome && keyboard > 0;
  return (
    <div
      data-slot="floating-stack"
      data-corner={corner}
      role={label ? "group" : undefined}
      aria-label={label}
      style={
        {
          "--fs-gap": GAPS[gap] ?? gap,
          "--fs-offset": typeof offset === "number" ? `${offset}px` : offset,
          // The larger of the two sides, so the stack stays the same distance from its edge in landscape on a phone with a notch.
          "--fs-side": "max(env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))",
          // The keyboard is drawn over a fixed bottom bar, so the bar and the keyboard are not stacked: the stack clears the higher of the two.
          "--fs-lift-bottom": respectChrome ? `max(var(--chrome-bottom,0px), ${keyboard}px)` : "0px",
          // The keyboard covers the home indicator too, so the safe area is only counted while there is no keyboard.
          "--fs-safe-bottom": keyboardUp ? "0px" : "env(safe-area-inset-bottom,0px)",
          "--fs-lift-top": respectChrome ? "var(--chrome-top,0px)" : "0px",
          ...style,
        } as CSSProperties
      }
      // Above the page and its sticky bars, below a dialog. Only the widgets take the pointer.
      className={cn("pointer-events-none fixed z-40 flex gap-(--fs-gap) transition-[bottom,top] duration-200 ease-out print:hidden motion-reduce:transition-none [&>*]:pointer-events-auto", CORNER[corner], className)}
      {...props}
    >
      {children}
    </div>
  );
}
