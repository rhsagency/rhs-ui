"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface LoadMoreProps {
  /** How many are shown, and how many exist. */
  shown: number;
  total: number;
  /** Fetch and append the next page; resolve when it is in. */
  onLoadMore: () => Promise<void> | void;
  noun?: string;
  className?: string;
}

/**
 * The calm alternative to infinite scroll: a count of what is shown, a
 * progress line, and one button for the next page. The footer stays
 * reachable, and the new count is announced when the page arrives.
 */
export function LoadMore({ shown, total, onLoadMore, noun = "items", className }: LoadMoreProps) {
  const [busy, setBusy] = useState(false);
  const done = shown >= total;
  return (
    <div data-slot="load-more" className={cn("mx-auto flex max-w-xs flex-col items-center gap-3 py-6 text-center", className)}>
      <p role="status" className="text-sm text-muted-foreground tabular-nums">Showing {Math.min(shown, total)} of {total} {noun}</p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${total ? (Math.min(shown, total) / total) * 100 : 0}%` }} /></div>
      {done ? (
        <p className="text-sm">That is everything.</p>
      ) : (
        <Button variant="outline" loading={busy} onClick={async () => { setBusy(true); try { await onLoadMore(); } finally { setBusy(false); } }}>Load more {noun}</Button>
      )}
    </div>
  );
}
