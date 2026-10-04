import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface RealtimeCounterProps {
  /** "Visitors right now". */
  label: string;
  value: number;
  /** Small breakdown under the number: top pages, countries. */
  breakdown?: readonly { label: string; value: number }[];
  /** "Updated every 10 s". */
  footnote?: ReactNode;
  locale?: string;
  className?: string;
}

/**
 * A live number for an analytics or ops screen: a pulsing dot (still under
 * reduced motion) that says it is live, the number large, and a short
 * breakdown below. You push new values in; the region is polite, so screen
 * readers hear the number when it settles, not every tick.
 */
export function RealtimeCounter({ label, value, breakdown = [], footnote, locale = "en-GB", className }: RealtimeCounterProps) {
  const number = new Intl.NumberFormat(locale);
  return (
    <section data-slot="realtime-counter" aria-label={label} className={cn("relative rounded-2xl border border-border p-5", className)}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden="true" className="relative inline-flex size-2">
          <span className="absolute inset-0 rounded-full bg-foreground/60 motion-safe:animate-ping" />
          <span className="relative inline-block size-2 rounded-full bg-foreground" />
        </span>
        {label}
        <span className="sr-only">(live)</span>
      </p>
      <p aria-live="polite" aria-atomic="true" className="mt-2 text-5xl font-medium tracking-tight tabular-nums" suppressHydrationWarning>{number.format(value)}</p>
      {breakdown.length ? (
        <ul className="mt-4 grid gap-1.5 border-t border-border pt-3 text-sm">
          {breakdown.map((row) => <li key={row.label} className="flex justify-between gap-4"><span className="truncate text-muted-foreground">{row.label}</span><span className="tabular-nums" suppressHydrationWarning>{number.format(row.value)}</span></li>)}
        </ul>
      ) : null}
      {footnote ? <p className="mt-3 text-xs text-muted-foreground">{footnote}</p> : null}
    </section>
  );
}
