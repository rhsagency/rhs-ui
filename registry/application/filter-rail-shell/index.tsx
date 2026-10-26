"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconChevronDown, IconClose, IconFilter } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { Separator } from "@rhs-ui/primitives/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface FilterGroup {
  id: string;
  /** The group's name on its header: "Brand", "Price". */
  label: string;
  /** How many choices in this group are active; shown next to the name, so a folded group still tells. */
  activeCount?: number;
  /** Starts folded when false. Default true. */
  defaultOpen?: boolean;
  /** The controls of the group: checkboxes, a range slider, anything. They are yours. */
  children: ReactNode;
}

export interface FilterChip {
  id: string;
  /** What the chip says: "Brand: Halcyon". */
  label: string;
  /** Remove this one filter. */
  onRemove: () => void;
}

export interface FilterRailShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The filter groups, as collapsible sections in the rail (and in the sheet below lg). */
  filters: readonly FilterGroup[];
  /** The right end of the results toolbar: a sort select, a view toggle. */
  toolbar?: ReactNode;
  /** The active filters, shown as removable chips above the results. */
  chips?: readonly FilterChip[];
  /** "Clear all": the chips row and the sheet's footer call it. */
  onClearAll?: () => void;
  /** How many results the current filters leave. It is shown, announced politely when it changes, and written on the sheet's button. */
  resultCount: number;
  /** The noun, singular then plural. Default ["result", "results"]. */
  resultNoun?: readonly [string, string];
  /** For the number. Default "en-US". */
  locale?: string;
  /** Whether the filter sheet (below lg) is open. Leave it out to let the shell keep it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The sheet's title and the rail's heading. Default "Filters". */
  title?: string;
  /** The results: your list or grid, and its empty state. */
  children: ReactNode;
}

/**
 * The layout for any list narrowed by filters: a rail of collapsible filter
 * groups beside the results, a toolbar with the count, removable chips for
 * what is active with "Clear all", and below lg a sheet opened from a
 * "Filters (3)" button whose footer says "Show 128 results". Changing a
 * filter announces the new count politely and leaves focus on the control
 * you used: the controls are never remounted, and while the sheet is open
 * the rail's copy is not rendered, so no id or label exists twice. The
 * sheet carries its own live region, because the page behind a modal is
 * hidden from screen readers. Removing a chip moves focus to the next one;
 * "Clear" in the sheet moves it to "Show N results", so it never leaves
 * the dialog. The facets and the results are yours.
 */
export function FilterRailShell({
  filters,
  toolbar,
  chips = [],
  onClearAll,
  resultCount,
  resultNoun = ["result", "results"],
  locale = "en-US",
  open,
  onOpenChange,
  title = "Filters",
  children,
  className,
  ...props
}: FilterRailShellProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const sheetOpen = open ?? innerOpen;
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const [announcement, setAnnouncement] = useState("");
  const results = useRef<HTMLElement>(null);
  const chipRow = useRef<HTMLUListElement>(null);
  const showResults = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<number | null>(null);
  const previousCount = useRef(resultCount);

  const setSheetOpen = (next: boolean) => {
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  // The latest setter, for the media query listener below.
  const closeSheet = useRef(setSheetOpen);
  useEffect(() => {
    closeSheet.current = setSheetOpen;
  });

  const hasFilters = filters.length > 0;
  const formatted = new Intl.NumberFormat(locale).format(resultCount);
  const noun = resultCount === 1 ? resultNoun[0] : resultNoun[1];

  useEffect(() => {
    if (previousCount.current === resultCount) return;
    previousCount.current = resultCount;
    setAnnouncement(`${formatted} ${noun}`);
  }, [resultCount, formatted, noun]);

  // The page and the sheet each have a live region and only one is mounted at a time. The one that mounts next starts empty, so opening or closing the sheet never repeats an old count.
  const [seenOpen, setSeenOpen] = useState(sheetOpen);
  if (seenOpen !== sheetOpen) {
    setSeenOpen(sheetOpen);
    setAnnouncement("");
  }

  // The sheet is for narrow screens: it closes by itself when the rail takes over.
  useEffect(() => {
    const wide = window.matchMedia?.("(min-width: 64rem)");
    if (!wide) return;
    const close = () => {
      if (wide.matches) closeSheet.current(false);
    };
    close();
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);

  // A removed chip takes its focus with it: land on the next chip, or on the results when none is left.
  useEffect(() => {
    const index = focusAfter.current;
    if (index === null) return;
    focusAfter.current = null;
    // Behind the open sheet the results are hidden and inert: focus must stay in the dialog.
    if (sheetOpen) return;
    const removers = chipRow.current?.querySelectorAll<HTMLElement>("[data-chip-remove]");
    const next = removers && removers.length ? removers[Math.min(index, removers.length - 1)] : null;
    (next ?? results.current)?.focus();
  }, [chips.length, sheetOpen]);

  const groups = filters.map((group, index) => {
    const isOpen = !(folded[group.id] ?? group.defaultOpen === false);
    return (
      <div key={group.id}>
        {index > 0 ? <Separator /> : null}
        <Collapsible open={isOpen} onOpenChange={(next) => setFolded((state) => ({ ...state, [group.id]: !next }))}>
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-md py-3 text-left text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <span className="flex items-center gap-2">
              {group.label}
              {group.activeCount ? (
                <Badge variant="secondary" className="h-[1.125rem] min-w-[1.125rem] px-1 text-[0.6875rem] tabular-nums">
                  {group.activeCount}
                  <span className="sr-only"> selected</span>
                </Badge>
              ) : null}
            </span>
            <IconChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-1 pb-4">{group.children}</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  });

  const removeChip = (chip: FilterChip, index: number) => {
    focusAfter.current = index;
    chip.onRemove();
  };
  const clearAll = () => {
    focusAfter.current = 0;
    onClearAll?.();
  };
  // "Clear" is disabled once nothing is left, and a modal has nowhere else to send focus: put it on the button that closes the sheet.
  const clearFromSheet = () => {
    showResults.current?.focus();
    onClearAll?.();
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <div data-slot="filter-rail-shell" className={cn("grid items-start gap-x-10 gap-y-5", hasFilters && "lg:grid-cols-[16rem_minmax(0,1fr)]", className)} {...props}>
        {hasFilters ? (
          // The rail scrolls, so it clips what pokes out of it: 4px of padding on each side (and the matching negative margin, so the controls stay on the edge of the column) leave room for the 3px focus rings.
          <aside
            data-slot="filter-rail-shell-rail"
            aria-label={title}
            className="relative hidden lg:sticky lg:top-[var(--sticky-top,1.5rem)] lg:-ml-1 lg:block lg:max-h-[calc(100dvh_-_var(--sticky-top,1.5rem)_-_1.5rem)] lg:overflow-y-auto lg:px-1"
          >
            <p className="flex h-8 items-center text-sm font-semibold">{title}</p>
            {sheetOpen ? null : groups}
          </aside>
        ) : null}

        <section ref={results} tabIndex={-1} aria-label="Results" data-slot="filter-rail-shell-results" className="min-w-0 outline-none">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            {hasFilters ? (
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="lg:hidden">
                  <IconFilter />
                  {title}
                  {chips.length ? (
                    <span className="text-muted-foreground tabular-nums" aria-hidden="true">
                      ({chips.length})
                    </span>
                  ) : null}
                  {chips.length ? <span className="sr-only">, {chips.length} active</span> : null}
                </Button>
              </SheetTrigger>
            ) : null}
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="font-medium text-foreground">{formatted}</span> {noun}
            </p>
            {toolbar ? <div className="ml-auto flex flex-wrap items-center gap-2">{toolbar}</div> : null}
          </div>

          {chips.length ? (
            <ul ref={chipRow} aria-label="Active filters" className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip, index) => (
                <li key={chip.id}>
                  <span className="inline-flex h-7 items-center rounded-full border border-border bg-muted/50 pl-3 text-[0.8125rem]">
                    {chip.label}
                    <button
                      type="button"
                      data-chip-remove=""
                      aria-label={`Remove filter: ${chip.label}`}
                      onClick={() => removeChip(chip, index)}
                      className="mr-0.5 ml-1 grid size-6 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      <IconClose className="size-3" />
                    </button>
                  </span>
                </li>
              ))}
              {onClearAll ? (
                <li>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={clearAll}>
                    Clear all
                  </Button>
                </li>
              ) : null}
            </ul>
          ) : null}

          <div className="mt-5">{children}</div>
        </section>
        {/* A modal hides the page behind it from screen readers, so the count is announced from the sheet while it is open and from here otherwise. */}
        {sheetOpen ? null : (
          <p role="status" className="sr-only">
            {announcement}
          </p>
        )}
      </div>

      <SheetContent side="left" className="w-80 max-w-[90vw] gap-0 p-0">
        <SheetHeader className="border-b border-border py-4 pr-12 pl-5">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="sr-only">Narrow the list. The button at the bottom shows the results.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
          <div className="px-5 py-1">{groups}</div>
        </ScrollArea>
        <SheetFooter className="flex-row gap-2 border-t border-border p-4">
          <p role="status" className="sr-only">
            {announcement}
          </p>
          <Button ref={showResults} type="button" className="flex-1" onClick={() => setSheetOpen(false)}>
            Show {formatted} {noun}
          </Button>
          <Button type="button" variant="outline" disabled={!chips.length || !onClearAll} onClick={clearFromSheet}>
            Clear
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
