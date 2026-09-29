"use client";

import { useState, type ElementType, type ReactNode } from "react";

import { IconMenu } from "@rhs-ui/icons";
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface NavbarLink {
  label: string;
  href: string;
  /** One line under the label inside a menu panel. */
  description?: string;
}

export interface NavbarMenu {
  label: string;
  links: readonly NavbarLink[];
}

export type NavbarEntry = NavbarLink | NavbarMenu;

export interface NavbarProps {
  /** Your mark, usually already a link home. */
  brand: ReactNode;
  items: readonly NavbarEntry[];
  /** Sign in, a call to action: shown on the right, and at the foot of the phone menu. */
  actions?: ReactNode;
  /** The path of the current page; its link gets aria-current="page". */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  sticky?: boolean;
  className?: string;
}

const isMenu = (entry: NavbarEntry): entry is NavbarMenu => "links" in entry;

/**
 * The top of a marketing site: your mark, links and panels in the middle,
 * actions on the right. From md up the panels open in one navigation menu;
 * on a phone everything moves into a sheet with the same groups. Sticky by
 * default, on a blurred page colour so content scrolls under it.
 */
export function Navbar({ brand, items, actions, currentHref, linkAs: Link = "a", sticky = true, className }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const current = (href: string) => (href === currentHref ? "page" : undefined);

  return (
    <header
      data-slot="navbar"
      className={cn("z-40 w-full border-b border-border bg-background/80 backdrop-blur-md", sticky && "sticky top-0", className)}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <div className="shrink-0">{brand}</div>

        <NavigationMenu aria-label="Main" className="hidden md:flex">
          <NavigationMenuList>
            {items.map((entry) =>
              isMenu(entry) ? (
                <NavigationMenuItem key={entry.label}>
                  <NavigationMenuTrigger>{entry.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[30rem] grid-cols-2 gap-1">
                      {entry.links.map((link) => (
                        <li key={link.href}>
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
                <NavigationMenuItem key={entry.href}>
                  <NavigationMenuLink asChild active={entry.href === currentHref} className={navigationMenuTriggerStyle}>
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Open the menu">
              <IconMenu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(22rem,100vw)] gap-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription className="sr-only">Every page of this site, grouped as in the top bar.</SheetDescription>
            </SheetHeader>
            <nav aria-label="Main" className="grid gap-6 overflow-y-auto p-5">
              {items.map((entry) =>
                isMenu(entry) ? (
                  <section key={entry.label} className="grid gap-1">
                    <h3 className="px-2 pb-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground">{entry.label}</h3>
                    {entry.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        aria-current={current(link.href)}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-2 py-2 text-sm transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:font-medium"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </section>
                ) : (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    aria-current={current(entry.href)}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2 text-base font-medium transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    {entry.label}
                  </Link>
                ),
              )}
            </nav>
            {actions ? <div className="mt-auto grid gap-2 border-t border-border p-5 *:w-full">{actions}</div> : null}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
