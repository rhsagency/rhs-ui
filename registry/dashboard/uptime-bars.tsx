import { cn } from "@/lib/utils";

export interface UptimeDay {
  /** Formatted for the tooltip: "14 April". */
  date: string;
  /** Share of the day the service was up, 0 to 1; null when not monitored. */
  uptime: number | null;
}

export interface UptimeBarsProps {
  label: string;
  days: readonly UptimeDay[];
  locale?: string;
  className?: string;
}

/**
 * Uptime as a row of day bars, the way status pages show it: full days
 * solid, partial days lighter, outages marked, unmonitored days hollow.
 * Each bar has a title; the row is summarised for screen readers.
 */
export function UptimeBars({ label, days, locale = "en-GB", className }: UptimeBarsProps) {
  const monitored = days.filter((day) => day.uptime !== null) as { date: string; uptime: number }[];
  const overall = monitored.length ? monitored.reduce((sum, day) => sum + day.uptime, 0) / monitored.length : 1;
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
  const incidents = monitored.filter((day) => day.uptime < 0.999).length;
  return (
    <figure data-slot="uptime-bars" className={cn("grid gap-2", className)}>
      <figcaption className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{percent.format(overall)} uptime</span>
      </figcaption>
      <div role="img" aria-label={`${label}: ${percent.format(overall)} uptime over ${days.length} days, ${incidents} days with incidents`} className="flex h-8 gap-px">
        {days.map((day, index) => (
          <span
            key={`${day.date}-${index}`}
            title={`${day.date}: ${day.uptime === null ? "not monitored" : percent.format(day.uptime)}`}
            className={cn("flex-1 rounded-[2px]", day.uptime === null ? "border border-border" : day.uptime >= 0.999 ? "bg-foreground/70" : day.uptime >= 0.95 ? "bg-[var(--color-warning,oklch(0.72_0.16_75))]" : "bg-destructive")}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{days[0]?.date}</span><span>{days.at(-1)?.date}</span></div>
    </figure>
  );
}
