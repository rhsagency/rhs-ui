"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PortfolioProject {
  href: string;
  title: string;
  client: string;
  /** "Branding", "Website": used for the filter. */
  category: string;
  year: string;
  /** The cover; always visible, it only scales on hover. */
  image: ReactNode;
  /** Span two columns on wide screens. */
  wide?: boolean;
}

export interface PortfolioGridProps {
  title: string;
  projects: readonly PortfolioProject[];
  className?: string;
}

/**
 * Selected work for a studio or a freelancer: filter chips by discipline,
 * a grid of covers with title, client and year, and wide projects across two
 * columns. Every card is one link; the filter is a group of toggle buttons
 * with the count announced.
 */
export function PortfolioGrid({ title, projects, className }: PortfolioGridProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const categories = [...new Set(projects.map((p) => p.category))];
  const shown = projects.filter((p) => !filter || p.category === filter);
  const chip = "rounded-full border border-border px-3 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background";
  return (
    <section data-slot="portfolio-grid" className={cn("relative py-16 sm:py-20", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
        <div role="group" aria-label="Discipline" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)} className={chip}>All</button>
          {categories.map((c) => <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)} className={chip}>{c}</button>)}
        </div>
      </div>
      <p role="status" className="sr-only">{shown.length} projects</p>
      <ul className="relative mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((project) => (
          <li key={`${project.href}-${project.title}`} className={cn(project.wide && "lg:col-span-2")}>
            <a href={project.href} className="group block outline-none">
              <span className="block aspect-[4/3] overflow-clip rounded-2xl bg-muted ring-offset-4 ring-offset-background group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50 [&_img]:size-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.03] motion-reduce:[&_img]:transition-none">{project.image}</span>
              <span className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-medium">{project.title}</span>
                <span className="text-sm text-muted-foreground tabular-nums">{project.year}</span>
              </span>
              <span className="text-sm text-muted-foreground">{project.client} · {project.category}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
