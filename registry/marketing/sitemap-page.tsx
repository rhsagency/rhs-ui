import type { ComponentProps, ElementType } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface SitemapEntry {
  /** The page's name, or the group's. */
  label: string;
  /** Without one the entry is a group and renders as text, never as a dead link. */
  href?: string;
  /** Pages below this one. At this depth they fold away in a details element. */
  pages?: readonly SitemapEntry[];
  /** Starts the fold open, for the branch that holds the page being read. */
  open?: boolean;
}

export interface SitemapSection {
  /** The section's name: its heading. */
  label: string;
  /** Without one the section heading is plain text. */
  href?: string;
  /** One line about what the section holds. */
  description?: string;
  /** The pages of the section, drawn as a nested list. */
  pages?: readonly SitemapEntry[];
}

export interface SitemapLabels {
  /** The noun after a count of one: "1 page". */
  page: string;
  /** The noun after any other count: "3 pages". */
  pages: string;
  /** Read out between a fold's count and the page it belongs to: "3 pages in Guides". */
  in: string;
}

export interface SitemapPageProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The top-level sections of the site, each drawn as a block. */
  sections: readonly SitemapSection[];
  /** Columns from 1024px up: 3 by default. Tablets get two and phones one. */
  columns?: 1 | 2 | 3 | 4;
  /** Shows each section's one-line description. */
  showDescriptions?: boolean;
  /** The level of each section heading: 2 by default, for a page whose title is an h1. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark. */
  label?: string;
  /** Words for the page counts, for a site that is not in English. */
  labels?: Partial<SitemapLabels>;
}

const LABELS: SitemapLabels = { page: "page", pages: "pages", in: "in" };

const COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

/* Each item draws its own piece of the guide: a vertical hairline for its whole height (down to the tick on the last one) and a short tick at the first line. */
const BRANCH =
  "relative pl-5 before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-border last:before:h-3.5 after:absolute after:top-3.5 after:left-0 after:h-px after:w-3 after:bg-border";
const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
const LINK = cn("inline-block max-w-full rounded-sm text-sm leading-7 text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline motion-reduce:transition-none", FOCUS);
const GROUP = "block text-sm leading-7 font-medium text-foreground";
const SUMMARY = cn(
  "flex w-fit max-w-full cursor-pointer list-none items-center gap-1.5 rounded-sm text-sm leading-7 text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none [&::-webkit-details-marker]:hidden",
  FOCUS,
);

/** The pages that can be visited: a group without a link is not one. */
const countPages = (pages: readonly SitemapEntry[] = []): number => pages.reduce((sum, page) => sum + (page.href ? 1 : 0) + countPages(page.pages), 0);

function PageList({ pages, Link, labels, className }: { pages: readonly SitemapEntry[]; Link: ElementType; labels: SitemapLabels; className?: string }) {
  return (
    <ul role="list" className={className}>
      {pages.map((page) => {
        const children = page.pages ?? [];
        const count = countPages(children);
        const noun = count === 1 ? labels.page : labels.pages;
        // Under a link the fold is indented one level, so "3 pages" reads as that page's own and not as its sibling (the details below).
        return (
          <li key={`${page.label}-${page.href ?? "group"}`} className={BRANCH}>
            {page.href ? (
              <Link href={page.href} className={LINK}>
                {page.label}
              </Link>
            ) : null}
            {children.length ? (
              <details className={cn("group/fold", page.href && "pl-5")} open={page.open}>
                <summary className={cn(SUMMARY, !page.href && "font-medium text-foreground")}>
                  <IconChevronRight aria-hidden="true" className="size-3 shrink-0 transition-transform duration-150 group-open/fold:rotate-90 motion-reduce:transition-none" />
                  {page.href ? (
                    <>
                      {count} {noun}
                      <span className="sr-only"> {labels.in} {page.label}</span>
                    </>
                  ) : (
                    <>
                      {page.label}
                      <span aria-hidden="true" className="text-xs font-normal text-muted-foreground tabular-nums">
                        {count}
                      </span>
                      <span className="sr-only">, {count} {noun}</span>
                    </>
                  )}
                </summary>
                <PageList pages={children} Link={Link} labels={labels} className="pb-1" />
              </details>
            ) : page.href ? null : (
              <span className={GROUP}>{page.label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A human sitemap: every top-level section as a block with its heading as a
 * link, a line about it and its pages as a nested list, with hairline guides
 * that show the levels. The structure is nested lists inside one navigation
 * landmark named Sitemap, so a screen reader announces the levels and the
 * counts; an entry without a page of its own renders as text, not a dead
 * link, and a third level folds under its parent in a details element. It
 * gives people a second way to find a page, which WCAG asks for, and works as
 * an index for anyone lost on a large site.
 */
export function SitemapPage({ sections, columns = 3, showDescriptions = true, headingLevel = 2, linkAs: Link = "a", label = "Sitemap", labels: custom, className, ...props }: SitemapPageProps) {
  const labels = { ...LABELS, ...custom };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <nav data-slot="sitemap-page" aria-label={label} className={cn("w-full break-words", className)} {...props}>
      <ul role="list" className={cn("grid gap-x-12 gap-y-14", COLUMNS[columns])}>
        {sections.map((section) => {
          const total = countPages(section.pages);
          return (
            <li key={`${section.label}-${section.href ?? "section"}`} className="min-w-0 border-t border-border pt-5">
              <Heading className="flex items-baseline justify-between gap-4 text-lg leading-snug font-medium tracking-[-0.02em]">
                {section.href ? (
                  <Link
                    href={section.href}
                    className={cn("min-w-0 rounded-sm underline decoration-foreground/40 underline-offset-4 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none", FOCUS)}
                  >
                    {section.label}
                  </Link>
                ) : (
                  <span className="min-w-0">{section.label}</span>
                )}
                {total ? (
                  <span aria-hidden="true" className="shrink-0 text-xs font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                    {total} {total === 1 ? labels.page : labels.pages}
                  </span>
                ) : null}
              </Heading>
              {showDescriptions && section.description ? <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{section.description}</p> : null}
              {section.pages?.length ? <PageList pages={section.pages} Link={Link} labels={labels} className="mt-4" /> : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
