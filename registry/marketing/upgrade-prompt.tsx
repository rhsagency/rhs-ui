import { useId, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck, IconLock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Meter } from "@rhs-ui/primitives/meter";
import { cn } from "@/lib/utils";

export interface UpgradePlan {
  /** The plan that unlocks the feature: "Team". */
  name: string;
  /** What it costs. A number is written as money in the section's currency; text ("Custom") is shown as written. */
  price: number | string;
  /** What the price is for: "per user, per month". */
  period?: string;
}

export interface UpgradeUsage {
  /** How much of the free allowance is used: 8. */
  used: number;
  /** The whole allowance: 10. */
  limit: number;
  /** What is counted: "Reports this month". */
  label: string;
}

export interface UpgradePromptLabels {
  /** Said to a screen reader before the feature's name, so a locked feature is not mistaken for an open one. */
  locked: string;
  /** The small line above the list. {plan} stands for the plan's name. */
  adds: string;
  /** The button. {plan} stands for the plan's name. */
  upgrade: string;
  /** The link to the comparison of plans. */
  compare: string;
  /** The way out. It returns to the free experience. */
  dismiss: string;
  /** What the meter says beside its label. {used} and {limit} stand for the numbers. */
  used: string;
  /** Said under the meter once the allowance is gone. */
  limitReached: string;
}

const LABELS: UpgradePromptLabels = {
  locked: "Locked:",
  adds: "What {plan} adds",
  upgrade: "Upgrade to {plan}",
  compare: "Compare plans",
  dismiss: "Not now",
  used: "{used} of {limit} used",
  limitReached: "You have used all of your free allowance.",
};

export interface UpgradePromptProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The feature that is locked, which is the heading: "Team analytics". */
  feature: string;
  /** The plan that unlocks it, with its price. */
  plan: UpgradePlan;
  /** What the plan adds, a line each. Three or four read best. */
  unlocks: readonly string[];
  /** Called when the reader presses the upgrade button. The panel does no checkout of its own. */
  onUpgrade: () => void;
  /**
   * Called when the reader says not now. Show the free experience again: the panel has no way to hide itself, so it
   * never traps anyone. The button they pressed leaves with the panel, so move focus to the heading of what you show
   * in its place and a keyboard reader keeps their place.
   */
  onDismiss: () => void;
  /** Two lines on what the feature does. */
  description?: string;
  /** The comparison of plans. The link appears when this is set. */
  compareHref?: string;
  /** How much of the free allowance is gone, as a meter. Leave it out for a feature that is locked outright. */
  usage?: UpgradeUsage;
  /** The ISO 4217 currency of a numeric price. "USD" by default. */
  currency?: string;
  /** The language the price and the numbers are written in. "en-US" by default. */
  locale?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<UpgradePromptLabels>;
}

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

const LINK =
  "inline-flex min-h-9 items-center rounded-sm px-1 text-sm font-medium underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The wall a free user hits, as a way forward and never a dead end: what is locked, what the next plan adds, what it
 * costs and an upgrade button, with a quieter link to compare plans and a Not now that always works. An optional
 * meter shows how much of the free allowance is gone, in words as well as the bar. It stands in for the locked content
 * as a labelled region, not a modal: focus is never trapped, nothing is dimmed behind it, and onDismiss is required,
 * so there is always an exit that returns to the free experience. It needs no client JavaScript; a function passed to
 * it needs a client component around it.
 */
export function UpgradePrompt({
  feature,
  plan,
  unlocks,
  onUpgrade,
  onDismiss,
  description,
  compareHref,
  usage,
  currency = "USD",
  locale = "en-US",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: UpgradePromptProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const count = new Intl.NumberFormat(locale);
  // 29 is shown as $29, not $29.00; a price with cents keeps them.
  const price =
    typeof plan.price === "number"
      ? new Intl.NumberFormat(locale, { style: "currency", currency, ...(Number.isInteger(plan.price) ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) }).format(plan.price)
      : plan.price;
  const gone = usage !== undefined && usage.limit > 0 && usage.used >= usage.limit;

  return (
    <section
      data-slot="upgrade-prompt"
      aria-labelledby={`${id}-title`}
      className={cn("@container mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-5 text-center break-words shadow-xs @sm:p-6 @md:p-10", className)}
      {...props}
    >
      <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full border border-border bg-background shadow-xs">
        <IconLock size={20} />
      </span>
      <Heading id={`${id}-title`} className="mt-5 text-2xl leading-tight font-medium tracking-[-0.03em] text-balance @md:text-3xl">
        <span className="sr-only">{labels.locked} </span>
        {feature}
      </Heading>
      {description ? <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}

      {usage && usage.limit > 0 ? (
        <div className="mt-7 rounded-xl border border-border p-4 text-left">
          <Meter label={usage.label} value={Math.min(usage.used, usage.limit)} max={usage.limit} valueText={text(labels.used, { used: count.format(usage.used), limit: count.format(usage.limit) })} />
          {gone ? (
            <p className="mt-3 flex items-start gap-2 text-sm leading-snug font-medium">
              <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
              {labels.limitReached}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 rounded-xl bg-muted/50 p-4 text-left @sm:p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{text(labels.adds, { plan: plan.name })}</p>
        <ul role="list" className="mt-3.5 grid gap-3">
          {unlocks.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm leading-snug">
              <IconCheck aria-hidden="true" className="mt-px size-4 shrink-0" />
              <span className="min-w-0 text-pretty">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <Badge variant="outline">{plan.name}</Badge>
        <span>
          <span className="text-3xl leading-none font-medium tracking-[-0.04em] tabular-nums">{price}</span>
          {plan.period ? <span className="ml-2 text-sm text-muted-foreground">{plan.period}</span> : null}
        </span>
      </p>

      <div className="mt-5 flex flex-col items-stretch gap-x-5 gap-y-2 @md:flex-row @md:items-center @md:justify-center">
        <Button type="button" size="lg" onClick={onUpgrade} className="@md:min-w-48">
          {text(labels.upgrade, { plan: plan.name })}
        </Button>
        <div className="flex items-center justify-center gap-x-4">
          {compareHref ? (
            <a href={compareHref} className={LINK}>
              {labels.compare}
            </a>
          ) : null}
          <button type="button" onClick={onDismiss} className={cn(LINK, "text-muted-foreground hover:text-foreground")}>
            {labels.dismiss}
          </button>
        </div>
      </div>
    </section>
  );
}
