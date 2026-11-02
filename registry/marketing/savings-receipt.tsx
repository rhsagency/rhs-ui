import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconPiggyBank } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ReceiptItem {
  /** What the tool is, in generic words: "Email platform". Never a competitor's name. */
  label: string;
  /** What it costs for one period, in whole currency units: 79 or 12.5. */
  price: number;
}

export interface ReceiptOffer {
  /** Your product or bundle: "Halcyon Suite". */
  name: string;
  /** What it costs for one period, in whole currency units. */
  price: number;
}

export interface ReceiptAction {
  /** The button's text: "Switch and save". */
  label: string;
  /** Where the button goes. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface SavingsReceiptLabels {
  /** The heading when you do not pass a title. */
  title: string;
  /** The tag in the corner when it replaces more than one tool. {count} stands for the number. */
  replaces: string;
  /** The tag in the corner when it replaces one tool. */
  replacesOne: string;
  /** The head of the column of tools. */
  tool: string;
  /** The head of the column of prices. {period} stands for the period. */
  priceHead: string;
  /** The word for a month, in "per month". */
  month: string;
  /** The word for a year, in "per year". */
  year: string;
  /** The row with the struck-through total. */
  total: string;
  /** The line after your price. {period} stands for the period. */
  per: string;
  /** The saving. {amount} stands for the money saved in a year and {percent} for the share of the total, rounded down. */
  save: string;
  /** Said when your price is not lower than the total, so the receipt never claims a saving it does not show. */
  noSaving: string;
  /** The date line. {date} stands for the day the prices were checked. */
  checked: string;
}

const LABELS: SavingsReceiptLabels = {
  title: "What you pay today",
  replaces: "Replaces {count} tools",
  replacesOne: "Replaces 1 tool",
  tool: "Tool",
  priceHead: "Per {period}",
  month: "month",
  year: "year",
  total: "Total if bought separately",
  per: "per {period}",
  // No-break spaces keep "a year" and "(52 percent)" whole, so a narrow phone never leaves "percent)" alone on a line.
  save: "You save {amount} a\u00A0year ({percent}\u00A0percent)",
  noSaving: "At these prices there is no saving.",
  checked: "Prices checked {date}.",
};

export interface SavingsReceiptProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading. "What you pay today" by default. */
  title?: string;
  /** The tools it replaces, with what each costs for one period. Generic names, five or six at most. */
  items: readonly ReceiptItem[];
  /** Your product and its price for the same period. */
  ours: ReceiptOffer;
  /** The period every price is for. "month" by default. The saving is always said for a year. */
  period?: "month" | "year";
  /** The ISO 4217 currency of every price. "USD" by default. */
  currency?: string;
  /** The button under the receipt. */
  action: ReceiptAction;
  /**
   * The day the prices were checked: an ISO day ("2026-10-01") or a date. It is required, and printed under the
   * receipt as "Prices checked 1 October 2026", because a price comparison ages fast and is only fair with its date.
   */
  asOf: string | Date;
  /** How the comparison was made, in a sentence: "List prices of each tool's cheapest plan for ten people." */
  note?: string;
  /** The language the prices and the date are written in. "en-US" by default. */
  locale?: string;
  /** The time zone a full date and time is read in. A plain ISO day is read as that calendar day. "UTC" by default. */
  timeZone?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SavingsReceiptLabels>;
}

const text = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** Whole units to minor units, rounded, so the sums are exact: 12.1 + 0.2 has no stray digits. */
const minor = (units: number): number => Math.round(units * 100);

/** The day as a time element, written for the locale. A plain ISO day is that calendar day in any zone. */
function dayOf(value: string | Date, locale: string, timeZone: string): ReactNode {
  const moment = new Date(value);
  if (Number.isNaN(moment.getTime())) return String(value);
  const day = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  return <time dateTime={day ?? moment.toISOString()}>{new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: day ? "UTC" : timeZone }).format(moment)}</time>;
}

/**
 * What you would pay for the tools this replaces, added up like a receipt against your single price. A real table:
 * a row per replaced tool with a dotted leader to its price in tabular figures and a total row with the sum struck
 * through; then your own price in large type and one computed line, such as You save $1,584 a year (52 percent).
 * The arithmetic is done from the numbers you pass, in whole cents, so it cannot disagree with the rows; the percent
 * is rounded down, so the claim is never larger than the sum; and when your price is not lower, the receipt says
 * there is no saving instead of claiming one. The date the prices were checked is required, because price
 * comparisons age fast, and it is printed under the button next to a line on how the comparison was made.
 */
export function SavingsReceipt({ title, items, ours, period = "month", currency = "USD", action, asOf, note, locale = "en-US", timeZone = "UTC", headingLevel = 2, labels: custom, className, ...props }: SavingsReceiptProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const money = (cents: number): string => new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);
  const periodName = period === "year" ? labels.year : labels.month;

  const total = items.reduce((sum, item) => sum + minor(item.price), 0);
  const price = minor(ours.price);
  const difference = total - price;
  const yearly = period === "year" ? difference : difference * 12;
  // Rounded down, with a hair added so 20 percent never becomes 19 through floating point.
  const percent = total > 0 ? Math.max(0, Math.floor((difference / total) * 100 + 1e-9)) : 0;
  const saves = difference > 0;

  const arrow = <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />;

  return (
    <section data-slot="savings-receipt" aria-labelledby={`${id}-title`} className={cn("w-full max-w-md rounded-2xl border border-border bg-card p-6 break-words shadow-xs sm:p-8", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Heading id={`${id}-title`} className="text-xl leading-snug font-medium tracking-[-0.03em]">
          {title ?? labels.title}
        </Heading>
        <Badge variant="outline">{items.length === 1 ? labels.replacesOne : text(labels.replaces, { count: items.length })}</Badge>
      </div>

      {/* The column heads are drawn above the table, so the price column is only as wide as its figures and every leader runs all the way to them. A screen reader gets the real heads below. */}
      <div aria-hidden="true" className="mt-6 flex items-center justify-between gap-4 border-b border-border pb-2.5 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        <span>{labels.tool}</span>
        <span>{text(labels.priceHead, { period: periodName })}</span>
      </div>

      <table aria-labelledby={`${id}-title`} className="w-full border-collapse text-sm">
        <thead className="sr-only">
          <tr>
            <th scope="col">{labels.tool}</th>
            <th scope="col">{text(labels.priceHead, { period: periodName })}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${index}-${item.label}`}>
              <th scope="row" className="w-full py-2.5 pr-3 text-left font-normal">
                {/* The leader is decoration: it only carries the eye from the name to the price. */}
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0">{item.label}</span>
                  <span aria-hidden="true" className="min-w-4 flex-1 -translate-y-[0.2em] border-b border-dotted border-foreground/30" />
                </span>
              </th>
              <td className="py-2.5 text-right align-baseline whitespace-nowrap tabular-nums">{money(minor(item.price))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <th scope="row" className="pt-4 pb-1 text-left font-normal text-muted-foreground">
              {labels.total}
            </th>
            <td className="pt-4 pb-1 text-right whitespace-nowrap tabular-nums">
              <s className="text-muted-foreground">{money(total)}</s>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Your own price closes the receipt, outside the table: its large figure would otherwise widen the column of prices and pull every leader short of them. */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-base font-medium tracking-[-0.01em]">{ours.name}</p>
        <p className="text-right whitespace-nowrap">
          <span className="text-4xl leading-none font-medium tracking-[-0.05em] tabular-nums">{money(price)}</span>{" "}
          <span className="ml-1 text-sm text-muted-foreground">{text(labels.per, { period: periodName })}</span>
        </p>
      </div>

      <p className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-sm leading-snug font-medium tabular-nums">
        <IconPiggyBank aria-hidden="true" className="mt-px size-5 shrink-0" />
        <span className="text-balance">{saves ? fill(labels.save, { amount: <strong className="font-semibold">{money(yearly)}</strong>, percent: String(percent) }) : labels.noSaving}</span>
      </p>

      {action.href ? (
        <Button asChild size="lg" className="mt-6 w-full">
          <a href={action.href} onClick={action.onClick}>
            {action.label}
            {arrow}
          </a>
        </Button>
      ) : (
        <Button type="button" size="lg" onClick={action.onClick} className="mt-6 w-full">
          {action.label}
          {arrow}
        </Button>
      )}

      <p className="mt-5 text-xs leading-relaxed text-pretty text-muted-foreground">
        <span className="tabular-nums">{fill(labels.checked, { date: dayOf(asOf, locale, timeZone) })}</span>
        {note ? <> {note}</> : null}
      </p>
    </section>
  );
}
