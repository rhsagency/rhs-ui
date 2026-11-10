"use client";

import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { sumOf, type PriceLine, type PriceLineKind } from "@rhs-ui/commerce/price-breakdown-popover/breakdown";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { PriceLine, PriceLineKind } from "@rhs-ui/commerce/price-breakdown-popover/breakdown";

export interface PriceBreakdownPopoverLabels {
  /** The heading of the popover and the caption of its table. */
  title?: string;
  /** The name of the trigger button. `{amount}` is the total in words: "49.00 euros". */
  trigger?: string;
  /** The row with the total. */
  total?: string;
  /** The tag next to a discount line. */
  discount?: string;
  /** Before a tax that is already in the total. `{label}` is the tax with its rate: "VAT 21%". */
  includes?: string;
  /** The name of the first column of the table, for a screen reader: what each line is. */
  item?: string;
  /** The name of the second column of the table, for a screen reader: what each line comes to. */
  amount?: string;
}

const WORDS = {
  title: "Price breakdown",
  trigger: "Price breakdown, {amount}",
  total: "Total",
  discount: "Discount",
  includes: "Includes {label}",
  item: "Item",
  amount: "Amount",
} satisfies Required<PriceBreakdownPopoverLabels>;

export interface PriceBreakdownPopoverProps extends Omit<ComponentProps<typeof PopoverTrigger>, "children" | "title" | "asChild"> {
  /** What the customer pays, in minor units: 4900 is 49.00. It is the figure on the trigger and on the last row. */
  total: number;
  /** How the total is made up: charges, discounts and taxes. In development a warning says so when they do not add up to `total`. */
  lines: readonly PriceLine[];
  /** ISO 4217 code. It also sets how many decimals an amount has (two for euros, none for yen). */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same amounts. */
  locale?: string;
  /** The total already contains its taxes: they are listed under the total as "Includes VAT 21%" and not added again. Defaults to false, where taxes are added above the total. */
  includesTax?: boolean;
  /** What the button shows. Defaults to the total with an info icon. Its name stays "Price breakdown, 49.00 euros". */
  trigger?: ReactNode;
  /** The heading of the popover. */
  title?: string;
  /** Which side of the trigger the popover lines up with. Defaults to "start". */
  align?: "start" | "center" | "end";
  /** Whether the popover is open, to control it. */
  open?: boolean;
  /** Whether the popover starts open, when you do not control it. It is shown without taking the focus from the page; a popover the visitor opens takes it as usual. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The words, for another language. */
  labels?: PriceBreakdownPopoverLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/**
 * A price you can press to see how it is made up: the base price, discounts, shipping and tax as the lines of a
 * real table that add up to the total, with each tax named with its rate ("VAT 21%") and each discount carrying a
 * minus and the word Discount. A rule above the total makes the sum readable. Money is formatted for the locale and
 * currency from whole minor units, and in development the component warns when the lines do not add up to the
 * total. The trigger is a button named "Price breakdown, 49.00 euros" and the popover is not modal, so the page
 * stays usable while it is open.
 */
export function PriceBreakdownPopover({
  total,
  lines,
  currency = "EUR",
  locale = "en-US",
  includesTax = false,
  trigger,
  title,
  align = "start",
  open,
  defaultOpen,
  onOpenChange,
  labels,
  className,
  ...props
}: PriceBreakdownPopoverProps) {
  const words: Required<PriceBreakdownPopoverLabels> = { ...WORDS, ...labels };
  const id = useId();
  const digits = new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const style = { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits } as const;
  const money = (minor: number): string => new Intl.NumberFormat(locale, style).format(minor / 10 ** digits);
  const minus = (minor: number): string => `−${money(Math.abs(minor))}`;
  const spoken = new Intl.NumberFormat(locale, { ...style, currencyDisplay: "name" }).format(total / 10 ** digits);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
  const named = (line: PriceLine): string => (line.kind === "tax" && line.rate !== undefined ? `${line.label} ${percent.format(line.rate / 100)}` : line.label);

  const sum = sumOf(lines, includesTax);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && sum !== total) {
      console.warn(`PriceBreakdownPopover: the lines add up to ${sum} but the total is ${total} (minor units). Check the amounts${includesTax ? "" : ", and whether the taxes are already in the total (includesTax)"}.`);
    }
  }, [sum, total, includesTax]);

  const counted = lines.filter((line) => !(line.kind === "tax" && includesTax));
  const inside = lines.filter((line) => line.kind === "tax" && includesTax);
  const heading = title ?? words.title;

  // A popover that starts open (a preview in the docs) is shown without taking the focus from the page; one the visitor opens takes it as usual.
  const visitorOpened = useRef(false);

  return (
    <Popover
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => {
        if (next) visitorOpened.current = true;
        onOpenChange?.(next);
      }}
    >
      <PopoverTrigger
        data-slot="price-breakdown-popover"
        // A trigger of your own is named by its own words ("Processing fee $3.50"), so the name holds what it shows (WCAG 2.5.3).
        aria-label={trigger ? undefined : fill(words.trigger, { amount: spoken })}
        className={cn(
          // No negative margin: in a sentence the filled pill must not reach over the word before it. Pass `-ml-1` to line a price up with the text above it.
          "group/trigger inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 outline-none transition-colors duration-150",
          "hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {trigger ?? (
          <>
            <span className="tabular-nums underline decoration-1 decoration-muted-foreground/60 decoration-dotted underline-offset-[5px] transition-colors duration-150 group-hover/trigger:decoration-foreground group-data-[state=open]/trigger:decoration-foreground motion-reduce:transition-none">
              {money(total)}
            </span>
            <IconInfo aria-hidden="true" className="size-[max(0.875rem,0.6em)] shrink-0 text-muted-foreground" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        collisionPadding={16}
        aria-labelledby={`${id}-title`}
        onOpenAutoFocus={(event) => {
          if (defaultOpen && !visitorOpened.current) event.preventDefault();
        }}
        className="w-[21rem] max-w-[calc(100vw-2rem)] p-4"
      >
        <p id={`${id}-title`} className="text-sm leading-none font-medium">
          {heading}
        </p>
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">{heading}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{words.item}</th>
              <th scope="col">{words.amount}</th>
            </tr>
          </thead>
          <tbody>
            {counted.map((line, index) => (
              <tr key={`${line.label}-${index}`}>
                <th scope="row" className="py-1.5 pr-4 text-left align-top font-normal">
                  {/* The tag stays on the line of the label, and a long label wraps beside it, so every discount row has the same shape. */}
                  <span className="flex items-baseline gap-x-2">
                    <span className="min-w-0">{named(line)}</span>
                    {line.kind === "discount" ? <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-none font-medium text-muted-foreground">{words.discount}</span> : null}
                  </span>
                  {line.note ? <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{line.note}</span> : null}
                </th>
                <td className="py-1.5 text-right align-top tabular-nums">{line.kind === "discount" ? minus(line.amount) : money(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <th scope="row" className="pt-3 pr-4 text-left font-semibold">
                {words.total}
              </th>
              <td className="pt-3 text-right font-semibold tabular-nums">{money(total)}</td>
            </tr>
            {inside.map((line, index) => (
              <tr key={`${line.label}-${index}`} className="text-xs text-muted-foreground">
                <th scope="row" className="pt-1.5 pr-4 text-left font-normal">
                  {fill(words.includes, { label: named(line) })}
                </th>
                <td className="pt-1.5 text-right tabular-nums">{money(line.amount)}</td>
              </tr>
            ))}
          </tfoot>
        </table>
      </PopoverContent>
    </Popover>
  );
}
