"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, paginationRange } from "@rhs-ui/primitives/pagination";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, type TableSort } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Makes the column sortable by this value. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Hide the column below the md breakpoint. */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowId: (row: T) => string;
  /** Names the table for screen readers; shown under it. */
  caption: string;
  /** Adds a search field that matches rows on this text. */
  searchText?: (row: T) => string;
  selectable?: boolean;
  selected?: readonly string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Rows per page; leave it out to show every row. */
  pageSize?: number;
  /** Buttons that act on the selection, shown above the table while anything is selected. */
  actions?: (ids: string[]) => ReactNode;
  empty?: ReactNode;
  className?: string;
}

/**
 * A table for real data: search, sort by any column that has a sort value,
 * select rows (a header checkbox that reads "some" when some are selected),
 * act on the selection, and page through. It is a real <table> with a
 * caption and aria-sort, so screen readers hear what they see.
 */
export function DataTable<T>({ rows, columns, getRowId, caption, searchText, selectable = false, selected, onSelectedChange, pageSize, actions, empty, className }: DataTableProps<T>) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ id: string; direction: TableSort } | null>(null);
  const [page, setPage] = useState(1);
  const [own, setOwn] = useState<readonly string[]>([]);
  const chosen = selected ?? own;
  const setChosen = (ids: string[]) => {
    if (selected === undefined) setOwn(ids);
    onSelectedChange?.(ids);
  };
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const found = needle && searchText ? rows.filter((row) => searchText(row).toLowerCase().includes(needle)) : [...rows];
    const column = sort && columns.find((item) => item.id === sort.id);
    if (!column?.sortValue || !sort || sort.direction === "none") return found;
    const factor = sort.direction === "ascending" ? 1 : -1;
    return found.sort((a, b) => {
      const x = column.sortValue!(a), y = column.sortValue!(b);
      return factor * (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)));
    });
  }, [rows, columns, query, sort, searchText]);
  const pages = pageSize ? Math.max(1, Math.ceil(visible.length / pageSize)) : 1;
  const current = Math.min(page, pages);
  const shown = pageSize ? visible.slice((current - 1) * pageSize, current * pageSize) : visible;
  const shownIds = shown.map(getRowId);
  const allShown = shownIds.length > 0 && shownIds.every((rowId) => chosen.includes(rowId));
  const someShown = shownIds.some((rowId) => chosen.includes(rowId));
  const toggleSort = (columnId: string) => {
    setSort((previous) => ({ id: columnId, direction: previous?.id !== columnId ? "ascending" : previous.direction === "ascending" ? "descending" : "ascending" }));
    setPage(1);
  };
  return (
    <div data-slot="data-table" className={cn("grid grid-cols-1 gap-3", className)}>
      {searchText || (actions && chosen.length) ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {searchText ? <SearchInput aria-label={`Search ${caption.toLowerCase()}`} placeholder="Search" className="max-w-xs" value={query} onValueChange={(next) => { setQuery(next); setPage(1); }} /> : <span />}
          {actions && chosen.length ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {chosen.length} selected
              </span>
              {actions([...chosen])}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="rounded-lg border border-border">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {selectable ? (
                <TableHead className="pl-3">
                  <Checkbox
                    aria-label="Select all rows on this page"
                    checked={allShown ? true : someShown ? "indeterminate" : false}
                    onCheckedChange={(checked) => setChosen(checked === true ? [...new Set([...chosen, ...shownIds])] : chosen.filter((rowId) => !shownIds.includes(rowId)))}
                  />
                </TableHead>
              ) : null}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  sort={column.sortValue ? (sort?.id === column.id ? sort.direction : "none") : undefined}
                  onSort={column.sortValue ? () => toggleSort(column.id) : undefined}
                  className={cn(column.align === "right" && "text-right [&>button]:ml-auto", column.hideOnMobile && "hidden md:table-cell")}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length ? (
              shown.map((row) => {
                const rowId = getRowId(row);
                const isChosen = chosen.includes(rowId);
                return (
                  <TableRow key={rowId} data-state={isChosen ? "selected" : undefined}>
                    {selectable ? (
                      <TableCell className="pl-3">
                        <Checkbox aria-labelledby={`${id}-${rowId}`} checked={isChosen} onCheckedChange={(checked) => setChosen(checked === true ? [...chosen, rowId] : chosen.filter((item) => item !== rowId))} />
                      </TableCell>
                    ) : null}
                    {columns.map((column, index) => (
                      <TableCell key={column.id} id={index === 0 ? `${id}-${rowId}` : undefined} className={cn(column.align === "right" && "text-right tabular-nums", column.hideOnMobile && "hidden md:table-cell")}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="py-10 text-center text-muted-foreground">
                  {empty ?? (query ? `Nothing matches "${query}".` : "Nothing here yet.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            {(current - 1) * pageSize! + 1}–{Math.min(current * pageSize!, visible.length)} of {visible.length}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" aria-disabled={current === 1 || undefined} tabIndex={current === 1 ? -1 : undefined} onClick={(event) => { event.preventDefault(); setPage(Math.max(1, current - 1)); }} />
              </PaginationItem>
              {paginationRange(current, pages).map((entry, index) => (
                <PaginationItem key={entry === "ellipsis" ? `gap-${index}` : entry}>
                  {entry === "ellipsis" ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={entry === current} onClick={(event) => { event.preventDefault(); setPage(entry); }}>{entry}</PaginationLink>}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" aria-disabled={current === pages || undefined} tabIndex={current === pages ? -1 : undefined} onClick={(event) => { event.preventDefault(); setPage(Math.min(pages, current + 1)); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
