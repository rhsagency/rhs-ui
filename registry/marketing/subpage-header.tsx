import type { ReactNode } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface SubpageHeaderProps {
  /** The title's element: "h1" (the default) because this header opens an inner page, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  /** The trail to this page; the last item is the page itself and is not a link. */
  breadcrumbs: readonly { label: string; href?: string }[];
  title: string;
  description?: string;
  /** Tabs, filters or a meta line under the description. */
  children?: ReactNode;
  className?: string;
}

/**
 * The quiet header of an inner page (about, a category, a docs section):
 * breadcrumbs, the title, a line of context and an optional row underneath,
 * on a muted band. The page's h1 lives here by default.
 */
export function SubpageHeader({ titleAs: Title = "h1", breadcrumbs, title, description, children, className }: SubpageHeaderProps) {
  return (
    <header data-slot="subpage-header" className={cn("rounded-3xl bg-muted/60 px-6 py-12 sm:px-10 sm:py-16", className)}>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => {
            const last = index === breadcrumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {crumb.href && !last ? <a href={crumb.href} className="hover:text-foreground">{crumb.label}</a> : <span aria-current={last ? "page" : undefined} className={last ? "text-foreground" : undefined}>{crumb.label}</span>}
                {last ? null : <IconChevronRight aria-hidden="true" className="size-3.5" />}
              </li>
            );
          })}
        </ol>
      </nav>
      <Title className="mt-6 text-4xl font-medium tracking-[-.05em] text-balance sm:text-5xl">{title}</Title>
      {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </header>
  );
}
