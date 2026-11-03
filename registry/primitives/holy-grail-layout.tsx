import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { cn } from "@/lib/utils";

/** The classes of each part, merged over the defaults: a background for the navigation, no padding in main, a different border on the footer. */
export type HolyGrailLayoutClassNames = Partial<Record<"header" | "nav" | "main" | "aside" | "footer", string>>;

export interface HolyGrailLayoutProps extends Omit<ComponentProps<"div">, "children"> {
  /** The main content of the page. It is the `main` landmark (unless you set `mainAs`) and the target of the skip link. */
  children: ReactNode;
  /** The top bar, in a `header`: the brand, the search, the account. */
  header?: ReactNode;
  /** The navigation on the start side, in a `nav` that is named by `navLabel`: pass the links, not another `nav`. */
  nav?: ReactNode;
  /** The column on the end side, in an `aside` named by `asideLabel`: the contents of the page, related links, an activity feed. */
  aside?: ReactNode;
  /** The bottom bar, in a `footer`. On a page shorter than the screen it sits at the bottom of the screen; on a longer page it follows the content. */
  footer?: ReactNode;
  /** The width of the navigation column in the wide layouts, any CSS length. Default `14rem`. */
  navWidth?: string;
  /** The width of the aside column in the widest layout, any CSS length. Default `15rem`. */
  asideWidth?: string;
  /** Keep the header at the top of the screen while the page scrolls. Default `false`. */
  stickyHeader?: boolean;
  /** Pin the navigation and the aside under the header while main scrolls. They scroll inside themselves when they are taller than the screen, and they only pin where they stand beside main. Default `false`. */
  stickyColumns?: boolean;
  /** The height of the header, any CSS length. It is the least height the header gets, and the distance the pinned columns keep from the top when the header is sticky. Default `3.5rem`. */
  headerHeight?: string;
  /** The height of one screen, any CSS length: the least height of the layout, which is what pushes the footer to the bottom of a short page, and the room the pinned columns have. Default `100dvh`; give it a length when the layout lives in a box and not in the page. */
  height?: string;
  /** The accessible name of the navigation. Default `Primary`. */
  navLabel?: string;
  /** The accessible name of the aside. Default `Contents`. */
  asideLabel?: string;
  /** The id of `main`, which the skip link points at. Default `main`. */
  mainId?: string;
  /** The element of the main part: `main`, the landmark of the page, or `div` for a second layout on one page (a preview, a dialog), because a page has one `main`. Default `main`. */
  mainAs?: "main" | "div";
  /** The text of the skip link, which is the first thing a keyboard reaches. Pass `false` to leave it out when your page has one already. Default `Skip to content`. */
  skipLabel?: string | false;
  /** Classes for each part. */
  classNames?: HolyGrailLayoutClassNames;
}

/**
 * The classic page skeleton in five semantic elements: header, navigation,
 * main, aside and footer, on one grid. In the widest layout the three
 * columns stand side by side. When the layout is narrower the aside drops
 * under main, and narrower still the navigation becomes a block above
 * everything, so a phone gets one column in reading order. The switches read
 * the width of the layout (it is a size container), not the window, so the
 * same skeleton works in a page, a dialog or a preview. The footer sits at
 * the bottom of a short page and follows the content of a long one. The
 * source order is the focus order, which is also the reading order: header,
 * navigation, main, aside, footer. Pin the header, the columns or both, and
 * the columns keep their place under the header.
 */
export function HolyGrailLayout({
  children,
  header,
  nav,
  aside,
  footer,
  navWidth = "14rem",
  asideWidth = "15rem",
  stickyHeader = false,
  stickyColumns = false,
  headerHeight = "3.5rem",
  height = "100dvh",
  navLabel = "Primary",
  asideLabel = "Contents",
  mainId = "main",
  mainAs = "main",
  skipLabel = "Skip to content",
  classNames,
  className,
  style,
  ...props
}: HolyGrailLayoutProps) {
  const Main = mainAs as "main";
  const vars = {
    "--hg-height": height,
    "--hg-header": headerHeight,
    // Where a pinned column stops under the top of the screen: under the header when the header is pinned too.
    "--hg-top": stickyHeader ? headerHeight : "0px",
    // A column that is not there takes no room at all.
    "--hg-nav": nav ? navWidth : "0px",
    "--hg-aside": aside ? asideWidth : "0px",
    // The rows of the middle layout: the aside comes under main, and whichever of the two is last takes the spare height.
    "--hg-rows": aside ? "auto 1fr" : "1fr",
    ...style,
  } as CSSProperties;
  return (
    <div data-slot="holy-grail-layout" style={vars} className={cn("@container flex min-h-(--hg-height) w-full flex-col bg-background text-foreground", className)} {...props}>
      {skipLabel === false ? null : <SkipLink target={mainId} label={skipLabel} />}
      {header ? (
        <header data-slot="holy-grail-layout-header" className={cn("grid min-h-(--hg-header) shrink-0 items-center border-b border-border bg-background", stickyHeader && "sticky top-0 z-30", classNames?.header)}>
          {header}
        </header>
      ) : null}
      <div
        data-slot="holy-grail-layout-body"
        className={cn(
          "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] [grid-template-areas:'nav'_'main'_'aside']",
          "@3xl:grid-cols-[var(--hg-nav)_minmax(0,1fr)] @3xl:[grid-template-areas:'nav_main'_'nav_aside'] @3xl:[grid-template-rows:var(--hg-rows)]",
          "@5xl:grid-cols-[var(--hg-nav)_minmax(0,1fr)_var(--hg-aside)] @5xl:[grid-template-areas:'nav_main_aside'] @5xl:grid-rows-[1fr]",
        )}
      >
        {nav ? (
          <div data-slot="holy-grail-layout-nav" className="min-w-0 border-b border-border [grid-area:nav] @3xl:border-e @3xl:border-b-0">
            <nav
              aria-label={navLabel}
              className={cn(
                "px-4 py-4",
                // Pinned only where it stands beside main; it needs its own position, which is also what lets it scroll inside itself.
                stickyColumns && "relative @3xl:sticky @3xl:top-(--hg-top) @3xl:max-h-[calc(var(--hg-height)_-_var(--hg-top))] @3xl:overflow-y-auto @3xl:overscroll-contain",
                classNames?.nav,
              )}
            >
              {nav}
            </nav>
          </div>
        ) : null}
        <Main id={mainId} tabIndex={-1} data-slot="holy-grail-layout-main" className={cn("min-w-0 px-5 py-6 outline-none [grid-area:main] @3xl:px-8 @3xl:py-8", classNames?.main)}>
          {children}
        </Main>
        {aside ? (
          <div data-slot="holy-grail-layout-aside" className="min-w-0 border-t border-border [grid-area:aside] @5xl:border-s @5xl:border-t-0">
            <aside
              aria-label={asideLabel}
              className={cn(
                "px-5 py-5 @5xl:px-4",
                stickyColumns && "relative @5xl:sticky @5xl:top-(--hg-top) @5xl:max-h-[calc(var(--hg-height)_-_var(--hg-top))] @5xl:overflow-y-auto @5xl:overscroll-contain",
                classNames?.aside,
              )}
            >
              {aside}
            </aside>
          </div>
        ) : null}
      </div>
      {footer ? (
        <footer data-slot="holy-grail-layout-footer" className={cn("shrink-0 border-t border-border bg-background px-5 py-5 @3xl:px-8", classNames?.footer)}>
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
