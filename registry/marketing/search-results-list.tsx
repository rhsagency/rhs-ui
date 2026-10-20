import { Fragment, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { EmptySearch } from "@rhs-ui/primitives/empty-search";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, paginationRange } from "@rhs-ui/primitives/pagination";
import { cn } from "@/lib/utils";

export interface SearchFilter {
  /** "All", "Pages", "Articles", "Docs". */
  label: string;
  /** The URL of the same search with this filter on. */
  href: string;
  /** How many results this filter holds. */
  count: number;
  /** Marks the filter that is on (aria-current). */
  current?: boolean;
}

export interface SearchResult {
  /** The page's title: the link people click. */
  title: string;
  /** Where the result lives. */
  href: string;
  /** Where it lives, as the steps of a breadcrumb: ["Docs", "Billing", "Invoices"]. */
  path?: readonly string[];
  /** A sentence or two around the match, as plain text. The matched words are marked here, not by you. */
  snippet: string;
  /** "Page", "Article", "Doc". */
  type: string;
  /** When it was last changed, as an ISO date: "2026-03-12". */
  date?: string;
}

export interface SearchResultsLabels {
  /** The noun after a count of one: "1 result for". */
  result: string;
  /** The noun after any other count: "24 results for". */
  results: string;
  /** The word between the count and the query. */
  for: string;
  /** The page line. {page} and {pageCount} are replaced by the numbers. */
  pageOf: string;
  /** The button to the previous page. */
  previous: string;
  /** The button to the next page. */
  next: string;
  /** The accessible name of a numbered page link. {page} is replaced by the number. */
  page: string;
  /** The accessible name of the pager. */
  pagination: string;
  /** Read out before a result's path. */
  path: string;
  /** The suggestion that drops the type filter when nothing matched under it. */
  searchAll: string;
}

export interface SearchResultsListProps extends Omit<ComponentProps<"section">, "children" | "results"> {
  /** What was searched for. Its words are marked in every snippet. */
  query: string;
  /** How many results the current filter holds, across all pages. */
  total: number;
  /** The type filters. They render as links, so each one has a URL and works without script. */
  filters?: readonly SearchFilter[];
  /** The results of this page only. */
  results: readonly SearchResult[];
  /** The page being shown, from 1. */
  page?: number;
  /** How many pages there are in all. */
  pageCount?: number;
  /** The URL of a page. Without it no pagination is drawn. */
  pageHref?: (page: number) => string;
  /** Spelling fixes or nearby searches, shown by the empty state. */
  suggestions?: readonly { label: string; href: string }[];
  /** A last resort in the empty state: "Ask support". */
  emptyAction?: ReactNode;
  /** The level of the count line; each result's title sits one level below. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The accessible name of the filter row. Give each list on a page its own. */
  filtersLabel?: string;
  /** Words for the count line, the pager and the hidden labels, for a site that is not in English. */
  labels?: Partial<SearchResultsLabels>;
  /** Locale for numbers and dates. */
  locale?: string;
  /** Time zone for dates that carry a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: SearchResultsLabels = {
  result: "result",
  results: "results",
  for: "for",
  pageOf: "Page {page} of {pageCount}",
  previous: "Previous",
  next: "Next",
  page: "Page {page}",
  pagination: "Search results pages",
  path: "Path:",
  searchAll: "Search all types",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * One pattern for every word of a query, with "quoted phrases" kept whole and the longest first, so a phrase
 * wins over its own words. A lone symbol (a stray "+" or "-") is not a word and is never marked. Null when
 * there is nothing to mark.
 */
function patternOf(query: string): RegExp | null {
  const found = [...query.matchAll(/"([^"]+)"|(\S+)/g)]
    .map((match) => (match[1] ?? match[2] ?? "").trim())
    .filter((term) => /[\p{L}\p{N}]/u.test(term));
  const terms = [...new Set(found.map((term) => term.toLowerCase()))].sort((a, b) => b.length - a.length);
  return terms.length ? new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi") : null;
}

/** Splits the snippet on the pattern and wraps the matches in <mark>; the text itself is never parsed as HTML. */
function mark(snippet: string, pattern: RegExp | null): ReactNode {
  if (!pattern) return snippet;
  const parts = snippet.split(pattern);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="rounded-[3px] bg-foreground/10 px-0.5 -mx-0.5 text-foreground box-decoration-clone">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const CHIP =
  "inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border px-3.5 py-1 text-sm outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The body of a site search page: the count and the query, type filters with
 * their counts as links, the results with a breadcrumb path, a snippet with the
 * matched words marked, a type and a date, and the pager. It keeps no state, so
 * every filter and every page has a URL and the page works as plain HTML; the
 * snippet is highlighted by splitting the text on the query, never by
 * injecting HTML. With nothing found it hands over to EmptySearch. The count
 * sits in a polite live region, so a client-side update is announced once. On
 * a phone the pager shrinks to Previous, "Page 2 of 12" and Next, so it never
 * wraps however many pages there are.
 */
export function SearchResultsList({
  query,
  total,
  filters = [],
  results,
  page = 1,
  pageCount = 1,
  pageHref,
  suggestions = [],
  emptyAction,
  headingLevel = 2,
  linkAs: Link = "a",
  filtersLabel = "Filter results by type",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: SearchResultsListProps) {
  const labels = { ...LABELS, ...custom };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const ResultHeading = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const numbers = new Intl.NumberFormat(locale);
  const noun = (count: number) => (count === 1 ? labels.result : labels.results);
  const pattern = patternOf(query);
  const empty = total === 0 || results.length === 0;
  const showFilters = filters.some((filter) => filter.count > 0);
  // The first filter is the unfiltered one by convention; when another is on, the empty state offers a way back.
  const active = filters.find((filter) => filter.current);
  const first = filters[0];
  const narrowed = active && first && active !== first ? { filter: active, back: first } : null;
  const pages = pageHref && pageCount > 1 ? paginationRange(page, pageCount) : [];
  const pageLine = labels.pageOf.replace("{page}", numbers.format(page)).replace("{pageCount}", numbers.format(pageCount));

  const step = (direction: "previous" | "next") => {
    const target = direction === "previous" ? page - 1 : page + 1;
    const disabled = target < 1 || target > pageCount;
    // The word stays in the DOM as the button's name; below 360px only the chevron is drawn.
    const content = (
      <>
        {direction === "previous" ? <IconChevronLeft size={16} /> : null}
        <span className="max-[359px]:sr-only">{direction === "previous" ? labels.previous : labels.next}</span>
        {direction === "next" ? <IconChevronRight size={16} /> : null}
      </>
    );
    return (
      <PaginationItem>
        <PaginationLink
          asChild
          size="default"
          aria-disabled={disabled || undefined}
          className={cn("gap-1 max-sm:border-border max-sm:bg-background max-[359px]:px-2.5", direction === "previous" ? "pr-3 pl-2" : "pr-2 pl-3")}
        >
          {disabled || !pageHref ? (
            <span role="link">{content}</span>
          ) : (
            <Link href={pageHref(target)} rel={direction === "previous" ? "prev" : "next"}>
              {content}
            </Link>
          )}
        </PaginationLink>
      </PaginationItem>
    );
  };

  return (
    <section data-slot="search-results-list" className={cn("w-full break-words", className)} {...props}>
      <Heading aria-live="polite" aria-atomic="true" className={cn("text-2xl leading-tight font-medium tracking-[-0.03em] [overflow-wrap:anywhere] text-balance sm:text-3xl", empty && "sr-only")}>
        <span className="tabular-nums">{numbers.format(total)}</span> <span className="text-muted-foreground">{noun(total)} {labels.for}</span> <span>“{query}”</span>
      </Heading>

      {showFilters ? (
        <nav aria-label={filtersLabel} className={cn(!empty && "mt-6")}>
          <ul role="list" className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <li key={`${filter.label}-${filter.href}`} className="max-w-full min-w-0">
                <Link
                  href={filter.href}
                  aria-current={filter.current ? "true" : undefined}
                  className={cn(CHIP, filter.current ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-muted")}
                >
                  <span className="min-w-0">{filter.label}</span>
                  <span aria-hidden="true" className={cn("tabular-nums", filter.current ? "text-background/70" : "text-muted-foreground")}>
                    {numbers.format(filter.count)}
                  </span>
                  <span className="sr-only">
                    ({numbers.format(filter.count)} {noun(filter.count)})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {empty ? (
        <EmptySearch
          query={query}
          filters={narrowed ? [narrowed.filter.label] : []}
          suggestions={[...(narrowed ? [{ label: labels.searchAll, href: narrowed.back.href }] : []), ...suggestions]}
          action={emptyAction}
          className="mt-6"
        />
      ) : (
        <ol role="list" className={cn("divide-y divide-border border-y border-border", showFilters ? "mt-8" : "mt-6")}>
          {results.map((result) => (
            <li key={`${result.href}-${result.title}`} className="grid grid-cols-1 gap-x-8 gap-y-3 py-6 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                {result.path?.length ? (
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="sr-only">{labels.path} </span>
                    {result.path.map((segment, index) => (
                      <Fragment key={`${index}-${segment}`}>
                        {index > 0 ? <IconChevronRight aria-hidden="true" className="size-3 opacity-60" /> : null}
                        <span className="min-w-0">{segment}</span>
                      </Fragment>
                    ))}
                  </p>
                ) : null}
                <ResultHeading className={cn("text-lg leading-snug font-medium tracking-[-0.02em] text-balance", result.path?.length ? "mt-1.5" : undefined)}>
                  <Link href={result.href} className="rounded-sm underline decoration-transparent underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
                    {result.title}
                  </Link>
                </ResultHeading>
                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{mark(result.snippet, pattern)}</p>
              </div>
              <p className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                <Badge variant="outline">{result.type}</Badge>
                {result.date ? (
                  <time dateTime={result.date} className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatDate(result.date, locale, timeZone)}
                  </time>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      )}

      {!empty && pages.length ? (
        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="hidden text-sm text-muted-foreground tabular-nums sm:block">{pageLine}</p>
          <Pagination aria-label={labels.pagination} className="mx-0 w-full sm:w-auto">
            <PaginationContent className="w-full justify-between sm:w-auto sm:flex-wrap sm:justify-center">
              {step("previous")}
              <PaginationItem className="sm:hidden">
                <span aria-current="page" className="text-sm text-muted-foreground tabular-nums">
                  {pageLine}
                </span>
              </PaginationItem>
              {pages.map((entry, index) =>
                entry === "ellipsis" ? (
                  <PaginationItem key={`gap-${index}`} className="hidden sm:block">
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={entry} className="hidden sm:block">
                    <PaginationLink asChild isActive={entry === page}>
                      <Link href={pageHref ? pageHref(entry) : "#"} aria-label={labels.page.replace("{page}", numbers.format(entry))}>
                        {numbers.format(entry)}
                      </Link>
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              {step("next")}
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </section>
  );
}
