"use client";

import { AnimatedNumber, type AnimatedNumberProps } from "@rhs-ui/application/animated-number";
import { cn } from "@/lib/utils";

export interface KpiCardProps extends AnimatedNumberProps {
  label: string;
  description: string;
  trend?: readonly number[];
}

/** One metric, an accessible value, and a quiet trend silhouette. */
export function KpiCard({ label, description, trend = [], className, ...number }: KpiCardProps): React.JSX.Element {
  const values = trend.filter(Number.isFinite);
  const low = Math.min(...values);
  const range = Math.max(...values) - low || 1;
  const points = values.map((value, index) => `${index * 240 / Math.max(1, values.length - 1)},${58 - (value - low) / range * 48}`).join(" ");
  return <article data-slot="kpi-card" className={cn("relative w-full overflow-hidden rounded-2xl border border-border bg-card p-7", className)}>
    <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
    <p className="mt-4 text-4xl font-medium tracking-tight"><AnimatedNumber {...number} /></p>
    <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    {values.length > 1 && <svg aria-hidden="true" viewBox="0 0 240 64" className="mt-8 h-16 w-full overflow-visible"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>}
  </article>;
}
