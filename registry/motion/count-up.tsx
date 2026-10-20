"use client";

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface CountUpProps extends Omit<ComponentProps<"span">, "children" | "ref"> {
  /** The number to count to. */
  value: number;
  /** Where the count starts. */
  from?: number;
  /** Milliseconds the count takes. */
  duration?: number;
  /** Milliseconds to wait after the number has scrolled into view. */
  delay?: number;
  /** Text before the number: "$". */
  prefix?: string;
  /** Text after the number: "%", "k", " orders". */
  suffix?: string;
  /** Digits after the decimal point. */
  decimals?: number;
  /** BCP 47 locale for digits and separators. Pass your application locale. */
  locale?: string;
  /** More number formatting, such as `{ notation: "compact" }`. Set after `decimals`, so it wins. */
  format?: Intl.NumberFormatOptions;
  /** Count once (the default), or count again every time the number comes back into view. */
  once?: boolean;
}

type Phase = "settled" | "armed" | "counting" | "done";

interface Live {
  value: number;
  from: number;
  duration: number;
  delay: number;
  once: boolean;
  text: (n: number) => string;
}

const noSubscription = (): (() => void) => () => {};

/** True when this instance was created in the browser, false while it is hydrating server HTML. */
function useCreatedInBrowser(): boolean {
  const browser = useSyncExternalStore(noSubscription, () => true, () => false);
  const [created] = useState(browser);
  return created;
}

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 4);

/**
 * A number that counts up the first time it is mostly on screen: for the
 * figures on a stats band, a pricing claim or a results page. The final value
 * is in the page from the first render, for screen readers, search engines
 * and print, and the visible digits sit in a box as wide as that final value,
 * so nothing shifts while they run. Reduced motion, a browser without
 * IntersectionObserver, or a number that is already on screen when the page
 * hydrates simply show the final value.
 */
export function CountUp({ value, from = 0, duration = 1600, delay = 0, prefix = "", suffix = "", decimals = 0, locale = "en-US", format, once = true, className, ...props }: CountUpProps) {
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, ...format }),
    [locale, decimals, format],
  );
  const text = (n: number): string => `${prefix}${formatter.format(n)}${suffix}`;
  const finalText = text(value);
  const created = useCreatedInBrowser();
  const root = useRef<HTMLSpanElement>(null);
  const visual = useRef<HTMLSpanElement>(null);
  // What the server rendered. React never rewrites it, so the digits are free to run.
  const initial = useRef(finalText);
  const live = useRef<Live>({ value, from, duration, delay, once, text });
  const run = useRef<{ phase: Phase; shown: number; frame: number; count: () => void }>({ phase: "settled", shown: value, frame: 0, count: () => {} });

  useLayoutEffect(() => {
    live.current = { value, from, duration, delay, once, text };
  });

  useLayoutEffect(() => {
    const node = root.current;
    const out = visual.current;
    const state = run.current;
    if (!node || !out || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const paint = (n: number): void => {
      state.shown = n;
      out.textContent = live.current.text(n);
    };
    const stop = (): void => cancelAnimationFrame(state.frame);
    const count = (): void => {
      stop();
      const { value: to, duration: ms, delay: wait } = live.current;
      const start = state.shown;
      const t0 = performance.now() + wait;
      state.phase = "counting";
      const tick = (now: number): void => {
        const p = ms > 0 ? Math.min(1, Math.max(0, (now - t0) / ms)) : 1;
        if (p >= 1) {
          paint(to);
          state.phase = "done";
          return;
        }
        paint(start + (to - start) * easeOut(p));
        state.frame = requestAnimationFrame(tick);
      };
      state.frame = requestAnimationFrame(tick);
    };
    const arm = (): void => {
      stop();
      state.phase = "armed";
      paint(live.current.from);
    };
    state.count = count;
    let seen = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (!seen && !created) {
          // Already on screen from the server HTML: leave the final value alone.
          seen = true;
          if (entry.isIntersecting) {
            if (live.current.once) observer.disconnect();
            return;
          }
          arm();
          return;
        }
        seen = true;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.399) {
          if (state.phase !== "armed") return;
          count();
          if (live.current.once) observer.disconnect();
        } else if (!entry.isIntersecting && !live.current.once && state.phase !== "armed") arm();
      },
      { threshold: [0, 0.4] },
    );
    if (created) arm(); // before the first paint, so the final value never flashes
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [created, once]);

  // A new target: follow it, counting if the number has already been revealed.
  useLayoutEffect(() => {
    const state = run.current;
    const out = visual.current;
    if (!out) return;
    if (state.phase === "settled") {
      state.shown = live.current.value;
      out.textContent = live.current.text(live.current.value);
    } else if (state.phase === "done" || state.phase === "counting") state.count();
  }, [finalText]);

  return (
    <span ref={root} data-slot="count-up" className={cn("relative inline-grid tabular-nums", className)} {...props}>
      <span className="sr-only print:not-sr-only">{finalText}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 print:hidden">
        {finalText}
      </span>
      <span ref={visual} aria-hidden="true" className="col-start-1 row-start-1 print:hidden">
        {initial.current}
      </span>
    </span>
  );
}
