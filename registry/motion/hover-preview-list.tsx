"use client";

import { useRef, useState, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

export interface HoverPreviewItem {
  id: string;
  title: string;
  /** A short meta column: year, client, discipline. */
  meta?: string;
  href: string;
  image: { src: string; alt: string };
}

export interface HoverPreviewListProps {
  items: readonly HoverPreviewItem[];
  className?: string;
}

/**
 * An editorial index of work: big rows of titles, and an image that follows
 * the pointer for the row under it. Rows are plain links, so keyboard and
 * touch users get the list without the floating preview; the image is
 * decoration with an empty alt on the floating copy.
 */
export function HoverPreviewList({ items, className }: HoverPreviewListProps) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !host.current) return;
    const box = host.current.getBoundingClientRect();
    setPoint({ x: event.clientX - box.left, y: event.clientY - box.top });
  }
  const current = items.find((item) => item.id === active);
  return (
    <div ref={host} data-slot="hover-preview-list" onPointerMove={move} onPointerLeave={() => setActive(null)} className={cn("relative", className)}>
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              onPointerEnter={(event) => event.pointerType === "mouse" && setActive(item.id)}
              className="group flex items-baseline justify-between gap-6 py-6 outline-none focus-visible:bg-muted sm:py-8"
            >
              <span className="text-3xl font-medium tracking-[-.04em] transition-[opacity,transform] duration-300 group-hover:translate-x-2 sm:text-5xl motion-reduce:transition-none">{item.title}</span>
              {item.meta ? <span className="shrink-0 text-sm text-muted-foreground">{item.meta}</span> : null}
            </a>
          </li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute top-0 left-0 z-10 hidden w-64 overflow-hidden rounded-xl shadow-xl transition-opacity duration-200 sm:block motion-reduce:hidden", current ? "opacity-100" : "opacity-0")}
        style={{ transform: `translate(${point.x + 24}px, ${point.y - 80}px)` }}
      >
        {current ? <img src={current.image.src} alt="" className="aspect-[4/3] w-full object-cover" /> : null}
      </div>
    </div>
  );
}
