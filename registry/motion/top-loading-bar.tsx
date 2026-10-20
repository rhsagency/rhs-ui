"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface TopLoadingBarProps extends Omit<ComponentProps<"div">, "children" | "ref"> {
  /** True while a navigation, request or action is pending. */
  active: boolean;
  /** `default` follows the text colour, `muted` is quieter, `destructive` marks a run that is failing. */
  tone?: "default" | "muted" | "destructive";
  /** Thickness of the bar in pixels. */
  height?: number;
  /** Milliseconds of pending work to ignore, so a fast response never flashes the bar. */
  delay?: number;
  /** What a screen reader hears while the bar is showing. */
  label?: string;
}

const GROW_MS = 800;
const CREEP_MS = 30_000;
const FINISH_MS = 220;
const FADE_MS = 320;

const TONES = { default: "bg-foreground", muted: "bg-muted-foreground", destructive: "bg-destructive" } as const;

/**
 * The route-change and async-action indicator: a thin bar that races to about
 * 80 percent while something is pending, keeps creeping so it never looks
 * stuck, then sweeps to the end and fades when the work is done. Pass `active`
 * from a transition or a form action. Work shorter than `delay` never shows
 * the bar at all. It is announced once as a polite status, and under reduced
 * motion it is a still line that appears and disappears.
 */
export function TopLoadingBar({ active, tone = "default", height = 2, delay = 150, label = "Loading", className, style, ...props }: TopLoadingBarProps) {
  const bar = useRef<HTMLDivElement>(null);
  const pending = useRef(0);
  const steps = useRef<number[]>([]);
  const phase = useRef<"idle" | "running" | "finishing">("idle");
  const [loading, setLoading] = useState(false);

  useEffect(
    () => () => {
      window.clearTimeout(pending.current);
      steps.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stop = (): void => {
      steps.current.forEach((id) => window.clearTimeout(id));
      steps.current = [];
    };
    const later = (run: () => void, ms: number): void => {
      steps.current.push(window.setTimeout(run, ms));
    };
    const draw = (transition: string, transform: string, opacity: string): void => {
      el.style.transition = transition;
      el.style.transform = transform;
      el.style.opacity = opacity;
    };
    const begin = (): void => {
      stop();
      phase.current = "running";
      setLoading(true);
      if (reduced) return draw("none", "scaleX(1)", "1");
      draw("none", "scaleX(0)", "1");
      void el.offsetWidth; // commit the empty bar first, so the next change animates
      draw(`transform ${GROW_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`, "scaleX(0.8)", "1");
      later(() => draw(`transform ${CREEP_MS}ms cubic-bezier(0.25, 0.5, 0.45, 1)`, "scaleX(0.96)", "1"), GROW_MS);
    };
    const finish = (): void => {
      stop();
      phase.current = "finishing";
      setLoading(false);
      const reset = (): void => {
        draw("none", "scaleX(0)", "0");
        phase.current = "idle";
      };
      if (reduced) return reset();
      draw(`transform ${FINISH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`, "scaleX(1)", "1");
      later(() => draw(`opacity ${FADE_MS}ms ease-out`, "scaleX(1)", "0"), FINISH_MS + 60);
      later(reset, FINISH_MS + 60 + FADE_MS);
    };

    if (active) {
      if (phase.current === "running") return;
      pending.current = window.setTimeout(begin, delay);
      return () => window.clearTimeout(pending.current);
    }
    window.clearTimeout(pending.current);
    if (phase.current === "running") finish();
  }, [active, delay]);

  return (
    <div
      data-slot="top-loading-bar"
      data-state={loading ? "loading" : "idle"}
      className={cn("pointer-events-none fixed inset-x-0 top-0 z-[60]", className)}
      style={{ height, ...style }}
      {...props}
    >
      <div ref={bar} aria-hidden="true" className={cn("h-full w-full origin-left opacity-0 will-change-transform [transform:scaleX(0)]", TONES[tone])} />
      <span role="status" className="sr-only">
        {loading ? label : ""}
      </span>
    </div>
  );
}
