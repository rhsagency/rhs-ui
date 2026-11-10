import type { ComponentProps, ElementType } from "react";

import { IconArrowRight, IconArrowUpRight, IconCheck } from "@rhs-ui/icons";
import { SitesMenu } from "@rhs-ui/marketing/family-sites-bar/sites-menu";
import { EdgeFadeScroller } from "@rhs-ui/motion/edge-fade-scroller";
import { cn } from "@/lib/utils";

export interface FamilySite {
  /** The site's name, as people say it: "Northwind Coffee". */
  label: string;
  /** Where it lives. Sibling sites open in the same tab, because they belong to one family. */
  href: string;
}

export interface FamilySitesBarLink {
  /** The link text, as it is read: "All Northwind companies". */
  label: string;
  /** Where it goes. */
  href: string;
  /** Opens in a new tab with rel="noopener noreferrer", and says so to a screen reader. For a group home that is not one of the family's own sites. */
  external?: boolean;
}

export interface FamilySitesBarLabels {
  /** The name of the navigation landmark. */
  nav: string;
  /** The text of the button that opens the list of sites below lg. */
  menu: string;
  /** The words that mark the site you are on, for a screen reader beside the link and in plain sight in the list below lg. */
  current: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface FamilySitesBarProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The group, on the left: its name or mark as a link to its home, written the way you want it read: "Part of Northwind". */
  group: { label: string; href: string };
  /** The sibling sites, in the order they show. Include the current one: it is marked, not left out. */
  sites: readonly FamilySite[];
  /** The site this page belongs to, as its href or its label. It is marked with aria-current, weight and an underline, and named to a screen reader. */
  current?: string;
  /** An optional link on the right, usually to the group home: "All Northwind companies". From lg up it sits at the end of the strip; below lg it is the last row of the list. */
  trailing?: FamilySitesBarLink;
  /** Renders the links. Defaults to "a"; pass your router's Link. Sibling sites are usually other domains, which a plain anchor serves best. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FamilySitesBarLabels>;
}

const LABELS: FamilySitesBarLabels = { nav: "Our sites", menu: "Our sites", current: "Current site", newTab: "opens in a new tab" };

const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
/* A label never wraps: a strip that grows a second line is worse than one that scrolls. */
const stripLink = cn("inline-flex min-h-9 items-center rounded-sm whitespace-nowrap transition-colors duration-150 hover:text-foreground motion-reduce:transition-none", focusRing);

/**
 * A slim strip above the header for the businesses that are really several:
 * holding companies, franchises, school faculties, multi-brand shops. The
 * group on the left ("Part of Northwind"), the sibling sites as links with
 * the one you are on marked in weight and an underline and named to a screen
 * reader, and an optional link to the group home on the right. It is one
 * navigation landmark named "Our sites", and sibling links open in the same
 * tab. Every label stays on one line: a list wider than the room it has
 * scrolls sideways with fading edges instead of wrapping. Below lg it keeps
 * to one line too: the group and a button that discloses the sites in a panel
 * under the strip (the current one marked in plain words, the group link
 * last). Calm, not inverted: it holds what is true on every page. The server
 * renders everything but the button's open state and the fade of the list.
 */
export function FamilySitesBar({ group, sites, current, trailing, linkAs: Link = "a", labels: custom, className, ...props }: FamilySitesBarProps) {
  const words = { ...LABELS, ...custom };
  const isCurrent = (site: FamilySite) => current !== undefined && (site.href === current || site.label === current);
  const renderTrailing = (extra: string) =>
    trailing ? (
      trailing.external ? (
        <a href={trailing.href} target="_blank" rel="noopener noreferrer" className={cn(stripLink, "gap-1", extra)}>
          {trailing.label}
          <IconArrowUpRight aria-hidden="true" className="size-3.5" />
          <span className="sr-only"> ({words.newTab})</span>
        </a>
      ) : (
        <Link href={trailing.href} className={cn(stripLink, "gap-1", extra)}>
          {trailing.label}
          <IconArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      )
    ) : null;

  return (
    <nav data-slot="family-sites-bar" aria-label={words.nav} className={cn("relative z-50 border-b border-border bg-muted/50 text-[0.8125rem] text-muted-foreground", className)} {...props}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-x-4">
          {/* Below lg the group is the one thing that may be cut short, with an ellipsis; from lg up it keeps its whole name and the list scrolls instead. */}
          <Link href={group.href} className={cn("block min-w-0 truncate rounded-sm leading-9 font-medium text-foreground transition-colors duration-150 hover:underline hover:decoration-foreground/40 hover:underline-offset-4 motion-reduce:transition-none lg:shrink-0", focusRing)}>
            {group.label}
          </Link>
          {/* The negative margin takes back the first link's padding, so its text sits one gap from the divider. */}
          <span aria-hidden="true" className="-mr-2.5 hidden h-3.5 w-px shrink-0 bg-border lg:block" />
          <EdgeFadeScroller className="hidden flex-1 lg:block">
            <ul className="flex w-max items-center">
              {sites.map((site) => {
                const here = isCurrent(site);
                return (
                  <li key={`${site.label}-${site.href}`}>
                    <Link
                      href={site.href}
                      aria-current={here ? "true" : undefined}
                      className={cn(stripLink, "px-2.5", here && "font-medium text-foreground underline decoration-foreground/50 decoration-1 underline-offset-[0.4em]")}
                    >
                      {site.label}
                      {here ? <span className="sr-only"> ({words.current})</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </EdgeFadeScroller>
        </div>

        <div className="hidden shrink-0 lg:block">{renderTrailing("")}</div>

        <SitesMenu label={words.menu} className="shrink-0 lg:hidden">
          <ul>
            {sites.map((site) => {
              const here = isCurrent(site);
              return (
                <li key={`${site.label}-${site.href}`} className="border-t border-border first:border-t-0">
                  <Link
                    href={site.href}
                    aria-current={here ? "true" : undefined}
                    className={cn("flex min-h-12 items-center justify-between gap-4 px-4 text-sm text-foreground transition-colors duration-150 hover:bg-muted motion-reduce:transition-none sm:px-6", focusRing, "focus-visible:ring-inset", here && "font-medium")}
                  >
                    {site.label}
                    {here ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                        <IconCheck aria-hidden="true" className="size-3.5 text-foreground" />
                        {words.current}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
            {trailing ? <li className="border-t border-border bg-muted/40">{renderTrailing("min-h-12 w-full justify-between px-4 text-sm text-foreground hover:bg-muted sm:px-6 focus-visible:ring-inset")}</li> : null}
          </ul>
        </SitesMenu>
      </div>
    </nav>
  );
}
