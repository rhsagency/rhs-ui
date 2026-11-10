import type { ComponentProps, ElementType, ReactNode } from "react";

import { OnepageBar, type OnepageSection } from "@rhs-ui/marketing/navbar-onepage/onepage-bar";

export type { OnepageSection } from "@rhs-ui/marketing/navbar-onepage/onepage-bar";

export interface NavbarOnepageProps extends Omit<ComponentProps<"header">, "children" | "onClick"> {
  /** Your mark. It is wrapped in a link that takes the reader back to the top. */
  brand: ReactNode;
  /** Where the mark links. "#top" scrolls to the top of the page, with or without an element of that id. Pass "/" with your router's Link to leave the page. */
  brandHref?: string;
  /** The accessible name of the mark's link, when the mark is only a picture. */
  brandLabel?: string;
  /** The sections of the page, in order: each link scrolls to the element with that id. */
  sections: readonly OnepageSection[];
  /** The call to action: on the right, and at the foot of the phone menu. A link to a section (href="#contact") scrolls like the rest. */
  action?: ReactNode;
  /** The pixels the bar covers. A section counts as current once its top passes this line, and a link scrolls it to rest just below. Match it to the scroll-margin of your sections. */
  offset?: number;
  /** The section to mark as current. Leave it out and the bar follows the scroll. */
  currentId?: string;
  /** Called with the id of the section a link took the reader to. */
  onNavigate?: (id: string) => void;
  /** Renders the mark's link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Keep the bar at the top of the window as the page scrolls. On by default. */
  sticky?: boolean;
  /** The name of the menu button, and the title of the sheet it opens on a phone. */
  menuLabel?: string;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
}

/**
 * The navbar for a site that lives on one page: the mark on the left (it
 * scrolls to the top), a link to each section in the middle, with the one in
 * view marked as you scroll, and a call to action on the right. Links are real
 * fragment links, so they work before any script loads; give each section a
 * scroll-margin as tall as the bar (scroll-mt-20 for the default offset) so
 * they also clear it when a visitor arrives with the hash in the address. On a
 * phone the links move into a sheet that closes itself when one is chosen and
 * then moves focus to that section's heading. Scrolling is smooth, and instant
 * under reduced motion. For tradespeople, studios and event pages.
 */
export function NavbarOnepage({
  brand,
  brandHref = "#top",
  brandLabel,
  sections,
  action,
  offset = 80,
  currentId,
  onNavigate,
  linkAs: Link = "a",
  sticky = true,
  menuLabel = "Menu",
  navLabel = "Sections",
  ...props
}: NavbarOnepageProps) {
  return (
    <OnepageBar
      brand={
        <Link href={brandHref} aria-label={brandLabel} className="inline-flex rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          {brand}
        </Link>
      }
      sections={sections}
      action={action}
      offset={offset}
      currentId={currentId}
      onNavigate={onNavigate}
      sticky={sticky}
      menuLabel={menuLabel}
      navLabel={navLabel}
      {...props}
    />
  );
}
