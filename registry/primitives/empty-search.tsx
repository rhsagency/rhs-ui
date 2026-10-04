import type { ReactNode } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface EmptySearchProps {
  /** What was searched for. */
  query: string;
  /** Filters that are on, so people see why nothing matched. */
  filters?: readonly string[];
  /** Clear the filters (and keep the query). */
  onClearFilters?: () => void;
  /** Spelling fixes or nearby searches, as links or buttons. */
  suggestions?: readonly { label: string; href: string }[];
  /** A last resort: "Ask support", "Request this". */
  action?: ReactNode;
  className?: string;
}

/**
 * The "no results" state that helps: it repeats what was searched, shows
 * the filters that narrowed it to nothing with one button to clear them,
 * offers close searches, and ends with a way to a human. Announced as a
 * status, so screen reader users hear the outcome of their search.
 */
export function EmptySearch({ query, filters = [], onClearFilters, suggestions = [], action, className }: EmptySearchProps) {
  return (
    <div data-slot="empty-search" role="status" className={cn("mx-auto max-w-md py-12 text-center", className)}>
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-muted [&_svg]:size-5"><IconSearch aria-hidden="true" /></span>
      <p className="mt-4 text-lg font-medium text-balance">No results for “{query}”</p>
      {filters.length ? (
        <div className="mt-3 text-sm text-muted-foreground">
          <p>With these filters on: {filters.join(", ")}.</p>
          {onClearFilters ? <button type="button" onClick={onClearFilters} className="mt-2 font-medium text-foreground underline underline-offset-4">Clear filters and search again</button> : null}
        </div>
      ) : <p className="mt-2 text-sm text-muted-foreground">Check the spelling, or try a broader word.</p>}
      {suggestions.length ? (
        <div className="mt-6">
          <p className="text-xs text-muted-foreground">Try instead</p>
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => <li key={`${suggestion.href}-${suggestion.label}`}><a href={suggestion.href} className="inline-flex rounded-full border border-border px-3 py-1 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">{suggestion.label}</a></li>)}
          </ul>
        </div>
      ) : null}
      {action ? <div className="mt-8 border-t border-border pt-6 text-sm">{action}</div> : null}
    </div>
  );
}
