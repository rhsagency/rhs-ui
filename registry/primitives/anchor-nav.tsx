"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface AnchorNavProps {
  /** Sections on the page, by id. */
  items: readonly { id: string; label: string }[];
  label?: string;
  className?: string;
}

/**
 * A sticky row of in-page links for long pages (a product page, a policy,
 * a pricing page): the section you are in is marked as you scroll, and the
 * row scrolls sideways on a phone with the active link kept in view.
 */
export function AnchorNav({ items, label = "On this page", className }: AnchorNavProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: "-20% 0px -70% 0px" });
    for (const item of items) { const node = document.getElementById(item.id); if (node) observer.observe(node); }
    return () => observer.disconnect();
  }, [items]);
  useEffect(() => {
    document.querySelector(`[data-slot="anchor-nav"] a[href="#${active}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  return (
    <nav data-slot="anchor-nav" aria-label={label} className={cn("sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur", className)}>
      <ul className="relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={item.id === active ? "location" : undefined} onClick={() => setActive(item.id)} className="block border-b-2 border-transparent px-3 py-3 text-sm whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground aria-[current=location]:border-foreground aria-[current=location]:text-foreground">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
