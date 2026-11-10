"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconAlertCircle, IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  cellText,
  fill,
  nextSort,
  nounFor,
  pagesOf,
  type LookupColumn,
  type LookupPage,
  type LookupQuery,
  type LookupRecord,
  type LookupSort,
  type RecordLookupLabels,
} from "@rhs-ui/application/record-lookup/lookup";
import { Button } from "@rhs-ui/primitives/button";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface RecordLookupPanelProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The columns of the table, in order. The first one is the record's main label unless `labelKey` says otherwise. */
  columns: readonly LookupColumn[];
  /** Asks for one page of records: the search, the page, the page size and the sort. It gets a signal that is aborted when the answer is no longer wanted. */
  loadRows: (query: LookupQuery, signal: AbortSignal) => Promise<LookupPage>;
  /** The record that is chosen now, or `null`. */
  picked: LookupRecord | null;
  /** Called when a row is chosen with its radio button or by clicking it. */
  onPickedChange: (record: LookupRecord) => void;
  /** Called when a row is confirmed: Enter on it, a double click, or Enter in the search field. */
  onConfirm?: (record: LookupRecord) => void;
  /** The name of the table: "Customers". It is in the caption, for a screen reader. */
  title: string;
  /** Rows to a page. Default 8. */
  pageSize?: number;
  /** The key of the column that names a record, for assistive technology. Default the first column. */
  labelKey?: string;
  /** The language of the plural rules. Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: RecordLookupLabels;
  /** Put the cursor in the search field when the panel appears. Default true. */
  autoFocus?: boolean;
}

const RADIO =
  "relative grid size-[18px] shrink-0 cursor-pointer appearance-none place-items-center rounded-full border border-muted-foreground bg-background shadow-xs outline-none transition-[border-color,box-shadow] duration-150 hover:border-foreground checked:border-primary focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 before:size-2 before:scale-0 before:rounded-full before:bg-primary before:transition-transform before:duration-150 checked:before:scale-100 motion-reduce:before:transition-none";

/**
 * What the lookup dialog holds, and usable on its own in a split view: a search
 * field, a table of one page of records with sortable columns and a radio
 * button on each row, and paging. Everything runs through `loadRows`, so the
 * data can stay on the server; each new question aborts the one before and an
 * answer that arrives late is thrown away, so an old response never replaces a
 * new one. Arrow Down in the search field moves into the rows, Enter in the
 * field takes the chosen row or the first result, and the result count is
 * announced politely. The table keeps the room of a whole page, so it does not
 * change height from one answer to the next, and when its container is shorter
 * than that it scrolls inside itself instead of running over the paging.
 */
export function RecordLookupPanel({ columns, loadRows, picked, onPickedChange, onConfirm, title, pageSize = 8, labelKey, locale = "en-US", labels, autoFocus = true, className, ...props }: RecordLookupPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<LookupSort | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<LookupPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [searching, setSearching] = useState(false);
  const load = useRef(loadRows);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load.current = loadRows;
  });

  // What is typed becomes the search when typing pauses, and at once when the field is emptied.
  useEffect(() => {
    if (typed === search) return;
    const timer = window.setTimeout(() => {
      setSearch(typed);
      setPage(1);
    }, typed === "" ? 0 : 250);
    return () => window.clearTimeout(timer);
  }, [typed, search]);

  // Each question aborts the one before it, and an answer to a question that is no longer the latest is dropped even when the loader ignores the signal.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    (async () => {
      try {
        const answer = await load.current({ search, page, pageSize, sort }, controller.signal);
        if (controller.signal.aborted) return;
        setData({ rows: answer.rows, total: answer.total });
      } catch {
        if (controller.signal.aborted) return;
        setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [search, page, pageSize, sort, attempt]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = pagesOf(total, pageSize);

  // A page that no longer exists (the data shrank) steps back to the last one.
  useEffect(() => {
    if (data && page > pages) setPage(pages);
  }, [data, page, pages]);

  const labelColumn = Math.max(0, columns.findIndex((column) => column.key === (labelKey ?? columns[0]?.key)));
  const target = rows.find((row) => row.id === picked?.id) ?? rows[0];
  const from = (page - 1) * pageSize + 1;
  const announced = failed
    ? fill(words.failed, { noun: words.recordOther })
    : loading || !data
      ? ""
      : total === 0
        ? search
          ? fill(words.none, { noun: words.recordOther, query: search })
          : fill(words.empty, { noun: words.recordOther })
        : fill(words.found, { count: total, noun: nounFor(total, words, locale) });

  function confirm(record: LookupRecord) {
    onPickedChange(record);
    onConfirm?.(record);
  }

  function focusRows() {
    const radios = [...(scroller.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [])];
    (radios.find((radio) => radio.checked) ?? radios[0])?.focus();
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRows();
    } else if (event.key === "Enter") {
      event.preventDefault();
      // What is typed has not been asked for yet: ask now, rather than choose from the old results.
      if (typed !== search) {
        setSearch(typed);
        setPage(1);
      } else if (target && !loading) confirm(target);
    }
  }

  const columnCount = columns.length + 1;
  // A width on any column fixes the layout: the columns then keep their places from one answer to the next.
  const fixed = columns.some((column) => column.width !== undefined);
  const back = page > 1;
  const forward = page < pages;

  return (
    <div data-slot="record-lookup-panel" className={cn("flex min-h-0 flex-col gap-3", className)} {...props}>
      <div className="shrink-0 px-4 sm:px-6">
        <SearchInput
          value={typed}
          onValueChange={setTyped}
          placeholder={words.searchPlaceholder}
          aria-label={words.search}
          autoFocus={autoFocus}
          onFocus={() => setSearching(true)}
          onBlur={() => setSearching(false)}
          onKeyDown={onSearchKey}
        />
      </div>

      {/* The table asks for the room of a whole page, so its box keeps one height from answer to answer; when its container has less room than that (a short screen, a small pane) it gives way and scrolls inside itself, and never runs over the paging below it. */}
      <div ref={scroller} aria-busy={loading} data-slot="record-lookup-rows" className="relative min-h-0 shrink grow overflow-y-auto border-y border-border" style={{ flexBasis: `calc(2.5rem + ${pageSize} * 2.75rem)` }}>
        <Table className={cn("min-w-[34rem] transition-opacity duration-150 motion-reduce:transition-none", fixed && "table-fixed", loading && data && "opacity-60")}>
          <TableCaption className="sr-only">{fill(words.caption, { title, page, pages })}</TableCaption>
          {fixed ? (
            <colgroup>
              <col className="w-10 sm:w-12" />
              {columns.map((column) => (
                <col key={column.key} style={column.width ? { width: column.width } : undefined} />
              ))}
            </colgroup>
          ) : null}
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead scope="col" className="w-10 pr-0 pl-4 sm:pl-6">
                <span className="sr-only">{words.choose}</span>
              </TableHead>
              {columns.map((column, index) => (
                <TableHead
                  key={column.key}
                  scope="col"
                  sort={column.sortable === false ? undefined : sort?.key === column.key ? sort.direction : "none"}
                  onSort={column.sortable === false ? undefined : () => {
                    setSort(nextSort(sort, column.key));
                    setPage(1);
                  }}
                  className={cn("text-xs", column.align === "right" && "text-right", index === columns.length - 1 && "pr-4 sm:pr-6")}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data && !failed
              ? Array.from({ length: pageSize }, (_, row) => (
                  <TableRow key={row} className="hover:bg-transparent">
                    <TableCell className="w-10 pr-0 pl-4 sm:pl-6">
                      <Skeleton className="size-[18px] rounded-full" delay={row * 70} />
                    </TableCell>
                    {columns.map((column, index) => (
                      <TableCell key={column.key} className={cn(index === columns.length - 1 && "pr-4 sm:pr-6")}>
                        <Skeleton className={cn("h-4", index === 0 ? "w-3/5" : "w-2/5", column.align === "right" && "ml-auto")} delay={row * 70 + index * 40} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {rows.map((row, at) => {
              const chosen = picked?.id === row.id;
              return (
                <TableRow
                  key={row.id}
                  data-state={chosen ? "selected" : undefined}
                  data-target={searching && target?.id === row.id ? "" : undefined}
                  onClick={() => onPickedChange(row)}
                  onDoubleClick={() => confirm(row)}
                  className="cursor-pointer data-[target]:bg-muted/60"
                >
                  <TableCell className="w-10 pr-0 pl-4 sm:pl-6">
                    <input
                      type="radio"
                      name={`${base}-choice`}
                      value={row.id}
                      checked={chosen}
                      aria-labelledby={`${base}-r${at}`}
                      onChange={() => onPickedChange(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          confirm(row);
                        }
                      }}
                      className={RADIO}
                    />
                  </TableCell>
                  {columns.map((column, index) => (
                    <TableCell
                      key={column.key}
                      id={index === labelColumn ? `${base}-r${at}` : undefined}
                      className={cn("max-w-64 truncate", index === labelColumn ? "font-medium" : "text-muted-foreground", column.align === "right" && "text-right tabular-nums", index === columns.length - 1 && "pr-4 sm:pr-6")}
                    >
                      {cellText(row, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {data && rows.length === 0 && !loading && !failed ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="h-40 text-center text-sm text-muted-foreground">
                  <p>{search ? fill(words.none, { noun: words.recordOther, query: search }) : fill(words.empty, { noun: words.recordOther })}</p>
                  {search ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setTyped("");
                        setSearch("");
                        setPage(1);
                      }}
                      className="mt-1"
                    >
                      {fill(words.clearSearch, { noun: words.recordOther })}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : null}
            {failed ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="h-40 text-center text-sm">
                  <p className="flex items-center justify-center gap-2 font-medium text-destructive">
                    <IconAlertCircle aria-hidden="true" className="size-4 shrink-0" />
                    {fill(words.failed, { noun: words.recordOther })}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((count) => count + 1)} className="mt-3">
                    {words.retry}
                  </Button>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pb-0.5 sm:px-6">
        <p className="flex min-h-8 items-center gap-2 text-xs text-muted-foreground tabular-nums">
          {loading ? <Spinner size={14} label="" aria-hidden="true" /> : null}
          {total > 0 && rows.length > 0 ? fill(words.range, { from, to: from + rows.length - 1, total }) : null}
        </p>
        <div className="flex items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground tabular-nums">{fill(words.page, { page, pages })}</span>
          <Button type="button" variant="outline" size="icon-sm" aria-label={words.previous} aria-disabled={!back || undefined} onClick={() => back && setPage(page - 1)} className="aria-disabled:pointer-events-none aria-disabled:opacity-50">
            <IconChevronLeft aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" aria-label={words.next} aria-disabled={!forward || undefined} onClick={() => forward && setPage(page + 1)} className="aria-disabled:pointer-events-none aria-disabled:opacity-50">
            <IconChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  );
}
