import type { ReactNode } from "react";

import { IconGift } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface LoyaltyReward {
  points: number;
  label: string;
}

export interface LoyaltyPointsProps {
  points: number;
  /** Rewards in order of cost; the next one out of reach drives the progress bar. */
  rewards: readonly LoyaltyReward[];
  /** "1 point per €1 spent". */
  earnRule?: string;
  /** "Redeem" or "See rewards". */
  action?: ReactNode;
  locale?: string;
  className?: string;
}

/**
 * A loyalty balance people understand at a glance: the points, what they
 * can get now, how far the next reward is in points and as a bar, and how
 * points are earned. The bar is a meter with the numbers in its name.
 */
export function LoyaltyPoints({ points, rewards, earnRule, action, locale = "en-GB", className }: LoyaltyPointsProps) {
  const number = new Intl.NumberFormat(locale);
  const sorted = [...rewards].sort((a, b) => a.points - b.points);
  const next = sorted.find((reward) => reward.points > points);
  const unlocked = sorted.filter((reward) => reward.points <= points);
  const previous = unlocked.at(-1)?.points ?? 0;
  const progress = next ? (points - previous) / (next.points - previous) : 1;
  return (
    <section data-slot="loyalty-points" aria-label="Loyalty points" className={cn("rounded-3xl border border-border p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Your points</p>
          <p className="text-4xl font-medium tracking-tight tabular-nums">{number.format(points)}</p>
        </div>
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-muted [&_svg]:size-5"><IconGift aria-hidden="true" /></span>
      </div>
      {unlocked.length ? <p className="mt-3 text-sm">You can get <span className="font-medium">{unlocked.at(-1)?.label}</span> now.</p> : null}
      {next ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground"><span>{number.format(next.points - points)} points to {next.label}</span><span className="tabular-nums">{number.format(next.points)}</span></div>
          <div role="meter" aria-label={`${number.format(points)} of ${number.format(next.points)} points towards ${next.label}`} aria-valuemin={previous} aria-valuemax={next.points} aria-valuenow={points} className="mt-1.5 h-2 overflow-clip rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.max(0.03, progress) * 100}%` }} />
          </div>
        </div>
      ) : <p className="mt-4 text-sm">Every reward is unlocked. Nice.</p>}
      {earnRule || action ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{earnRule}</span>
          {action}
        </div>
      ) : null}
    </section>
  );
}
