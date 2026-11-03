"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CollectionSubcollection {
  /** The name on the chip: "Under 50". */
  label: string;
  /** Where the sub-collection lives. */
  href: string;
  /** How many products it holds. Shown after the name, in tabular figures. */
  count?: number;
}

export interface CollectionChipsProps {
  /** The chips, in order. */
  items: readonly CollectionSubcollection[];
  /** The list's accessible name. */
  label: string;
  /** Locale for the counts. */
  locale: string;
  className?: string;
}

/** How wide the soft edge is where more chips wait beyond the frame. */
const FADE = "2rem";

/**
 * The sub-collection chips as a row of links. On a phone the row scrolls
 * sideways and a soft edge shows on whichever side has more chips waiting,
 * and only then, measured again when a web font changes the chips' widths;
 * from sm up the chips wrap and nothing scrolls.
 */
export function CollectionChips({ items, label, locale, className }: CollectionChipsProps) {
  const list = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const number = new Intl.NumberFormat(locale);

  useEffect(() => {
    const node = list.current;
    if (!node) return;
    const measure = () => {
      const travelled = Math.abs(node.scrollLeft);
      const next = { start: travelled > 2, end: travelled < node.scrollWidth - node.clientWidth - 2 };
      setEdges((previous) => (previous.start === next.start && previous.end === next.end ? previous : next));
    };
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    // The chips change width when a web font arrives, but the row itself does not, so the observer stays silent: measure again once the font is in.
    const fonts = document.fonts;
    void fonts?.ready.then(measure);
    fonts?.addEventListener("loadingdone", measure);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, [items]);

  return (
    <nav aria-label={label} data-slot="collection-hero-chips" className={className}>
      <ul
        ref={list}
        style={{ "--fade-start": edges.start ? FADE : "0px", "--fade-end": edges.end ? FADE : "0px" } as CSSProperties}
        className={cn(
          "relative flex gap-2 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start),#000_calc(100%_-_var(--fade-end)),transparent)]",
          "sm:flex-wrap sm:overflow-visible sm:[mask-image:none]",
        )}
      >
        {items.map((item) => (
          <li key={`${item.label}-${item.href}`} className="shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-full px-3.5">
              <a href={item.href}>
                {item.label}
                {item.count === undefined ? null : <span className="font-normal text-muted-foreground tabular-nums">{number.format(item.count)}</span>}
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
