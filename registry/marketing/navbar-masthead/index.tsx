import type { ComponentProps, ElementType, ReactNode } from "react";

import { SectionsRow } from "@rhs-ui/marketing/navbar-masthead/sections-row";
import { cn } from "@/lib/utils";

export interface MastheadSection {
  /** The section's name: "Business". */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface NavbarMastheadProps extends Omit<ComponentProps<"header">, "children"> {
  /** The publication's name, set large and centred: a string, or your own wordmark. */
  name: ReactNode;
  /** Where the name links, usually "/". Leave it out and the name is plain text, for when your wordmark is already a link. */
  nameHref?: string;
  /** The date in the top line: a Date, a timestamp or an ISO string. A date-only string such as "2026-11-10" is a calendar date and never shifts with the time zone. Pass today's date from the server, and the browser prints the same. */
  date?: Date | string | number;
  /** The locale the date is written in. Default "en-US". */
  locale?: string;
  /** The IANA time zone whose calendar day the date is read in, so the server and the browser print the same day. Default "UTC". */
  timeZone?: string;
  /** The ruled row of sections under the name. On a phone it scrolls sideways, with the current one brought into view. */
  sections: readonly MastheadSection[];
  /** Sign in and a subscribe button: the right end of the top line, at every width. The line is 2.25rem tall (2.75rem on a phone), so a small button fits. To change it, set `--mast-top` in className, and again with `md:` for wider screens. */
  actions?: ReactNode;
  /** The path of the current page; its link gets aria-current="page" and an underline. */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Pin the top line and the sections to the window as the page scrolls; the name scrolls away behind them. On by default. */
  sticky?: boolean;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
}

/** The date as it is read ("Tuesday, November 10, 2026") and as a machine reads it ("2026-11-10"), both in the same time zone; the short form is for a phone. */
function dateOf(value: NavbarMastheadProps["date"], locale: string, timeZone: string): { long: string; short: string; iso: string } | null {
  if (value === undefined) return null;
  const calendar = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const instant = new Date(calendar ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(instant.getTime())) return null;
  const zone = calendar ? "UTC" : timeZone;
  const write = (loc: string, zoneName: string) => ({
    long: new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: zoneName }).format(instant),
    short: new Intl.DateTimeFormat(loc, { weekday: "short", day: "numeric", month: "short", timeZone: zoneName }).format(instant),
    iso: new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: zoneName }).format(instant),
  });
  try {
    return write(locale, zone);
  } catch {
    // A locale or a zone the browser does not know must not take the page down: fall back to UTC and US English.
    return write("en-US", "UTC");
  }
}

const link =
  "relative inline-flex h-full items-center rounded-md px-3.5 text-[0.8125rem] font-medium tracking-[0.04em] whitespace-nowrap text-muted-foreground uppercase outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset aria-[current=page]:text-foreground after:pointer-events-none after:absolute after:inset-x-3.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity after:duration-150 aria-[current=page]:after:opacity-100 motion-reduce:transition-none motion-reduce:after:transition-none";

const nameClass =
  "inline-block max-w-full rounded-md text-[clamp(2.5rem,8.5vw,5rem)] leading-none font-semibold tracking-[-0.05em] text-balance outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * An editorial header in three tiers, like the front page of a paper: a thin
 * top line with today's date on the left and sign-in and subscribe on the
 * right, the publication's name centred in large type, and a ruled row of
 * section links. The date is written with Intl in a locale and a time zone you
 * name, so the server and the browser agree. As the page scrolls the name
 * slides away behind the top line and only the top line and the sections stay
 * pinned: the three tiers are siblings, and the header is `display: contents`,
 * so the two that stick are pinned by plain CSS for the whole page, with no
 * scroll handler and nothing that moves but the scroll itself. Put it directly
 * in the page's wrapper (a wrapper that holds only the header would unpin it).
 * Below md the sections become a scrolling row with fading edges and the
 * current one in view, and the date shortens. For magazines, newsletters and
 * news sites that want a masthead, not a toolbar. The links are server-rendered,
 * so a Server Component can pass its router's Link as linkAs.
 */
export function NavbarMasthead({
  name,
  nameHref,
  date,
  locale = "en-US",
  timeZone = "UTC",
  sections,
  actions,
  currentHref,
  linkAs: Link = "a",
  sticky = true,
  navLabel = "Sections",
  className,
  ...props
}: NavbarMastheadProps) {
  const when = dateOf(date, locale, timeZone);
  const current = (href: string) => (href === currentHref ? "page" : undefined);

  return (
    <header data-slot="navbar-masthead" className={cn("contents [--mast-top:2.75rem] md:[--mast-top:2.25rem]", className)} {...props}>
      <div data-slot="navbar-masthead-top" className={cn("z-30 border-b border-border bg-background", sticky && "sticky top-0")}>
        <div className="mx-auto flex h-(--mast-top) max-w-6xl items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:px-6">
          {when ? (
            <time dateTime={when.iso} className="min-w-0 truncate tabular-nums">
              <span className="sr-only sm:not-sr-only">{when.long}</span>
              <span aria-hidden="true" className="sm:hidden">
                {when.short}
              </span>
            </time>
          ) : (
            <span />
          )}
          {actions ? <div className="flex shrink-0 items-center gap-1 sm:gap-3">{actions}</div> : null}
        </div>
      </div>

      <div data-slot="navbar-masthead-name" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6 sm:py-9">
          {nameHref ? (
            <Link href={nameHref} className={nameClass}>
              {name}
            </Link>
          ) : (
            <p className={nameClass}>{name}</p>
          )}
        </div>
      </div>

      <nav
        data-slot="navbar-masthead-sections"
        aria-label={navLabel}
        className={cn("z-20 border-y border-t-[3px] border-double border-t-foreground border-b-border bg-background", sticky && "sticky top-[calc(var(--mast-top)+1px)]")}
      >
        <SectionsRow className="mx-auto max-w-6xl">
          <ul className="flex h-12 w-max min-w-full items-stretch justify-center gap-1 px-2 sm:px-4">
            {sections.map((section) => (
              <li key={`${section.label}-${section.href}`} className="flex">
                <Link href={section.href} aria-current={current(section.href)} className={link}>
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </SectionsRow>
      </nav>
    </header>
  );
}
