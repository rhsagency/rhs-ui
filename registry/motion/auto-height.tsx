"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

export interface AutoHeightProps extends Omit<ComponentProps<"div">, "ref" | "children"> {
  /** The content whose height changes. */
  children: ReactNode;
  /** Milliseconds the height takes to settle. */
  duration?: number;
  /** The element to render. */
  as?: "div" | "section" | "article" | "aside" | "li" | "form" | "fieldset";
  /** Switch the animation off and let the height change at once. */
  disabled?: boolean;
}

/**
 * A container that glides to its new height instead of jumping, for form
 * steps, inline errors, swapped panels and anything else that grows or
 * shrinks. It watches its content with a ResizeObserver, so it follows images
 * that load and text that wraps as well as your own state changes. Height is
 * only pinned while it moves: afterwards it is `auto` again and overflow is
 * released, so focus rings and shadows are never clipped. Reduced motion
 * applies the change at once.
 */
export function AutoHeight({ children, duration = 260, as = "div", disabled = false, className, ...props }: AutoHeightProps) {
  const Tag = as as "div";
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const settled = useRef(0);
  const timer = useRef(0);
  const latest = useRef({ duration, disabled });

  useEffect(() => {
    latest.current = { duration, disabled };
  });

  useEffect(() => {
    const box = outer.current;
    const content = inner.current;
    if (!box || !content || typeof ResizeObserver === "undefined") return;
    settled.current = box.getBoundingClientRect().height;
    const release = (): void => {
      box.style.height = "";
      box.style.overflow = "";
      box.style.transition = "";
      settled.current = box.getBoundingClientRect().height;
    };
    const observer = new ResizeObserver(() => {
      const { duration: ms, disabled: off } = latest.current;
      const moving = box.style.height !== "";
      // Where the box is now: its last settled height, or wherever a running glide has got to.
      const from = moving ? box.getBoundingClientRect().height : settled.current;
      window.clearTimeout(timer.current);
      box.style.transition = "none";
      box.style.height = "";
      const to = box.getBoundingClientRect().height;
      if (off || ms <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(to - from) < 1) {
        release();
        return;
      }
      box.style.height = `${from}px`;
      box.style.overflow = "clip";
      void box.offsetHeight;
      box.style.transition = `height ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      box.style.height = `${to}px`;
      settled.current = to;
      timer.current = window.setTimeout(release, ms + 60);
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <Tag ref={outer} data-slot="auto-height" className={className} {...props}>
      <div ref={inner} data-slot="auto-height-content" className="flow-root">
        {children}
      </div>
    </Tag>
  );
}
