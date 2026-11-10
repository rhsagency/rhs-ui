"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconChevronDown, IconChevronRight } from "@rhs-ui/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export interface ArchiveYearProps {
  /** The year as it is written. */
  year: string;
  /** How many posts it holds, as it is written. */
  count: string;
  /** What a screen reader hears after the year: "24 posts". */
  spoken: string;
  /** Whether it starts open. */
  defaultOpen: boolean;
  /** True while the page being shown is in this year: it opens, even if it was shut. */
  current: boolean;
  /** The list of its months. */
  children: ReactNode;
}

/** One year of the archive: a disclosure button with its months folded under it. */
export function ArchiveYear({ year, count, spoken, defaultOpen, current, children }: ArchiveYearProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Following a link into another year opens that year.
  useEffect(() => {
    if (current) setOpen(true);
  }, [current]);
  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <li data-slot="archive-nav-year">
        <CollapsibleTrigger
          className={cn(
            "group/year flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium outline-none",
            "transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
            current ? "text-foreground" : "text-foreground/85",
          )}
        >
          <IconChevronRight size={14} className="shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]/year:rotate-90 motion-reduce:transition-none" />
          <span className="min-w-0 flex-1 truncate tabular-nums">
            {year}
            <span className="sr-only">, {spoken}</span>
          </span>
          <span aria-hidden="true" className="text-xs font-normal text-muted-foreground tabular-nums">
            {count}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </li>
    </Collapsible>
  );
}

export interface ArchiveEarlierProps {
  /** The text of the button while the older years are folded: "Show 4 earlier years". */
  more: string;
  /** The text of the button while they are shown. */
  fewer: string;
  /** True while the page being shown is in one of the older years: they are shown, so the current page is never hidden. */
  holdsCurrent: boolean;
  /** The older years, as list items. */
  children: ReactNode;
}

/**
 * The button after the latest years and, once pressed, the older years after it. The button never moves or
 * remounts, so keyboard focus stays on it and the next Tab goes into the years that appeared.
 */
export function ArchiveEarlier({ more, fewer, holdsCurrent, children }: ArchiveEarlierProps) {
  const [shown, setShown] = useState(holdsCurrent);
  // Following a link into an older year shows the older years.
  useEffect(() => {
    if (holdsCurrent) setShown(true);
  }, [holdsCurrent]);
  return (
    <>
      <li data-slot="archive-nav-earlier">
        <button
          type="button"
          aria-expanded={shown}
          onClick={() => setShown((now) => !now)}
          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          <IconChevronDown size={14} className={cn("shrink-0 transition-transform duration-150 motion-reduce:transition-none", shown && "rotate-180")} />
          {shown ? fewer : more}
        </button>
      </li>
      {shown ? children : null}
    </>
  );
}
