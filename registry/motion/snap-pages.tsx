"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SnapPage {
  /** The page's anchor. Its dot links to `#id`, so the link works without script and in a new tab. */
  id: string;
  /** A short name: shown beside the dot on hover and focus, and read as the dot's name. */
  title: string;
  /** What the page holds. It fills the screen; content taller than that scrolls normally. */
  content: ReactNode;
  /** Classes for this page's own section, for a background or its alignment. */
  className?: string;
}

export interface SnapPagesProps extends Omit<ComponentProps<"div">, "children"> {
  /** The pages, top to bottom. Each one is as tall as the screen at least and snaps into place as you scroll. */
  pages: readonly SnapPage[];
  /** Show the dot rail on the right. */
  indicator?: boolean;
  /** `mandatory` always settles on a page. `proximity` only snaps when you stop close to one. Reduced motion always uses proximity. */
  snapType?: "mandatory" | "proximity";
  /** Called when another page becomes the current one, not on the first render. */
  onPageChange?: (index: number, page: SnapPage) => void;
  /** Accessible name of the set of pages. */
  label?: string;
  /** Sizes the component; it is one screen tall (`h-dvh`) by default, so give it `h-full` to fill a parent instead. */
  className?: string;
}

/**
 * Full-height pages that settle into place as you scroll, for product stories
 * and walk-throughs. Native CSS scroll snap does the snapping, so it is as
 * smooth as the browser's own scrolling. A dot rail marks the current page and
 * each dot links to its page; Page Up, Page Down, Home and End move between
 * pages. A page taller than the screen scrolls normally before the next
 * page takes over, and reduced motion softens the snap and ends the gliding.
 */
export function SnapPages({ pages, indicator = true, snapType = "mandatory", onPageChange, label = "Pages", className, ...props }: SnapPagesProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const now = useRef(0);
  const frame = useRef(0);
  const notify = useRef({ onPageChange, pages });

  useEffect(() => {
    notify.current = { onPageChange, pages };
  });

  // The current page is the last one whose top is above the middle of the screen, so tall pages work too.
  const sync = useCallback(() => {
    const box = scroller.current;
    if (!box) return;
    const middle = box.scrollTop + box.clientHeight / 2;
    let index = 0;
    sections.current.forEach((section, position) => {
      if (section && section.offsetTop <= middle) index = position;
    });
    if (index === now.current) return;
    now.current = index;
    setCurrent(index);
    const page = notify.current.pages[index];
    if (page) notify.current.onPageChange?.(index, page);
  }, []);

  useEffect(() => {
    const box = scroller.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(box);
    sync();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [sync]);

  // Arriving from below, a page taller than the screen is entered at its end, so the reader carries on upwards.
  const goTo = useCallback((index: number, from: "start" | "end" = "start") => {
    const box = scroller.current;
    const section = sections.current[index];
    if (!box || !section) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = from === "end" ? Math.max(section.offsetTop, section.offsetTop + section.offsetHeight - box.clientHeight) : section.offsetTop;
    box.scrollTo({ top, behavior: still ? "instant" : "smooth" });
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // Typing in a field inside a page must keep its own keys.
    if (event.target !== event.currentTarget && (event.target as HTMLElement).closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
    const box = event.currentTarget;
    const section = sections.current[now.current];
    let next = now.current;
    if (event.key === "PageDown") {
      // A page taller than the screen scrolls normally until its end is in view.
      if (section && section.offsetTop + section.offsetHeight - (box.scrollTop + box.clientHeight) > 4) return;
      next += 1;
    } else if (event.key === "PageUp") {
      if (section && box.scrollTop - section.offsetTop > 4) return;
      next -= 1;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = pages.length - 1;
    else return;
    next = Math.max(0, Math.min(pages.length - 1, next));
    // Nowhere to go: the browser's own key then scrolls within the page.
    if (next === now.current) return;
    event.preventDefault();
    goTo(next, event.key === "PageUp" ? "end" : "start");
  }

  return (
    <div data-slot="snap-pages" className={cn("relative h-dvh", className)} {...props}>
      <div
        ref={scroller}
        role="region"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onScroll={() => {
          if (!frame.current) {
            frame.current = requestAnimationFrame(() => {
              frame.current = 0;
              sync();
            });
          }
        }}
        className={cn(
          "relative h-full snap-y overflow-y-auto scroll-smooth outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:scroll-auto",
          snapType === "mandatory" ? "snap-mandatory motion-reduce:snap-proximity" : "snap-proximity",
        )}
      >
        {pages.map((page, index) => (
          <section
            key={page.id}
            id={page.id}
            ref={(element) => {
              sections.current[index] = element;
            }}
            className={cn("relative min-h-full snap-start snap-always", page.className)}
          >
            {page.content}
          </section>
        ))}
      </div>
      {indicator ? (
        <nav aria-label="Page navigation" className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 sm:right-5">
          <ol className="pointer-events-auto flex flex-col items-center rounded-full border border-foreground/15 bg-background px-0.5 py-1.5 shadow-xs">
            {pages.map((page, index) => (
              <li key={page.id}>
                <a
                  href={`#${page.id}`}
                  aria-label={page.title}
                  aria-current={index === current ? "page" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(index);
                  }}
                  className="group/dot relative grid size-6 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  <span className="block size-1.5 rounded-full bg-foreground/50 transition-[height,background-color] duration-200 group-hover/dot:bg-foreground/80 group-aria-[current=page]/dot:h-4 group-aria-[current=page]/dot:bg-foreground motion-reduce:transition-none" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-full mr-2 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-xs transition-opacity duration-150 group-hover/dot:opacity-100 group-focus-visible/dot:opacity-100 motion-reduce:transition-none"
                  >
                    {page.title}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}
