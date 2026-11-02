"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconWarning } from "@rhs-ui/icons";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import {
  formatAmount,
  formatMoneyText,
  minorDigits,
  parseAmount,
  pricingOf,
  tidyTyping,
  type Pricing,
  type PricingValue,
} from "@rhs-ui/commerce/product-pricing-fieldset/pricing";
import { cn } from "@/lib/utils";

export type { Pricing, PricingValue } from "@rhs-ui/commerce/product-pricing-fieldset/pricing";

export interface ProductPricingFieldsetLabels {
  /** The heading over the fields, and the name of the group. */
  legend?: string;
  /** The label of the price field. */
  price?: string;
  /** Under the price field. */
  priceHint?: string;
  /** The label of the compare-at price field. */
  compareAt?: string;
  /** Under the compare-at price field, while it is not flagged. */
  compareAtHint?: string;
  /** The label of the cost field. */
  cost?: string;
  /** Under the cost field. */
  costHint?: string;
  /** The name of the first fact under the fields: how far the price is below the compare-at price. */
  discount?: string;
  /** The name of the second fact under the fields: the price minus the cost. */
  profit?: string;
  /** The name of the third fact under the fields: the profit as a share of the price. */
  margin?: string;
  /** The discount. `{percent}` is the share, "20%". */
  percentOff?: string;
  /** Beside it. `{amount}` is what the customer saves. */
  saves?: string;
  /** In place of a discount when the compare-at price is not above the price. */
  noDiscount?: string;
  /** In place of a figure that cannot be worked out because a field is empty. */
  notEnough?: string;
  /** Under the compare-at price when it is lower than the price. */
  compareLow?: string;
  /** Beside a margin below zero. */
  belowCost?: string;
}

const WORDS = {
  legend: "Pricing",
  price: "Price",
  priceHint: "What the customer pays.",
  compareAt: "Compare-at price",
  compareAtHint: "Shown crossed out next to the price.",
  cost: "Cost per item",
  costHint: "Customers will not see this.",
  discount: "Discount",
  profit: "Profit",
  margin: "Margin",
  percentOff: "{percent} off",
  saves: "Saves {amount}",
  noDiscount: "No discount",
  notEnough: "Not enough information",
  compareLow: "Compare-at should be higher than the price.",
  belowCost: "Selling below cost",
} satisfies Required<ProductPricingFieldsetLabels>;

export interface ProductPricingFieldsetProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The three prices in minor units: 4900 is 49.00. A field that is empty is null. Pass it to control the fieldset. */
  value?: PricingValue;
  /** The prices to start with, when you do not control the fieldset. */
  defaultValue?: PricingValue;
  /** Called on every change with all three prices. */
  onValueChange?: (value: PricingValue) => void;
  /** ISO 4217 code: it sets the symbol and how many decimals an amount has (two for euros, none for yen). */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same amounts and percentages. */
  locale?: string;
  /** Show the cost field and, from it, the profit and the margin. Defaults to true. */
  showCost?: boolean;
  /** The words, for another language. */
  labels?: ProductPricingFieldsetLabels;
}

const EMPTY: PricingValue = { price: null, compareAt: null, cost: null };

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

interface MoneyFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> {
  value: number | null;
  onValueChange: (minor: number | null) => void;
  currency: string;
  locale: string;
}

/** An amount in a field: the symbol in front, the code behind, the text kept to what can be an amount and tidied when the field is left. Takes the id and the ARIA links from FormControl. */
function MoneyField({ value, onValueChange, currency, locale, ...props }: MoneyFieldProps) {
  const codeId = useId();
  const digits = minorDigits(currency, locale);
  const sign = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
  const [draft, setDraft] = useState(() => (value === null ? "" : formatAmount(value, digits, locale)));
  const [seen, setSeen] = useState(value);
  // An amount that arrives from outside replaces what is typed, unless it is only what the typing already means.
  if (value !== seen) {
    setSeen(value);
    if (parseAmount(draft, digits, locale) !== value) setDraft(value === null ? "" : formatAmount(value, digits, locale));
  }
  return (
    <InputGroup>
      <InputGroupAddon aria-hidden="true">{sign}</InputGroupAddon>
      <InputGroupInput
        inputMode={digits === 0 ? "numeric" : "decimal"}
        autoComplete="off"
        placeholder={formatAmount(0, digits, locale)}
        {...props}
        aria-describedby={[props["aria-describedby"], codeId].filter(Boolean).join(" ")}
        value={draft}
        onChange={(event) => {
          const text = tidyTyping(event.target.value, digits, locale);
          setDraft(text);
          onValueChange(parseAmount(text, digits, locale));
        }}
        onBlur={(event) => {
          props.onBlur?.(event);
          const minor = parseAmount(draft, digits, locale);
          setDraft(minor === null ? "" : formatAmount(minor, digits, locale));
        }}
        className="pl-2 tabular-nums"
      />
      <InputGroupAddon id={codeId} className="text-xs">
        {currency}
      </InputGroupAddon>
    </InputGroup>
  );
}

/**
 * The pricing block of a product editor: price, compare-at price and cost per item, with the discount, the profit
 * and the margin worked out as you type. All of it is whole minor units, so nothing is rounded before it is
 * calculated and each percentage is one division at the end. A fact that cannot be known yet says "Not enough
 * information" instead of showing a nonsense number, a compare-at price below the price is flagged in words, and a
 * margin below zero is shown plainly with a warning icon and text. The cost and the profit are for you: they never
 * leave the fieldset except through `onValueChange`.
 */
export function ProductPricingFieldset({ value, defaultValue, onValueChange, currency = "EUR", locale = "en-US", showCost = true, labels, className, ...props }: ProductPricingFieldsetProps) {
  const words: Required<ProductPricingFieldsetLabels> = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<PricingValue>(defaultValue ?? EMPTY);
  const [spoken, setSpoken] = useState("");
  const current = value ?? own;
  const digits = minorDigits(currency, locale);
  const money = (minor: number): string => formatMoneyText(minor, currency, digits, locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const facts: Pricing = pricingOf(current);

  function change(part: keyof PricingValue, minor: number | null) {
    const next = { ...current, [part]: minor };
    if (!value) setOwn(next);
    onValueChange?.(next);
  }

  // Words in place of a figure stay small and quiet even where the figures are large.
  const muted = (text: string): ReactNode => <span className="text-sm font-normal tracking-normal text-muted-foreground">{text}</span>;
  let discount: ReactNode = muted(words.notEnough);
  if (current.price !== null && current.compareAt !== null) {
    discount =
      facts.discount !== null && facts.saved !== null ? (
        <span className="tabular-nums">
          {fill(words.percentOff, { percent: percent.format(facts.discount) })}
          <span className="ml-2 text-sm font-normal tracking-normal text-muted-foreground @xl:mt-0.5 @xl:ml-0 @xl:block">{fill(words.saves, { amount: money(facts.saved) })}</span>
        </span>
      ) : (
        muted(words.noDiscount)
      );
  }
  // The same three facts as plain words. A screen reader hears them when a field is left, not on every key, as the VAT field does.
  const discountText =
    current.price === null || current.compareAt === null
      ? words.notEnough
      : facts.discount !== null && facts.saved !== null
        ? `${fill(words.percentOff, { percent: percent.format(facts.discount) })}, ${fill(words.saves, { amount: money(facts.saved) })}`
        : words.noDiscount;
  const profitText = facts.profit === null ? words.notEnough : money(facts.profit);
  const marginText = facts.margin === null ? words.notEnough : facts.margin < 0 ? `${percent.format(facts.margin)}, ${words.belowCost}` : percent.format(facts.margin);
  const spokenFacts = [`${words.discount}: ${discountText}`];
  if (showCost) spokenFacts.push(`${words.profit}: ${profitText}`, `${words.margin}: ${marginText}`);
  const sentence = `${spokenFacts.join(". ")}.`;

  const items: { key: string; term: string; value: ReactNode }[] = [{ key: "discount", term: words.discount, value: discount }];
  if (showCost) {
    items.push(
      { key: "profit", term: words.profit, value: facts.profit === null ? muted(words.notEnough) : <span className="tabular-nums">{money(facts.profit)}</span> },
      {
        key: "margin",
        term: words.margin,
        value:
          facts.margin === null ? (
            muted(words.notEnough)
          ) : facts.margin < 0 ? (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 @xl:flex-col @xl:items-start">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <IconWarning aria-hidden="true" className="size-4 shrink-0" />
                {percent.format(facts.margin)}
              </span>
              <span className="text-sm font-normal tracking-normal text-muted-foreground">{words.belowCost}</span>
            </span>
          ) : (
            <span className="tabular-nums">{percent.format(facts.margin)}</span>
          ),
      },
    );
  }

  const fields: { part: keyof PricingValue; label: string; hint: string; error?: string }[] = [
    { part: "price", label: words.price, hint: words.priceHint },
    { part: "compareAt", label: words.compareAt, hint: words.compareAtHint, error: facts.compareAtTooLow ? words.compareLow : undefined },
    ...(showCost ? [{ part: "cost" as const, label: words.cost, hint: words.costHint }] : []),
  ];

  return (
    <div data-slot="product-pricing-fieldset" role="group" aria-labelledby={`${id}-legend`} className={cn("@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5", className)} {...props}>
      <p id={`${id}-legend`} className="text-sm leading-none font-medium">
        {words.legend}
      </p>
      <div className={cn("grid gap-x-4 gap-y-5", showCost ? "@xl:grid-cols-3" : "@md:grid-cols-2")}>
        {fields.map((field) => (
          <FormField key={field.part} error={field.error} described={!field.error} className="content-start">
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              <MoneyField value={current[field.part]} onValueChange={(minor) => change(field.part, minor)} onBlur={() => setSpoken(sentence)} currency={currency} locale={locale} />
            </FormControl>
            {field.error ? null : <FormDescription>{field.hint}</FormDescription>}
          </FormField>
        ))}
      </div>
      {/* Beside each other where the room is a stat row, one under the other where it is not. */}
      <dl className={cn("grid divide-y divide-border rounded-lg border border-border bg-muted/40 text-sm", showCost && "@xl:grid-cols-3 @xl:divide-x @xl:divide-y-0")}>
        {items.map((item) => (
          <div key={item.key} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3 @xl:block @xl:px-5 @xl:py-4">
            <dt className="text-muted-foreground">{item.term}</dt>
            <dd className="text-right font-medium @xl:mt-1.5 @xl:text-left @xl:text-lg @xl:leading-snug @xl:tracking-[-0.02em]">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p role="status" className="sr-only">
        {spoken}
      </p>
    </div>
  );
}
