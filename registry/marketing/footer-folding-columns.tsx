import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowUpRight, IconMinus, IconPlus } from "@rhs-ui/icons";
import type { FooterLink } from "@rhs-ui/marketing/footer-section";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export interface FooterColumnGroup {
  /** A sub-heading that groups the links under it. Leave it out for a column of plain links. */
  heading?: string;
  /** The links of the group. */
  links: readonly FooterLink[];
}

export interface FooterFoldingColumn {
  /** The column's title: "Product", "Developers". It is the heading from md up and the button below it. */
  title: string;
  /** The links of the column, in groups. */
  groups: readonly FooterColumnGroup[];
}

export interface FooterFoldingSocial {
  /** The profile's name in words: "GitHub". It is the accessible name of the icon. */
  label: string;
  /** The profile's address. */
  href: string;
  /** An icon for the profile. Leave it out and the label is set as a text link. */
  icon?: ReactNode;
}

export interface FooterFoldingColumnsLabels {
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
  /** The name of the list of profiles. */
  social: string;
  /** The name of the list of legal links. */
  legal: string;
}

export interface FooterFoldingColumnsProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your mark. */
  brand: ReactNode;
  /** One or two sentences under the mark. */
  tagline?: string;
  /** Up to six columns. */
  columns: readonly FooterFoldingColumn[];
  /** Profiles, in the bar at the bottom. */
  social?: readonly FooterFoldingSocial[];
  /** A slot beside the mark: a newsletter form, a status link. */
  aside?: ReactNode;
  /** The bottom bar, left: "© 2026 Meridian Cloud, Inc." */
  legal: ReactNode;
  /** The bottom bar, next to the legal line: privacy, terms, cookies. */
  legalLinks?: readonly FooterLink[];
  /** Titles of the columns that start open on a phone. None by default. */
  defaultOpen?: readonly string[];
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark, for a site that is not in English or a page with two footers. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterFoldingColumnsLabels>;
}

const LABELS: FooterFoldingColumnsLabels = { newTab: "opens in a new tab", social: "Social profiles", legal: "Legal" };

const linkClass =
  "-my-1 inline-block rounded-sm py-1 text-sm text-muted-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:text-foreground hover:decoration-foreground/40 focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A footer for a site with a lot to say: up to six columns of links, each
 * with a heading and optional sub-headings that group what is under it, and
 * a bar for social profiles and legal links. From md up everything is
 * visible. On a phone every column folds into a row with a plus or a minus
 * and opens in place, so a sitemap of dozens of links stays one screen tall.
 * The desktop heading and the phone button are separate elements, so
 * neither borrows the other's semantics, and the links are in the page
 * either way, closed or not, for search engines and for print. Columns
 * animate their height and snap open for a reader who asked for less motion.
 */
export function FooterFoldingColumns({ brand, tagline, columns, social = [], aside, legal, legalLinks = [], defaultOpen = [], linkAs: Link = "a", navLabel = "Footer", labels: custom, className, ...props }: FooterFoldingColumnsProps) {
  const words = { ...LABELS, ...custom };
  const open = new Set(defaultOpen);

  return (
    <footer data-slot="footer-folding-columns" className={cn("border-t border-border bg-background", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between md:py-14">
          <div className="grid max-w-xs content-start gap-3">
            <div>{brand}</div>
            {tagline ? <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p> : null}
          </div>
          {aside ? <div className="w-full md:max-w-sm">{aside}</div> : null}
        </div>

        {/* From lg the columns share the row as they fit: six need 6 x 8rem and five gaps of 1.5rem, 888px, so none is left alone on a second row. */}
        <nav aria-label={navLabel} className="grid border-t border-border md:grid-cols-3 md:gap-x-8 md:gap-y-12 md:border-t-0 md:pb-14 lg:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] lg:gap-x-6">
          {columns.map((column) => (
            <Collapsible key={column.title} defaultOpen={open.has(column.title)} className="group/column border-b border-border last:border-b-0 md:border-b-0">
              <h2 className="hidden pb-4 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase md:block">{column.title}</h2>
              <h2 className="md:hidden">
                <CollapsibleTrigger className="group/trigger -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-md px-2 py-4 text-left text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
                  {column.title}
                  <span aria-hidden="true" className="relative size-4 shrink-0 text-muted-foreground">
                    <IconPlus className="absolute inset-0 size-4 transition-[opacity,transform] duration-200 group-data-[state=open]/trigger:rotate-90 group-data-[state=open]/trigger:opacity-0 motion-reduce:transition-none" />
                    <IconMinus className="absolute inset-0 size-4 -rotate-90 opacity-0 transition-[opacity,transform] duration-200 group-data-[state=open]/trigger:rotate-0 group-data-[state=open]/trigger:opacity-100 motion-reduce:transition-none" />
                  </span>
                </CollapsibleTrigger>
              </h2>
              {/* Kept mounted so the links are always in the page. The height is animated on the inner grid, which a transition can reach, and Radix's own animation is switched off. */}
              <CollapsibleContent forceMount style={{ animation: "none" }}>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none",
                    "group-data-[state=closed]/column:invisible group-data-[state=closed]/column:grid-rows-[0fr] group-data-[state=open]/column:grid-rows-[1fr]",
                    "md:group-data-[state=closed]/column:visible md:group-data-[state=closed]/column:grid-rows-[1fr]",
                    "print:group-data-[state=closed]/column:visible print:group-data-[state=closed]/column:grid-rows-[1fr]",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="grid gap-6 pb-5 md:pb-0">
                      {column.groups.map((group, index) => (
                        <div key={`${group.heading ?? "links"}-${index}`} className="grid content-start gap-2.5">
                          {group.heading ? <h3 className="text-xs font-medium text-foreground">{group.heading}</h3> : null}
                          <ul className="grid gap-2.5">
                            {group.links.map((link) => (
                              <li key={`${link.label}-${link.href}`}>
                                {link.external ? (
                                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, "inline-flex items-center gap-1")}>
                                    {link.label}
                                    <IconArrowUpRight aria-hidden="true" className="size-3" />
                                    <span className="sr-only"> ({words.newTab})</span>
                                  </a>
                                ) : (
                                  <Link href={link.href} className={linkClass}>
                                    {link.label}
                                  </Link>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>

        <div className="flex flex-col gap-5 border-t border-border py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <div>{legal}</div>
            {legalLinks.length ? (
              <ul aria-label={words.legal} className="flex flex-wrap gap-x-5 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, "text-xs")}>
                        {link.label}
                        <span className="sr-only"> ({words.newTab})</span>
                      </a>
                    ) : (
                      <Link href={link.href} className={cn(linkClass, "text-xs")}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {social.length ? (
            <ul aria-label={words.social} className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {social.map((profile) => (
                <li key={`${profile.label}-${profile.href}`}>
                  {profile.icon ? (
                    <a
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:size-4"
                    >
                      {profile.icon}
                      <span className="sr-only">
                        {profile.label} ({words.newTab})
                      </span>
                    </a>
                  ) : (
                    <a href={profile.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, "text-xs")}>
                      {profile.label}
                      <span className="sr-only"> ({words.newTab})</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
