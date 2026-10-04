"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DockItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onSelect?: () => void;
  /** A dot under the item: open, running, unread. */
  active?: boolean;
}

export interface DockProps {
  items: readonly DockItem[];
  /** Base size in pixels; items grow up to twice this near the pointer. */
  size?: number;
  label?: string;
  className?: string;
}

/**
 * A row of app icons that swell under the pointer, like a desktop dock.
 * Every item is a real link or button with a tooltip-style label on hover
 * and focus. The magnification only runs for a mouse and without reduced
 * motion; everywhere else it is a tidy toolbar.
 */
export function Dock({ items, size = 44, label = "Dock", className }: DockProps) {
  const row = useRef<HTMLUListElement>(null);
  const [scales, setScales] = useState<number[]>([]);
  // Centres are measured at rest positions (one base size apart), so a growing
  // neighbour never moves the target it is measured against.
  function move(event: PointerEvent<HTMLUListElement>) {
    const list = row.current;
    if (!list || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = list.getBoundingClientRect();
    const gap = 8;
    const first = box.left + 12 + size / 2;
    setScales(items.map((_, index) => {
      const distance = Math.abs(event.clientX - (first + index * (size + gap)));
      return 1 + Math.max(0, 1 - distance / (size * 2.5)) * 0.8;
    }));
  }
  return (
    <nav aria-label={label} data-slot="dock" className={cn("inline-flex", className)}>
      <ul ref={row} onPointerMove={move} onPointerLeave={() => setScales([])} className="flex items-end gap-2 rounded-2xl border border-border bg-background/80 px-3 pt-3 pb-2 shadow-lg backdrop-blur">
        {items.map((item, index) => {
          const scale = scales[index] ?? 1;
          const inner = (
            <>
              <span
                className="flex items-center justify-center rounded-xl border border-border bg-muted transition-[width,height] duration-150 ease-out [&_svg]:size-1/2"
                style={{ width: size * scale, height: size * scale }}
              >
                {item.icon}
              </span>
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity group-hover/dock:opacity-100 group-focus-visible/dock:opacity-100">{item.label}</span>
              <span aria-hidden="true" className={cn("mx-auto mt-1 block size-1 rounded-full", item.active ? "bg-foreground" : "bg-transparent")} />
            </>
          );
          const shared = "group/dock relative flex flex-col items-center rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
          return (
            <li key={item.id}>
              {item.href ? (
                <a href={item.href} aria-label={item.label} className={shared}>{inner}</a>
              ) : (
                <button type="button" aria-label={item.label} onClick={item.onSelect} className={shared}>{inner}</button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
