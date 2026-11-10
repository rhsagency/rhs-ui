import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import type { FooterLink } from "@rhs-ui/marketing/footer-section";
import { cn } from "@/lib/utils";

export interface FooterRowGroup {
  /** The group's heading: "Product", "Company", "Legal". It labels the list of links beside it. */
  label: string;
  /** The links of the group. */
  links: readonly FooterLink[];
}

export interface FooterRowsSocial {
  /** The profile's name in words: "Instagram". It is the accessible name when there is only an icon. */
  label: string;
  /** The profile's address. */
  href: string;
  /** An icon for the profile. Leave it out and the label is set as a text link. */
  icon?: ReactNode;
}

export interface FooterLinkRowsLabels {
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
  /** The name of the list of profiles. */
  social: string;
}

export interface FooterLinkRowsProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your mark. */
  brand: ReactNode;
  /** One or two sentences under the mark. */
  tagline?: string;
  /** Three or four short groups read best; each one becomes a row. */
  groups: readonly FooterRowGroup[];
  /** Profiles, set at the right of the mark. */
  social?: readonly FooterRowsSocial[];
  /** The line at the very bottom: "© 2026 Halcyon Labs B.V." */
  legal: ReactNode;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark, for a site that is not in English or a page with two footers. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterLinkRowsLabels>;
}

const LABELS: FooterLinkRowsLabels = { newTab: "opens in a new tab", social: "Social profiles" };

const linkClass =
  "-my-1 inline-block rounded-sm py-1 text-sm text-muted-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:text-foreground hover:decoration-foreground/40 focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A footer that reads as a calm list: the mark and a line about you on top,
 * then one row per link group, its label on the left and its links inline to
 * the right, divided by hairlines. Three short groups (product, company,
 * legal) stay together instead of floating in three sparse columns, links
 * wrap with no fixed column count, and on a phone each label sits above its
 * links. Each group is a list named by its own heading, all inside one Footer
 * navigation; links that leave the site open in a new tab and say so.
 */
export function FooterLinkRows({ brand, tagline, groups, social = [], legal, linkAs: Link = "a", navLabel = "Footer", labels: custom, className, ...props }: FooterLinkRowsProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();

  return (
    <footer data-slot="footer-link-rows" className={cn("border-t border-border bg-background", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between sm:py-14">
          <div className="grid max-w-sm content-start gap-3">
            <div>{brand}</div>
            {tagline ? <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p> : null}
          </div>
          {social.length ? (
            <ul aria-label={words.social} className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
              {social.map((profile) => (
                <li key={`${profile.label}-${profile.href}`}>
                  {profile.icon ? (
                    <a
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:size-4"
                    >
                      {profile.icon}
                      <span className="sr-only">
                        {profile.label} ({words.newTab})
                      </span>
                    </a>
                  ) : (
                    <a href={profile.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, "inline-flex items-center gap-1")}>
                      {profile.label}
                      <IconArrowUpRight aria-hidden="true" className="size-3" />
                      <span className="sr-only"> ({words.newTab})</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label={navLabel} className="border-t border-border">
          {groups.map((group, index) => (
            <div key={group.label} className="grid gap-x-8 gap-y-3 border-b border-border py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline">
              <h2 id={`${id}-${index}`} className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h2>
              <ul aria-labelledby={`${id}-${index}`} className="flex flex-wrap gap-x-7 gap-y-2.5">
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
        </nav>

        <div className="py-6 text-xs text-muted-foreground">{legal}</div>
      </div>
    </footer>
  );
}
