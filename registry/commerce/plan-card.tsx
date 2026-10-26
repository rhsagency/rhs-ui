import { useId, type ComponentProps, type MouseEventHandler } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconCheck, IconMinus } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

export interface PlanCardPrice {
  /** In minor units: 2900 is 29.00. A string is shown as it is written, for a price that is not a number: "Custom", "Free". */
  amount: number | string;
  /** What one payment covers: "month", "year", "seat per month". Muted, after a slash. Leave it out for a one-off price or a string amount. */
  interval?: string;
  /** ISO 4217 code of a numeric amount. Defaults to "EUR". */
  currency?: string;
  /** The small line under the price: "Billed yearly", "€288 billed yearly, two months free", "Cancel any time". */
  note?: string;
}

export interface PlanCardFeature {
  /** What the plan gives, in a few words. */
  label: string;
  /** False draws the feature as left out of this plan, and a screen reader hears "Not included". Defaults to true. */
  included?: boolean;
}

export interface PlanCardAction {
  /** The words on the button: "Start free trial", "Choose Studio". */
  label: string;
  /** Where the button goes. It then renders as a link, which needs no JavaScript. */
  href?: string;
  /** Called when the button is pressed. Pass it from a client component. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Turns the button off. A disabled action is always a button, never a link, even with an `href`. */
  disabled?: boolean;
  /** Busy state: a spinner, and the button cannot be pressed twice. */
  loading?: boolean;
}

export interface PlanCardLabels {
  /** The pill on a recommended card. */
  mostPopular?: string;
  /** Replaces the button on the plan the person is on. */
  yourPlan?: string;
  /** The small title over the list of features. */
  included?: string;
  /** What a screen reader hears before a feature the plan leaves out. */
  notIncluded?: string;
  /** What a screen reader hears between the price and its interval: "29 per month". */
  per?: string;
}

const WORDS = {
  mostPopular: "Most popular",
  yourPlan: "Your plan",
  included: "What is included",
  notIncluded: "Not included",
  per: "per",
} satisfies Required<PlanCardLabels>;

export interface PlanCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The plan's name: "Starter", "Studio". It names the card for a screen reader. */
  name: string;
  /** One or two lines on who the plan is for. */
  description?: string;
  /** The price, its interval and the small print under it. */
  price: PlanCardPrice;
  /** What the plan includes. A plain string is an included feature; an object can mark one as left out. */
  features?: readonly (string | PlanCardFeature)[];
  /** The button under the price. Not drawn on the current plan, which says "Your plan" instead. */
  cta?: PlanCardAction;
  /** The plan to look at first: a heavier border and the words "Most popular", so it never relies on colour. */
  recommended?: boolean;
  /** The plan the person is on: "Your plan" replaces the button and the card is marked `aria-current`. */
  current?: boolean;
  /** Your own words for the pill in the corner ("Best value", "Save 20%"). A recommended card shows "Most popular" without it. */
  badge?: string;
  /** Always pass your application locale, so the server and the browser write the same price. */
  locale?: string;
  /** The heading's element: "h3" by default, "h2" when the cards are the main content of the page. */
  headingAs?: "h2" | "h3" | "h4";
  /** The words, for another language. */
  labels?: PlanCardLabels;
}

/** Stable option objects, so a price that re-renders keeps its formatter and only animates when the number changes. */
const FORMATS = new Map<string, Intl.NumberFormatOptions>();

function currencyFormat(currency: string, fraction: number): Intl.NumberFormatOptions {
  const key = `${currency}:${fraction}`;
  let options = FORMATS.get(key);
  if (!options) {
    options = { style: "currency", currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction };
    FORMATS.set(key, options);
  }
  return options;
}

/** How many minor-unit digits the currency has in this locale: 2 for euros, 0 for yen. */
function minorDigits(currency: string, locale: string): number {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

const FIGURE = "text-4xl leading-none font-semibold tracking-[-0.04em]";

function Amount({ price, locale }: { price: PlanCardPrice; locale: string }) {
  if (typeof price.amount === "string") return <span className={FIGURE}>{price.amount}</span>;
  const currency = price.currency ?? "EUR";
  const digits = minorDigits(currency, locale);
  const major = price.amount / 10 ** digits;
  // A whole price is "€29", not "€29.00": it loses its cents, and a price with cents keeps them.
  return <AnimatedNumber value={major} locale={locale} format={currencyFormat(currency, Number.isInteger(major) ? 0 : digits)} className={FIGURE} />;
}

/** A long label ("Start your 30-day free trial of Enterprise Plus") wraps onto a second line and the button grows with it, rather than being cut off by a fixed height. */
const WRAPS = "h-auto min-h-11 w-full py-2 text-center whitespace-normal text-balance";

function Action({ cta, recommended, describedBy }: { cta: PlanCardAction; recommended: boolean; describedBy: string }) {
  const variant = recommended ? "default" : "outline";
  if (cta.href && !cta.disabled) {
    return (
      <Button asChild size="lg" variant={variant} className={WRAPS} aria-describedby={describedBy}>
        <a href={cta.href} onClick={cta.onClick}>
          {cta.label}
        </a>
      </Button>
    );
  }
  return (
    <Button type="button" size="lg" variant={variant} className={WRAPS} disabled={cta.disabled} loading={cta.loading} aria-describedby={describedBy} onClick={cta.onClick}>
      {cta.label}
    </Button>
  );
}

/**
 * One plan as a card, the unit a pricing section and an in-app plan picker are made of: the name and a line on who
 * it is for, the price in tabular figures with its interval muted and a small note ("Billed yearly") under it, the
 * button, and what is included as a list with a tick for every feature. A recommended card gets a heavier border and
 * the words "Most popular", so it is told apart by more than colour; the current plan swaps the button for "Your
 * plan" and is marked `aria-current`. When the price prop changes, as it does when a billing toggle flips between
 * monthly and yearly, the figure counts to its new value. It keeps no state and renders on the server.
 */
export function PlanCard({
  name,
  description,
  price,
  features = [],
  cta,
  recommended = false,
  current = false,
  badge,
  locale = "en-US",
  headingAs: Heading = "h3",
  labels,
  className,
  ...props
}: PlanCardProps) {
  const words: Required<PlanCardLabels> = { ...WORDS, ...labels };
  const id = useId();
  const pill = badge ?? (recommended ? words.mostPopular : undefined);
  const items = features.map((feature) => (typeof feature === "string" ? { label: feature, included: true } : { label: feature.label, included: feature.included !== false }));

  return (
    <Card
      data-slot="plan-card"
      data-recommended={recommended || undefined}
      data-current={current || undefined}
      role="group"
      aria-labelledby={`${id}-name`}
      aria-current={current ? "true" : undefined}
      className={cn("@container h-full gap-6 py-6", recommended && "border-foreground shadow-sm ring-1 ring-foreground", className)}
      {...props}
    >
      <div className="grid gap-2 px-6">
        <div className="flex min-h-5 items-center justify-between gap-3">
          <Heading id={`${id}-name`} className="text-base leading-tight font-semibold tracking-[-0.02em]">
            {name}
          </Heading>
          {pill ? <Badge variant={recommended ? "default" : "outline"}>{pill}</Badge> : null}
        </div>
        {description ? <p className="text-sm text-pretty text-muted-foreground">{description}</p> : null}
      </div>

      <div className="px-6">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Amount price={price} locale={locale} />
          {price.interval ? (
            <span className="text-sm text-muted-foreground">
              <span aria-hidden="true">/ </span>
              <span className="sr-only">{words.per} </span>
              {price.interval}
            </span>
          ) : null}
        </p>
        {price.note ? <p className="mt-2.5 text-xs text-muted-foreground">{price.note}</p> : null}
      </div>

      {current ? (
        <div className="px-6">
          <p data-slot="plan-card-current" className="flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-muted/60 text-sm font-medium">
            <IconCheck className="size-4" strokeWidth={2} />
            {words.yourPlan}
          </p>
        </div>
      ) : cta ? (
        <div className="px-6">
          <Action cta={cta} recommended={recommended} describedBy={`${id}-name`} />
        </div>
      ) : null}

      {items.length ? (
        <div className="grid gap-4 border-t border-border px-6 pt-6">
          <p id={`${id}-features`} className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">
            {words.included}
          </p>
          <ul role="list" aria-labelledby={`${id}-features`} className="grid gap-3 text-sm">
            {items.map((item, index) => (
              <li key={`${index}-${item.label}`} className={cn("flex items-start gap-3 leading-snug", !item.included && "text-muted-foreground")}>
                {item.included ? <IconCheck className="mt-0.5 size-4 shrink-0" strokeWidth={2} /> : <IconMinus className="mt-0.5 size-4 shrink-0 opacity-60" />}
                <span>
                  {item.included ? null : <span className="sr-only">{words.notIncluded}: </span>}
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
