"use client";

import { IconChevronRight, IconMoreHorizontal } from "@rhs-ui/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbCollapsedProps {
  items: readonly Crumb[];
  /** How many crumbs stay visible at the end, besides the first. */
  keep?: number;
  className?: string;
}

/**
 * A breadcrumb for deep paths: the first crumb and the last few stay, the
 * middle folds into a "…" menu with every hidden level as a link, so a path
 * ten folders deep still fits one line on a phone. The current page is
 * marked with aria-current and is not a link.
 */
export function BreadcrumbCollapsed({ items, keep = 2, className }: BreadcrumbCollapsedProps) {
  const first = items[0];
  const fold = items.length > keep + 2;
  const hidden = fold ? items.slice(1, items.length - keep) : [];
  const tail = fold ? items.slice(items.length - keep) : items.slice(1);
  const crumb = (item: Crumb, last: boolean) =>
    item.href && !last ? <a href={item.href} className="truncate hover:text-foreground">{item.label}</a> : <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "font-medium text-foreground")}>{item.label}</span>;
  const sep = <IconChevronRight aria-hidden="true" className="size-3.5 shrink-0" />;
  if (!first) return null;
  return (
    <nav data-slot="breadcrumb-collapsed" aria-label="Breadcrumb" className={className}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <li className="flex min-w-0 items-center gap-1.5">{crumb(first, items.length === 1)}</li>
        {hidden.length ? (
          <li className="flex items-center gap-1.5">
            {sep}
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={`Show ${hidden.length} more levels`} className="inline-flex size-6 items-center justify-center rounded-md outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"><IconMoreHorizontal className="size-4" /></DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {hidden.map((item) => (
                  <DropdownMenuItem key={`${item.label}-${item.href ?? ""}`} asChild><a href={item.href ?? "#"}>{item.label}</a></DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ) : null}
        {tail.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">{sep}{crumb(item, index === tail.length - 1)}</li>
        ))}
      </ol>
    </nav>
  );
}
