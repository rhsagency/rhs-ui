import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import type { FooterColumn, FooterLink } from "@rhs-ui/marketing/footer-section";
import { EdgeFadeScroller } from "@rhs-ui/motion/edge-fade-scroller";
import { cn } from "@/lib/utils";

export interface TrustMark {
  /** What the mark says about you: "Approved installer", "Member since", "Tested for safety". It sits under the artwork. */
  label: string;
  /** Who gave it. It is the accessible name of the tile: the alt text of the image, and the text mark when there is no image. */
  issuer: string;
  /** The entry in the issuer's public register. The tile becomes a link that opens in a new tab and says so. */
  href?: string;
  /** The issuer's artwork, as an address or a data URI. Dark on a clear ground: the tile turns it grey, and light in the dark theme. Leave it out and the issuer is set as a clean text mark. */
  image?: string;
  /** The year you were first listed: "2014". */
  since?: number | string;
}

export interface FooterTrustMarksLabels {
  /** The heading over the row of marks, and the name of the list. */
  marks: string;
  /** The line under a mark that has a year. {year} is the year. */
  since: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface FooterTrustMarksProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your name or mark. */
  brand: ReactNode;
  /** One or two sentences under the mark. */
  tagline?: string;
  /** The link columns above the marks. */
  columns: readonly FooterColumn[];
  /** The quality marks and memberships, in the order they show. Five to eight read best. */
  marks: readonly TrustMark[];
  /** The bottom row, left: "© 2026 Kestrel Heating B.V." */
  legal: ReactNode;
  /** The bottom row, right: privacy, terms, cookies. */
  legalLinks?: readonly FooterLink[];
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark, for a site that is not in English or a page with two footers. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterTrustMarksLabels>;
}

const LABELS: FooterTrustMarksLabels = { marks: "Quality marks and memberships", since: "Since {year}", newTab: "opens in a new tab" };

const linkClass =
  "rounded-sm text-sm text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";
/* Every tile is the same box, so a roundel, a shield and a wordmark of any shape stand on one line. They never animate: a mark is a fact, not a button. */
const tile = "relative flex min-h-[6.75rem] w-44 flex-1 shrink-0 flex-col items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 pt-4 pb-3.5 text-center text-card-foreground md:w-auto md:shrink";

/**
 * From md up the tiles sit in a grid whose columns follow how many marks there are, not how much room there is, so the last row is as full
 * as it can be at every width: four fill one row, five fill one row, six make two rows of three and one row of six from xl, seven and
 * eight make two rows of four. A grid that only fills the width (auto-fill) leaves one lone tile on a second row at some widths and an empty
 * stretch at the end of the row at others. One to three marks keep a tile of a natural size instead of stretching across the footer. Every
 * class is written out, because Tailwind only generates what it can read.
 */
const MARK_COLUMNS: Record<number, string> = {
  1: "md:grid-cols-[minmax(0,15rem)]",
  2: "md:grid-cols-[repeat(2,minmax(0,15rem))]",
  3: "md:grid-cols-[repeat(3,minmax(0,15rem))]",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-3 xl:grid-cols-6",
  7: "md:grid-cols-4",
  8: "md:grid-cols-4",
};

/**
 * A footer for the businesses where credentials decide the sale: installers,
 * shops, professional services. Link columns on top and, under them, a
 * labelled row of the quality marks and memberships you hold, each a bordered
 * tile of the same size. A tile shows the issuer's artwork, greyed, when you
 * pass an image and a clean text mark when you do not, so a mixed set lines up
 * on one baseline; the issuer is its accessible name, and an entry in the
 * register makes it a link. Nothing on a tile animates. On a phone the row
 * scrolls sideways with fading edges instead of wrapping into a wall, and from
 * md up the tiles sit in a grid whose columns follow how many marks there are,
 * so the last row is full. No state of its own, so it renders on the server.
 */
export function FooterTrustMarks({ brand, tagline, columns, marks, legal, legalLinks = [], linkAs: Link = "a", navLabel = "Footer", labels: custom, className, ...props }: FooterTrustMarksProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  const anyLink = marks.some((mark) => mark.href);

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

  const artwork = (mark: TrustMark) => (
    <span className="flex min-h-9 w-full items-center justify-center">
      {mark.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- the registry takes any address; a consumer's own image component is their choice.
        <img src={mark.image} alt={mark.issuer} loading="lazy" decoding="async" className="max-h-9 w-auto max-w-full object-contain grayscale dark:invert" />
      ) : (
        <span className="text-[0.8125rem] leading-[1.2] font-bold tracking-[0.08em] text-balance text-foreground/85 uppercase">{mark.issuer}</span>
      )}
    </span>
  );

  const caption = (mark: TrustMark) => (
    <span className="grid gap-0.5">
      <span className="text-xs leading-snug font-medium text-foreground/85">{mark.label}</span>
      {mark.since ? <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{words.since.replace("{year}", String(mark.since))}</span> : null}
    </span>
  );

  const tiles = marks.map((mark) => (
    <li key={`${mark.issuer}-${mark.label}`} className="flex shrink-0 md:shrink">
      {mark.href ? (
        <a
          href={mark.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(tile, "outline-none hover:border-foreground/30 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40")}
        >
          <IconArrowUpRight aria-hidden="true" className="absolute right-2.5 bottom-2.5 size-3 text-muted-foreground" />
          {artwork(mark)}
          {caption(mark)}
          <span className="sr-only"> ({words.newTab})</span>
        </a>
      ) : (
        <div className={tile}>
          {artwork(mark)}
          {caption(mark)}
        </div>
      )}
    </li>
  ));

  return (
    <footer data-slot="footer-trust-marks" className={cn("border-t border-border bg-background", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="grid content-start gap-3">
            <div>{brand}</div>
            {tagline ? <p className="max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p> : null}
          </div>
          <nav aria-label={navLabel} className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
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

        <section aria-labelledby={`${id}-marks`} className="border-t border-border py-10">
          <h2 id={`${id}-marks`} className="mb-5 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
            {words.marks}
          </h2>
          {/* The same tiles in two lists, one for each way of laying them out, and only one is ever displayed (a list that is not displayed is out of the tab order and the accessibility tree). So the row that scrolls, on a phone, is the only one that can hold a focus stop, and a grid that cannot scroll never gets one. */}
          {/* A row with nothing to focus in it is given a focus stop of its own, so the keyboard can scroll it. */}
          <EdgeFadeScroller label={anyLink ? undefined : words.marks} className="md:hidden">
            <ul className="flex gap-3">{tiles}</ul>
          </EdgeFadeScroller>
          <ul className={cn("hidden gap-3 md:grid md:auto-rows-fr", MARK_COLUMNS[marks.length] ?? "md:grid-cols-4")}>{tiles}</ul>
        </section>

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
