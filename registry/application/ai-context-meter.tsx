import { cn } from "@/lib/utils";

export interface AiContextMeterProps {
  /** Tokens used so far. */
  used: number;
  /** The model's context window. */
  limit: number;
  /** Locale for the numbers; fixed so server and browser agree. */
  locale?: string;
  className?: string;
}

/**
 * How full the conversation is: a small ring and the count, so people know
 * when an old chat will start to forget. Turns to a warning at 80% and says
 * so in its label, not only in the ring.
 */
export function AiContextMeter({ used, limit, locale = "en-GB", className }: AiContextMeterProps) {
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const percent = Math.round(ratio * 100);
  const warn = ratio >= 0.8;
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const r = 7;
  const circumference = 2 * Math.PI * r;
  return (
    <span
      data-slot="ai-context-meter"
      data-warning={warn || undefined}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      aria-label={`Context ${percent}% used${warn ? ", nearly full" : ""}`}
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums", warn && "text-foreground", className)}
    >
      <svg viewBox="0 0 18 18" className="size-4 -rotate-90" aria-hidden="true">
        <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2" className="stroke-border" />
        <circle cx="9" cy="9" r={r} fill="none" strokeWidth="2" strokeLinecap="round" className={warn ? "stroke-[var(--color-warning,oklch(0.72_0.16_75))]" : "stroke-foreground"} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} />
      </svg>
      {compact.format(used)} / {compact.format(limit)}
    </span>
  );
}
