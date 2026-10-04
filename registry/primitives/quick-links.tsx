import type { ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface QuickLink {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Opens elsewhere: the arrow points out and a hint is read. */
  external?: boolean;
}

export interface QuickLinksProps {
  title?: string;
  links: readonly QuickLink[];
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Shortcuts to where people usually go next: a docs home, an empty
 * dashboard, a help page. Each link is a whole card with an icon, a title
 * and a line, and says when it leaves the site.
 */
export function QuickLinks({ title, links, columns = 2, className }: QuickLinksProps) {
  return (
    <nav data-slot="quick-links" aria-label={title ?? "Quick links"} className={className}>
      {title ? <h3 className="mb-3 text-sm font-medium">{title}</h3> : null}
      <ul className={cn("grid gap-3", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
        {links.map((link) => (
          <li key={`${link.title}-${link.href}`}>
            <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined} className="group flex h-full gap-3 rounded-xl border border-border p-4 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40">
              {link.icon ? <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4">{link.icon}</span> : null}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-medium">{link.title}<IconArrowUpRight aria-hidden="true" className={cn("size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", !link.external && "opacity-0 group-hover:opacity-100")} /></span>
                {link.description ? <span className="mt-0.5 block text-sm text-muted-foreground">{link.description}</span> : null}
                {link.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
