import type { ComponentProps, ElementType, ReactNode } from "react";

import type { FooterColumn, FooterLink } from "@rhs-ui/marketing/footer-section";
import { RegionPicker } from "@rhs-ui/marketing/footer-region-selector/region-picker";
import { REGION_LABELS, type Region, type RegionLabels, type RegionOptions } from "@rhs-ui/marketing/footer-region-selector/types";
import { cn } from "@/lib/utils";

export type { Region, RegionChoice, RegionLabels, RegionOptions } from "@rhs-ui/marketing/footer-region-selector/types";

export interface FooterRegionSelectorProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your mark. */
  brand: ReactNode;
  /** One or two sentences under the mark. */
  tagline?: string;
  /** The link columns, above the region group. */
  columns: readonly FooterColumn[];
  /** The bottom row, left: "© 2026 Northwind Outdoor". */
  legal: ReactNode;
  /** The bottom row, right: privacy, terms, cookies. */
  legalLinks?: readonly FooterLink[];
  /** The region, when you control it. Pair with onRegionChange. */
  region?: Region;
  /** The region it starts with, when you do not control it. */
  defaultRegion?: Region;
  /** The countries, languages and currencies on offer. */
  options: RegionOptions;
  /** Called with all three codes every time one of the controls changes. Nothing navigates by itself: you switch the site, or store the choice. */
  onRegionChange?: (region: Region) => void;
  /** The language of the country names, in the list and in the summary. */
  locale?: string;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark, for a site that is not in English or a page with two footers. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<RegionLabels>;
}

const linkClass =
  "rounded-sm text-sm text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A footer for a shop or a product that sells in more than one market: link
 * columns above and, under them, a labelled Region group built on the house
 * selects, the searchable country list, the language and the currency. A
 * change calls onRegionChange with the full triple and nothing navigates by
 * itself, and a summary line ("Netherlands, English, EUR") says the current
 * choice in words. On a phone the group becomes one button that opens a dialog
 * with the same three fields, so the footer stays short. Every visible word,
 * the headings and the empty message of the country list included, is in
 * labels, and the country names follow locale. onRegionChange is a function,
 * so use the footer from a Client Component, or pass a Server Action.
 */
export function FooterRegionSelector({
  brand,
  tagline,
  columns,
  legal,
  legalLinks = [],
  region,
  defaultRegion,
  options,
  onRegionChange,
  locale = "en-US",
  linkAs: Link = "a",
  navLabel = "Footer",
  labels: custom,
  className,
  ...props
}: FooterRegionSelectorProps) {
  const words = { ...REGION_LABELS, ...custom };
  const renderLink = (link: FooterLink, extra?: string) =>
    link.external ? (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, extra)}>
        {link.label}
        <span className="sr-only"> ({words.newTab})</span>
      </a>
    ) : (
      <Link href={link.href} className={cn(linkClass, extra)}>
        {link.label}
      </Link>
    );

  return (
    <footer data-slot="footer-region-selector" className={cn("border-t border-border bg-background", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="grid content-start gap-4">
            <div>{brand}</div>
            {tagline ? <p className="max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p> : null}
          </div>
          <nav aria-label={navLabel} className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {columns.map((column) => (
              <div key={column.title} className="grid content-start gap-3">
                <h2 className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">{column.title}</h2>
                <ul className="grid gap-2.5">
                  {column.links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>{renderLink(link)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <RegionPicker className="border-t border-border py-8" region={region} defaultRegion={defaultRegion} options={options} onRegionChange={onRegionChange} locale={locale} labels={words} />

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>{legal}</div>
          {legalLinks.length ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>{renderLink(link, "text-xs")}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
