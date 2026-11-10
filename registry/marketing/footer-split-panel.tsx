import type { ComponentProps, ElementType, ReactNode } from "react";

import type { FooterColumn, FooterLink } from "@rhs-ui/marketing/footer-section";
import { cn } from "@/lib/utils";

export interface FooterSplitPanelSocial {
  /** The profile's name in words: "Instagram". It is the accessible name of the icon. */
  label: string;
  /** The profile's address. It opens in a new tab and says so. */
  href: string;
  /** The icon, 16px to 20px. */
  icon: ReactNode;
}

export interface FooterSplitPanelLabels {
  /** The name of the list of profiles. */
  social: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface FooterSplitPanelProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your mark, set in the card. It takes the card's colour. */
  brand: ReactNode;
  /** What you want a visitor to remember on the way out, in a sentence or two of inline text. */
  statement: ReactNode;
  /** The one thing to do: a Button, or a link styled as one. The card swaps the theme's colours, so a plain Button is already the right way round on it. */
  action?: ReactNode;
  /** Profiles, as icons at the foot of the card. */
  social?: readonly FooterSplitPanelSocial[];
  /** The link columns beside the card. */
  columns: readonly FooterColumn[];
  /** The bottom row, left: "© 2026 Halcyon Labs B.V." */
  legal: ReactNode;
  /** The bottom row, right: privacy, terms, cookies. */
  legalLinks?: readonly FooterLink[];
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark, for a site that is not in English or a page with two footers. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterSplitPanelLabels>;
}

const LABELS: FooterSplitPanelLabels = { social: "Social profiles", newTab: "opens in a new tab" };

/**
 * The card is the page turned inside out: its ground is the primary colour and its ink the primary-foreground, and inside it those
 * and the neutral tokens swap, so a Button, an outline, a ring and a hairline made for the page read right on it without a class.
 * The pair is captured on the footer first, because a variable cannot be read from the element that redefines it.
 */
const INVERTED = [
  "bg-(--inv-bg) text-(--inv-fg)",
  "[--background:var(--inv-bg)] [--foreground:var(--inv-fg)]",
  "[--card:var(--inv-bg)] [--card-foreground:var(--inv-fg)]",
  "[--primary:var(--inv-fg)] [--primary-foreground:var(--inv-bg)]",
  "[--secondary:color-mix(in_oklab,var(--inv-fg)_14%,var(--inv-bg))] [--secondary-foreground:var(--inv-fg)]",
  "[--muted:color-mix(in_oklab,var(--inv-fg)_12%,var(--inv-bg))] [--muted-foreground:color-mix(in_oklab,var(--inv-fg)_70%,var(--inv-bg))]",
  "[--accent:color-mix(in_oklab,var(--inv-fg)_12%,var(--inv-bg))] [--accent-foreground:var(--inv-fg)]",
  "[--border:color-mix(in_oklab,var(--inv-fg)_22%,var(--inv-bg))] [--input:color-mix(in_oklab,var(--inv-fg)_22%,var(--inv-bg))] [--ring:var(--inv-fg)]",
].join(" ");

const linkClass =
  "rounded-sm text-sm text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A footer in two panels. On the left an inverted card that says the last
 * thing you want a visitor to hear, with one action and the social profiles;
 * on the right the link columns on the plain page; the legal row spans both
 * beneath. The card is the primary pair turned round with a fine hairline set
 * inside its edge, so it reads as part of the page and not as a banner dropped
 * onto it, and anything made for the page (a Button, a ring) is the right way
 * round on it. On a phone the card comes first and the columns follow two
 * across. No state of its own, so it renders on the server.
 */
export function FooterSplitPanel({
  brand,
  statement,
  action,
  social = [],
  columns,
  legal,
  legalLinks = [],
  linkAs: Link = "a",
  navLabel = "Footer",
  labels: custom,
  className,
  ...props
}: FooterSplitPanelProps) {
  const words = { ...LABELS, ...custom };
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
    <footer data-slot="footer-split-panel" className={cn("bg-background [--inv-bg:var(--primary)] [--inv-fg:var(--primary-foreground)]", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <div
            data-slot="footer-split-panel-card"
            className={cn(
              INVERTED,
              "relative flex flex-col justify-between gap-12 overflow-hidden rounded-3xl p-7 sm:p-10",
              // The hairline, set a little inside the edge and rounded to match it.
              "before:pointer-events-none before:absolute before:inset-2 before:rounded-[calc(var(--radius-3xl)-0.5rem)] before:border before:border-(--inv-fg)/18 before:content-['']",
            )}
          >
            <div className="grid content-start gap-8">
              <div>{brand}</div>
              <p className="max-w-md text-[1.75rem] leading-[1.12] font-medium tracking-[-0.04em] text-balance sm:text-[2.125rem]">{statement}</p>
              {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
            </div>
            {social.length ? (
              <ul aria-label={words.social} className="relative flex flex-wrap gap-2">
                {social.map((profile) => (
                  <li key={`${profile.label}-${profile.href}`}>
                    <a
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 motion-reduce:transition-none [&_svg]:size-[1.125rem]"
                    >
                      {profile.icon}
                      <span className="sr-only">
                        {profile.label} ({words.newTab})
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label={navLabel} className="grid grid-cols-2 content-start gap-x-6 gap-y-10 sm:grid-cols-3 lg:pt-3">
            {columns.map((column) => (
              <div key={column.title} className="grid content-start gap-3.5">
                <h2 className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">{column.title}</h2>
                <ul className="grid gap-3">
                  {column.links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>{renderLink(link)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
