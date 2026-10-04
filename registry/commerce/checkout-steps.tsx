import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CheckoutStep {
  id: string;
  label: string;
  /** Link back to a finished step, to edit it. */
  href?: string;
}

export interface CheckoutStepsProps {
  steps: readonly CheckoutStep[];
  /** Index of the step being filled in. */
  current: number;
  className?: string;
}

/**
 * The step header of a checkout: Bag, Details, Shipping, Payment. Finished
 * steps get a check and a link to go back and edit, the current one is
 * marked (aria-current="step"), the rest wait. On a phone it collapses to
 * "Step 2 of 4: Details" with a thin progress bar.
 */
export function CheckoutSteps({ steps, current, className }: CheckoutStepsProps) {
  const now = steps[current];
  return (
    <nav data-slot="checkout-steps" aria-label="Checkout progress" className={cn("w-full", className)}>
      <div className="sm:hidden">
        <p className="text-sm"><span className="text-muted-foreground">Step {current + 1} of {steps.length}:</span> <span className="font-medium">{now?.label}</span></p>
        <div aria-hidden="true" className="mt-2 h-1 overflow-clip rounded-full bg-muted"><div className="h-full rounded-full bg-foreground" style={{ width: `${((current + 1) / steps.length) * 100}%` }} /></div>
      </div>
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const content = (
            <>
              <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums [&_svg]:size-3.5", done ? "border-foreground bg-foreground text-background" : active ? "border-foreground" : "border-border text-muted-foreground")}>{done ? <IconCheck aria-hidden="true" /> : index + 1}</span>
              <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>{step.label}</span>
              {done ? <span className="sr-only">(done)</span> : null}
            </>
          );
          return (
            <li key={step.id} aria-current={active ? "step" : undefined} className="relative flex flex-1 items-center gap-2 last:flex-none">
              {done && step.href ? <a href={step.href} className="flex items-center gap-2 rounded-md outline-none hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/40">{content}</a> : <span className="flex items-center gap-2">{content}</span>}
              {index < steps.length - 1 ? <span aria-hidden="true" className={cn("h-px flex-1", done ? "bg-foreground" : "bg-border")} /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
