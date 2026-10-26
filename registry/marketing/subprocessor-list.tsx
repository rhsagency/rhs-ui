import type { ComponentProps, ReactNode } from "react";

import { IconArrowUpRight, IconBuilding, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface Subprocessor {
  /** The vendor's legal or trading name: "Amazon Web Services EMEA SARL". */
  name: string;
  /** What it does for you, in one sentence: "Hosts the application and its databases". */
  purpose: string;
  /** The customer data it touches: "Account data, uploaded files". */
  data: string;
  /** Where the data is processed, as country names: "Ireland". Pass several for more than one. A flag alone is never enough. */
  location: string | readonly string[];
  /** How a transfer out of the EU is covered: "Standard Contractual Clauses", "Adequacy decision", "Not applicable, processed in the EU". */
  safeguard: string;
  /** The vendor's own page, such as its security or sub-processor page. The name links to it. */
  href?: string;
}

export interface SubprocessorLabels {
  /** Column head and label for the vendor. */
  name: string;
  /** Column head and label for what it does. */
  purpose: string;
  /** Column head and label for the data it touches. */
  data: string;
  /** Column head and label for the processing location. */
  location: string;
  /** Column head and label for the transfer safeguard. */
  safeguard: string;
  /** The words before the date. */
  updated: string;
  /** The noun after a count of one: "1 subprocessor". */
  subprocessor: string;
  /** The noun after any other count. */
  subprocessors: string;
  /** The accessible name of the notice slot. */
  notice: string;
  /** Said when the list has no entries. */
  empty: string;
}

export interface SubprocessorListProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The vendors, in any order. They are shown alphabetically. */
  subprocessors: readonly Subprocessor[];
  /** The page's own heading, when the page has no other: "Subprocessors". */
  title?: string;
  /** One or two sentences under the title: what a subprocessor is and who this list covers. */
  description?: string;
  /** When the list last changed, as an ISO date: "2026-09-30". */
  updated?: string;
  /** A slot above the list for the notify-me form or a line on how changes are announced. Yours to fill: it needs your mail tool. */
  notice?: ReactNode;
  /** The table's accessible name, which screen readers announce on arrival: "Subprocessors used by Northwind". */
  caption?: string;
  /** The level of the title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the headings and labels, for a site that is not in English. */
  labels?: Partial<SubprocessorLabels>;
  /** Locale for sorting, numbers and the date. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: SubprocessorLabels = {
  name: "Subprocessor",
  purpose: "Purpose",
  data: "Data processed",
  location: "Location",
  safeguard: "Transfer safeguard",
  updated: "Last updated",
  subprocessor: "subprocessor",
  subprocessors: "subprocessors",
  notice: "Notifications",
  empty: "We do not use any subprocessors at the moment.",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

const countries = (value: string | readonly string[]): string[] => (typeof value === "string" ? [value] : [...value]).map((country) => country.trim()).filter(Boolean);

const LINK =
  "rounded-sm underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The vendors that handle your customers' data, as the list a security review
 * asks for: who they are, what they do for you, which data they touch, in which
 * country and under which safeguard a transfer is covered. Sorted
 * alphabetically, with the date it last changed and a slot above it for the
 * notify-me form. Locations are country names in chips (a flag is never the
 * only word), and below 768px every row becomes a stacked card that keeps all
 * five labels, because the data matters more than the shape of a table.
 */
export function SubprocessorList({
  subprocessors,
  title,
  description,
  updated,
  notice,
  caption,
  headingLevel = 2,
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: SubprocessorListProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const rows = [...subprocessors].sort((a, b) => collator.compare(a.name, b.name));
  const count = rows.length;
  const numbers = new Intl.NumberFormat(locale);
  const hasHeader = Boolean(title || description);

  // The arrow stays glued to the last word, so it never wraps onto a line of its own and never floats away from a long name.
  const vendor = (row: Subprocessor): ReactNode => {
    if (!row.href) return row.name;
    const words = row.name.trim().split(" ");
    const last = words.pop() ?? "";
    // Only a short last word is glued to the arrow: a long one has to be free to break.
    const glue = last.length <= 14 ? "whitespace-nowrap" : undefined;
    return (
      <a href={row.href} className={LINK}>
        {words.length ? `${words.join(" ")} ` : null}
        <span className={glue}>
          {last}
          <IconArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5 align-[-0.1em] text-muted-foreground" />
        </span>
      </a>
    );
  };

  const where = (row: Subprocessor): ReactNode => (
    <ul role="list" className="flex flex-wrap gap-1.5">
      {countries(row.location).map((country) => (
        <li key={country} className="max-w-full min-w-0">
          <Badge variant="outline" className="h-auto max-w-full py-0.5 text-left whitespace-normal [overflow-wrap:anywhere]">
            {country}
          </Badge>
        </li>
      ))}
    </ul>
  );

  return (
    <section data-slot="subprocessor-list" className={cn("w-full break-words", className)} {...props}>
      {hasHeader ? (
        <header className="max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
        </header>
      ) : null}

      <p className={cn("flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground", hasHeader && "mt-6")}>
        <span className="inline-flex items-center gap-2">
          <IconBuilding aria-hidden="true" className="size-4" />
          <span>
            <span className="tabular-nums">{numbers.format(count)}</span> {count === 1 ? labels.subprocessor : labels.subprocessors}
          </span>
        </span>
        {updated ? (
          <span className="inline-flex items-center gap-2">
            <IconClock aria-hidden="true" className="size-4" />
            <span>
              {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
            </span>
          </span>
        ) : null}
      </p>

      {notice ? (
        <aside aria-label={labels.notice} className="mt-6 rounded-xl border border-border bg-muted/40 p-4 sm:p-5">
          {notice}
        </aside>
      ) : null}

      <div className="mt-6">
        {count === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{labels.empty}</p>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
              <Table className="table-fixed">
                {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    {/* A heading may wrap, so a narrow column never clips it or makes the table scroll. */}
                    <TableHead scope="col" className="w-[18%] pl-5 whitespace-normal">
                      {labels.name}
                    </TableHead>
                    <TableHead scope="col" className="w-[22%] whitespace-normal">
                      {labels.purpose}
                    </TableHead>
                    <TableHead scope="col" className="w-[20%] whitespace-normal">
                      {labels.data}
                    </TableHead>
                    <TableHead scope="col" className="w-32 whitespace-normal">
                      {labels.location}
                    </TableHead>
                    <TableHead scope="col" className="pr-5 whitespace-normal">
                      {labels.safeguard}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.name}-${row.purpose}`}>
                      <TableHead scope="row" className="py-4 pl-5 align-top font-medium whitespace-normal break-words text-foreground">
                        {vendor(row)}
                      </TableHead>
                      <TableCell className="py-4 align-top leading-relaxed text-muted-foreground">{row.purpose}</TableCell>
                      <TableCell className="py-4 align-top leading-relaxed text-muted-foreground">{row.data}</TableCell>
                      <TableCell className="py-4 align-top">{where(row)}</TableCell>
                      <TableCell className="py-4 pr-5 align-top leading-relaxed">{row.safeguard}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul role="list" aria-label={caption} className="grid grid-cols-1 gap-3 md:hidden">
              {rows.map((row) => (
                <li key={`${row.name}-${row.purpose}`} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-base leading-snug font-medium tracking-[-0.01em]">{vendor(row)}</p>
                  <dl className="mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-3.5 text-sm">
                    <dt className="text-muted-foreground">{labels.purpose}</dt>
                    <dd className="leading-relaxed">{row.purpose}</dd>
                    <dt className="text-muted-foreground">{labels.data}</dt>
                    <dd className="leading-relaxed">{row.data}</dd>
                    <dt className="text-muted-foreground">{labels.location}</dt>
                    <dd>{where(row)}</dd>
                    <dt className="text-muted-foreground">{labels.safeguard}</dt>
                    <dd className="leading-relaxed">{row.safeguard}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
