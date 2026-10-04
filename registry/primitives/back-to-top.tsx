"use client";

import { useEffect, useState } from "react";

import { IconArrowUp } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface BackToTopProps {
  /** Pixels scrolled before the button shows. */
  threshold?: number;
  className?: string;
}

/**
 * A round button that appears after a long scroll and takes the reader back
 * up, with a ring that fills as they read. Focus moves to the top of the
 * page too, so keyboard users land where the eye does. Instant under
 * reduced motion.
 */
export function BackToTop({ threshold = 600, className }: BackToTopProps) {
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(max > 0 ? scrollY / max : 0);
      setShown(scrollY > threshold);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  function top() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const target = document.querySelector<HTMLElement>("h1, main, body");
    target?.setAttribute("tabindex", target.getAttribute("tabindex") ?? "-1");
    target?.focus({ preventScroll: true });
  }
  const r = 20;
  const length = 2 * Math.PI * r;
  return (
    <button
      type="button"
      data-slot="back-to-top"
      aria-label="Back to top"
      onClick={top}
      className={cn("fixed right-5 bottom-5 z-40 inline-flex size-12 items-center justify-center rounded-full bg-background text-foreground shadow-lg outline-none transition-[opacity,transform] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none", shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0", className)}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="2" className="stroke-border" />
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-foreground" strokeDasharray={length} strokeDashoffset={length * (1 - progress)} />
      </svg>
      <IconArrowUp className="relative size-4" />
    </button>
  );
}
