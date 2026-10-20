"use client";

import { Children, useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconFilter } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface FilterRowLabels {
  /** The search field's accessible name. */
  search: string;
  /** What the empty search field says. */
  placeholder: string;
  /** The button that opens the sheet on a phone, and the sheet's title. */
  filters: string;
  /** The button that clears everything. */
  reset: string;
  /** The button that closes the sheet. */
  done: string;
  /** Under the sheet's title. */
  description: string;
  /** Said politely when the count changes. `{count}` is the number. */
  activeOne: string;
  /** Used for every count but one. */
  activeOther: string;
  /** Used when nothing is active. */
  activeNone: string;
}

const LABELS: FilterRowLabels = {
  search: "Search",
  placeholder: "Search",
  filters: "Filters",
  reset: "Reset",
  done: "Done",
  description: "Narrow the list. It updates as you choose.",
  activeOne: "{count} filter active",
  activeOther: "{count} filters active",
  activeNone: "No filters active",
};

export interface FilterRowProps extends Omit<ComponentProps<"div">, "children" | "onReset"> {
  /** The search text. Controlled. */
  search: string;
  /** Called with the new text on every change, and with "" when the search is cleared. */
  onSearchChange: (value: string) => void;
  /** How many filters are in use, for "Reset 3" and "Filters (3)". Count the search too if Reset should clear it. */
  activeCount: number;
  /** Clears everything the count counts. Reset appears only while the count is above zero. */
  onReset: () => void;
  /** Below this viewport width in pixels the filters fold into one button and a sheet. */
  collapseBelow?: number;
  /** The filters: selects, facet filters, a date range. Keep their values in your state so a reload can restore them. */
  children?: ReactNode;
  /** Your own words, for another language. */
  labels?: Partial<FilterRowLabels>;
}

/** True while the viewport is narrower than `width`. The server has no viewport, so it says false. */
function useBelow(width: number): boolean {
  const query = `(max-width: ${width - 0.02}px)`;
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * One element the filters live in, created once the browser is there. The
 * filters are rendered into it through a portal and the element is moved
 * between the row and the sheet, so they are never remounted and keep their
 * state, an open panel included.
 */
function useHost(): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const element = document.createElement("div");
    element.className = "contents";
    element.dataset.slot = "filter-row-controls";
    setHost(element);
    return () => element.remove();
  }, []);
  return host;
}

const fill = (template: string, count: number): string => template.replace("{count}", String(count));

/**
 * The row of controls above a list: a search field, the filters you pass as
 * children and a Reset button that appears once something is active and counts
 * what is. The row wraps instead of scrolling. On a phone it shrinks to the
 * search field and one "Filters (3)" button that opens the same filters,
 * stacked, in a sheet with Reset and Done at the foot. The controls are the
 * same instances in both places, so they keep their state. A facet filter's
 * button sizes to its picks, so when they change the controls after it make
 * room, and when the row is full the search field gives up width first. The
 * active count is announced politely. Server rendered, it already has the
 * phone's shape at the default 640px, so the page does not jump when it
 * becomes interactive.
 */
export function FilterRow({ search, onSearchChange, activeCount, onReset, collapseBelow = 640, children, labels, className, ...props }: FilterRowProps) {
  const l = { ...LABELS, ...labels };
  const narrow = useBelow(collapseBelow);
  const host = useHost();
  // Until the browser has taken over, the server's markup is all there is, and CSS alone decides between the row and the button.
  const mounted = host !== null;
  const [open, setOpen] = useState(false);
  const hasFilters = Children.toArray(children).length > 0;
  const count = Math.max(0, Math.round(activeCount));

  // Growing past the breakpoint with the sheet open: the filters go back to the row.
  useEffect(() => {
    if (!narrow) setOpen(false);
  }, [narrow]);

  // Where the filters are shown: the row on a wide screen, the open sheet on a narrow one.
  const place = useCallback(
    (slot: HTMLElement | null) => {
      if (slot && host && host.parentElement !== slot) slot.appendChild(host);
    },
    [host],
  );

  const status = count === 0 ? l.activeNone : fill(count === 1 ? l.activeOne : l.activeOther, count);
  const showRow = !mounted || !narrow;

  const filtersLabel = (
    <>
      <IconFilter />
      {l.filters}
      {count > 0 ? (
        <Badge className="tabular-nums">
          {count}
          <span className="sr-only"> active</span>
        </Badge>
      ) : null}
    </>
  );

  return (
    <div data-slot="filter-row" className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      <SearchInput value={search} onValueChange={onSearchChange} aria-label={l.search} placeholder={l.placeholder} className="min-w-[12rem] flex-1 sm:max-w-xs" />

      {/* The row. Before the browser has taken over it holds the filters itself, and a phone's CSS hides it. */}
      {showRow ? (
        <div ref={place} className={cn("contents", !mounted && "max-sm:hidden")}>
          {mounted ? null : children}
        </div>
      ) : null}
      {showRow && count > 0 ? (
        <Button type="button" variant="ghost" onClick={onReset} className={cn(!mounted && "max-sm:hidden")}>
          {l.reset}
          <Badge variant="secondary" className="tabular-nums">
            {count}
            <span className="sr-only"> filters</span>
          </Badge>
        </Button>
      ) : null}

      {/* The phone's button. Before the browser has taken over it is a plain button that only a phone's CSS shows. */}
      {!mounted && hasFilters ? (
        <Button type="button" variant="outline" className="sm:hidden">
          {filtersLabel}
        </Button>
      ) : null}
      {mounted && narrow && hasFilters ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline">
              {filtersLabel}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="gap-0"
            // Focus the sheet itself, not the first filter, so nothing is highlighted before anyone touches it.
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (event.currentTarget as HTMLElement | null)?.focus();
            }}
            // Panels the filters open (a facet list, a date picker) live outside the sheet; using one is not a click outside.
            onInteractOutside={(event) => {
              if (event.target instanceof Element && event.target.closest("[data-radix-popper-content-wrapper]")) event.preventDefault();
            }}
          >
            <SheetHeader className="border-b border-border pr-14">
              <SheetTitle>{l.filters}</SheetTitle>
              <SheetDescription>{l.description}</SheetDescription>
            </SheetHeader>
            <div
              ref={place}
              className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-5 [&>[data-slot=filter-row-controls]>*]:w-full [&_[data-slot=facet-filter]]:justify-start"
            />
            <SheetFooter className="grid grid-cols-2 gap-2 border-t border-border pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <Button type="button" variant="outline" disabled={count === 0} onClick={onReset}>
                {l.reset}
              </Button>
              <SheetClose asChild>
                <Button type="button">{l.done}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : null}

      {host ? createPortal(children, host) : null}

      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
