import type { ComponentProps } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconArrowDown, IconArrowUp, IconInfo, IconMinus } from "@rhs-ui/icons";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export interface Metric {
  /** Stable identity. `emphasis` points at it. */
  id: string;
  /** What is measured: "Revenue". */
  label: string;
  /** The figure. `null` means there is no data, and `missing` then says why. */
  value: number | null;
  /** Intl.NumberFormat options for the figure: currency, percent, compact. Keep the object stable between renders. */
  format?: Intl.NumberFormatOptions;
  /** Change since the last period as a ratio: 0.042 is up 4.2 percent. `null` means there is nothing to compare with; leave it out to show no comparison at all. */
  change?: number | null;
  /** One quiet line under the change: "Paid and shipped". */
  hint?: string;
  /** Shown in place of the change when `value` is null: "Connect your store to see revenue". */
  missing?: string;
}

export interface MetricStripProps extends Omit<ComponentProps<"div">, "children"> {
  /** Three to five metrics read best; the strip folds to two columns and then to a list on phones. */
  metrics: readonly Metric[];
  /** Skeleton figures in the same footprint while the numbers load. Pass the metrics you already have and the skeleton draws the rows they will carry (change, hint), so the height holds; with none it draws the tallest cell. */
  loading?: boolean;
  /** What the change compares with, as it ends the sentence "up 4.2 percent on ...". */
  periodLabel?: string;
  /** Compact tightens the cells and shrinks the figures for a denser page. */
  density?: "comfortable" | "compact";
  /** The `id` of the metric that reads first: a larger figure on a quiet fill. */
  emphasis?: string;
  /** What the strip is called for screen readers. */
  label?: string;
  /** BCP 47 locale for every figure and percentage. */
  locale?: string;
}

const COLUMNS: Record<number, string> = {
  1: "@3xl:grid-cols-1",
  2: "@3xl:grid-cols-2",
  3: "@3xl:grid-cols-3",
  4: "@3xl:grid-cols-4",
  5: "@3xl:grid-cols-5",
  6: "@3xl:grid-cols-6",
};

const PLACEHOLDERS: readonly Metric[] = [
  { id: "placeholder-1", label: "", value: null },
  { id: "placeholder-2", label: "", value: null },
  { id: "placeholder-3", label: "", value: null },
  { id: "placeholder-4", label: "", value: null },
];

interface ChangeView {
  direction: "up" | "down" | "flat";
  /** What is drawn: "Up 4.2%". */
  short: string;
  /** What is read out: "up 4.2 percent on last month". */
  spoken: string;
}

function describeChange(change: number, percent: Intl.NumberFormat, plain: Intl.NumberFormat, period: string): ChangeView {
  const size = Math.abs(change);
  if (size < 0.0005) return { direction: "flat", short: "No change", spoken: `unchanged on ${period}` };
  const direction = change > 0 ? "up" : "down";
  return {
    direction,
    short: `${direction === "up" ? "Up" : "Down"} ${percent.format(size)}`,
    spoken: `${direction} ${plain.format(size * 100)} percent on ${period}`,
  };
}

const DIRECTION_ICON = { up: IconArrowUp, down: IconArrowDown, flat: IconMinus } as const;

/**
 * The top of an analytics or admin home: three to five metrics on one bordered
 * surface, cut into cells by hairlines. Each cell has a label, a large
 * tabular figure that eases to new values, the change since the last period
 * in an arrow and a word, and an optional hint. Missing data shows a dash and
 * says why instead of a misleading zero. Each cell reads as one sentence to a
 * screen reader ("Revenue, $24,800, up 4.2 percent on last month"); the
 * drawn figures stay out of the way.
 */
export function MetricStrip({
  metrics,
  loading = false,
  periodLabel = "the previous period",
  density = "comfortable",
  emphasis,
  label = "Key metrics",
  locale = "en-US",
  className,
  ...props
}: MetricStripProps) {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const cells = loading && metrics.length === 0 ? PLACEHOLDERS : metrics;
  if (cells.length === 0) return null;
  const compact = density === "compact";
  const odd = cells.length % 2 === 1;
  // While loading, the skeleton draws the rows the loaded cells will have, so nothing below the strip jumps when the numbers arrive.
  // Metrics that are passed in say which rows those are; with none to read, it draws the tallest cell.
  const known = loading && metrics.length > 0;
  const loadingChange = known ? metrics.some((metric) => metric.change !== undefined || Boolean(metric.missing)) : true;
  const loadingHint = known ? metrics.some((metric) => Boolean(metric.hint)) : true;
  // Placeholders have no id to match, but they still leave the height an emphasised figure will need.
  const hasEmphasis = emphasis !== undefined && (cells.some((metric) => metric.id === emphasis) || (loading && metrics.length === 0));
  // One figure height for the whole strip, so a larger emphasised figure never pushes its cell out of line.
  const figureHeight = compact ? (hasEmphasis ? "@md:h-[1.875rem]" : "@md:h-6") : hasEmphasis ? "@md:h-9" : "@md:h-[1.875rem]";

  return (
    <div data-slot="metric-strip" data-density={density} aria-busy={loading || undefined} className={cn("@container w-full", className)} {...props}>
      {loading ? (
        <p role="status" className="sr-only">
          Loading {label.toLowerCase()}
        </p>
      ) : null}
      <ul
        role="list"
        aria-label={label}
        className={cn(
          "grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-xs @md:grid-cols-2",
          COLUMNS[Math.min(6, Math.max(1, cells.length))] ?? "@3xl:grid-cols-4",
        )}
      >
        {cells.map((metric, index) => {
          const emphasised = metric.id === emphasis;
          const figure = metric.value === null ? null : new Intl.NumberFormat(locale, metric.format).format(metric.value);
          const change =
            metric.value === null || metric.change === undefined ? undefined : metric.change === null || !Number.isFinite(metric.change) ? null : describeChange(metric.change, percent, plain, periodLabel);
          const ChangeIcon = change ? DIRECTION_ICON[change.direction] : null;

          const spoken = loading
            ? `${metric.label || "Metric"}, loading`
            : [
                metric.label,
                figure ?? `no data${metric.missing ? `. ${metric.missing}` : ""}`,
                change === undefined ? null : change === null ? "no comparison yet" : change.spoken,
              ]
                .filter(Boolean)
                .join(", ") + (metric.hint ? `. ${metric.hint}` : "") + ".";

          return (
            <li
              key={metric.id}
              data-emphasis={emphasised || undefined}
              className={cn(
                "min-w-0 bg-card text-card-foreground",
                compact ? "px-4 py-3.5 @md:px-5 @md:py-4" : "px-4 py-4 @md:px-6 @md:py-6",
                emphasised && "bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)]",
                odd && "@md:@max-3xl:last:col-span-2",
              )}
            >
              <span className="sr-only">{spoken}</span>
              <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 @md:flex @md:flex-col @md:gap-0">
                {metric.label ? (
                  <p className={cn("col-start-1 row-start-1 truncate text-sm font-medium", emphasised ? "text-foreground" : "text-muted-foreground")}>{metric.label}</p>
                ) : (
                  <div className="col-start-1 row-start-1 flex h-5 items-center">
                    <Skeleton className="h-4 w-24" delay={index * 80} />
                  </div>
                )}

                <div
                  className={cn(
                    "col-start-2 row-span-3 row-start-1 self-center text-right leading-none font-medium tracking-[-0.04em] tabular-nums @md:mt-3 @md:flex @md:items-end @md:self-auto @md:text-left",
                    figureHeight,
                    emphasised ? (compact ? "text-xl @[22rem]:text-2xl @md:text-3xl" : "text-2xl @[22rem]:text-3xl @md:text-4xl") : compact ? "text-xl @md:text-2xl" : "text-2xl @md:text-3xl",
                  )}
                >
                  {loading ? (
                    <Skeleton className={cn("ml-auto h-7 w-24 @md:ml-0", compact ? "@md:h-7" : "@md:h-9 @md:w-32")} delay={index * 80 + 40} />
                  ) : metric.value === null ? (
                    <span className="text-muted-foreground/60">&ndash;</span>
                  ) : (
                    <AnimatedNumber value={metric.value} locale={locale} format={metric.format} />
                  )}
                </div>

                {loading ? (
                  loadingChange ? <Skeleton className="col-start-1 row-start-2 h-5 w-36 max-w-full rounded-full @md:mt-3" delay={index * 80 + 80} /> : null
                ) : metric.value === null ? (
                  metric.missing ? (
                    <p className="col-start-1 row-start-2 flex items-start gap-1.5 text-xs leading-snug text-muted-foreground @md:mt-3">
                      <IconInfo size={14} className="mt-px shrink-0" />
                      <span className="line-clamp-2">{metric.missing}</span>
                    </p>
                  ) : null
                ) : change === undefined ? null : change === null ? (
                  <p className="col-start-1 row-start-2 text-xs text-muted-foreground @md:mt-3">No comparison yet</p>
                ) : (
                  <p className="col-start-1 row-start-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs @md:mt-3">
                    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-muted px-2 font-medium text-foreground">
                      {ChangeIcon ? <ChangeIcon size={12} /> : null}
                      {change.short}
                    </span>
                    {change.direction === "flat" ? null : <span className="text-muted-foreground">on {periodLabel}</span>}
                  </p>
                )}

                {loading ? (
                  loadingHint ? <Skeleton className="col-start-1 row-start-3 h-4 w-40 max-w-full @md:mt-2" delay={index * 80 + 120} /> : null
                ) : metric.hint ? (
                  <p className="col-start-1 row-start-3 text-xs text-muted-foreground @md:mt-2">{metric.hint}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
