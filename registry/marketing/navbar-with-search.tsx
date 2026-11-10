import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconMenu, IconSearch } from "@rhs-ui/icons";
import type { NavbarLink } from "@rhs-ui/marketing/navbar";
import { Button } from "@rhs-ui/primitives/button";
import { SearchTrigger } from "@rhs-ui/primitives/search-trigger";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface NavbarWithSearchProps extends Omit<ComponentProps<"header">, "children"> {
  /** Your mark, usually already a link home. */
  brand: ReactNode;
  /** A short row of links beside the mark. Below md they move into a sheet. */
  items: readonly NavbarLink[];
  /** Sign in, a call to action: shown on the right, and at the foot of the phone menu. */
  actions?: ReactNode;
  /** Opens your command palette or search overlay. The field, the icon button and the shortcut all call it. */
  onSearchOpen: () => void;
  /** The letter for the shortcut with Ctrl or Cmd. */
  shortcutKey?: string;
  /** The text in the field. */
  searchPlaceholder?: string;
  /** The name of the icon button that replaces the field below lg. */
  searchLabel?: string;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
  /** The name of the menu button, and the title of the sheet it opens on a phone. */
  menuLabel?: string;
  /** The path of the current page; its link gets aria-current="page". */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Keep the bar at the top of the window as the page scrolls. On by default. */
  sticky?: boolean;
  /** Classes for the bar. */
  className?: string;
}

/**
 * A navbar built around search, for docs, marketplaces and content-heavy
 * sites where it is the main way in. The mark and a short row of links sit
 * on the left, a wide search field in the middle and the actions on the
 * right. The field is a real button that opens your own command palette or
 * search overlay and shows the right shortcut for the platform, so the bar
 * has no search logic to keep in sync. Under lg the field shrinks to an icon
 * button named Search and the shortcut keeps working; under md the links move
 * into a sheet. onSearchOpen is a function, so use the bar from a Client
 * Component, next to the palette it opens.
 */
export function NavbarWithSearch({
  brand,
  items,
  actions,
  onSearchOpen,
  shortcutKey = "k",
  searchPlaceholder = "Search…",
  searchLabel = "Search",
  navLabel = "Main",
  menuLabel = "Menu",
  currentHref,
  linkAs: Link = "a",
  sticky = true,
  className,
  ...props
}: NavbarWithSearchProps) {
  const current = (href: string) => (href === currentHref ? "page" : undefined);

  return (
    <header data-slot="navbar-with-search" className={cn("z-40 w-full border-b border-border bg-background", sticky && "sticky top-0", className)} {...props}>
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:gap-8">
        <div className="flex min-w-0 items-center gap-6 lg:gap-8">
          <div className="shrink-0">{brand}</div>
          <nav aria-label={navLabel} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {items.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link
                    href={link.href}
                    aria-current={current(link.href)}
                    className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground motion-reduce:transition-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Always mounted, so the keyboard shortcut works below lg too; only the field is hidden there. */}
        <div className="hidden justify-center lg:flex">
          <SearchTrigger onOpen={onSearchOpen} shortcutKey={shortcutKey} placeholder={searchPlaceholder} className="h-10 max-w-lg rounded-lg" />
        </div>

        <div className="col-start-3 flex items-center gap-1 sm:gap-2 lg:col-start-auto">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={searchLabel} onClick={onSearchOpen}>
            <IconSearch size={18} />
          </Button>
          {actions ? <div className="hidden items-center gap-2 md:flex">{actions}</div> : null}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 md:hidden" aria-label={menuLabel}>
                <IconMenu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,100vw)] gap-0">
              <SheetHeader className="border-b border-border">
                <SheetTitle>{menuLabel}</SheetTitle>
                <SheetDescription className="sr-only">Every page of this site, as in the top bar.</SheetDescription>
              </SheetHeader>
              <nav aria-label={navLabel} className="relative grid gap-1 overflow-y-auto p-5">
                {items.map((link) => (
                  <SheetClose key={`${link.label}-${link.href}`} asChild>
                    <Link
                      href={link.href}
                      aria-current={current(link.href)}
                      className="rounded-md px-2 py-2.5 text-base font-medium transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted motion-reduce:transition-none"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              {actions ? <div className="mt-auto grid gap-2 border-t border-border p-5 *:w-full">{actions}</div> : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
