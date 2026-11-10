import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconTrendDown, IconTrendUp } from "@rhs-ui/icons";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface CustomerResult {
  /** Who it is: "Northwind Logistics". It is the link text when the row has a story. */
  customer: string;
  /** A small square mark or monogram, drawn at about 16px in a tile. Without one the tile holds the first letter of the name. */
  mark?: ReactNode;
  /** Their sector: "Logistics". */
  industry: string;
  /** What was measured: "Late deliveries". */
  metric: string;
  /** The figure before, as you want it written: "14.2%", "9 days". */
  before: string;
  /** The figure after, written the same way. It is set heavier than the rest. */
  after: string;
  /** The change, signed, as you want it written: "-31%", "+4.5 pts", "+12.5 percentage points". A leading minus or plus adds an arrow. A long one widens its column. */
  change: string;
  /** How long it took to get there: "8 weeks". */
  period: string;
  /** The customer's story. When set, the name is a link to it. */
  href?: string;
}

export interface CustomerResultsLabels {
  /** The column names. On a phone, where a row is a card, they are the labels of its values, read by screen readers only. */
  customer: string;
  industry: string;
  metric: string;
  before: string;
  after: string;
  /** The column of `period`. Default "Time". */
  time: string;
  /** The name of the change's column, shown to screen readers only, and said before the change on a phone so "-31%" is not a loose number: "9.8%, change -31%". Default "change". */
  change: string;
}

export interface CustomerResultsTableProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. It also names the table for screen readers. */
  title: string;
  /** Four to eight customers, in the order they are read. */
  rows: readonly CustomerResult[];
  /** Where the numbers come from and how they were measured. Required: a table of results without its method is only a claim. */
  caption: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CustomerResultsLabels>;
}

const LABELS: CustomerResultsLabels = { customer: "Customer", industry: "Industry", metric: "Metric", before: "Before", after: "After", time: "Time", change: "change" };

/** A change that starts with a minus (a hyphen, a minus sign or an en dash) went down; one that starts with a plus went up. */
function directionOf(change: string): "down" | "up" | null {
  const first = change.trim().charAt(0);
  if (first === "+") return "up";
  return first === "-" || first === "−" || first === "–" ? "down" : null;
}

/** The customer: a small mark in a tile and the name, which is a link when the row has a story. */
function Who({ row }: { row: CustomerResult }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted text-sm font-medium text-foreground select-none [&_img]:size-5 [&_svg]:size-4">
        {row.mark ?? Array.from(row.customer.trim())[0]?.toUpperCase()}
      </span>
      {row.href ? (
        <a href={row.href} className="rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
          {row.customer}
        </a>
      ) : (
        <span className="font-medium">{row.customer}</span>
      )}
    </span>
  );
}

/**
 * The change as a small chip, with an arrow when it is signed. `word` is said
 * before it to screen readers only; the table leaves it out because its column
 * header says it. The chip never grows past its container: on a phone a long
 * change wraps inside it, and in the table it sets the width of its own column.
 */
function Change({ change, word, className }: { change: string; word?: string; className?: string }) {
  const direction = directionOf(change);
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs leading-4 font-medium text-foreground tabular-nums", className)}>
      {direction === "down" ? <IconTrendDown aria-hidden="true" className="size-3 shrink-0" /> : direction === "up" ? <IconTrendUp aria-hidden="true" className="size-3 shrink-0" /> : null}
      {word ? <span className="sr-only">{word} </span> : null}
      {change}
    </span>
  );
}

/**
 * Results per customer as evidence a buyer can scan in ten seconds: a real
 * table with who, their industry, what was measured, the figure before and
 * after, and how long it took. The After figure is set heavier with its signed
 * change beside it as a chip (an arrow when it starts with a minus or a plus).
 * The chip has a column of its own, so a change as long as "+12.5 percentage
 * points" widens that column instead of running into its neighbour. Every
 * figure uses tabular digits, and a customer with a story is a link by name.
 * The caption under it is required and states the source and the method. A
 * phone has no room for seven columns and does not scroll sideways: each row
 * becomes a card that leads with the outcome (the metric under the name, then
 * before and after on one line with the change beside it, then the industry
 * and the time in a quiet line) and still gives every value its label to
 * screen readers. No state of its own, so it renders on the server.
 */
export function CustomerResultsTable({ title, rows, caption, labels, className, ...props }: CustomerResultsTableProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="customer-results-table" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <h2 id={heading} className="max-w-2xl text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
        {title}
      </h2>

      {/* From 768px: a table. It names itself from the heading, and its caption is the source and the method. */}
      <div className="mt-10 hidden md:mt-14 md:block">
        <Table aria-labelledby={heading}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="pl-0">
                {words.customer}
              </TableHead>
              <TableHead scope="col">{words.industry}</TableHead>
              <TableHead scope="col">{words.metric}</TableHead>
              <TableHead scope="col" className="text-right">
                {words.before}
              </TableHead>
              <TableHead scope="col" className="pr-2.5 text-right">
                {words.after}
              </TableHead>
              {/* The chip has a column of its own, named for screen readers only: "After" above it would sit over the number, not the chip. */}
              <TableHead scope="col" className="pl-0">
                <span className="sr-only">{words.change}</span>
              </TableHead>
              <TableHead scope="col" className="pr-0 text-right">
                {words.time}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.customer}-${row.metric}`}>
                <TableHead scope="row" className="h-auto py-4 pl-0 font-medium whitespace-normal text-foreground">
                  <Who row={row} />
                </TableHead>
                <TableCell className="py-4 text-muted-foreground">{row.industry}</TableCell>
                <TableCell className="py-4">{row.metric}</TableCell>
                <TableCell className="py-4 text-right whitespace-nowrap text-muted-foreground tabular-nums">{row.before}</TableCell>
                <TableCell className="py-4 pr-2.5 text-right font-medium whitespace-nowrap tabular-nums">{row.after}</TableCell>
                <TableCell className="py-4 pl-0">
                  <Change change={row.change} className="whitespace-nowrap" />
                </TableCell>
                <TableCell className="py-4 pr-0 text-right whitespace-nowrap text-muted-foreground tabular-nums">{row.period}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption className="mt-5 max-w-3xl text-left text-xs leading-relaxed">{caption}</TableCaption>
        </Table>
      </div>

      {/* Under 768px: one card per row that leads with the outcome. The labels are for screen readers (sr-only); the arrow says "from, to" and the weights say what matters. */}
      <div className="mt-10 md:hidden">
        <ul role="list" aria-labelledby={heading} className="grid gap-3">
          {rows.map((row) => (
            <li key={`${row.customer}-${row.metric}`}>
              <div className="grid gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground">
                <Who row={row} />
                <dl className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4">
                  <div className="basis-full">
                    <dt className="sr-only">{words.metric}</dt>
                    <dd className="text-sm font-medium">{row.metric}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">{words.before}</dt>
                    <dd className="text-sm text-muted-foreground tabular-nums">{row.before}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="sr-only">{words.after}</dt>
                    {/* The arrow leads the after figure, so when a long change makes the line wrap it goes down with it and never ends a line. */}
                    <dd className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <IconArrowRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      <span className="text-lg leading-7 font-medium tracking-[-0.01em] tabular-nums">{row.after}</span>
                      <Change change={row.change} word={words.change} />
                    </dd>
                  </div>
                </dl>
                <dl className="flex items-baseline justify-between gap-x-4 text-xs text-muted-foreground">
                  <div className="min-w-0">
                    <dt className="sr-only">{words.industry}</dt>
                    <dd>{row.industry}</dd>
                  </div>
                  <div className="shrink-0">
                    <dt className="sr-only">{words.time}</dt>
                    <dd className="tabular-nums">{row.period}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{caption}</p>
      </div>
    </section>
  );
}
