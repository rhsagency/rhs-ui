"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface TocItem {
  /** The id of the heading on the page. */
  id: string;
  /** The link's text, as the heading reads. */
  title: string;
  /** 2 for a section, 3 for a subsection. */
  level: 2 | 3;
}

export interface OnThisPageProps {
  /** The headings to link to, in the order they appear on the page. */
  items: readonly TocItem[];
  /** The landmark name, and the small heading above the list. */
  title?: string;
  className?: string;
}

/**
 * The "On this page" list of DocsPageLayout. The section you are in is
 * measured from the headings' positions on every scroll frame, so it is right
 * in both directions: the last heading that has passed a line 30% down the
 * window, and the final item once the page is scrolled to the bottom (a short
 * last section never reaches that line, but it is where you are). The current
 * link carries aria-current, and subsections are indented.
 */
export function OnThisPage({ items, title = "On this page", className }: OnThisPageProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const ids = items.map((item) => item.id).join("\n");

  useEffect(() => {
    const known = ids.split("\n");
    let frame = 0;
    const measure = () => {
      frame = 0;
      const headings = known.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
      const first = headings[0];
      if (!first) return;
      const line = window.innerHeight * 0.3;
      let current = first.id;
      for (const heading of headings) if (heading.getBoundingClientRect().top <= line) current = heading.id;
      const last = headings[headings.length - 1];
      const scrolls = document.documentElement.scrollHeight > window.innerHeight + 2;
      if (last && scrolls && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = last.id;
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids]);

  return (
    <nav data-slot="on-this-page" aria-label={title} className={cn("text-sm", className)}>
      <p className="mb-3 text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{title}</p>
      <ol role="list" className="border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === active ? "location" : undefined}
              onClick={() => setActive(item.id)}
              className={cn(
                "-ml-px block border-l-2 border-transparent py-1 text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none aria-[current=location]:border-foreground aria-[current=location]:font-medium aria-[current=location]:text-foreground",
                item.level === 3 ? "pl-6" : "pl-3",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
