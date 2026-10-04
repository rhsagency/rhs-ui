import { cn } from "@/lib/utils";

export interface StackedBarSegment {
  label: string;
  value: number;
}

export interface StackedBarProps {
  label: string;
  segments: readonly StackedBarSegment[];
  locale?: string;
  className?: string;
}

const SHADES = ["bg-foreground", "bg-foreground/65", "bg-foreground/40", "bg-foreground/20", "bg-foreground/10"];

/**
 * Parts of a whole on one bar: storage by type, traffic by device, budget by
 * team. Shades step from the largest down, a legend repeats every part with
 * its share, and the bar is described in full for screen readers.
 */
export function StackedBar({ label, segments, locale = "en-GB", className }: StackedBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  return (
    <figure data-slot="stacked-bar" className={cn("grid gap-3", className)}>
      <figcaption className="text-sm font-medium">{label}</figcaption>
      <div role="img" aria-label={`${label}: ${sorted.map((segment) => `${segment.label} ${percent.format(segment.value / total)}`).join(", ")}`} className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {sorted.map((segment, index) => <span key={segment.label} className={cn("h-full first:rounded-l-full last:rounded-r-full", SHADES[Math.min(index, SHADES.length - 1)])} style={{ width: `${(segment.value / total) * 100}%` }} />)}
      </div>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {sorted.map((segment, index) => (
          <li key={segment.label} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", SHADES[Math.min(index, SHADES.length - 1)])} />
            {segment.label}
            <span className="text-muted-foreground tabular-nums">{percent.format(segment.value / total)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
