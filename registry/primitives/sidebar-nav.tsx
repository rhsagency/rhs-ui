import type { ElementType, ReactNode } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export interface SidebarNavLink {
  href: string;
  label: string;
  icon?: ReactNode;
  /** A count or a short word at the end: "12", "New". */
  badge?: string;
}

export interface SidebarNavGroup {
  label?: string;
  links: readonly SidebarNavLink[];
  /** Makes the group a collapsible section that starts closed unless it holds the current page. */
  collapsible?: boolean;
}

export interface SidebarNavProps {
  groups: readonly SidebarNavGroup[];
  /** The path of the page being shown; its link is marked aria-current="page". */
  currentHref: string;
  /** Your router's link, e.g. Next's Link. A plain <a> by default. */
  linkAs?: ElementType;
  label?: string;
  className?: string;
}

/**
 * The navigation down the side of an app: groups of links with icons and
 * counts, the current page marked for everyone (aria-current), and groups
 * that fold away. It renders links, not a menu, because it navigates.
 */
export function SidebarNav({ groups, currentHref, linkAs: Link = "a", label = "Main", className }: SidebarNavProps) {
  const item = (link: SidebarNavLink) => {
    const current = currentHref === link.href || currentHref.startsWith(`${link.href}/`);
    return (
      <li key={link.href}>
        <Link
          href={link.href}
          aria-current={current ? "page" : undefined}
          className={cn(
            "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4 [&_svg]:shrink-0",
            current ? "bg-background font-medium text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
          )}
        >
          {link.icon}
          <span className="flex-1 truncate">{link.label}</span>
          {link.badge ? <span className="rounded-full bg-muted px-1.5 font-mono text-[0.625rem] tabular-nums text-muted-foreground">{link.badge}</span> : null}
        </Link>
      </li>
    );
  };
  return (
    <nav data-slot="sidebar-nav" aria-label={label} className={cn("grid gap-5", className)}>
      {groups.map((group, index) => {
        const holdsCurrent = group.links.some((link) => currentHref === link.href || currentHref.startsWith(`${link.href}/`));
        if (group.collapsible && group.label) {
          return (
            <Collapsible key={group.label} defaultOpen={holdsCurrent} className="grid gap-1">
              <CollapsibleTrigger className="group flex items-center justify-between rounded-md px-2.5 py-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {group.label}
                <IconChevronRight size={12} className="transition-transform duration-150 group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="grid gap-0.5">{group.links.map(item)}</ul>
              </CollapsibleContent>
            </Collapsible>
          );
        }
        return (
          <div key={group.label ?? index} className="grid gap-1">
            {group.label ? <p className="px-2.5 py-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">{group.label}</p> : null}
            <ul className="grid gap-0.5">{group.links.map(item)}</ul>
          </div>
        );
      })}
    </nav>
  );
}
