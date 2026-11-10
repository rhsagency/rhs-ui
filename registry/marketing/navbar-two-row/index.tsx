import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { CategoryScroller } from "@rhs-ui/marketing/navbar-two-row/category-scroller";
import { cn } from "@/lib/utils";

export interface NavbarTwoRowCategory {
  label: string;
  href: string;
}

export interface NavbarTwoRowProps extends Omit<ComponentProps<"header">, "children"> {
  /** Your mark, usually already a link home. */
  brand: ReactNode;
  /** The search field: a SearchTrigger, a form, anything. It takes the middle of the top row from md up and a row of its own on a phone, so give it w-full and a max-w of your own. */
  search?: ReactNode;
  /** Account, help, a bag with its count: icon buttons or links, on the right of the top row. */
  utilities?: ReactNode;
  /** The main categories, in the second row. */
  categories: readonly NavbarTwoRowCategory[];
  /** A trailing link to everything: "All departments". It sits at the right end of the row. */
  catalogue?: NavbarTwoRowCategory;
  /** The path of the current page; its link is underlined and gets aria-current="page". */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Pin the bar to the top of the window as the page scrolls: the first row scrolls away and only the categories stay, until keyboard focus enters the first row and the whole bar shows. On by default. */
  sticky?: boolean;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
}

const link =
  "relative inline-flex h-12 items-center whitespace-nowrap rounded-md px-3 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 aria-[current=page]:font-medium aria-[current=page]:text-foreground after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-20 aria-[current=page]:after:opacity-100 motion-reduce:transition-none motion-reduce:after:transition-none";

/**
 * While keyboard focus is inside the first row the whole bar unpins (top-0), so a control that has focus is never out of sight above the window.
 * :focus-visible and not :focus-within: a click on the bag or the account button, and the focus a menu or a sheet hands back when it closes,
 * would otherwise keep the bar open for as long as that button holds focus, and the bar would not collapse again as the page scrolls.
 */
const unpin = "has-[[data-slot=navbar-two-row-top]_:focus-visible]:top-0";

/**
 * A header in two rows, for shops, marketplaces and publishers with more than
 * six sections: the mark, a search field in the middle and the account links
 * on top, the main categories underneath with the current one underlined and a
 * trailing link to everything. On scroll the first row slips away and only the
 * categories stay pinned, so the bar costs about 48px of height instead of
 * 112px; that is plain CSS (a sticky bar with a negative top, the fixed height
 * of the first row), so it needs no script and no scroll listener and your
 * mark must fit that height. Under md the search field takes a row of its
 * own and the categories become one scrolling line with fade edges and the
 * current category scrolled into view. Keyboard focus on the first row brings
 * it back into view: the whole bar unpins while keyboard focus is inside that
 * row (CSS :has and :focus-visible, still no script), and pins again as soon
 * as focus moves on. The links are server-rendered, so a Server Component can pass its
 * router's Link as linkAs.
 */
export function NavbarTwoRow({ brand, search, utilities, categories, catalogue, currentHref, linkAs: Link = "a", sticky = true, navLabel = "Categories", className, ...props }: NavbarTwoRowProps) {
  const current = (href: string) => (href === currentHref ? "page" : undefined);

  return (
    <header
      data-slot="navbar-two-row"
      // The first row is 56px tall on a phone, 104px with the search row under it, and 64px from md. The bar sticks that far above the window, so the first row is out of sight and the categories sit at the top.
      className={cn("z-40 w-full bg-background", sticky && (search ? "sticky -top-[6.5rem] md:-top-16" : "sticky -top-14 md:-top-16"), sticky && unpin, className)}
      {...props}
    >
      <div data-slot="navbar-two-row-top" className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:px-6 md:h-16 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-8">
        <div className="flex h-14 items-center md:h-auto">{brand}</div>
        {search ? <div className="order-last col-span-2 flex h-12 items-center md:order-none md:col-span-1 md:h-auto md:justify-center">{search}</div> : null}
        <div className="flex items-center justify-end gap-1">{utilities}</div>
      </div>

      <nav aria-label={navLabel} className="border-b border-border">
        <CategoryScroller className="mx-auto max-w-6xl">
          <ul className="flex h-12 w-max min-w-full items-stretch gap-1 px-1 sm:px-3">
            {categories.map((category) => (
              <li key={`${category.label}-${category.href}`}>
                <Link href={category.href} aria-current={current(category.href)} className={link}>
                  {category.label}
                </Link>
              </li>
            ))}
            {catalogue ? (
              <li className="ml-auto pl-4">
                <Link href={catalogue.href} aria-current={current(catalogue.href)} className={cn(link, "gap-1.5 font-medium text-foreground")}>
                  {catalogue.label}
                  <IconArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </li>
            ) : null}
          </ul>
        </CategoryScroller>
      </nav>
    </header>
  );
}
