import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface FunnelStep {
  label: string;
  value: number;
}

export interface FunnelChartProps extends Omit<ComponentProps<"ol">, "children"> {
  steps: readonly FunnelStep[];
  label: string;
  /** How values read on the axis, in the readout and in the table: Intl number options, e.g. { style: "currency", currency: "EUR" }. Options, not a function, so a Server Component can pass them. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
}

/**
 * Where people drop off between steps: visits, sign-ups, trials, paid. Each
 * step shows its count, its share of the first step and the drop from the
 * one before, as a list that reads the same without the bars.
 */
export function FunnelChart({ steps, label, format, locale = "en-GB", className, ...props }: FunnelChartProps) {
  const formatter = new Intl.NumberFormat(locale, format);
  const show = (value: number) => formatter.format(value);
  const first = steps[0]?.value || 1;
  return (
    <ol data-slot="funnel-chart" aria-label={label} className={cn("grid gap-2", className)} {...props}>
      {steps.map((step, index) => {
        const share = step.value / first;
        const previous = steps[index - 1]?.value;
        const drop = previous ? 1 - step.value / previous : null;
        return (
          <li key={step.label} className="grid grid-cols-[minmax(6rem,9rem)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-muted-foreground">{step.label}</span>
            <span className="relative h-8 overflow-hidden rounded-md bg-muted">
              <span className="absolute inset-y-0 left-0 rounded-md bg-foreground" style={{ width: `${Math.max(2, share * 100)}%`, opacity: 1 - index * 0.14 }} />
            </span>
            <span className="grid min-w-24 text-right tabular-nums">
              <span className="font-medium" suppressHydrationWarning>{show(step.value)}</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(share * 100)}%{drop !== null ? ` · −${Math.round(drop * 100)}%` : ""}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
