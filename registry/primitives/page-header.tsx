import type { ReactNode } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  /** The title is the page's h1; use "h2" when the header sits inside a page that has one. */
  titleAs?: "h1" | "h2";
  description?: string;
  /** The way back up: Settings / Team. The last item is the current page. */
  breadcrumbs?: readonly { label: string; href?: string }[];
  /** Buttons on the right: the page's main actions. */
  actions?: ReactNode;
  /** Small facts under the title: status, owner, last edited. */
  meta?: ReactNode;
  /** Tabs or filters under the header. */
  children?: ReactNode;
  className?: string;
}

/**
 * The top of an application page: breadcrumbs, the title as the page's h1,
 * a line of description, the main actions, and a slot for tabs. Actions
 * wrap under the title on a phone.
 */
export function PageHeader({ title, titleAs: Title = "h1", description, breadcrumbs = [], actions, meta, children, className }: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={cn("border-b border-border pb-0", className)}>
      {breadcrumbs.length ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? <IconChevronRight aria-hidden="true" className="size-3.5" /> : null}
                {crumb.href && index < breadcrumbs.length - 1 ? <a href={crumb.href} className="hover:text-foreground">{crumb.label}</a> : <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4 pb-6">
        <div className="min-w-0">
          <Title className="text-2xl font-medium tracking-[-0.03em] sm:text-3xl">{title}</Title>
          {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
