"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties } from "react";

import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export interface FillBarProps extends Omit<ComponentProps<"div">, "children" | "ref"> {
  /** How far along it is. A value past `max` draws a full bar, one below zero an empty bar, and the text still shows the real number. */
  value: number;
  /** The value that means full. */
  max?: number;
  /** What the bar measures: "TypeScript", "API requests". */
  label: string;
  /** Show the value at the right of the label. */
  showValue?: boolean;
  /** How the value reads: "percent" (62%), "value" (7,420) or "fraction" (7,420 of 10,000). */
  format?: "percent" | "value" | "fraction";
  /** Replaces the value text entirely, for anything the formats do not cover: "7.2 of 10 GB". */
  valueText?: string;
  /** BCP 47 locale for the numbers. Pass your application locale. */
  locale?: string;
  /** Milliseconds the fill takes. */
  duration?: number;
  /** Position in a list of bars: each step starts the fill a little later, so a group lands in sequence. */
  order?: number;
  /** `muted` is for the bars that are not the point, `destructive` for a limit that has been hit. */
  tone?: "default" | "muted" | "destructive";
  /** Fill once (the default), or fill again every time the bar comes back into view. */
  once?: boolean;
}

type Phase = "idle" | "hidden" | "shown" | "done";

const noSubscription = (): (() => void) => () => {};

/** True when this instance was created in the browser, false while it is hydrating server HTML. */
function useCreatedInBrowser(): boolean {
  const browser = useSyncExternalStore(noSubscription, () => true, () => false);
  const [created] = useState(browser);
  return created;
}

const STEP_MS = 90;
const MAX_DELAY_MS = 600;

/**
 * A labelled bar that fills to its value when it scrolls into view, for
 * skills, quotas and survey results. It is the Progress primitive underneath,
 * so the progressbar role and the real value are in the page from the first
 * render and only the drawing animates. Bars in a list stagger through
 * `order`; reduced motion, and a bar that is already on screen when the page
 * hydrates, show the final width at once.
 */
export function FillBar({ value, max = 100, label, showValue = true, format = "percent", valueText, locale = "en-US", duration = 900, order = 0, tone = "default", once = true, className, style, ...props }: FillBarProps) {
  const labelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const created = useCreatedInBrowser();
  const [phase, setPhase] = useState<Phase>("idle");
  const delay = Math.min(MAX_DELAY_MS, Math.max(0, order) * STEP_MS);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let seen = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (!seen && !created) {
          // Already on screen from the server HTML: leave it full.
          seen = true;
          if (entry.isIntersecting) {
            if (once) observer.disconnect();
            return;
          }
          setPhase("hidden");
          return;
        }
        seen = true;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.349) {
          setPhase("shown");
          if (once) observer.disconnect();
        } else if (!entry.isIntersecting && !once) setPhase("hidden");
      },
      { threshold: [0, 0.35] },
    );
    if (created) setPhase("hidden"); // before the first paint, so the full bar never flashes
    observer.observe(node);
    return () => observer.disconnect();
  }, [created, once]);

  // Once the fill has played, later changes of the value use the Progress primitive's own quick transition.
  useEffect(() => {
    if (phase !== "shown") return;
    const id = window.setTimeout(() => setPhase("done"), delay + duration + 60);
    return () => window.clearTimeout(id);
  }, [phase, delay, duration]);

  const safeMax = max > 0 ? max : 1;
  // The bar is drawn from the clamped value; every text, whatever its format, says the real one (118% for a quota that is over its limit).
  const real = Number.isFinite(value) ? value : 0;
  const clamped = Math.min(safeMax, Math.max(0, real));
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const text =
    valueText ??
    (format === "value"
      ? number.format(real)
      : format === "fraction"
        ? `${number.format(real)} of ${number.format(safeMax)}`
        : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(real / safeMax));
  const vars = { "--rhs-fill-duration": `${duration}ms`, "--rhs-fill-delay": `${delay}ms`, ...style } as CSSProperties;

  return (
    <div ref={root} data-slot="fill-bar" data-tone={tone} className={cn("grid gap-2", className)} style={vars} {...props}>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span id={labelId} className="font-medium">
          {label}
        </span>
        {showValue ? <span className={cn("tabular-nums", tone === "destructive" ? "text-destructive" : "text-muted-foreground")}>{text}</span> : null}
      </div>
      <Progress
        aria-labelledby={labelId}
        value={clamped}
        max={safeMax}
        getValueLabel={() => text}
        data-reveal={phase === "idle" || phase === "done" ? undefined : phase}
        className={cn(
          "h-2",
          "[&[data-reveal=hidden]>[data-slot=progress-indicator]]:-translate-x-full [&[data-reveal=hidden]>[data-slot=progress-indicator]]:transition-none print:[&>[data-slot=progress-indicator]]:-translate-x-[calc(100%-var(--progress))]!",
          "[&[data-reveal=shown]>[data-slot=progress-indicator]]:duration-[var(--rhs-fill-duration,900ms)] [&[data-reveal=shown]>[data-slot=progress-indicator]]:delay-[var(--rhs-fill-delay,0ms)] [&[data-reveal=shown]>[data-slot=progress-indicator]]:ease-[cubic-bezier(0.22,1,0.36,1)]",
          tone === "muted" && "[&>[data-slot=progress-indicator]]:bg-muted-foreground",
          tone === "destructive" && "[&>[data-slot=progress-indicator]]:bg-destructive",
        )}
      />
    </div>
  );
}
