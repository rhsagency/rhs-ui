import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconMenu, IconUser } from "@rhs-ui/icons";
import type { NavbarEntry, NavbarMenu } from "@rhs-ui/marketing/navbar";
import { Button } from "@rhs-ui/primitives/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@rhs-ui/primitives/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface NavbarCenteredLogoProps extends Omit<ComponentProps<"header">, "children"> {
  /** Your mark, set on the true middle of the bar. Usually already a link home. */
  brand: ReactNode;
  /** The links on the left: plain links, and groups that open as panels. */
  items: readonly NavbarEntry[];
  /** Sign in, a call to action: on the right, and folded into one icon button on a phone. */
  actions?: ReactNode;
  /** The path of the current page; its link gets aria-current="page". */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Keep the bar at the top of the window as the page scrolls. On by default. */
  sticky?: boolean;
  /** The name of the menu button, and the title of the sheet it opens on a phone. */
  menuLabel?: string;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
  /** The name of the icon button that holds the actions on a phone, and of the panel it opens. */
  actionsLabel?: string;
  /** The icon on that button. A person by default. */
  actionsIcon?: ReactNode;
  /**
   * The width from which the links sit beside the mark; below it they fold into the sheet. Each side of the mark has room for about
   * three short links from md (768px), five from lg (1024px) and six from xl (1280px), and no more than that at any width, so keep the
   * list to six. Left out, the bar goes by the number of links and keeps some room to spare: up to three md, four lg, more xl. Long
   * labels or a wide mark need a later fold than that, so set it yourself.
   */
  foldBelow?: "md" | "lg" | "xl";
  /** Classes for the bar. */
  className?: string;
}

const isMenu = (entry: NavbarEntry): entry is NavbarMenu => "links" in entry;

/* Where the links leave the bar. Every class is written out in full, because Tailwind only generates what it can read in the source. */
const FOLD = {
  md: { links: "hidden md:flex", menu: "md:hidden" },
  lg: { links: "hidden lg:flex", menu: "lg:hidden" },
  xl: { links: "hidden xl:flex", menu: "xl:hidden" },
} as const;

/**
 * The smallest width at which this many links stay clear of the mark with room to spare: a side of the bar is about 295px wide at md,
 * 425px at lg and 490px at xl, and a link is 70 to 85px. Folding early costs a click, folding late paints links over the mark.
 */
const foldFor = (count: number): keyof typeof FOLD => (count > 4 ? "xl" : count > 3 ? "lg" : "md");

/* The thin line that grows from the middle of a link on hover and focus, and stays for the current page. */
const underline =
  "relative after:pointer-events-none after:absolute after:inset-x-3 after:bottom-1.5 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100 data-[state=open]:after:scale-x-100 aria-[current=page]:after:scale-x-100 motion-reduce:after:transition-none";

const barLink = cn(
  "inline-flex h-9 w-max flex-row items-center gap-1 rounded-md bg-transparent px-3 py-0 text-sm font-medium text-foreground",
  "hover:bg-transparent focus-visible:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
  underline,
);

/**
 * A navbar with the mark in the middle: links on the left, actions on the
 * right and the brand on the true centre of the bar, because the three zones
 * are one grid and a long list of links never pushes it off. Props match
 * Navbar, so one can replace the other, and groups open as panels in the
 * shared navigation menu. The current page is marked with aria-current and a
 * thin underline that grows from the centre on hover and focus. The links
 * only sit beside the mark where they fit: below md for up to three links,
 * below lg for four and below xl for more (foldBelow sets it), they
 * move into a sheet opened from a menu button on the left, so they do not
 * run over the mark. The brand stays centred, and below md the actions fold
 * into one icon button on the right. For fashion, hospitality and editorial
 * brands, where the mark is the loudest thing on the bar. No state of its
 * own, so it renders on the server.
 */
export function NavbarCenteredLogo({
  brand,
  items,
  actions,
  currentHref,
  linkAs: Link = "a",
  sticky = true,
  menuLabel = "Menu",
  navLabel = "Main",
  actionsLabel = "Account",
  actionsIcon,
  foldBelow,
  className,
  ...props
}: NavbarCenteredLogoProps) {
  const current = (href: string) => (href === currentHref ? "page" : undefined);
  const fold = FOLD[foldBelow ?? foldFor(items.length)];

  return (
    <header data-slot="navbar-centered-logo" className={cn("z-40 w-full border-b border-border bg-background", sticky && "sticky top-0", className)} {...props}>
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center justify-self-start">
          <NavigationMenu aria-label={navLabel} className={fold.links}>
            <NavigationMenuList>
              {items.map((entry) =>
                isMenu(entry) ? (
                  <NavigationMenuItem key={entry.label}>
                    <NavigationMenuTrigger className={barLink}>{entry.label}</NavigationMenuTrigger>
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

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("-ml-2", fold.menu)} aria-label={menuLabel}>
                <IconMenu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(22rem,100vw)] gap-0">
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
            </SheetContent>
          </Sheet>
        </div>

        <div className="justify-self-center">{brand}</div>

        <div className="flex min-w-0 items-center justify-self-end">
          {actions ? (
            <>
              <div className="hidden items-center gap-2 md:flex">{actions}</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2 md:hidden" aria-label={actionsLabel}>
                    {actionsIcon ?? <IconUser size={18} />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" aria-label={actionsLabel} className="grid w-56 gap-2 p-3 *:w-full">
                  {actions}
                </PopoverContent>
              </Popover>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
