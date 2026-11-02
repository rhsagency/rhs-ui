"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface Industry {
  /** The industry as visitors call it: "Fashion and apparel". */
  name: string;
  /** Its page. */
  href: string;
  /** How many customers you have in it. Shown quietly beside the name, in tabular numbers. Leave it out for an industry you cannot count honestly. */
  customers?: number;
  /** Puts the industry first in its sector and marks it in words. One per sector is enough. */
  featured?: boolean;
}

export interface IndustrySector {
  /** The sector's heading: "Commerce". */
  label: string;
  /** The industries of the sector. A featured one moves to the top. */
  industries: readonly Industry[];
}

export interface IndustryIndexContact {
  /** The link's text: "Tell us about yours". */
  label: string;
  /** Where it goes: a contact page or a mailto: link. */
  href: string;
}

export interface IndustryIndexLabels {
  /** The mark on a featured industry. */
  featured: string;
  /** The search field's accessible name and placeholder. */
  search: string;
  /** The noun after a count of one: "1 industry". */
  industry: string;
  /** The noun after any other count: "24 industries". */
  industries: string;
  /** Said as the search narrows the list. {shown}, {total} and {noun} stand for the two counts and the noun. */
  filtered: string;
  /** Read out after the name of an industry that has a count: "Fashion and apparel, 214 customers". */
  customers: string;
  /** Said once, next to the count of industries, so the quiet numbers are not a riddle. */
  legend: string;
  /** Said when nothing matches the search. {query} stands for what was typed. */
  noMatch: string;
  /** The words before the contact link, when nothing matches. */
  noMatchHelp: string;
  /** The button that clears the search. */
  clear: string;
}

export interface IndustryIndexProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Industries". */
  eyebrow?: string;
  /** The heading: "Built for the way your industry works". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The industries, grouped by sector. Sectors keep the order you give them; a featured industry moves to the top of its own sector. */
  sectors: readonly IndustrySector[];
  /** Adds a search field that narrows the index as you type. For twenty industries and more. */
  filterable?: boolean;
  /** The link shown when the search finds nothing: your contact page. */
  contact?: IndustryIndexContact;
  /** The level of the heading: 2 by default. The sector headings sit one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<IndustryIndexLabels>;
  /** Locale for the numbers. */
  locale?: string;
}

const LABELS: IndustryIndexLabels = {
  featured: "Popular",
  search: "Search industries",
  industry: "industry",
  industries: "industries",
  filtered: "{shown} of {total} {noun}",
  customers: "customers",
  legend: "Numbers show customers",
  noMatch: "No industry matches “{query}”.",
  noMatchHelp: "Not on the list?",
  clear: "Clear search",
};

/** Lower case without accents, so "cafe" finds "Café". */
const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Puts values into a sentence: {query} becomes what was typed. Words stay plain strings, so they can cross from a Server Component. */
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * Where the use cases grid gives a few audiences a card each, this carries the
 * long tail: twelve to thirty industries as a quiet index, grouped by sector,
 * each a link with how many customers you have there. Sector headings sit over
 * lists that flow into columns by the width of the block, and no industry is
 * split across two of them. A featured industry leads its sector and is marked
 * in words. With `filterable` a search field narrows the index as you type,
 * says how many are left, and when nothing matches it says so and offers your
 * contact link, because a missing industry is a lead and not a dead end. The
 * numbers are tabular and quiet, and a screen reader hears them as customers.
 */
export function IndustryIndex({
  eyebrow,
  title,
  description,
  sectors,
  filterable = false,
  contact,
  headingLevel = 2,
  labels: custom,
  locale = "en-US",
  className,
  ...props
}: IndustryIndexProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [query, setQuery] = useState("");
  const search = useRef<HTMLDivElement>(null);
  const SectorHeading = `h${headingLevel + 1}` as "h3" | "h4";
  const numbers = new Intl.NumberFormat(locale);

  const terms = filterable ? fold(query.trim()).split(/\s+/).filter(Boolean) : [];
  const matches = (industry: Industry) => terms.every((term) => fold(industry.name).includes(term));
  // A featured industry leads its sector; the sort is stable, so the rest keep the order they were given in.
  const lead = (a: Industry, b: Industry) => Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  const shownSectors = sectors
    .map((sector) => ({ sector, industries: sector.industries.filter(matches).sort(lead) }))
    .filter((entry) => entry.industries.length > 0);
  const total = sectors.reduce((sum, sector) => sum + sector.industries.length, 0);
  const shown = shownSectors.reduce((sum, entry) => sum + entry.industries.length, 0);
  const hasCounts = sectors.some((sector) => sector.industries.some((industry) => industry.customers !== undefined));
  const noun = (n: number) => (n === 1 ? labels.industry : labels.industries);
  const status = terms.length ? (shown === 0 ? fill(labels.noMatch, { query: query.trim() }) : fill(labels.filtered, { shown, total, noun: noun(total) })) : `${numbers.format(total)} ${noun(total)}`;
  const empty = terms.length > 0 && shown === 0;

  return (
    <section data-slot="industry-index" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {filterable || hasCounts ? (
        <div className="mt-10 flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-8 @3xl:mt-12">
          {filterable ? (
            <div ref={search} role="search" className="w-full @xl:max-w-sm">
              <SearchInput aria-label={labels.search} placeholder={labels.search} value={query} onValueChange={setQuery} />
            </div>
          ) : null}
          <p className={cn("text-sm text-muted-foreground tabular-nums", filterable ? "@xl:text-right" : "")}>
            {/* With nothing left, the box below says it in words; this line then speaks to screen readers only. */}
            <span role={filterable ? "status" : undefined} aria-live={filterable ? "polite" : undefined} className={cn(empty && "sr-only")}>
              {status}
            </span>
            {hasCounts && !empty ? (
              <>
                <span aria-hidden="true" className="px-2">
                  &middot;
                </span>
                <span>{labels.legend}</span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {empty ? (
        <div className="mt-8 rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <p className="text-[0.9375rem] font-medium">{fill(labels.noMatch, { query: query.trim() })}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
            {contact ? (
              <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.9375rem]">
                <span className="text-muted-foreground">{labels.noMatchHelp}</span>
                <a href={contact.href} className={LINK}>
                  {contact.label}
                  <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                // The button leaves the page with the empty state: keep the keyboard where the reader was typing.
                search.current?.querySelector("input")?.focus();
              }}
            >
              {labels.clear}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-y-12">
          {shownSectors.map(({ sector, industries }, sectorIndex) => (
            <div key={`${sectorIndex}-${sector.label}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-3">
                <SectorHeading id={`${id}-${sectorIndex}`} className="min-w-0 text-xl leading-snug font-semibold tracking-[-0.025em]">
                  {sector.label}
                </SectorHeading>
                <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {numbers.format(industries.length)} {noun(industries.length)}
                </p>
              </div>
              <ul role="list" aria-labelledby={`${id}-${sectorIndex}`} className="gap-x-12 @lg:columns-2 @3xl:columns-3">
                {industries.map((industry) => (
                  <li key={`${industry.name}-${industry.href}`} className="break-inside-avoid">
                    <a
                      href={industry.href}
                      className="group/industry flex items-baseline gap-3 border-b border-border py-3 outline-none transition-colors duration-150 hover:border-foreground/40 focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                    >
                      <span
                        className={cn(
                          "min-w-0 text-[0.9375rem] leading-snug underline decoration-transparent underline-offset-4 transition-colors duration-150 group-hover/industry:decoration-foreground/40 motion-reduce:transition-none",
                          industry.featured ? "font-semibold" : "font-medium",
                        )}
                      >
                        {industry.name}
                      </span>
                      {industry.featured ? (
                        <Badge variant="secondary" className="shrink-0 self-center">
                          {labels.featured}
                        </Badge>
                      ) : null}
                      {industry.customers !== undefined ? (
                        <span className="ml-auto shrink-0 pl-2 text-sm text-muted-foreground tabular-nums transition-colors duration-150 group-hover/industry:text-foreground motion-reduce:transition-none">
                          {numbers.format(industry.customers)}
                          <span className="sr-only"> {labels.customers}</span>
                        </span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
