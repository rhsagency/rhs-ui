"use client";

import type { ReactNode } from "react";

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@rhs-ui/primitives/navigation-menu";
import { cn } from "@/lib/utils";

export interface MegaMenuLink {
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
}

export interface MegaMenuSection {
  label: string;
  /** Columns of links, each with an optional heading. */
  columns?: readonly { title?: string; links: readonly MegaMenuLink[] }[];
  /** A highlighted card on the right: a new feature, a case study. */
  featured?: { eyebrow: string; title: string; description: string; href: string; visual?: ReactNode };
  /** A plain link instead of a panel. */
  href?: string;
}

export interface MegaMenuProps {
  sections: readonly MegaMenuSection[];
  className?: string;
}

/**
 * The desktop navigation of a bigger marketing site: top-level items that
 * open wide panels with columns of links (icon, title and a line each) and a
 * featured card, on the house navigation menu, so arrow keys, Escape and the
 * moving viewport come for free. Pair it with the mobile menu below md.
 */
export function MegaMenu({ sections, className }: MegaMenuProps) {
  return (
    <NavigationMenu data-slot="mega-menu" className={cn("hidden md:flex", className)}>
      <NavigationMenuList>
        {sections.map((section) => (
          <NavigationMenuItem key={section.label}>
            {section.href ? (
              <NavigationMenuLink href={section.href} className="inline-flex h-9 items-center rounded-md px-3 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">{section.label}</NavigationMenuLink>
            ) : (
              <>
                <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[min(52rem,calc(100vw-2rem))] gap-6 p-5 lg:grid-cols-[1fr_16rem]">
                    <div className="grid gap-6 sm:grid-cols-2">
                      {section.columns?.map((column, index) => (
                        <div key={column.title ?? index}>
                          {column.title ? <p className="mb-2 px-3 text-xs font-medium tracking-[.1em] text-muted-foreground uppercase">{column.title}</p> : null}
                          <ul className="grid gap-0.5">
                            {column.links.map((link) => (
                              <li key={`${link.href}-${link.label}`}>
                                <NavigationMenuLink href={link.href} className="flex gap-3 rounded-xl p-3 outline-none hover:bg-muted focus-visible:bg-muted">
                                  {link.icon ? <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border [&_svg]:size-4.5">{link.icon}</span> : null}
                                  <span>
                                    <span className="block text-sm font-medium">{link.label}</span>
                                    {link.description ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{link.description}</span> : null}
                                  </span>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {section.featured ? (
                      <NavigationMenuLink href={section.featured.href} className="flex flex-col overflow-clip rounded-2xl bg-muted outline-none hover:bg-muted/80 focus-visible:ring-[3px] focus-visible:ring-ring/40">
                        {section.featured.visual ? <span className="block aspect-[16/10] bg-background/60">{section.featured.visual}</span> : null}
                        <span className="p-4">
                          <span className="block text-xs text-muted-foreground">{section.featured.eyebrow}</span>
                          <span className="mt-1 block text-sm font-medium">{section.featured.title}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{section.featured.description}</span>
                        </span>
                      </NavigationMenuLink>
                    ) : null}
                  </div>
                </NavigationMenuContent>
              </>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
