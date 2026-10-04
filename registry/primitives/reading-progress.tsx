"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export interface ReadingProgressProps {
  /** The id of the article to measure; the whole page when left out. */
  target?: string;
  className?: string;
}

/**
 * A thin bar across the top that fills as you read: measured against the
 * article when you name it, so comments and the footer do not count. It
 * writes a transform on scroll (no re-render per frame) and is decorative,
 * hidden from screen readers, who have their own sense of position.
 */
export function ReadingProgress({ target, className }: ReadingProgressProps) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    function measure() {
      frame = 0;
      const node = target ? document.getElementById(target) : document.documentElement;
      if (!node || !bar.current) return;
      const rect = node.getBoundingClientRect();
      const total = target ? rect.height - window.innerHeight : node.scrollHeight - window.innerHeight;
      const done = target ? -rect.top : window.scrollY;
      const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 1;
      bar.current.style.transform = `scaleX(${ratio})`;
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [target]);
  return (
    <div data-slot="reading-progress" aria-hidden="true" className={cn("pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5", className)}>
      <div ref={bar} className="h-full origin-left scale-x-0 bg-foreground" />
    </div>
  );
}
