"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface CategoryNavItem {
  /** The id of the category's section on the page. */
  id: string;
  title: string;
  /** How many questions it holds. */
  count: number;
}

export interface CategoryNavProps {
  items: readonly CategoryNavItem[];
  /** The landmark name. */
  label?: string;
  /** Read after each count: "questions". */
  countLabel?: string;
  className?: string;
}

/**
 * The category list of an FAQ with question counts. The category you are in
 * follows the scroll and carries aria-current, like the table of contents.
 * From lg up it is a vertical list on a rule that sticks beside the answers;
 * below that it is a row of pills that scrolls sideways and keeps the current
 * one in view.
 */
export function CategoryNav({ items, label = "Categories", countLabel = "questions", className }: CategoryNavProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const list = useRef<HTMLOListElement>(null);
  const ids = items.map((item) => item.id).join("\n");

  useEffect(() => {
    const known = ids.split("\n");
    let frame = 0;
    const measure = () => {
      frame = 0;
      const sections = known.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
      const first = sections[0];
      if (!first) return;
      const line = window.innerHeight * 0.3;
      let current = first.id;
      for (const section of sections) if (section.getBoundingClientRect().top <= line) current = section.id;
      const last = sections[sections.length - 1];
      if (last && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = last.id;
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

  useEffect(() => {
    const row = list.current;
    const current = row?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!row || !current || row.scrollWidth <= row.clientWidth) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
  }, [active]);

  return (
    <nav data-slot="faq-category-nav" aria-label={label} className={cn("min-w-0 lg:sticky lg:top-[var(--sticky-top,6rem)] lg:self-start", className)}>
      <p aria-hidden="true" className="mb-3 hidden text-xs font-medium tracking-[.14em] text-muted-foreground uppercase lg:block">
        {label}
      </p>
      <ol
        ref={list}
        role="list"
        className="relative -m-1 flex gap-2 overflow-x-auto p-1 [scrollbar-width:none] lg:m-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-border lg:p-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              aria-current={item.id === active ? "location" : undefined}
              onClick={() => setActive(item.id)}
              className={cn(
                "flex items-center text-sm whitespace-nowrap outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                "max-lg:gap-2 max-lg:rounded-full max-lg:border max-lg:border-border max-lg:px-3.5 max-lg:py-1.5 max-lg:text-muted-foreground max-lg:hover:border-foreground/30 max-lg:hover:text-foreground max-lg:aria-[current=location]:border-foreground max-lg:aria-[current=location]:bg-foreground max-lg:aria-[current=location]:text-background",
                "lg:-ml-px lg:justify-between lg:gap-4 lg:border-l-2 lg:border-transparent lg:py-1.5 lg:pr-2 lg:pl-4 lg:text-muted-foreground lg:hover:text-foreground lg:aria-[current=location]:border-foreground lg:aria-[current=location]:font-medium lg:aria-[current=location]:text-foreground",
              )}
            >
              {item.title}
              <span aria-hidden="true" className="text-xs tabular-nums opacity-80 lg:opacity-100">
                {item.count}
              </span>
              <span className="sr-only">
                {" "}
                ({item.count} {countLabel})
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
