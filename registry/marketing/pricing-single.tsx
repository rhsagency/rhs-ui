import type { ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PricingSingleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  planName: string;
  price: string;
  /** "per month", "one-time payment", "per seat". */
  period: string;
  features: readonly string[];
  action: ReactNode;
  /** Guarantee or terms under the action. */
  note?: string;
  className?: string;
}

/**
 * One plan, one price: for a product that does not need tiers. The pitch on
 * the left, the price card on the right with everything that is included.
 */
export function PricingSingle({ eyebrow, title, description, planName, price, period, features, action, note, className }: PricingSingleProps) {
  return (
    <section data-slot="pricing-single" className={cn("grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_26rem] lg:gap-20", className)}>
      <div>
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-4xl font-medium tracking-[-.045em] text-balance sm:text-5xl">{title}</h2>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="rounded-2xl border border-border bg-card p-8">
        <p className="text-sm font-medium">{planName}</p>
        <p className="mt-4 flex items-baseline gap-2">
          <span className="text-5xl font-medium tracking-[-.06em] tabular-nums">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </p>
        <div className="mt-6 [&>*]:w-full">{action}</div>
        {note ? <p className="mt-3 text-center text-xs text-muted-foreground">{note}</p> : null}
        <ul className="mt-8 space-y-3 border-t border-border pt-6">
          {features.map((feature) => (
            <li key={feature} className="flex gap-3 text-sm">
              <span className="mt-0.5 shrink-0 [&_svg]:size-4"><IconCheck /></span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
