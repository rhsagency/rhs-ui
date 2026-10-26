"use client";

import { useId, useState, type ComponentProps } from "react";

import { IconCheck, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CreditPack {
  /** A stable key, sent back in onSelect and used as the value of the choice: "growth". */
  id: string;
  /** How many credits the pack holds: 2000. */
  credits: number;
  /** What the pack costs in the section's currency, in whole units: 40 or 39.5. */
  price: number;
  /** A short name for the pack, written over its credits: "Starter". */
  label?: string;
}

export interface CreditPacksLabels {
  /** The name of the group of packs for assistive technology, when the section has no title. */
  packs: string;
  /** The word after the number of credits. */
  credits: string;
  /** The badge on the best value pack. */
  bestValue: string;
  /** The words after the price of one credit. */
  perCredit: string;
  /** The saving against the smallest pack. {percent} stands for the number, written as 24%. */
  save: string;
  /** Said on the pack the saving is measured against, and on any pack that costs as much per credit. */
  standardRate: string;
  /** The line beside the button. {credits} and {price} stand for the chosen pack. */
  summary: string;
  /** The line beside the button while no pack is chosen. */
  choose: string;
  /** The button. */
  continue: string;
}

const LABELS: CreditPacksLabels = {
  packs: "Credit packs",
  credits: "credits",
  bestValue: "Best value",
  perCredit: "per credit",
  save: "Save {percent}",
  standardRate: "Standard rate",
  summary: "{credits} credits for {price}",
  choose: "Choose a pack to continue",
  continue: "Continue",
};

export interface CreditPacksProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSelect" | "defaultValue"> {
  /** The packs, smallest first. The smallest one is the rate every saving is measured against. Three or four read best. */
  packs: readonly CreditPack[];
  /** Called with the chosen pack when the reader presses the button. The section takes no payment itself. */
  onSelect: (pack: CreditPack) => void;
  /** The heading: "Top up your credits". */
  title?: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The rule buyers ask about first, said next to the button: "Credits never expire". */
  expiry?: string;
  /** The ISO 4217 currency of every price. "USD" by default. */
  currency?: string;
  /** The language prices and numbers are written in. "en-US" by default. */
  locale?: string;
  /** Controlled: the id of the chosen pack, or null for none. */
  value?: string | null;
  /** Uncontrolled: the pack chosen at the start. The best value pack by default. */
  defaultValue?: string | null;
  /** Called when the reader chooses another pack. */
  onValueChange?: (id: string) => void;
  /**
   * The id of the pack that carries the badge. Left out, it is the pack with the lowest price per credit (when that
   * is lower than the smallest pack's), so the badge can never contradict the numbers. null shows no badge.
   */
  bestValue?: string | null;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CreditPacksLabels>;
}

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Width and columns by how many packs there are, written out so Tailwind sees every class. Under 672px every pack is a row; from there a card, and a count that does not divide the row never leaves a lonely card: four go from two columns to four, and five from three to five. */
const WIDTH = [
  "max-w-xl",
  "max-w-xl",
  "max-w-xl @2xl:max-w-3xl",
  "max-w-xl @2xl:max-w-4xl",
  "max-w-xl @2xl:max-w-2xl @5xl:max-w-6xl",
  "max-w-xl @2xl:max-w-4xl @5xl:max-w-none",
  "max-w-xl @2xl:max-w-4xl",
];
const COLUMNS = ["", "", "@2xl:grid-cols-2", "@2xl:grid-cols-3", "@2xl:grid-cols-2 @5xl:grid-cols-4", "@2xl:grid-cols-3 @5xl:grid-cols-5", "@2xl:grid-cols-3"];

/** Price of one credit, as an exact fraction of the pack's price. */
const rateOf = (pack: CreditPack) => pack.price / pack.credits;

/**
 * Whole percent saved per credit against the smallest pack. Rounded down so the claim is never larger than the truth;
 * the small addition keeps 20% from becoming 19% through floating point (1 - 0.8 is 0.19999999999999996).
 */
function savingOf(pack: CreditPack, base: CreditPack): number {
  if (pack === base) return 0;
  return Math.max(0, Math.floor((1 - rateOf(pack) / rateOf(base)) * 100 + 1e-9));
}

/**
 * One-off packs of credits for AI, design and API tools that sell by usage. Each pack shows its credits as the
 * biggest thing on the card, then the price, the price of one credit and the saving against the smallest pack. The
 * saving and the best value badge are worked out from the packs you pass, never typed in, so they cannot drift when
 * a price changes. The packs are a radio group (arrow keys move, one tab stop) with a button under it that hands the
 * chosen pack to onSelect, and the rule buyers ask about first, such as credits never expiring, sits beside that
 * button. Under 672px every pack is a compact row with the price on the right; from there the packs become cards
 * that share their rows, so the credits, prices and savings line up from one card to the next.
 */
export function CreditPacks({
  packs,
  onSelect,
  title,
  description,
  expiry,
  currency = "USD",
  locale = "en-US",
  value,
  defaultValue,
  onValueChange,
  bestValue,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: CreditPacksProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const base = packs.reduce<CreditPack | undefined>((smallest, pack) => (!smallest || pack.credits < smallest.credits ? pack : smallest), undefined);
  const cheapest = packs.reduce<CreditPack | undefined>((best, pack) => (!best || rateOf(pack) < rateOf(best) ? pack : best), undefined);
  // The badge goes to the cheapest credit, and only when it is cheaper than the smallest pack: three packs at one rate have no best value.
  const bestId = bestValue !== undefined ? bestValue : base && cheapest && rateOf(cheapest) < rateOf(base) ? cheapest.id : null;

  const [own, setOwn] = useState<string | null>(defaultValue !== undefined ? defaultValue : (bestId ?? packs[0]?.id ?? null));
  const selected = value !== undefined ? value : own;
  const chosen = packs.find((pack) => pack.id === selected);

  const count = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  // 38 is shown as $38, not $38.00; a price with cents keeps them.
  const whole = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const withCents = new Intl.NumberFormat(locale, { style: "currency", currency });
  const money = (amount: number) => (Number.isInteger(amount) ? whole : withCents).format(amount);
  // A credit costs cents or fractions of one: at least two decimals, up to three, so $0.076 is not rounded to $0.08.
  const perCredit = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 3 });
  const named = packs.some((pack) => pack.label);
  // Five cards or more share a row too narrow for the big numeral.
  const dense = packs.length > 4;

  function choose(pack: CreditPack) {
    if (value === undefined) setOwn(pack.id);
    onValueChange?.(pack.id);
  }

  return (
    <section data-slot="credit-packs" aria-labelledby={title ? `${id}-title` : undefined} aria-label={title ? undefined : labels.packs} className={cn("@container w-full break-words", className)} {...props}>
      {title ? (
        <div className="mx-auto max-w-2xl text-center">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      <div className={cn("mx-auto", title && "mt-10 @3xl:mt-12", WIDTH[Math.min(packs.length, 6)])}>
        {/* Every card spans four rows of this grid and passes them on (subgrid), so credits, prices and savings line up. The gap leaves room for the badge that sits on a card's top edge. */}
        <div role="radiogroup" aria-labelledby={title ? `${id}-title` : undefined} aria-label={title ? undefined : labels.packs} className={cn("grid gap-5", COLUMNS[Math.min(packs.length, 6)])}>
          {packs.map((pack) => {
            const checked = pack.id === selected;
            const best = pack.id === bestId;
            const saving = base ? savingOf(pack, base) : 0;
            const ids = { credits: `${id}-${pack.id}-credits`, price: `${id}-${pack.id}-price`, rate: `${id}-${pack.id}-rate`, saving: `${id}-${pack.id}-saving`, badge: `${id}-${pack.id}-badge` };
            return (
              <label
                key={pack.id}
                data-state={checked ? "checked" : "unchecked"}
                className={cn(
                  "relative grid min-w-0 cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-2xl border px-4 py-4 shadow-xs",
                  "transition-[border-color,background-color] duration-150 motion-reduce:transition-none",
                  "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40",
                  "@2xl:row-span-4 @2xl:grid-cols-1 @2xl:grid-rows-subgrid @2xl:items-start @2xl:gap-x-0 @2xl:gap-y-0 @2xl:p-6",
                  checked ? "border-foreground bg-muted/40 outline-1 outline-foreground" : "border-border bg-card hover:border-foreground/40 hover:bg-muted/30",
                )}
              >
                <input
                  type="radio"
                  name={id}
                  value={pack.id}
                  checked={checked}
                  onChange={() => choose(pack)}
                  aria-labelledby={ids.credits}
                  aria-describedby={[best ? ids.badge : null, ids.price, ids.rate, ids.saving].filter(Boolean).join(" ")}
                  className="sr-only"
                />
                {best ? (
                  <Badge id={ids.badge} className="absolute -top-2.5 right-4 @2xl:right-auto @2xl:left-6">
                    {labels.bestValue}
                  </Badge>
                ) : null}

                <span
                  aria-hidden="true"
                  className={cn(
                    "col-start-1 row-span-2 row-start-1 grid size-5 place-items-center rounded-full border transition-colors duration-150 motion-reduce:transition-none",
                    "@2xl:absolute @2xl:top-6 @2xl:right-6 @2xl:col-auto @2xl:row-auto",
                    checked ? "border-foreground bg-foreground text-background" : "border-muted-foreground/60 bg-background",
                  )}
                >
                  {checked ? <IconCheck size={12} strokeWidth={2.5} /> : null}
                </span>

                {/* From 672px the radio sits at the top right of the card: the label stops short of it, and a long one is cut with an ellipsis instead of running under it. */}
                <span className="col-start-2 row-start-1 flex min-w-0 flex-col gap-0.5 @2xl:col-auto @2xl:row-auto @2xl:gap-0">
                  {pack.label ? (
                    <span className="truncate text-[0.8125rem] leading-tight font-medium text-muted-foreground @2xl:pr-8 @2xl:text-sm">{pack.label}</span>
                  ) : named ? (
                    <span aria-hidden="true" className="hidden h-5 @2xl:block" />
                  ) : null}
                  {/* The word follows the number on the same line, and drops under it as a whole word when the card is too narrow for both. */}
                  <span id={ids.credits} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 @2xl:mt-3">
                    <span className={cn("text-2xl leading-none font-medium tracking-[-0.04em] whitespace-nowrap tabular-nums @2xl:tracking-[-0.05em]", dense ? "@2xl:text-[2rem]" : "@2xl:text-[2.75rem]")}>{count.format(pack.credits)}</span>
                    <span className="text-sm whitespace-nowrap text-muted-foreground">{labels.credits}</span>
                  </span>
                </span>

                <span id={ids.price} className="col-start-3 row-start-1 justify-self-end text-lg leading-none font-medium tracking-[-0.02em] tabular-nums @2xl:col-auto @2xl:row-auto @2xl:mt-5 @2xl:justify-self-auto @2xl:border-t @2xl:border-border @2xl:pt-5 @2xl:text-2xl">
                  {money(pack.price)}
                </span>

                <span id={ids.rate} className="col-start-2 row-start-2 text-[0.8125rem] leading-snug text-muted-foreground tabular-nums @2xl:col-auto @2xl:row-auto @2xl:mt-1.5 @2xl:text-sm">
                  {perCredit.format(rateOf(pack))} {labels.perCredit}
                </span>

                <span id={ids.saving} className="col-start-3 row-start-2 justify-self-end @2xl:col-auto @2xl:row-auto @2xl:mt-5 @2xl:justify-self-start">
                  {saving > 0 ? (
                    <Badge variant={best ? "default" : "muted"} className="tabular-nums">
                      {text(labels.save, { percent: percent.format(saving / 100) })}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{labels.standardRate}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4 @lg:flex-row @lg:items-center @lg:justify-between @lg:px-5">
          <div className="min-w-0">
            <p className="text-sm leading-snug font-medium tabular-nums">{chosen ? text(labels.summary, { credits: count.format(chosen.credits), price: money(chosen.price) }) : labels.choose}</p>
            {expiry ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-muted-foreground">
                <IconClock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                {expiry}
              </p>
            ) : null}
          </div>
          <Button type="button" size="lg" disabled={!chosen} onClick={() => chosen && onSelect(chosen)} className="w-full @lg:w-auto @lg:min-w-40">
            {labels.continue}
          </Button>
        </div>
      </div>
    </section>
  );
}
