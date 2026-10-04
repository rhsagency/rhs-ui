"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface CountdownInlineProps {
  /** ISO date and time the countdown ends, with an offset: "2026-10-31T23:59:00+01:00". */
  until: string;
  /** Before the clock: "Ends in". */
  label?: string;
  /** Shown when the time has passed. */
  endedLabel?: string;
  className?: string;
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const two = (n: number) => String(n).padStart(2, "0");

/**
 * A one-line countdown for a sale or a deadline: "Ends in 2d 04:13:22",
 * ticking every second in tabular numbers so it does not jitter. It renders
 * after mount (the server cannot know the viewer's clock) and is not a
 * live region, so a screen reader is not read a number every second.
 */
export function CountdownInline({ until, label = "Ends in", endedLabel = "Ended", className }: CountdownInlineProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const end = Date.parse(until);
  const left = now === null ? null : end - now;
  const t = left === null ? null : parts(left);
  return (
    <span data-slot="countdown-inline" className={cn("inline-flex items-baseline gap-1.5 text-sm", className)}>
      {left !== null && left <= 0 ? (
        <span className="text-muted-foreground">{endedLabel}</span>
      ) : (
        <>
          <span className="text-muted-foreground">{label}</span>
          <time dateTime={until} className="font-medium tabular-nums">
            {t === null ? "--:--:--" : `${t.d ? `${t.d}d ` : ""}${two(t.h)}:${two(t.m)}:${two(t.s)}`}
          </time>
        </>
      )}
    </span>
  );
}
