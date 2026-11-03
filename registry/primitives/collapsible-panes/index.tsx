"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";
import { paneCapacity, shownPanes, toggledOpenIds } from "./fold";

export interface CollapsiblePane {
  /** A stable id: what `openIds` lists. */
  id: string;
  /** The title in the header, shown in small capitals: `Outline`, `Timeline`, `Open files`. */
  title: string;
  /** A count after the title, in tabular figures: how many items the pane holds. */
  count?: number | string;
  /** Buttons for the header, as elements: refresh, collapse all, add. They show while the pane is open, and sit beside the toggle, not inside it. */
  actions?: ReactNode;
  /** What the pane holds. It scrolls inside the pane, under the header, when it is taller than the room it gets. */
  content: ReactNode;
}

export interface CollapsiblePanesProps extends Omit<ComponentProps<"div">, "children" | "defaultValue"> {
  /** The panes, top to bottom. */
  panes: readonly CollapsiblePane[];
  /** The ids of the open panes, when you control them. Report changes with `onOpenIdsChange` and pass the new list back. */
  openIds?: readonly string[];
  /** The ids of the panes that start open, when the component keeps the state itself. */
  defaultOpenIds?: readonly string[];
  /** Called with the ids that are open after a pane is opened or closed, in the order they were opened. */
  onOpenIdsChange?: (openIds: string[]) => void;
  /** The least height, in pixels, an open pane gets (the header not counted). When there is not room for every open pane at that height, the ones that cannot have it fold first. Default `120`. */
  minPaneHeight?: number;
  /** Let several panes be open at once and share the height. Off, opening one closes the others. Default `true`. */
  multiple?: boolean;
  /** The level of the pane titles as headings, so they fit the outline of the page. Default `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/** The height of a header row in pixels: what a folded pane takes. */
const HEADER = 32;

/** The layout effect that does not warn on the server, where there is no layout. */
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The side panel of editors and file tools (Outline, Timeline, Open files):
 * stacked panes with a header each (a title, a count, actions), where the
 * open panes divide the height between them and the closed ones fold to their
 * header. A pane's content scrolls inside it while its header stays in view,
 * and closing a pane hands its room to the others with a short transition
 * that reduced motion removes. When there is not room for every open pane at
 * its minimum height, the panes that cannot have it fold first (the last ones,
 * but never the one a person just opened) and open again when there is room.
 * Headers are buttons with `aria-expanded` and `aria-controls` inside
 * headings, the arrow keys, Home and End move between them, the content of an
 * open pane takes focus so the keyboard can scroll it, and the content of a
 * folded pane is inert, so it is neither read nor reached by Tab. Give it a
 * height: it fills its parent. It keeps no state of its own about what is
 * inside the panes, so a tree or a list in one keeps its scroll position and
 * its selection while the pane is folded.
 */
export function CollapsiblePanes({ panes, openIds, defaultOpenIds = [], onOpenIdsChange, minPaneHeight = 120, multiple = true, headingLevel = 3, className, onKeyDown, ref, ...props }: CollapsiblePanesProps) {
  const uid = useId();
  const root = useRef<HTMLDivElement | null>(null);
  // The panes need their own ref to measure the height they have, and the caller may want theirs too.
  const attach = (node: HTMLDivElement | null) => {
    root.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const [ownOpen, setOwnOpen] = useState<readonly string[]>(defaultOpenIds);
  const [height, setHeight] = useState<number | null>(null);
  // The panes a person opened, the latest first: they are the last to fold when there is not room.
  const recent = useRef<string[]>([]);
  const open = openIds ?? ownOpen;

  useBrowserLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const read = () => setHeight(Math.floor(element.clientHeight));
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const ids = panes.map((pane) => pane.id);
  const capacity = paneCapacity(height, panes.length, HEADER, minPaneHeight);
  const shown = shownPanes(ids, open, recent.current, multiple ? capacity : Math.min(1, capacity));

  const toggle = (id: string) => {
    const next = toggledOpenIds(open, shown, id, multiple);
    if (!shown.has(id)) recent.current = [id, ...recent.current.filter((other) => other !== id)];
    if (openIds === undefined) setOwnOpen(next);
    onOpenIdsChange?.(next);
  };

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !(event.target instanceof HTMLElement) || !event.target.matches("[data-pane-toggle]")) return;
    const toggles = [...(root.current?.querySelectorAll<HTMLButtonElement>("[data-pane-toggle]") ?? [])];
    const at = toggles.indexOf(event.target as HTMLButtonElement);
    const last = toggles.length - 1;
    const next = event.key === "ArrowDown" ? (at === last ? 0 : at + 1) : event.key === "ArrowUp" ? (at <= 0 ? last : at - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : -1;
    if (next < 0) return;
    event.preventDefault();
    toggles[next]?.focus();
  };

  const Heading = `h${headingLevel}` as "h3";
  return (
    <div ref={attach} data-slot="collapsible-panes" onKeyDown={move} className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden", className)} {...props}>
      {panes.map((pane, index) => {
        const isOpen = shown.has(pane.id);
        // Open and wanted, but without room: folded for now, and open again as soon as there is room.
        const squeezed = !isOpen && open.includes(pane.id);
        const button = `${uid}-${pane.id}-toggle`;
        const region = `${uid}-${pane.id}-region`;
        return (
          <section
            key={pane.id}
            data-slot="collapsible-pane"
            data-state={isOpen ? "open" : "closed"}
            data-squeezed={squeezed || undefined}
            // The height is shared out by flex-grow, so it animates; a folded pane is its header and no more.
            style={{ flex: isOpen ? "1 1 0px" : "0 0 0px", minHeight: isOpen ? HEADER + Math.max(0, minPaneHeight) : HEADER }}
            className="flex min-h-0 flex-col overflow-hidden transition-[flex-grow,min-height] duration-200 ease-out motion-reduce:transition-none"
          >
            <div data-slot="collapsible-pane-header" style={{ height: HEADER }} className={cn("group/header flex shrink-0 items-center gap-1 px-1", index > 0 && "border-t border-border")}>
              <Heading className="m-0 min-w-0 flex-1 text-[0.8125rem] leading-none font-normal tracking-normal">
                <button
                  type="button"
                  id={button}
                  data-pane-toggle=""
                  aria-expanded={isOpen}
                  aria-controls={region}
                  title={squeezed ? "Not enough room to keep this open with the others" : undefined}
                  onClick={() => toggle(pane.id)}
                  className="flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 text-start outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  <IconChevronRight aria-hidden="true" className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", isOpen && "rotate-90")} />
                  <span className="min-w-0 truncate text-[0.6875rem] font-semibold tracking-[0.06em] text-foreground uppercase">{pane.title}</span>
                  {pane.count !== undefined ? <span className="ms-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-none text-muted-foreground tabular-nums">{pane.count}</span> : null}
                </button>
              </Heading>
              {isOpen && pane.actions ? (
                <div data-slot="collapsible-pane-actions" className="flex shrink-0 items-center gap-0.5">
                  {pane.actions}
                </div>
              ) : null}
            </div>
            <div
              id={region}
              role="region"
              aria-labelledby={button}
              inert={!isOpen}
              // A scroll container with nothing to focus in it is out of reach for a keyboard in some browsers, so an open pane takes focus itself; a folded one is inert.
              tabIndex={isOpen ? 0 : undefined}
              data-slot="collapsible-pane-content"
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]"
            >
              {pane.content}
            </div>
          </section>
        );
      })}
    </div>
  );
}
