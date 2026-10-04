import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface UsageLine {
  id: string;
  label: string;
  used: number;
  limit: number;
  /** How to print a value: "2.4 GB", "1,240 runs". Defaults to the number. */
  format?: (value: number) => string;
}

export interface PlanUsageProps {
  plan: string;
  /** "Renews on 1 April". */
  period?: string;
  lines: readonly UsageLine[];
  action?: ReactNode;
  className?: string;
}

/**
 * Where a team stands against its plan: one bar per limit, the numbers in
 * words, and a warning in text at 80% and 100%. Bars are meters, so screen
 * readers hear the value and the maximum.
 */
export function PlanUsage({ plan, period, lines, action, className }: PlanUsageProps) {
  return (
    <section data-slot="plan-usage" aria-label={`${plan} usage`} className={cn("rounded-xl border border-border p-5", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{plan}</h3>
          {period ? <p className="text-xs text-muted-foreground">{period}</p> : null}
        </div>
        {action}
      </header>
      <ul className="mt-5 space-y-5">
        {lines.map((line) => {
          const ratio = line.limit > 0 ? Math.min(1, line.used / line.limit) : 0;
          const print = line.format ?? String;
          const state = ratio >= 1 ? "full" : ratio >= 0.8 ? "near" : "ok";
          return (
            <li key={line.id}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span>{line.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {print(line.used)} of {print(line.limit)}
                </span>
              </div>
              <div role="meter" aria-label={line.label} aria-valuemin={0} aria-valuemax={line.limit} aria-valuenow={line.used} className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", state === "full" ? "bg-destructive" : state === "near" ? "bg-[var(--color-warning,oklch(0.72_0.16_75))]" : "bg-foreground")} style={{ width: `${ratio * 100}%` }} />
              </div>
              {state !== "ok" ? <p className={cn("mt-1.5 text-xs", state === "full" ? "text-destructive" : "text-muted-foreground")}>{state === "full" ? "Limit reached." : "Nearly at the limit."}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
