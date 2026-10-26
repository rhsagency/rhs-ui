import { useId, type ComponentProps, type ReactNode } from "react";

import { IconCalendarCheck, IconReceipt } from "@rhs-ui/icons";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface RateRow {
  /** What is metered, which is also the row's header: "API requests". */
  resource: string;
  /** What is free in each billing period. A number is written in the section's locale; text ("10 GB", "Unlimited") is shown as written; null says nothing is included. */
  included: string | number | null;
  /** What one unit costs after that, in the section's currency: 0.4. Text ("Custom") is shown as written, 0 reads as Free and null as no extra charge. */
  rate: number | string | null;
  /** The unit the rate is for, without the word per: "1,000 requests", "GB", "seat". */
  unit?: string;
  /** A short note: "Burst limit of 200 requests a second". */
  note?: string;
}

export interface RateGroup {
  /** The product the rows belong to: "Platform". It is the header of the group. */
  title: string;
  /** The rows of this group, one per metered resource. */
  rows: readonly RateRow[];
}

export interface RateCardLabels {
  /** The name of the table for assistive technology, when the section has no title. */
  table: string;
  /** The header of the column of resources. */
  resource: string;
  /** The header of the column of free allowances. */
  included: string;
  /** The header of the column of prices after the allowance. */
  then: string;
  /** The header of the column of notes. */
  notes: string;
  /** Said after the price of a unit. {unit} stands for the unit: "per 1,000 requests". */
  per: string;
  /** The price of a resource whose rate is 0. */
  free: string;
  /** The price of a resource whose rate is null. */
  noCharge: string;
  /** The allowance of a resource with nothing included. */
  none: string;
  /** Said in the caption beside the date. {date} stands for the day the prices were checked. */
  checked: string;
}

const LABELS: RateCardLabels = {
  table: "Metered pricing",
  resource: "Resource",
  included: "Included",
  then: "Then",
  notes: "Notes",
  per: "per {unit}",
  free: "Free",
  noCharge: "No extra charge",
  none: "None",
  checked: "Prices checked {date}",
};

export interface RateCardProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The products and their rows. Each group is a header row followed by its resources. */
  groups: readonly RateGroup[];
  /** The billing period in plain words, said in the caption: "Billed monthly, in arrears". */
  billing: string;
  /** The day the prices were last checked, as an ISO date ("2026-10-12") or a Date. It is part of the caption, so the table says how old it is. */
  checkedOn: string | Date;
  /** The heading: "Pay for what you use". */
  title?: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** What the prices leave out, under the table: "Prices exclude VAT." */
  footnote?: ReactNode;
  /** The ISO 4217 currency of every numeric rate. "USD" by default. */
  currency?: string;
  /** The language numbers and the date are written in. "en-US" by default. */
  locale?: string;
  /** The time zone the checked date is written in, when it is a timestamp. A date without a time is always read as that day. "UTC" by default. */
  timeZone?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<RateCardLabels>;
}

const text = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => values[key] ?? marker);

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** A date without a time is a day, not a moment: it is written as that day whatever the time zone. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Metered pricing as a plain table, for products billed by usage. Each resource is a row with what is included
 * free in a billing period, then the price per unit and a note, grouped by product under their own headers, so
 * a developer can read off what a month will cost without a calculator. Prices are tabular figures and units are
 * spelled out ("per 1,000 requests"). The caption says how the product is billed and the day the prices were
 * checked, and both are required: a rate card that does not say how old it is goes stale without anyone noticing.
 * You pass the numbers, so the card never drifts from them. It is a reference, not an estimator. On a phone
 * each row becomes a stacked block that keeps its labels, so there is no sideways scrolling; the table
 * keeps its roles in both layouts, so a screen reader still meets a table.
 */
export function RateCard({
  groups,
  billing,
  checkedOn,
  title,
  description,
  footnote,
  currency = "USD",
  locale = "en-US",
  timeZone = "UTC",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: RateCardProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const count = new Intl.NumberFormat(locale);
  // $12 is shown as $12, not $12.00; a rate with cents keeps them, and a rate of a fraction of a cent keeps up to four digits.
  const whole = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fine = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const money = (amount: number) => (Number.isInteger(amount) ? whole : fine).format(amount);
  const day = typeof checkedOn === "string" && DAY.test(checkedOn);
  const checked = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: day ? "UTC" : timeZone }).format(new Date(checkedOn));
  const checkedIso = typeof checkedOn === "string" ? checkedOn : checkedOn.toISOString();

  // The cells have no header of their own on a phone, so each carries its column's name.
  const cell = "flex items-baseline gap-4 px-0 py-1 @2xl:table-cell @2xl:px-4 @2xl:py-4 @2xl:align-top";
  const name = "w-[5.5rem] shrink-0 text-[0.8125rem] leading-snug text-muted-foreground @2xl:hidden";

  return (
    <section data-slot="rate-card" aria-labelledby={title ? `${id}-title` : undefined} className={cn("@container w-full break-words", className)} {...props}>
      {title ? (
        <div className="mx-auto max-w-2xl text-center">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-xs", title && "mt-10 @3xl:mt-12")}>
        {/* Under 672px the table is made of blocks, which some browsers stop treating as a table; the roles say it again. */}
        <Table role="table" aria-labelledby={title ? `${id}-title` : undefined} aria-label={title ? undefined : labels.table} aria-describedby={`${id}-caption`} className="block caption-top @2xl:table">
          <TableCaption id={`${id}-caption`} className="mt-0 block border-b border-border bg-muted/30 px-4 py-3 text-left text-[0.8125rem] leading-snug @2xl:table-caption @2xl:px-6">
            <span className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <span className="flex items-center gap-2">
                <IconReceipt aria-hidden="true" className="size-4 shrink-0" />
                {billing}
              </span>
              <span className="flex items-center gap-2">
                <IconCalendarCheck aria-hidden="true" className="size-4 shrink-0" />
                <span>{fill(labels.checked, { date: <time dateTime={checkedIso}>{checked}</time> })}</span>
              </span>
            </span>
          </TableCaption>

          <TableHeader role="rowgroup" className="sr-only @2xl:not-sr-only @2xl:table-header-group">
            <TableRow role="row" className="hover:bg-transparent">
              <TableHead role="columnheader" scope="col" className="@2xl:w-[23%] @2xl:pl-6">
                {labels.resource}
              </TableHead>
              <TableHead role="columnheader" scope="col" className="@2xl:w-[17%] @2xl:px-4">
                {labels.included}
              </TableHead>
              <TableHead role="columnheader" scope="col" className="@2xl:w-[28%] @2xl:px-4">
                {labels.then}
              </TableHead>
              <TableHead role="columnheader" scope="col" className="@2xl:px-4 @2xl:pr-6">
                {labels.notes}
              </TableHead>
            </TableRow>
          </TableHeader>

          {groups.map((group, index) => {
            const groupId = `${id}-group-${index}`;
            return (
              <TableBody key={`${index}-${group.title}`} role="rowgroup" aria-labelledby={groupId} className="block @2xl:table-row-group">
                <TableRow role="row" className="block border-b border-border bg-muted/40 hover:bg-muted/40 @2xl:table-row">
                  <TableHead
                    id={groupId}
                    role="rowheader"
                    scope="rowgroup"
                    colSpan={4}
                    className="block h-auto px-4 py-2.5 text-xs font-medium tracking-[0.14em] whitespace-normal text-muted-foreground uppercase @2xl:table-cell @2xl:px-6"
                  >
                    {group.title}
                  </TableHead>
                </TableRow>

                {group.rows.map((row, position) => (
                  <TableRow key={`${position}-${row.resource}`} role="row" className="block px-4 py-4 @2xl:table-row @2xl:p-0">
                    <TableHead
                      role="rowheader"
                      scope="row"
                      className="block h-auto px-0 pb-2 text-[0.9375rem] leading-snug font-medium whitespace-normal text-foreground @2xl:table-cell @2xl:py-4 @2xl:pr-4 @2xl:pl-6 @2xl:align-top"
                    >
                      {row.resource}
                    </TableHead>
                    <TableCell role="cell" className={cell}>
                      <span aria-hidden="true" className={name}>
                        {labels.included}
                      </span>
                      <span className={cn("min-w-0 tabular-nums", row.included === null && "text-muted-foreground")}>
                        {row.included === null ? labels.none : typeof row.included === "number" ? count.format(row.included) : row.included}
                      </span>
                    </TableCell>
                    <TableCell role="cell" className={cell}>
                      <span aria-hidden="true" className={name}>
                        {labels.then}
                      </span>
                      <span className="min-w-0">
                        {typeof row.rate === "number" && row.rate > 0 ? (
                          <>
                            <span className="font-medium tabular-nums">{money(row.rate)}</span>
                            {row.unit ? <span className="text-muted-foreground"> {text(labels.per, { unit: row.unit })}</span> : null}
                          </>
                        ) : (
                          <span className="font-medium">{row.rate === null ? labels.noCharge : row.rate === 0 ? labels.free : row.rate}</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell role="cell" className={cn(cell, "text-muted-foreground @2xl:pr-6", !row.note && "hidden @2xl:table-cell")}>
                      <span aria-hidden="true" className={name}>
                        {labels.notes}
                      </span>
                      <span className="min-w-0 text-pretty">{row.note}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            );
          })}
        </Table>
      </div>

      {footnote ? <div className="mt-4 text-sm leading-relaxed text-pretty text-muted-foreground">{footnote}</div> : null}
    </section>
  );
}
