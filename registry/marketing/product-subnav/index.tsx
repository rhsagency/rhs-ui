import type { ComponentProps, ElementType, ReactNode } from "react";

import { subnavLink } from "@rhs-ui/marketing/product-subnav/styles";
import { SubnavBar } from "@rhs-ui/marketing/product-subnav/subnav-bar";

export interface ProductSubnavLink {
  /** The link text: "Specs". Keep it to a word or two. */
  label: string;
  /** In pages mode the product's other page: "/halcyon/specs". In anchors mode a fragment link to a section of this page: "#specs". */
  href: string;
}

export interface ProductSubnavProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The product's name. It is set large above the bar and, once that has scrolled away, small at the bar's left. */
  name: string;
  /** One line under the big name: what the product is. */
  tagline?: string;
  /** The big name's element: "p" (the default, so the page's own heading stays the only h1), "h1" on the product's overview page, or "h2". */
  nameAs?: "h1" | "h2" | "p";
  /** The product's pages, or the sections of this page. Four or five read best. */
  links: readonly ProductSubnavLink[];
  /** The buy or try action, pinned to the right of the bar: a Button, or a link styled as one. Give it size="sm". */
  action?: ReactNode;
  /** The path of the current page, marked with aria-current="page". In anchors mode it holds the mark on one section instead of following the scroll. */
  currentHref?: string;
  /** "pages": the links go to the product's other pages, and the current one is marked with aria-current="page". "anchors": they jump within this page and follow the scroll, marked with aria-current="location". */
  mode?: "pages" | "anchors";
  /** The height in pixels of whatever is fixed above the bar, the main navbar, so the bar sticks just under it and a link scrolls its section clear of both. */
  offset?: number;
  /** Renders the links of pages mode. Defaults to "a"; pass your router's Link. Anchor links are plain fragment links. */
  linkAs?: ElementType;
  /** The name of the navigation landmark. Defaults to the product's name. */
  navLabel?: string;
}

/**
 * The local navigation of one product on a marketing site. It starts tall, the
 * product's name set large with a tagline and the links beneath it; as the page
 * scrolls the big name goes and the links stay as a 56px bar, sticky under the
 * main navbar: the name at its left, the links in the middle, the buy or try
 * action at its right. In pages mode the links go to the product's other pages
 * and the current one carries aria-current="page"; in anchors mode they jump
 * within the page and follow the scroll with aria-current="location". On a
 * phone the links are a row of their own under the name that scrolls sideways,
 * the action pinned at the right end of that row. Unlike AnchorNav it carries the product's
 * identity and its action. Put it directly in the element that holds the page:
 * a sticky bar stays for as long as its parent is on screen.
 */
export function ProductSubnav({ name, tagline, nameAs: Name = "p", links, action, currentHref, mode = "pages", offset = 0, linkAs: Link = "a", navLabel, ...props }: ProductSubnavProps) {
  const pages = mode === "pages";

  return (
    <>
      <div data-slot="product-subnav-intro" className="px-4 pt-14 pb-3 text-center sm:px-6 sm:pt-20 md:pb-12">
        <Name className="text-5xl leading-none font-medium tracking-[-0.055em] text-balance sm:text-6xl">{name}</Name>
        {tagline ? <p className="mx-auto mt-4 max-w-xl text-lg leading-snug text-pretty text-muted-foreground">{tagline}</p> : null}
      </div>
      <SubnavBar name={name} offset={offset} navLabel={navLabel ?? name} sections={pages ? undefined : links} currentHref={pages ? undefined : currentHref} action={action} {...props}>
        {pages
          ? links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <Link href={link.href} aria-current={link.href === currentHref ? "page" : undefined} className={subnavLink}>
                  {link.label}
                </Link>
              </li>
            ))
          : null}
      </SubnavBar>
    </>
  );
}
