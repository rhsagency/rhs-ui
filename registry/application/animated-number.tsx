"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedNumberProps {
  value: number;
  locale?: string;
  format?: Intl.NumberFormatOptions;
  /** Seconds. New values continue from the currently displayed value. */
  duration?: number;
  className?: string;
}

/** Smooth count transitions. Assistive technology only receives the final value. */
export function AnimatedNumber({ value, locale = "en-US", format, duration = 0.7, className }: AnimatedNumberProps): React.JSX.Element {
  const formatter = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
  const initialText = useRef(formatter.format(value));
  const current = useRef(value);
  const visual = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = visual.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const from = current.current;
    const start = performance.now();
    const finish = (): void => {
      cancelAnimationFrame(frame);
      current.current = value;
      element.textContent = formatter.format(value);
      element.style.filter = "";
    };
    const tick = (time: number): void => {
      const progress = Math.min(1, (time - start) / (duration * 1000));
      current.current = from + (value - from) * (1 - Math.pow(1 - progress, 4));
      element.textContent = formatter.format(current.current);
      element.style.filter = `blur(${0.5 * Math.sin(progress * Math.PI)}px)`;
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    if (reduced.matches || duration <= 0 || !Number.isFinite(from) || !Number.isFinite(value) || from === value) finish();
    else frame = requestAnimationFrame(tick);
    const onPreference = (): void => { if (reduced.matches) finish(); };
    reduced.addEventListener("change", onPreference);
    return () => { cancelAnimationFrame(frame); reduced.removeEventListener("change", onPreference); };
  }, [value, duration, formatter]);
  return <span data-slot="animated-number" className={cn("inline-block tabular-nums", className)}><span className="sr-only">{formatter.format(value)}</span><span ref={visual} aria-hidden="true">{initialText.current}</span></span>;
}
