import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface GoalRingProps {
  label: string;
  value: number;
  goal: number;
  /** How the numbers read: "€48k", "12 deals". */
  display?: (value: number) => string;
  /** A line under the ring: "8 days left". */
  note?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: 96, md: 140, lg: 184 } as const;

/**
 * Progress towards one goal as a ring: the share in the middle, the label
 * and value against goal underneath, and a second lap drawn darker when the
 * goal is beaten. A meter for assistive technology, with the numbers in its
 * name.
 */
export function GoalRing({ label, value, goal, display = String, note, size = "md", className }: GoalRingProps) {
  const px = SIZES[size];
  const stroke = Math.round(px / 11);
  const r = (px - stroke) / 2;
  const length = 2 * Math.PI * r;
  const ratio = goal > 0 ? value / goal : 0;
  const first = Math.min(1, ratio);
  const over = Math.max(0, Math.min(1, ratio - 1));
  const percent = Math.round(ratio * 100);
  return (
    <div data-slot="goal-ring" className={cn("inline-flex flex-col items-center gap-3 text-center", className)}>
      <div role="meter" aria-label={`${label}: ${display(value)} of ${display(goal)}`} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(value, goal)} className="relative" style={{ width: px, height: px }}>
        <svg viewBox={`0 0 ${px} ${px}`} className="-rotate-90 text-foreground" aria-hidden="true">
          <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} />
          <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${first * length} ${length}`} />
          {over > 0 ? <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${over * length} ${length}`} /> : null}
        </svg>
        <span aria-hidden="true" className={cn("absolute inset-0 flex items-center justify-center font-medium tracking-tight tabular-nums", size === "sm" ? "text-xl" : size === "md" ? "text-3xl" : "text-4xl")}>{percent}%</span>
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground tabular-nums">{display(value)} of {display(goal)}</p>
        {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
      </div>
    </div>
  );
}
