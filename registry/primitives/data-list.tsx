import type { ReactNode } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface DataListItem {
  id: string;
  title: ReactNode;
  /** A second line: who, when, how much. */
  subtitle?: ReactNode;
  /** Leading media: an avatar, an icon, a thumbnail. */
  media?: ReactNode;
  /** Right side: a status badge, an amount. */
  meta?: ReactNode;
  href?: string;
}

export interface DataListProps {
  items: readonly DataListItem[];
  label: string;
  /** Shown when there are no items. */
  empty?: ReactNode;
  className?: string;
}

/**
 * The phone-friendly cousin of a table: one row per record with media, a
 * title and a line, and the important number or status on the right, each
 * row a link with a chevron when there is a detail page. Use it where a
 * table would need sideways scrolling.
 */
export function DataList({ items, label, empty, className }: DataListProps) {
  if (!items.length) return <div data-slot="data-list" className={cn("rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground", className)}>{empty ?? "Nothing here yet."}</div>;
  return (
    <ul data-slot="data-list" aria-label={label} className={cn("divide-y divide-border overflow-clip rounded-2xl border border-border", className)}>
      {items.map((item) => {
        const body = (
          <>
            {item.media ? <span className="shrink-0 [&_img]:size-10 [&_img]:rounded-full">{item.media}</span> : null}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              {item.subtitle ? <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span> : null}
            </span>
            {item.meta ? <span className="shrink-0 text-right text-sm">{item.meta}</span> : null}
            {item.href ? <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
          </>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <a href={item.href} className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/60">{body}</a>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
