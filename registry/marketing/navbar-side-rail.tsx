import type { ComponentProps, CSSProperties, ElementType, ReactNode } from "react";

import { IconArrowUpRight, IconMenu } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface SideRailLink {
  /** The page's name, set in large type. */
  label: string;
  /** Where it goes. */
  href: string;
  /** A small number beside the label: projects, articles, open roles. */
  count?: number;
}

export interface SideRailProfile {
  /** The profile's name in words: "Instagram". */
  label: string;
  /** The profile's address. It opens in a new tab and says so. */
  href: string;
}

export interface SideRailFooter {
  /** An address, as the text of a mailto: link. */
  email?: string;
  /** Profiles, as text links. */
  social?: readonly SideRailProfile[];
  /** The small line at the very foot: "© 2026 Atelier Nord". */
  note?: ReactNode;
}

export interface SideRailLabels {
  /** The name of the menu button, and the title of the sheet it opens. Default "Menu". */
  menu: string;
  /** The name of the navigation landmark. Default "Main". */
  nav: string;
  /** The name of the list of profiles. Default "Social profiles". */
  social: string;
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
  /** What the sheet says it holds, for screen readers. Default "Every page of this site. Choosing one closes the menu and takes you there." */
  menuDescription: string;
}

export interface NavbarSideRailProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark, usually already a link home. At the top of the rail, and in the bar on a phone. */
  brand: ReactNode;
  /** The pages, in large type down the rail. Four to six read well. */
  links: readonly SideRailLink[];
  /** The foot of the rail: an email link, profiles and a small line. It is also at the foot of the phone menu. */
  footer?: SideRailFooter;
  /** The path of the current page; its link gets aria-current="page" and a dot. */
  currentHref?: string;
  /** The width of the rail from lg up, as a CSS length. The page sits beside it, padded on the left by the same width, and the value is also written on the root as `--rail-width`, so your own fixed or full-bleed parts can use `var(--rail-width)`. Default "16rem". */
  width?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The id of the region the page sits in, for a skip link. Default "main". */
  mainId?: string;
  /** The element the page sits in. A `main` landmark by default; pass "div" when your layout already has one, since a page has only one. */
  contentAs?: "main" | "div";
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SideRailLabels>;
  /** The page. From lg up it sits beside the rail; below that it sits under the top bar. */
  children: ReactNode;
}

const LABELS: SideRailLabels = {
  menu: "Menu",
  nav: "Main",
  social: "Social profiles",
  newTab: "opens in a new tab",
  menuDescription: "Every page of this site. Choosing one closes the menu and takes you there.",
};

/** A page link in large type. The dot in the gutter marks the current page and grows halfway on hover. */
const LINK =
  "group/link relative flex w-fit items-baseline gap-2 rounded-md py-1 text-[1.75rem] leading-[1.1] font-medium tracking-[-0.04em] text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:text-foreground motion-reduce:transition-none";

const FOOT_LINK =
  "rounded-sm outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** The label of a page link: the words, the dot, and the count set small and high, like a footnote mark. */
function LinkBody({ link }: { link: SideRailLink }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute top-1/2 -left-4 size-1.5 -translate-y-1/2 scale-0 rounded-full bg-foreground transition-transform duration-200 group-hover/link:scale-50 group-aria-[current=page]/link:scale-100 motion-reduce:transition-none"
      />
      {link.label}
      {link.count !== undefined ? <span className="self-start pt-1 text-[0.6875rem] leading-none font-normal tracking-normal text-muted-foreground tabular-nums">{link.count}</span> : null}
    </>
  );
}

/** The email, the profiles and the small line: the same block at the foot of the rail and at the foot of the phone menu. */
function RailFooter({ footer, words }: { footer: SideRailFooter; words: SideRailLabels }) {
  return (
    <div className="grid gap-5 text-sm">
      {footer.email ? (
        <a
          href={`mailto:${footer.email}`}
          className={cn(FOOT_LINK, "w-fit font-medium break-all text-foreground underline decoration-border decoration-1 underline-offset-[0.3em] hover:decoration-foreground")}
        >
          {footer.email}
        </a>
      ) : null}
      {footer.social?.length ? (
        <ul aria-label={words.social} className="grid justify-items-start gap-1.5 text-muted-foreground">
          {footer.social.map((profile) => (
            <li key={`${profile.label}-${profile.href}`}>
              <a href={profile.href} target="_blank" rel="noopener noreferrer" className={cn(FOOT_LINK, "inline-flex items-center gap-0.5")}>
                {profile.label}
                <IconArrowUpRight aria-hidden="true" className="size-3.5" />
                <span className="sr-only"> ({words.newTab})</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {footer.note ? <p className="text-xs text-muted-foreground">{footer.note}</p> : null}
    </div>
  );
}

/**
 * A navigation rail fixed to the left edge, for portfolios, studios and
 * editorial sites that want the page itself uninterrupted by a horizontal bar.
 * From lg up the rail runs the full height of the window: the mark at the top,
 * the pages stacked in large type with the current one marked by a dot, and at
 * the foot an email link, profiles and a small line. The page sits beside it in
 * a main region padded by the rail's width, which is also written on the
 * root as `--rail-width` for your own parts to use. Below lg the rail becomes a
 * top bar with the mark and a Menu button that opens the same pages and the same
 * foot in a sheet. The rail is `fixed`, so it needs a window that scrolls (or an
 * ancestor with a transform); the pages are server-rendered links, so a Server
 * Component can pass its router's Link as linkAs.
 */
export function NavbarSideRail({ brand, links, footer, currentHref, width = "16rem", linkAs: Link = "a", mainId = "main", contentAs: Content = "main", labels, children, className, style, ...props }: NavbarSideRailProps) {
  const words = { ...LABELS, ...labels };
  const current = (href: string) => (href === currentHref ? "page" : undefined);
  const rail = { "--rail-width": width, ...style } as CSSProperties;

  return (
    <div data-slot="navbar-side-rail" style={rail} className={cn("relative", className)} {...props}>
      <header data-slot="navbar-side-rail-bar" className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6 lg:hidden print:hidden">
        <div className="min-w-0">{brand}</div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-2">
              {words.menu}
              <IconMenu aria-hidden="true" size={14} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(22rem,100vw)] gap-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>{words.menu}</SheetTitle>
              <SheetDescription className="sr-only">{words.menuDescription}</SheetDescription>
            </SheetHeader>
            <nav aria-label={words.nav} className="relative overflow-y-auto px-9 py-6">
              <ul className="grid gap-1">
                {links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <SheetClose asChild>
                      <Link href={link.href} aria-current={current(link.href)} className={LINK}>
                        <LinkBody link={link} />
                      </Link>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </nav>
            {footer ? (
              <div className="mt-auto border-t border-border px-9 py-5">
                <RailFooter footer={footer} words={words} />
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </header>

      <header
        data-slot="navbar-side-rail-rail"
        className="relative hidden flex-col overflow-y-auto overscroll-contain border-r border-border bg-background px-9 py-8 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-(--rail-width) print:hidden"
      >
        <div className="shrink-0">{brand}</div>
        <nav aria-label={words.nav} className="mt-14">
          <ul className="grid gap-1">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <Link href={link.href} aria-current={current(link.href)} className={LINK}>
                  <LinkBody link={link} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {footer ? (
          <div className="mt-auto pt-12">
            <RailFooter footer={footer} words={words} />
          </div>
        ) : null}
      </header>

      <Content id={mainId} tabIndex={-1} className="min-w-0 outline-none lg:pl-(--rail-width) print:pl-0">
        {children}
      </Content>
    </div>
  );
}
