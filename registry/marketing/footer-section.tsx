import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FooterLink {
  label: string;
  href: string;
  /** Opens in a new tab with rel="noopener noreferrer". */
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: readonly FooterLink[];
}

export interface FooterSectionProps {
  brand: ReactNode;
  /** One or two sentences under the mark. */
  tagline?: string;
  columns: readonly FooterColumn[];
  /** A slot beside the columns: a newsletter form, a contact block, social links. */
  aside?: ReactNode;
  /** The bottom row, left: "© 2026 Studio North". */
  legal: ReactNode;
  /** The bottom row, right: privacy, terms, cookies. */
  legalLinks?: readonly FooterLink[];
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  className?: string;
}

/**
 * The end of every page: the mark and a line about you, columns of links
 * with a heading each, an optional slot (a newsletter, a contact block), and
 * a legal row. Columns reflow from one to four; the whole footer is one
 * landmark with one navigation inside.
 */
export function FooterSection({ brand, tagline, columns, aside, legal, legalLinks = [], linkAs: Link = "a", className }: FooterSectionProps) {
  const renderLink = (link: FooterLink, className: string) =>
    link.external ? (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ) : (
      <Link href={link.href} className={className}>
        {link.label}
      </Link>
    );
  const linkClass = "rounded-sm text-sm text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40";

  return (
    <footer data-slot="footer-section" className={cn("border-t border-border bg-background", className)}>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16">
        <div className="grid content-start gap-4">
          <div>{brand}</div>
          {tagline ? <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{tagline}</p> : null}
          {aside ? <div className="pt-2">{aside}</div> : null}
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
          {columns.map((column) => (
            <div key={column.title} className="grid content-start gap-3">
              <h2 className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">{column.title}</h2>
              <ul className="grid gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>{renderLink(link, linkClass)}</li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>{legal}</div>
          {legalLinks.length ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>{renderLink(link, cn(linkClass, "text-xs"))}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
