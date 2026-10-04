"use client";

import { useId } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface PageSizePaginationProps {
  /** 1-based page. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sizes?: readonly number[];
  /** "rows", "orders". */
  noun?: string;
  locale?: string;
  className?: string;
}

/**
 * The footer of a data table: rows per page (the house select), "21 to 40
 * of 312 orders", and previous and next. Changing the page size keeps the
 * first visible row on screen instead of jumping back to page one.
 */
export function PageSizePagination({ page, pageSize, total, onPageChange, onPageSizeChange, sizes = [10, 20, 50, 100], noun = "rows", locale = "en-GB", className }: PageSizePaginationProps) {
  const id = useId();
  const number = new Intl.NumberFormat(locale);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(total, page * pageSize);
  const button = "inline-flex size-8 items-center justify-center rounded-md border border-border outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4";
  return (
    <nav data-slot="page-size-pagination" aria-label="Pagination" className={cn("flex flex-wrap items-center justify-between gap-3 text-sm", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span id={id}>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(next) => { const size = Number(next); onPageSizeChange(size); onPageChange(Math.max(1, Math.floor((first - 1) / size) + 1)); }}>
          <SelectTrigger aria-labelledby={id} className="h-8 w-20"><SelectValue /></SelectTrigger>
          <SelectContent>{sizes.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <p aria-live="polite" className="text-muted-foreground tabular-nums">{number.format(first)} to {number.format(last)} of {number.format(total)} {noun}</p>
      <div className="flex gap-1">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className={button}><IconChevronLeft /></button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pages} aria-label="Next page" className={button}><IconChevronRight /></button>
      </div>
    </nav>
  );
}
