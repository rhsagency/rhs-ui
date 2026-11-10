"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

/** One link of the row, drawn three ways by the server half: in the row, as a hidden twin to measure, and as a menu item. */
export interface PriorityNavEntry {
  /** A key for the link, unique among the entries. */
  id: string;
  /** The page being shown: this link is never moved into the menu. */
  current: boolean;
  /** The link as it is drawn in the row. */
  link: ReactNode;
  /** The same box without an address, hidden, so it can be measured without navigating or prefetching anything. */
  probe: ReactNode;
  /** The link as a menu item, for when it does not fit the row. */
  item: ReactNode;
}

export interface PriorityNavRowProps {
  /** Every link, in the order it should read in the row and in the menu. */
  entries: readonly PriorityNavEntry[];
  /** The text of the menu button. */
  moreLabel: string;
  /** The count in the menu button's name, for one link. `{count}` is the number. */
  one: string;
  /** The same for any other number of links. */
  other: string;
  /** The locale the number in the menu button's name is written in. */
  locale: string;
  /** The classes of a link, so the menu button looks like one. */
  moreClassName: string;
}

/** The space between links in the row, in px (gap-1). */
const GAP = 4;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Which links do not fit, by id. The current page is kept first; then links are added in order for as long as they
 * fit, so what stays is the start of the list plus the current page, and what moves keeps its order.
 */
function distribute(entries: readonly PriorityNavEntry[], widths: ReadonlyMap<string, number>, available: number, moreWidth: number): string[] {
  const ids = entries.map((entry) => entry.id);
  const total = (list: readonly string[]) => list.reduce((sum, id) => sum + (widths.get(id) ?? 0), 0) + GAP * Math.max(0, list.length - 1);
  // A hidden or unmeasured container tells nothing: keep everything in the row.
  if (available <= 0 || total(ids) <= available + 0.5) return [];
  const room = available - moreWidth - GAP;
  const kept = new Set<string>();
  const current = entries.find((entry) => entry.current);
  if (current) kept.add(current.id);
  for (const entry of entries) {
    if (kept.has(entry.id)) continue;
    if (total([...kept, entry.id]) > room) break;
    kept.add(entry.id);
  }
  return ids.filter((id) => !kept.has(id));
}

/**
 * The measuring half of Priority nav. It shows the links that fit and a More menu for the rest, and measures hidden
 * twins of every link (never the live row, so it cannot flicker). Every link exists once in the accessibility tree,
 * in the row or in the menu: the twins are hidden from it and cannot take focus.
 */
export function PriorityNavRow({ entries, moreLabel, one, other, locale, moreClassName }: PriorityNavRowProps) {
  const root = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState<readonly string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  // What the measuring reads is kept in a ref, so a new `entries` array on every render does not restart the observers.
  const latest = useRef(entries);
  useEffect(() => {
    latest.current = entries;
  });
  const signature = entries.map((entry) => `${entry.id}:${entry.current ? 1 : 0}`).join("|");

  const measure = useCallback(() => {
    const host = root.current;
    const twins = probe.current;
    if (!host || !twins) return;
    const widths = new Map<string, number>();
    let moreWidth = 0;
    for (const child of Array.from(twins.children)) {
      const width = child.getBoundingClientRect().width;
      const id = (child as HTMLElement).dataset.id;
      if (id === undefined) moreWidth = width;
      else widths.set(id, width);
    }
    const next = distribute(latest.current, widths, host.clientWidth, moreWidth);
    setMoved((previous) => (previous.length === next.length && previous.every((id, index) => id === next[index]) ? previous : next));
  }, []);

  useIsoLayoutEffect(() => {
    const host = root.current;
    const twins = probe.current;
    if (!host || !twins) return;
    measure();
    // The observers answer on the next frame: a change of layout in their own callback ends in "loop completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer.observe(host);
    for (const child of Array.from(twins.children)) observer.observe(child);
    // A web font arriving changes every width.
    void document.fonts?.ready.then(() => measure());
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measure, signature, moreLabel, moreClassName]);

  const inRow = entries.filter((entry) => !moved.includes(entry.id));
  const inMenu = entries.filter((entry) => moved.includes(entry.id));
  // A menu with nothing in it is gone; it must not come back already open the next time something is moved into it.
  const holdsLinks = inMenu.length > 0;
  useEffect(() => {
    if (!holdsLinks) setMenuOpen(false);
  }, [holdsLinks]);
  const countText = (inMenu.length === 1 ? one : other).replace("{count}", numbers.format(inMenu.length));
  const more = (
    <>
      {moreLabel}
      <IconChevronDown className="size-3.5 transition-transform duration-150 group-data-[state=open]/more:rotate-180 motion-reduce:transition-none" />
    </>
  );

  return (
    // With less room than the current page and the menu button need together, the current page gives way (its text is cut) before the button is. Only once there is a menu: before the first measure nothing is in it, and the row just ends at its edge.
    <div
      ref={root}
      data-overflowing={inMenu.length ? "" : undefined}
      className="relative flex min-w-0 items-center gap-1 overflow-hidden data-[overflowing]:[&>[aria-current=page]]:min-w-0 data-[overflowing]:[&>[aria-current=page]]:shrink"
    >

      {inRow.map((entry) => (
        <Fragment key={entry.id}>{entry.link}</Fragment>
      ))}

      {inMenu.length ? (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`${moreLabel}, ${countText}`} className={cn(moreClassName, "group/more cursor-pointer data-[state=open]:text-foreground")}>
              {more}
            </button>
          </DropdownMenuTrigger>
          {/* Choosing a link closes the menu here, not in the menu item: a click that is handled (your router, onNavigate) is default-prevented, and then the item never closes it. */}
          <DropdownMenuContent
            align="end"
            className="min-w-52"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("[role='menuitem']")) setMenuOpen(false);
            }}
          >
            {inMenu.map((entry) => (
              <Fragment key={entry.id}>{entry.item}</Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Hidden twins, one per link and one for the menu button. They are measured and never shown, focused or read. */}
      <div aria-hidden="true" className="pointer-events-none invisible absolute top-0 left-0 h-0 w-0 overflow-hidden">
        <div ref={probe} inert className="flex w-max" style={{ gap: GAP }}>
          {entries.map((entry) => (
            <span key={entry.id} data-id={entry.id} className="flex shrink-0">
              {entry.probe}
            </span>
          ))}
          <span className={cn(moreClassName, "group/more")}>{more}</span>
        </div>
      </div>
    </div>
  );
}
