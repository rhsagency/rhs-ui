import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** A count on the icon. */
  badge?: number;
}

export interface BottomNavProps {
  items: readonly BottomNavItem[];
  /** The href of the current page. */
  current: string;
  label?: string;
  className?: string;
}

/**
 * The tab bar of a mobile web app: three to five destinations with an icon
 * and a word each, fixed to the bottom with room for the home indicator,
 * the current one marked with aria-current. Hidden from md up.
 */
export function BottomNav({ items, current, label = "Main", className }: BottomNavProps) {
  return (
    <nav data-slot="bottom-nav" aria-label={label} className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden", className)}>
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={`${item.href}-${item.label}`}>
              <a href={item.href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground outline-none focus-visible:bg-muted aria-[current=page]:text-foreground">
                <span className="relative [&_svg]:size-5">
                  {item.icon}
                  {item.badge ? <span className="absolute -top-1 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground tabular-nums"><span aria-hidden="true">{item.badge}</span><span className="sr-only">, {item.badge} new</span></span> : null}
                </span>
                <span className={cn(active && "font-medium")}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
