import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconMenu } from "@rhs-ui/icons";
import type { NavbarEntry, NavbarMenu } from "@rhs-ui/marketing/navbar";
import { ScrollHeader } from "@rhs-ui/marketing/navbar-transparent/scroll-header";
import { Button } from "@rhs-ui/primitives/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@rhs-ui/primitives/navigation-menu";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface NavbarTransparentProps extends Omit<ComponentProps<"header">, "children"> {
  /** Your mark, usually already a link home. */
  brand: ReactNode;
  /** The links: plain links, and groups that open as panels. */
  items: readonly NavbarEntry[];
  /** Sign in, a call to action: shown on the right, and at the foot of the phone menu. */
  actions?: ReactNode;
  /** What the bar sits on at rest: "light" is light text over a dark hero (the default), "dark" is dark text over a light one. */
  tone?: "light" | "dark";
  /** How far the page scrolls, in px, before the bar turns solid. */
  threshold?: number;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
  /** The name of the menu button, and the title of the sheet it opens on a phone. */
  menuLabel?: string;
  /** The path of the current page; its link gets aria-current="page". */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Fix the state instead of reading the scroll: for a preview, a story or a test. */
  scrolled?: boolean;
  /** Position and spacing. The bar is fixed to the window; in a layout that scrolls inside a container, pass "sticky -mb-16" so the hero still slides under it. */
  className?: string;
}

const isMenu = (entry: NavbarEntry): entry is NavbarMenu => "links" in entry;

/* Links take the colour of the bar, white on the photograph and the foreground once solid, and their hover and open states are a wash of it, so they read on both. */
const wash = "text-inherit hover:bg-foreground/10 data-[active]:bg-foreground/10 data-[state=open]:bg-foreground/10";
const barLink = cn(navigationMenuTriggerStyle, "flex-row bg-transparent px-3 py-0 focus-visible:bg-transparent", wash);

/**
 * A navbar that sits over the hero with no background of its own, so the
 * hero fills the screen, and turns solid with a hairline as soon as the page
 * has scrolled past a threshold (24px by default). One passive scroll
 * listener sets data-scrolled on the header for your own styling, and the
 * state starts from the real scroll position. Text keeps AA contrast in both
 * states: with tone "light" the bar is light on the photograph and takes the
 * foreground token once solid. The phone menu opens on a solid sheet, so
 * links never sit directly on an image, and under reduced motion the change
 * is instant. Put a dark hero under it, or pass tone="dark" over a light one.
 */
export function NavbarTransparent({ brand, items, actions, tone = "light", threshold = 24, navLabel = "Main", menuLabel = "Menu", currentHref, linkAs: Link = "a", scrolled, className, ...props }: NavbarTransparentProps) {
  const current = (href: string) => (href === currentHref ? "page" : undefined);

  return (
    <ScrollHeader tone={tone} threshold={threshold} scrolled={scrolled} className={className} {...props}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <div className="shrink-0">{brand}</div>

        <NavigationMenu aria-label={navLabel} className="hidden md:flex">
          <NavigationMenuList>
            {items.map((entry) =>
              isMenu(entry) ? (
                <NavigationMenuItem key={entry.label}>
                  <NavigationMenuTrigger className={wash}>{entry.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[26rem] grid-cols-2 gap-1">
                      {entry.links.map((link) => (
                        <li key={`${link.label}-${link.href}`}>
                          <NavigationMenuLink asChild active={link.href === currentHref}>
                            <Link href={link.href} aria-current={current(link.href)}>
                              <span className="font-medium text-foreground">{link.label}</span>
                              {link.description ? <span className="text-xs leading-snug text-muted-foreground">{link.description}</span> : null}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={`${entry.label}-${entry.href}`}>
                  <NavigationMenuLink asChild active={entry.href === currentHref} className={barLink}>
                    <Link href={entry.href} aria-current={current(entry.href)}>
                      {entry.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {actions ? <div className="ml-auto hidden items-center gap-2 md:flex">{actions}</div> : null}

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto -mr-2 text-inherit md:hidden" aria-label={menuLabel}>
              <IconMenu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(22rem,100vw)] gap-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>{menuLabel}</SheetTitle>
              <SheetDescription className="sr-only">Every page of this site, grouped as in the top bar.</SheetDescription>
            </SheetHeader>
            <nav aria-label={navLabel} className="relative grid gap-6 overflow-y-auto p-5">
              {items.map((entry) =>
                isMenu(entry) ? (
                  <section key={entry.label} className="grid gap-1">
                    <h3 className="px-2 pb-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground">{entry.label}</h3>
                    {entry.links.map((link) => (
                      <SheetClose key={`${link.label}-${link.href}`} asChild>
                        <Link
                          href={link.href}
                          aria-current={current(link.href)}
                          className="rounded-md px-2 py-2 text-sm transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium motion-reduce:transition-none"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </section>
                ) : (
                  <SheetClose key={`${entry.label}-${entry.href}`} asChild>
                    <Link
                      href={entry.href}
                      aria-current={current(entry.href)}
                      className="rounded-md px-2 py-2 text-base font-medium transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted motion-reduce:transition-none"
                    >
                      {entry.label}
                    </Link>
                  </SheetClose>
                ),
              )}
            </nav>
            {actions ? <div className="mt-auto grid gap-2 border-t border-border p-5 *:w-full">{actions}</div> : null}
          </SheetContent>
        </Sheet>
      </div>
    </ScrollHeader>
  );
}
