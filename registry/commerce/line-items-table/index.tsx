import { useId, type ComponentProps, type ReactNode } from "react";

import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import { WORDS, fill, totalsOf, type LineItem, type LineItemsDiscount, type LineItemsLabels, type LineItemsShipping } from "@rhs-ui/commerce/line-items-table/totals";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { LineItem, LineItemsDiscount, LineItemsLabels, LineItemsShipping, LineItemsTotals } from "@rhs-ui/commerce/line-items-table/totals";
export { totalsOf } from "@rhs-ui/commerce/line-items-table/totals";

export interface LineItemsTableProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** What is on the order, quote or invoice: one entry per line. */
  lines: readonly LineItem[];
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Always pass your application locale, so amounts and quantities are written the same on the server and in the browser. */
  locale?: string;
  /** A discount, as a percentage of the subtotal, a fixed amount, or both. It is shown as a negative amount and never exceeds the subtotal. */
  discount?: LineItemsDiscount;
  /** What delivery costs, in minor units, or an object with its own label. 0 shows "Free". Leave it out for no shipping row. */
  shipping?: number | LineItemsShipping;
  /** VAT in percent: 21 is 21%. Leave it out for no tax row. */
  taxRate?: number;
  /** Set it when the unit amounts already contain the VAT, as on a shop receipt: the row then says "Includes VAT" and the total does not change. */
  taxIncluded?: boolean;
  /** A heading above the table. It also names the table for a screen reader. */
  title?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: LineItemsLabels;
}

/**
 * Priced lines as a table, for quotes, order confirmations, invoices and cart reviews: description (with a second
 * line for the variant), quantity, unit price and amount, and in the footer the subtotal, discount, shipping, VAT
 * and total. Everything is worked out in whole minor units and rounded once per row, so the rows always add up to the
 * total, and every figure is tabular. The footer is a real tfoot with row headers, and the total is set apart by a
 * heavier rule and counts to a new value when the lines change. On a phone each line folds into a card with its own
 * subtotal and the footer becomes a list, so nothing hides in a sideways scroll.
 */
export function LineItemsTable({ lines, currency = "EUR", locale = "en-US", discount, shipping, taxRate, taxIncluded = false, title, headingAs: Heading = "h2", labels, className, ...props }: LineItemsTableProps) {
  const words = { ...WORDS, ...labels, columns: { ...WORDS.columns, ...labels?.columns } };
  const id = useId();
  const totals = totalsOf({ lines, discount, shipping, taxRate, taxIncluded });
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const quantity = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  const rate = taxRate === undefined ? "" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(taxRate / 100);
  const quantityOf = (line: LineItem): string => `${quantity.format(line.quantity)}${line.unit ? ` ${line.unit}` : ""}`;
  const shippingLabel = typeof shipping === "object" ? (shipping.label ?? words.shipping) : words.shipping;

  // The rows under the lines. A subtotal is only worth a row when something is added to it or taken off it.
  const adjusts = totals.discount > 0 || totals.shipping !== undefined || totals.tax !== undefined;
  const rows: { key: string; label: string; value: ReactNode; muted?: boolean }[] = [
    ...(adjusts ? [{ key: "subtotal", label: words.subtotal, value: money(totals.subtotal) }] : []),
    ...(totals.discount > 0 ? [{ key: "discount", label: discount?.label ?? words.discount, value: `−${money(totals.discount)}` }] : []),
    ...(totals.shipping !== undefined ? [{ key: "shipping", label: shippingLabel, value: totals.shipping === 0 ? words.free : money(totals.shipping) }] : []),
    ...(totals.tax !== undefined ? [{ key: "vat", label: fill(taxIncluded ? words.vatIncluded : words.vat, { rate }), value: money(totals.tax), muted: taxIncluded }] : []),
  ];
  // The first row under the lines has room above it, and the last has room above the heavy rule.
  const rowSpace = (index: number): string => cn(index === 0 ? "pt-4" : "pt-1.5", index === rows.length - 1 ? "pb-4" : "pb-1.5");
  const total = <AnimatedPrice value={totals.total / 100} currency={currency} locale={locale} />;

  return (
    <div data-slot="line-items-table" className={cn("@container min-w-0", className)} {...props}>
      {title ? (
        <Heading id={`${id}-title`} className="mb-4 text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">
          {title}
        </Heading>
      ) : null}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card @xl:block">
        <Table aria-labelledby={title ? `${id}-title` : undefined}>
          {title ? null : <TableCaption className="sr-only">{words.caption}</TableCaption>}
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="pl-5">
                {words.columns.description}
              </TableHead>
              <TableHead scope="col" className="text-right">
                {words.columns.quantity}
              </TableHead>
              <TableHead scope="col" className="text-right">
                {words.columns.unitPrice}
              </TableHead>
              <TableHead scope="col" className="pr-5 text-right">
                {words.columns.amount}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  {words.empty}
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, index) => (
                <TableRow key={line.id} className="hover:bg-transparent">
                  <TableHead scope="row" className="h-auto py-3.5 pl-5 align-top font-normal whitespace-normal text-foreground">
                    <span className="block font-medium text-pretty">{line.description}</span>
                    {line.detail ? <span className="mt-0.5 block text-xs text-pretty text-muted-foreground">{line.detail}</span> : null}
                  </TableHead>
                  <TableCell className="py-3.5 text-right align-top whitespace-nowrap tabular-nums">{quantityOf(line)}</TableCell>
                  <TableCell className="py-3.5 text-right align-top whitespace-nowrap tabular-nums">{money(line.unitAmount)}</TableCell>
                  <TableCell className="py-3.5 pr-5 text-right align-top font-medium whitespace-nowrap tabular-nums">{money(totals.lines[index] ?? 0)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter className="border-t border-border bg-muted/30 font-normal">
            {rows.map((row, index) => (
              <TableRow key={row.key} className="border-0 hover:bg-transparent">
                <TableHead scope="row" colSpan={3} className={cn("h-auto pr-4 text-right text-sm font-normal text-muted-foreground", rowSpace(index))}>
                  {row.label}
                </TableHead>
                <TableCell className={cn("pr-5 text-right whitespace-nowrap tabular-nums", rowSpace(index), row.muted && "text-muted-foreground")}>{row.value}</TableCell>
              </TableRow>
            ))}
            <TableRow className={cn("border-b-0 border-foreground hover:bg-transparent", rows.length ? "border-t-2" : "border-t-0")}>
              <TableHead scope="row" colSpan={3} className="h-auto py-4 pr-4 text-right text-base font-semibold text-foreground">
                {words.total}
              </TableHead>
              <TableCell className="py-4 pr-5 text-right text-lg font-semibold tracking-[-0.02em] whitespace-nowrap">{total}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="grid gap-3 @xl:hidden">
        <ul role="list" aria-labelledby={title ? `${id}-title` : undefined} aria-label={title ? undefined : words.caption} className="grid gap-3">
          {lines.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{words.empty}</li>
          ) : (
            lines.map((line, index) => (
              <li key={line.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium text-pretty">{line.description}</p>
                {line.detail ? <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{line.detail}</p> : null}
                <p className="mt-3 flex items-baseline justify-between gap-4 border-t border-border pt-3 text-sm tabular-nums">
                  <span className="text-muted-foreground">{fill(words.each, { quantity: quantityOf(line), price: money(line.unitAmount) })}</span>
                  <span className="shrink-0 font-semibold whitespace-nowrap">{money(totals.lines[index] ?? 0)}</span>
                </p>
              </li>
            ))
          )}
        </ul>

        <dl className="grid gap-2.5 rounded-xl border border-border bg-card p-4 text-sm">
          {rows.map((row) => (
            <div key={row.key} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className={cn("shrink-0 whitespace-nowrap tabular-nums", row.muted && "text-muted-foreground")}>{row.value}</dd>
            </div>
          ))}
          <div className={cn("flex items-baseline justify-between gap-4 border-foreground", rows.length ? "mt-1 border-t-2 pt-3.5" : "")}>
            <dt className="text-base font-semibold">{words.total}</dt>
            <dd className="shrink-0 text-lg font-semibold tracking-[-0.02em] whitespace-nowrap">{total}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
