"use client";

import { useId, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ScrollTabs } from "@rhs-ui/primitives/scroll-tabs";
import { cn } from "@/lib/utils";

export interface SearchCategory {
  /** Identity of the category, for your list's key and for `activeCategory`. */
  id: string;
  /** "All", "Shirts", "Trousers", "Accessories". */
  label: string;
  /** How many results the category holds. */
  count: number;
}

export interface SearchResultsHeaderLabels {
  /** The noun after a count of one: "1 result for". */
  result?: string;
  /** The noun after any other count: "42 results for". */
  results?: string;
  /** The word between the count and the query. */
  for?: string;
  /** The heading when nothing was found, before the query. */
  noResults?: string;
  /** Before the corrected search, in the correction line: "Showing results for". */
  showing?: string;
  /** Before the search as typed: "Search instead for". */
  searchInstead?: string;
  /** The caption of the related searches. */
  related?: string;
  /** Names the tabs for a screen reader. */
  categories?: string;
  /** What a screen reader hears when a category is chosen. `{count}`, `{results}` and `{category}`. */
  inCategory?: string;
}

const WORDS = {
  result: "result",
  results: "results",
  for: "for",
  noResults: "No results for",
  showing: "Showing results for",
  searchInstead: "Search instead for",
  related: "Related searches",
  categories: "Narrow the results by category",
  inCategory: "{count} {results} in {category}",
} satisfies Required<SearchResultsHeaderLabels>;

export interface SearchResultsHeaderProps extends Omit<ComponentProps<"header">, "children" | "title"> {
  /** What was typed. It is the heading, unless the shop searched for something else. */
  query: string;
  /** How many results the search found in all, across every category. 0 keeps the heading honest and hides the tabs. */
  total: number;
  /** What the shop searched for when it fixed the query: typed "shrit", searched "shirt". The heading then names this, and a line says so with two links. */
  correctedQuery?: string;
  /** The category tabs, the first one being the unfiltered "All". */
  categories?: readonly SearchCategory[];
  /** The chosen category. Pass it, with `onCategoryChange`, to control it; without it the tabs keep it themselves. */
  activeCategory?: string;
  /** The category to start on when the tabs keep it themselves. Defaults to the first. */
  defaultCategory?: string;
  /** Called with the id of the category that was chosen. */
  onCategoryChange?: (id: string) => void;
  /** Searches to try next, as chips. */
  related?: readonly string[];
  /** Called with the term when a related search or the correction link is followed. Without it the links just navigate. */
  onSearch?: (term: string) => void;
  /** The URL of a search, so the links work as plain links. Defaults to `?q=` plus the term. */
  searchHref?: (term: string) => string;
  /** Beside the related searches, at the end of the row: a sort menu, a view switch. On a phone it gets a row of its own and the whole width, so let it grow. */
  sort?: ReactNode;
  /** The heading's element: "h1" (the default) when this opens the page, "h2" inside a page that has one. */
  headingAs?: "h1" | "h2";
  /** Locale for the numbers. Always passed, so server and browser agree. */
  locale?: string;
  /** The words, for another language. */
  labels?: SearchResultsHeaderLabels;
}

const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
const defaultHref = (term: string): string => `?q=${encodeURIComponent(term)}`;
const FOCUS = "rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * The top of a shop's search results page: the heading that repeats what was searched with the number of
 * results (the page's h1), a line that says when the shop fixed a typo and offers the search as typed, tabs that
 * narrow the results by category with a count each, and related searches as chips beside a slot for sorting.
 * The count is announced politely when it changes. A search that finds nothing keeps the heading honest ("No
 * results for ...") and hides the tabs; the empty-search state belongs to the results area below.
 */
export function SearchResultsHeader({
  query,
  total,
  correctedQuery,
  categories = [],
  activeCategory,
  defaultCategory,
  onCategoryChange,
  related = [],
  onSearch,
  searchHref = defaultHref,
  sort,
  headingAs: Heading = "h1",
  locale = "en-US",
  labels,
  className,
  ...props
}: SearchResultsHeaderProps) {
  const words = { ...WORDS, ...labels };
  const relatedId = useId();
  const [own, setOwn] = useState(defaultCategory ?? categories[0]?.id ?? "");
  const current = activeCategory ?? own;
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const noun = (count: number) => (plural.select(count) === "one" ? words.result : words.results);

  const fixed = correctedQuery !== undefined && correctedQuery !== "" && correctedQuery !== query;
  const searched = fixed ? correctedQuery : query;
  const empty = total === 0;
  const active = categories.find((category) => category.id === current);
  const narrowed = active !== undefined && categories[0] !== undefined && active.id !== categories[0].id;

  const announcement = empty
    ? `${words.noResults} “${searched}”`
    : narrowed
      ? fill(words.inCategory, { count: numbers.format(active.count), results: noun(active.count), category: active.label })
      : `${numbers.format(total)} ${noun(total)} ${words.for} “${searched}”`;

  const follow = (term: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    // A modified click opens a new tab: leave it to the browser.
    if (!onSearch || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onSearch(term);
  };

  return (
    <header data-slot="search-results-header" className={cn("grid grid-cols-[minmax(0,1fr)] gap-6 py-8 sm:py-10", className)} {...props}>
      <div className="grid gap-3">
        <Heading className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance [overflow-wrap:anywhere] sm:text-4xl">
          {empty ? (
            <>
              <span className="text-muted-foreground">{words.noResults}</span> <span>“{searched}”</span>
            </>
          ) : (
            <>
              <span className="tabular-nums">{numbers.format(total)}</span> <span className="text-muted-foreground">{noun(total)} {words.for}</span> <span>“{searched}”</span>
            </>
          )}
        </Heading>
        {fixed ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {words.showing}{" "}
            <a href={searchHref(correctedQuery)} aria-current="true" onClick={follow(correctedQuery)} className={cn(FOCUS, "font-medium text-foreground underline underline-offset-4")}>
              {correctedQuery}
            </a>
            . {words.searchInstead}{" "}
            <a href={searchHref(query)} onClick={follow(query)} className={cn(FOCUS, "font-medium text-foreground underline underline-offset-4 hover:decoration-2")}>
              {query}
            </a>
            .
          </p>
        ) : null}
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>

      {categories.length > 0 && !empty ? (
        <ScrollTabs
          label={words.categories}
          tabs={categories.map((category) => ({ id: category.id, label: category.label, count: category.count }))}
          value={current}
          onValueChange={(id) => {
            setOwn(id);
            onCategoryChange?.(id);
          }}
        />
      ) : null}

      {related.length > 0 || sort ? (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          {related.length > 0 ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <p id={relatedId} className="text-sm text-muted-foreground">
                {words.related}
              </p>
              <ul aria-labelledby={relatedId} className="flex flex-wrap gap-2">
                {related.map((term) => (
                  <li key={term}>
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <a href={searchHref(term)} onClick={follow(term)}>
                        {term}
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {sort ? <div className="w-full sm:ml-auto sm:w-auto sm:shrink-0">{sort}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
