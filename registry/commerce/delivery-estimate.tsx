import { IconStore, IconTruck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface DeliveryOption {
  id: string;
  /** "Tomorrow", "Thursday 17 April", already worked out on your side. */
  when: string;
  how: string;
  /** "Free", "€4.95". */
  cost: string;
  kind: "delivery" | "pickup";
}

export interface DeliveryEstimateProps {
  options: readonly DeliveryOption[];
  /** "Order within 2 h 14 min". Leave out rather than invent urgency. */
  cutoff?: string;
  className?: string;
}

/**
 * When it arrives, before people ask: the delivery and pick-up options with
 * a date in words and the cost, and the real cut-off for today when there
 * is one. Dates are computed by you, so they match your carrier.
 */
export function DeliveryEstimate({ options, cutoff, className }: DeliveryEstimateProps) {
  return (
    <div data-slot="delivery-estimate" className={cn("rounded-xl border border-border", className)}>
      {cutoff ? <p className="border-b border-border bg-muted/50 px-4 py-2 text-xs">{cutoff}</p> : null}
      <ul className="divide-y divide-border">
        {options.map((option) => (
          <li key={option.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4">{option.kind === "pickup" ? <IconStore /> : <IconTruck />}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{option.when}</span>
              <span className="block text-muted-foreground">{option.how}</span>
            </span>
            <span className="tabular-nums">{option.cost}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
