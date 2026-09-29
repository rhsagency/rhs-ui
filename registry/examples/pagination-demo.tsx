"use client";

import { useState } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from "@rhs-ui/primitives/pagination";

const PAGES = 12;

export default function Demo(): React.JSX.Element {
  const [page, setPage] = useState(6);

  // Real pages would be links (href="?page=7"). Here the preview keeps them in state.
  const go = (target: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(PAGES, Math.max(1, target)));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={`?page=${page - 1}`} onClick={go(page - 1)} aria-disabled={page === 1 || undefined} tabIndex={page === 1 ? -1 : undefined} />
          </PaginationItem>
          {paginationRange(page, PAGES).map((entry, index) =>
            entry === "ellipsis" ? (
              <PaginationItem key={`gap-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink href={`?page=${entry}`} isActive={entry === page} onClick={go(entry)}>
                  {entry}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext href={`?page=${page + 1}`} onClick={go(page + 1)} aria-disabled={page === PAGES || undefined} tabIndex={page === PAGES ? -1 : undefined} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Page {page} of {PAGES}
      </p>
    </div>
  );
}
