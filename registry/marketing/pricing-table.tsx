import type { ReactNode } from "react";

import { IconCheck, IconMinus } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PricingTablePlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  action: ReactNode;
  highlighted?: boolean;
}

export interface PricingTableRow {
  feature: string;
  /** Per plan id: true for included, false for not, or a short value like "10 GB". */
  values: Record<string, boolean | string>;
}

export interface PricingTableGroup {
  title: string;
  rows: readonly PricingTableRow[];
}

export interface PricingTableProps {
  title?: string;
  plans: readonly PricingTablePlan[];
  groups: readonly PricingTableGroup[];
  className?: string;
}

function Cell({ value }: { value: boolean | string | undefined }) {
  if (value === true) return <span className="inline-flex [&_svg]:size-4"><IconCheck /><span className="sr-only">Included</span></span>;
  if (value === false || value === undefined) return <span className="inline-flex text-muted-foreground/60 [&_svg]:size-4"><IconMinus /><span className="sr-only">Not included</span></span>;
  return <span className="text-sm">{value}</span>;
}

/**
 * The full plan comparison: a sticky header with price and action per plan,
 * then feature groups as rows. A real table, so screen readers announce the
 * plan for every cell; it scrolls sideways on a phone instead of squashing.
 */
export function PricingTable({ title = "Compare plans", plans, groups, className }: PricingTableProps) {
  return (
    <section data-slot="pricing-table" className={cn("py-16 sm:py-24", className)}>
      <h2 className="mb-10 text-center text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
      <div className="relative overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="w-1/3 p-5 align-bottom text-sm font-normal text-muted-foreground">Features</th>
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className={cn("p-5 align-bottom font-normal", plan.highlighted && "bg-muted")}>
                  <span className="block text-sm font-medium">{plan.name}</span>
                  <span className="mt-2 block text-3xl font-medium tracking-[-.05em] tabular-nums">{plan.price}</span>
                  {plan.period ? <span className="block text-xs text-muted-foreground">{plan.period}</span> : null}
                  <span className="mt-4 block">{plan.action}</span>
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.title}>
              <tr>
                <th colSpan={plans.length + 1} scope="colgroup" className="bg-background px-5 pt-8 pb-3 text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{group.title}</th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.feature} className="border-t border-border">
                  <th scope="row" className="p-5 text-sm font-normal">{row.feature}</th>
                  {plans.map((plan) => (
                    <td key={plan.id} className={cn("p-5", plan.highlighted && "bg-muted")}>
                      <Cell value={row.values[plan.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
