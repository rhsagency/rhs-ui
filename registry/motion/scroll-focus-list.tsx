"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ScrollFocusItem {
  /** A stable key. Falls back to the title. */
  id?: string;
  /** The line that names the item. */
  title: string;
  /** A sentence or two under the title. */
  description?: string;
}

export interface ScrollFocusState {
  index: number;
  /** True for the item at the reading line. */
  active: boolean;
}

export interface ScrollFocusListProps extends Omit<ComponentProps<"ol">, "ref" | "children"> {
  /** The rows, in reading order. */
  items: readonly ScrollFocusItem[];
  /** Where the reading line sits, from the top (0) to the bottom (1) of the scroll area. */
  lineAt?: number;
  /** How far the other items step back, 0 to 1. Their text never goes lighter than your muted-foreground, so contrast stays at AA. */
  dim?: number;
  /** Called when a different item reaches the reading line. */
  onActiveChange?: (index: number, item: ScrollFocusItem) => void;
  /** Your own content for an item. The list still owns the state: `aria-current` and `data-active` stay on the row. */
  render?: (item: ScrollFocusItem, state: ScrollFocusState) => ReactNode;
  /** The element to render. Rows are `li`, or `div` when this is `div`. */
  as?: "ol" | "ul" | "div";
}

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return parent;
  }
  return null;
}

const keyOf = (item: ScrollFocusItem): string => item.id ?? item.title;

/**
 * A list read at a line. As the reader scrolls, the item crossing a reading
 * line near the middle of the screen is at full strength and the others step
 * back, for steps, features and long lists. It watches a thin band with an
 * IntersectionObserver, so there is no scroll listener, and the current item
 * carries `aria-current`. Text only steps back as far as your
 * muted-foreground, so it stays readable, and the description of the current
 * item steps up toward your foreground while the rest stay put; without
 * JavaScript, or under reduced motion, no item is dimmed.
 */
export function ScrollFocusList({ items, lineAt = 0.45, dim = 1, onActiveChange, render, as = "ol", className, style, ...props }: ScrollFocusListProps) {
  const Tag = as as "ol";
  const Row = as === "div" ? "div" : "li";
  const list = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const latest = useRef({ items, onActiveChange });
  const signature = items.map(keyOf).join("\u0000");

  useEffect(() => {
    latest.current = { items, onActiveChange };
  });

  useLayoutEffect(() => {
    const element = list.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const root = scrollParent(element);
    const line = Math.min(0.98, Math.max(0.02, lineAt));
    const rows = Array.from(element.children) as HTMLElement[];
    // The row at the reading line, or the nearest one when the line falls in a gap or a jump skipped past rows.
    const pick = (): void => {
      const area = root ? root.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const y = area.top + area.height * line;
      let nearest = 0;
      let gap = Infinity;
      rows.forEach((row, index) => {
        const box = row.getBoundingClientRect();
        const distance = y >= box.top && y <= box.bottom ? 0 : Math.min(Math.abs(y - box.top), Math.abs(y - box.bottom));
        if (distance < gap) {
          gap = distance;
          nearest = index;
        }
      });
      setActive(rows.length ? nearest : null);
    };
    pick();
    // A band one percent of the area tall at the reading line. A row entering or leaving it is the cue to look again.
    const observer = new IntersectionObserver(pick, {
      root,
      rootMargin: `-${(line * 100 - 0.5).toFixed(2)}% 0px -${((1 - line) * 100 - 0.5).toFixed(2)}% 0px`,
      threshold: 0,
    });
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [signature, lineAt]);

  // Only a change of the active row is news; the items array may be rebuilt on every render.
  useEffect(() => {
    if (active === null) return;
    const item = latest.current.items[active];
    if (item) latest.current.onActiveChange?.(active, item);
  }, [active]);

  const vars = { "--rhs-focus-dim": Math.min(1, Math.max(0, dim)) } as CSSProperties;

  return (
    <Tag ref={list} data-slot="scroll-focus-list" role={as === "ol" || as === "ul" ? "list" : undefined} className={cn("relative", className)} style={{ ...vars, ...style }} {...props}>
      {items.map((item, index) => {
        const isActive = active === index;
        return (
          <Row
            key={keyOf(item)}
            data-slot="scroll-focus-item"
            data-active={active === null ? undefined : isActive}
            data-passed={active !== null && index < active ? "" : undefined}
            aria-current={isActive ? "true" : undefined}
            className="group/item relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-5 pb-[var(--rhs-focus-gap,3rem)] last:pb-0"
          >
            {render ? (
              render(item, { index, active: isActive })
            ) : (
              <>
                <div className="relative -mb-[calc(var(--rhs-focus-gap,3rem)-0.5rem)] flex flex-col items-center group-last/item:mb-0" aria-hidden="true">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-medium text-muted-foreground tabular-nums transition-[background-color,border-color,color] duration-300 group-data-[active=true]/item:border-primary group-data-[active=true]/item:bg-primary group-data-[active=true]/item:text-primary-foreground motion-reduce:transition-none">
                    {index + 1}
                  </span>
                  {index < items.length - 1 ? <span className="mt-2 w-px flex-1 bg-border transition-colors duration-300 group-data-[passed]/item:bg-foreground motion-reduce:transition-none" /> : null}
                </div>
                <div className="min-w-0 pt-1">
                  <h3 className="text-lg font-medium tracking-[-0.02em] text-foreground transition-colors duration-300 motion-safe:group-data-[active=false]/item:text-[color:color-mix(in_oklab,var(--foreground),var(--muted-foreground)_calc(var(--rhs-focus-dim)*100%))] motion-reduce:transition-none">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 motion-safe:group-data-[active=true]/item:text-[color:color-mix(in_oklab,var(--muted-foreground),var(--foreground)_calc(var(--rhs-focus-dim)*75%))] motion-reduce:transition-none">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </Row>
        );
      })}
    </Tag>
  );
}
