"use client";

import { useState } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface DocsPage {
  title: string;
  href: string;
  /** "New", "Beta": a small label after the title. */
  badge?: string;
}

export interface DocsSection {
  title: string;
  pages: readonly (DocsPage | { title: string; pages: readonly DocsPage[] })[];
}

export interface DocsSidebarProps {
  sections: readonly DocsSection[];
  /** The href of the page being read. */
  current: string;
  className?: string;
}

const isGroup = (entry: DocsPage | { title: string; pages: readonly DocsPage[] }): entry is { title: string; pages: readonly DocsPage[] } => "pages" in entry;

/**
 * The left column of a documentation site: section titles, pages, and
 * nested groups that fold open, with the current page marked (aria-current)
 * and its group open from the start. A nav landmark with its own name, so
 * it is easy to jump past.
 */
export function DocsSidebar({ sections, current, className }: DocsSidebarProps) {
  const initial = new Set(sections.flatMap((section) => section.pages.filter(isGroup).filter((group) => group.pages.some((page) => page.href === current)).map((group) => group.title)));
  const [open, setOpen] = useState(initial);
  const link = (page: DocsPage) => (
    <a href={page.href} aria-current={page.href === current ? "page" : undefined} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground">
      <span className="truncate">{page.title}</span>
      {page.badge ? <span className="rounded-full border border-border px-1.5 text-[10px] leading-4">{page.badge}</span> : null}
    </a>
  );
  return (
    <nav data-slot="docs-sidebar" aria-label="Documentation" className={cn("grid gap-6 text-sm", className)}>
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-2.5 text-xs font-medium tracking-[.1em] text-foreground uppercase">{section.title}</p>
          <ul className="grid gap-0.5">
            {section.pages.map((entry) => (
              <li key={entry.title}>
                {isGroup(entry) ? (
                  <>
                    <button type="button" aria-expanded={open.has(entry.title)} onClick={() => setOpen((set) => { const next = new Set(set); if (next.has(entry.title)) next.delete(entry.title); else next.add(entry.title); return next; })} className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                      {entry.title}
                      <IconChevronRight aria-hidden="true" className={cn("size-3.5 transition-transform motion-reduce:transition-none", open.has(entry.title) && "rotate-90")} />
                    </button>
                    {open.has(entry.title) ? <ul className="mt-0.5 ml-2.5 grid gap-0.5 border-l border-border pl-2">{entry.pages.map((page) => <li key={`${page.href}-${page.title}`}>{link(page)}</li>)}</ul> : null}
                  </>
                ) : link(entry)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
