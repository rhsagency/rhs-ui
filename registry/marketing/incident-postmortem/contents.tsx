"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface PostmortemContentsItem {
  /** The id of the section on the page. */
  id: string;
  /** The link's text, as the section's heading reads. */
  title: string;
}

export interface PostmortemContentsProps {
  /** The sections, in the order they appear on the page. */
  items: readonly PostmortemContentsItem[];
  /** The landmark name, and the small heading above the list. */
  title: string;
  className?: string;
}

/**
 * The contents list of a postmortem, for the side of the page. The section
 * you are in is marked as you scroll: the last section whose top has passed a
 * line 30% down the window, and the final one once the page is scrolled to the
 * bottom, because a short last section never reaches that line. The current
 * link carries aria-current.
 */
export function PostmortemContents({ items, title, className }: PostmortemContentsProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");
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
    <nav data-slot="postmortem-contents" aria-label={title} className={cn("text-sm", className)}>
      <p className="mb-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{title}</p>
      <ol role="list" className="border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === active ? "location" : undefined}
              onClick={() => setActive(item.id)}
              className="-ml-px block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none aria-[current=location]:border-foreground aria-[current=location]:font-medium aria-[current=location]:text-foreground"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
