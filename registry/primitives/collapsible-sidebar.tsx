"use client";

import type { ReactNode } from "react";

import { IconSidebar } from "@rhs-ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface SidebarLink {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export interface CollapsibleSidebarProps {
  brand: ReactNode;
  /** The mark alone, for the collapsed rail. */
  mark: ReactNode;
  sections: readonly { title?: string; links: readonly SidebarLink[] }[];
  current: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  footer?: ReactNode;
  className?: string;
}

/**
 * An app sidebar that folds into an icon rail: labels and section titles go,
 * icons stay with their names in tooltips and in the accessible name, and
 * the toggle says which way it goes. The current page is marked with
 * aria-current in both widths.
 */
export function CollapsibleSidebar({ brand, mark, sections, current, collapsed, onCollapsedChange, footer, className }: CollapsibleSidebarProps) {
  return (
    <aside data-slot="collapsible-sidebar" data-collapsed={collapsed || undefined} className={cn("flex h-full flex-col border-r border-border bg-background transition-[width] duration-200 motion-reduce:transition-none", collapsed ? "w-16" : "w-60", className)}>
      <div className={cn("flex items-center gap-2 p-3", collapsed ? "flex-col" : "justify-between")}>
        <span className={cn("flex min-w-0 items-center gap-2 px-1 font-medium [&_svg]:size-5", collapsed && "justify-center")}>{collapsed ? mark : brand}</span>
        <button type="button" onClick={() => onCollapsedChange(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconSidebar /></button>
      </div>
      <nav aria-label="Sidebar" className="relative min-h-0 flex-1 overflow-y-auto px-2">
        {sections.map((section, sectionIndex) => (
          <div key={section.title ?? sectionIndex} className="mt-3 first:mt-0">
            {section.title && !collapsed ? <p className="px-3 pb-1 text-[11px] font-medium tracking-[.1em] text-muted-foreground uppercase">{section.title}</p> : null}
            {section.title && collapsed ? <span aria-hidden="true" className="mx-auto my-2 block h-px w-6 bg-border" /> : null}
            <ul className="grid gap-0.5">
              {section.links.map((link) => {
                const item = (
                  <a href={link.href} aria-current={link.href === current ? "page" : undefined} aria-label={collapsed ? link.label : undefined} className={cn("relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0", collapsed && "justify-center px-0")}>
                    {link.icon}
                    {collapsed ? null : <span className="flex-1 truncate">{link.label}</span>}
                    {link.badge ? (collapsed ? <span className="absolute top-1 right-2 size-2 rounded-full bg-foreground" /> : <span className="rounded-full bg-foreground px-1.5 text-[11px] text-background tabular-nums">{link.badge}</span>) : null}
                  </a>
                );
                return (
                  <li key={`${link.href}-${link.label}`}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{item}</TooltipTrigger>
                        <TooltipContent side="right">{link.label}{link.badge ? ` (${link.badge})` : ""}</TooltipContent>
                      </Tooltip>
                    ) : item}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {footer ? <div className={cn("border-t border-border p-3", collapsed && "flex justify-center")}>{footer}</div> : null}
    </aside>
  );
}
