"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ChartCardProps {
  title: string;
  /** The headline number and its change. */
  value?: ReactNode;
  /** Period switches: [{ value: "7d", label: "7 days" }, ...]. */
  periods?: readonly { value: string; label: string }[];
  period?: string;
  onPeriodChange?: (period: string) => void;
  /** Download, menu or link. */
  actions?: ReactNode;
  /** The chart: any of the dashboard charts. */
  children: ReactNode;
  /** "Source: Stripe, updated 5 min ago". */
  footnote?: ReactNode;
  className?: string;
}

/**
 * The frame every dashboard chart sits in: title, headline number, period
 * switch (a real radio group of pills), actions, the chart and a source
 * line. One frame for all charts keeps a dashboard consistent without each
 * chart reinventing its header.
 */
export function ChartCard({ title, value, periods = [], period, onPeriodChange, actions, children, footnote, className }: ChartCardProps) {
  return (
    <section data-slot="chart-card" aria-label={title} className={cn("rounded-2xl border border-border bg-background p-5", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm text-muted-foreground">{title}</h3>
          {value ? <div className="mt-1 text-2xl font-medium tracking-tight">{value}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          {periods.length ? (
            <div role="radiogroup" aria-label="Period" className="flex rounded-lg bg-muted p-0.5 text-xs">
              {periods.map((option) => (
                <label key={option.value} className="relative cursor-pointer rounded-md px-2.5 py-1 has-[:checked]:bg-background has-[:checked]:font-medium has-[:checked]:shadow-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40">
                  <input type="radio" name={`${title}-period`} checked={period === option.value} onChange={() => onPeriodChange?.(option.value)} className="sr-only" />
                  {option.label}
                </label>
              ))}
            </div>
          ) : null}
          {actions}
        </div>
      </header>
      <div className="mt-5">{children}</div>
      {footnote ? <p className="mt-3 text-xs text-muted-foreground">{footnote}</p> : null}
    </section>
  );
}
