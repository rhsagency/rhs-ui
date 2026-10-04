"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Resource {
  href: string;
  /** "Guide", "Template", "Webinar", "Report". */
  type: string;
  title: string;
  description: string;
  icon?: ReactNode;
}

export interface ResourceLibraryProps {
  title: string;
  description?: string;
  resources: readonly Resource[];
  className?: string;
}

/**
 * A resource centre: guides, templates, webinars and reports in one grid,
 * with chips to filter by type. The chips are toggle buttons (aria-pressed)
 * and the result count is announced when it changes.
 */
export function ResourceLibrary({ title, description, resources, className }: ResourceLibraryProps) {
  const types = [...new Set(resources.map((resource) => resource.type))];
  const [filter, setFilter] = useState<string | null>(null);
  const shown = filter ? resources.filter((resource) => resource.type === filter) : resources;
  const chip = "rounded-full border border-border px-3.5 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background";
  return (
    <section data-slot="resource-library" className={cn("py-16 sm:py-20", className)}>
      <h2 className="text-3xl font-medium tracking-[-.04em]">{title}</h2>
      {description ? <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      <div role="group" aria-label="Filter by type" className="mt-8 flex flex-wrap gap-2">
        <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)} className={chip}>All</button>
        {types.map((type) => (
          <button key={type} type="button" aria-pressed={filter === type} onClick={() => setFilter(type)} className={chip}>{type}</button>
        ))}
      </div>
      <p role="status" className="mt-4 text-xs text-muted-foreground">{shown.length} {shown.length === 1 ? "resource" : "resources"}</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((resource) => (
          <li key={`${resource.href}-${resource.title}`}>
            <a href={resource.href} className="flex h-full flex-col rounded-2xl border border-border p-6 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <span className="flex items-center gap-2 text-xs font-medium tracking-[.1em] text-muted-foreground uppercase [&_svg]:size-4 [&_svg]:text-foreground">{resource.icon}{resource.type}</span>
              <span className="mt-4 font-medium text-balance">{resource.title}</span>
              <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{resource.description}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
