"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface TocItem {
  /** The id of the heading on the page. */
  id: string;
  title: string;
  /** 2 for a section, 3 for a subsection. */
  level: 2 | 3;
}

export interface TableOfContentsProps {
  items: readonly TocItem[];
  title?: string;
  className?: string;
}

/**
 * "On this page" for docs and long articles: the headings as links, the one
 * you are reading marked as you scroll (aria-current), subsections indented.
 * Put it in a sticky aside next to the text.
 */
export function TableOfContents({ items, title = "On this page", className }: TableOfContentsProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.id)).filter((node): node is HTMLElement => Boolean(node));
    if (!headings.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);
  return (
    <nav data-slot="table-of-contents" aria-label={title} className={cn("text-sm", className)}>
      <p className="mb-3 text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{title}</p>
      <ol className="border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === active ? "location" : undefined}
              onClick={() => setActive(item.id)}
              className={cn("-ml-px block border-l-2 border-transparent py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground aria-[current=location]:border-foreground aria-[current=location]:font-medium aria-[current=location]:text-foreground", item.level === 3 ? "pl-6" : "pl-3")}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
