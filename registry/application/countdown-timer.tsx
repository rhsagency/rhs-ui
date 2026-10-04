"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface CountdownTimerProps {
  /** The moment it counts down to, as an ISO string or a timestamp. */
  target: string | number;
  /** What happens then, for screen readers and the finished state: "Doors open". */
  label: string;
  /** Text shown when the moment has passed. */
  finished?: string;
  className?: string;
}

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

/**
 * Days, hours, minutes and seconds to a launch or a sale end. Renders a
 * stable placeholder on the server (the server does not know the reader's
 * clock), then ticks every second. Screen readers get one summary that
 * updates per minute, not every tick.
 */
export function CountdownTimer({ target, label, finished = "It has started.", className }: CountdownTimerProps) {
  const end = typeof target === "number" ? target : Date.parse(target);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = now === null ? null : end - now;
  if (left !== null && left <= 0) return <p data-slot="countdown-timer" role="status" className={cn("text-sm font-medium", className)}>{finished}</p>;
  const value = left === null ? null : parts(left);
  const units: [keyof ReturnType<typeof parts>, string][] = [["days", "Days"], ["hours", "Hours"], ["minutes", "Minutes"], ["seconds", "Seconds"]];
  return (
    <div data-slot="countdown-timer" className={cn("inline-flex flex-col gap-2", className)}>
      <p className="sr-only" aria-live="polite">{value ? `${label} in ${value.days} days, ${value.hours} hours and ${value.minutes} minutes` : label}</p>
      <div aria-hidden="true" className="flex gap-2 sm:gap-3">
        {units.map(([key, name]) => (
          <div key={key} className="flex min-w-16 flex-col items-center rounded-xl border border-border bg-card px-3 py-3 sm:min-w-20">
            <span className="font-mono text-3xl font-medium tabular-nums sm:text-4xl">{value ? String(value[key]).padStart(2, "0") : "--"}</span>
            <span className="mt-1 text-[0.6875rem] uppercase tracking-[.14em] text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
