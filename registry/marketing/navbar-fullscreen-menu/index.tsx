import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowUpRight, IconClose, IconMenu } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export interface FullscreenMenuLink {
  /** The page's name, set in very large type. */
  label: string;
  /** Where it goes. */
  href: string;
  /** A few words in small type beside the link: what is on the page. Keep it short: from sm up it wraps to two lines at most. */
  hint?: string;
}

export interface FullscreenMenuContact {
  /** The postal address, a line each: street and number, postcode and city. */
  address?: readonly string[];
  /** Shown as a large mail link. */
  email?: string;
  /** Shown under the email, as a tel: link. */
  phone?: string;
  /** Profiles, as text links that open in a new tab. */
  social?: readonly { label: string; href: string }[];
}

export interface NavbarFullscreenMenuLabels {
  /** The text of the button that closes the overlay. */
  close: string;
  /** What the overlay holds, for a screen reader: read after its title. */
  description: string;
  /** The small heading over the address. */
  visit: string;
  /** The small heading over the email and phone. */
  contact: string;
  /** The small heading over the profiles. */
  follow: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface NavbarFullscreenMenuProps extends Omit<ComponentProps<"header">, "children"> {
  /** Your mark, usually already a link home. It is shown in the bar and again in the overlay. */
  brand: ReactNode;
  /** The pages, in order. They get a two-digit index; five or six fit one screen. */
  links: readonly FullscreenMenuLink[];
  /** The second column of the overlay: address, email, phone and profiles. */
  contact?: FullscreenMenuContact;
  /** The path of the current page; its link is marked with aria-current="page" and a dot. */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The text of the button in the bar, and the title of the overlay. */
  menuLabel?: string;
  /** Keep the bar at the top of the window as the page scrolls. On by default. */
  sticky?: boolean;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<NavbarFullscreenMenuLabels>;
}

const LABELS: NavbarFullscreenMenuLabels = {
  close: "Close",
  description: "Every page of this site, and how to reach us.",
  visit: "Visit",
  contact: "Say hello",
  follow: "Follow",
  newTab: "opens in a new tab",
};

const eyebrow = "font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase";
const plainLink =
  "rounded-sm underline decoration-foreground/25 decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A navbar for the sites that keep the page quiet: at rest only the mark and
 * a Menu button, at every screen size. The button opens a full-screen overlay
 * (a modal dialog, so focus moves in, stays in, returns to the button, and
 * Escape or Close leaves) with the pages in very large type under a two-digit
 * index, the current one marked with a dot and aria-current, and a second
 * column with the address, email, phone and profiles. While one link is under
 * the pointer or the keyboard the titles of the others soften, to half their
 * strength, which is still 3:1 against the page. The links arrive one
 * after another with a short stagger, and simply appear under reduced motion.
 * Choosing a link closes the overlay. Where MobileMenu serves phones, this is
 * the whole navigation on every screen. No state of its own, so it renders on
 * the server and a Server Component can pass its router's Link as linkAs.
 */
export function NavbarFullscreenMenu({ brand, links, contact, currentHref, linkAs: Link = "a", menuLabel = "Menu", sticky = true, labels: custom, className, ...props }: NavbarFullscreenMenuProps) {
  const words = { ...LABELS, ...custom };
  const arrival = (index: number) => ({ animationDelay: `${140 + index * 65}ms` });
  const hasContact = Boolean(contact && (contact.address?.length || contact.email || contact.phone || contact.social?.length));

  return (
    <header data-slot="navbar-fullscreen-menu" className={cn("z-40 w-full border-b border-border bg-background", sticky && "sticky top-0", className)} {...props}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="shrink-0">{brand}</div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full pr-3.5 pl-4">
              {menuLabel}
              <IconMenu />
            </Button>
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none data-[state=closed]:animate-rhs-fade-out data-[state=open]:animate-rhs-fade-in sm:max-w-none"
          >
            <DialogTitle className="sr-only">{menuLabel}</DialogTitle>
            <DialogDescription className="sr-only">{words.description}</DialogDescription>

            {/* The same height and the same margins as the bar, so Close sits exactly where Menu was and the button seems to turn into it. */}
            <div className="mx-auto flex h-16 w-full max-w-6xl shrink-0 items-center justify-between px-4 sm:px-6">
              <div className="shrink-0">{brand}</div>
              <DialogClose asChild>
                <Button variant="outline" size="sm" className="rounded-full pr-4 pl-3.5">
                  <IconClose />
                  {words.close}
                </Button>
              </DialogClose>
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto grid min-h-full w-full max-w-6xl content-between gap-14 px-4 pt-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:gap-20 lg:pt-10 lg:pb-14">
                <nav aria-label={menuLabel}>
                  <ul className="group/links grid">
                    {links.map((link, index) => {
                      const here = link.href === currentHref;
                      return (
                        <li key={`${link.label}-${link.href}`} style={arrival(index)} className="animate-rhs-menu-link-in border-t border-border first:border-t-0 motion-reduce:animate-none">
                          <DialogClose asChild>
                            <Link
                              href={link.href}
                              aria-current={here ? "page" : undefined}
                              className="group/link flex flex-wrap items-baseline gap-x-5 gap-y-1 py-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:grid sm:grid-cols-[2.5rem_auto_minmax(4.5rem,1fr)] sm:gap-x-8 sm:py-4"
                            >
                              <span aria-hidden="true" className="w-8 shrink-0 font-mono text-xs tracking-wide text-muted-foreground tabular-nums sm:w-10 sm:text-sm">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="min-w-0 text-[clamp(2.25rem,min(9vw,10vh),5.5rem)] leading-[1.02] font-medium tracking-[-0.055em] transition-[color,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within/links:text-foreground/50 group-hover/links:text-foreground/50 group-hover/link:translate-x-2 group-hover/link:text-foreground! group-focus-visible/link:text-foreground! motion-reduce:transition-none">
                                {link.label}
                                {here ? <span aria-hidden="true" className="ml-3 inline-block size-2.5 rounded-full bg-foreground align-middle sm:ml-4 sm:size-3" /> : null}
                              </span>
                              {/* From sm up the hint has a column of its own and wraps inside it, to two lines at most, instead of dropping under its title. Its first line stays on the title's baseline and the second hangs into the row's padding (the negative margin is one line), so a hint never makes its row taller than the others. */}
                              {link.hint ? <span className="basis-full pl-[3.25rem] text-sm text-muted-foreground sm:-mb-5 sm:line-clamp-2 sm:max-w-[15rem] sm:justify-self-end sm:pl-0 sm:text-right">{link.hint}</span> : null}
                            </Link>
                          </DialogClose>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {hasContact && contact ? (
                  <div style={arrival(links.length)} className="grid animate-rhs-menu-link-in content-start gap-9 motion-reduce:animate-none lg:pt-4">
                    {contact.address?.length ? (
                      <section className="grid gap-3">
                        <h3 className={eyebrow}>{words.visit}</h3>
                        <address className="text-base leading-relaxed not-italic">
                          {contact.address.map((line, index) => (
                            <span key={`${line}-${index}`} className="block">
                              {line}
                            </span>
                          ))}
                        </address>
                      </section>
                    ) : null}

                    {contact.email || contact.phone ? (
                      <section className="grid gap-3">
                        <h3 className={eyebrow}>{words.contact}</h3>
                        <ul className="grid gap-1.5">
                          {contact.email ? (
                            <li>
                              <a href={`mailto:${contact.email}`} className={cn(plainLink, "text-xl font-medium tracking-[-0.02em] break-words")}>
                                {contact.email}
                              </a>
                            </li>
                          ) : null}
                          {contact.phone ? (
                            <li>
                              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className={cn(plainLink, "text-base tabular-nums")}>
                                {contact.phone}
                              </a>
                            </li>
                          ) : null}
                        </ul>
                      </section>
                    ) : null}

                    {contact.social?.length ? (
                      <section className="grid gap-3">
                        <h3 className={eyebrow}>{words.follow}</h3>
                        <ul className="grid gap-1.5">
                          {contact.social.map((profile) => (
                            <li key={`${profile.label}-${profile.href}`}>
                              <a href={profile.href} target="_blank" rel="noopener noreferrer" className={cn(plainLink, "inline-flex items-center gap-1 text-base")}>
                                {profile.label}
                                <IconArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                                <span className="sr-only"> ({words.newTab})</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
