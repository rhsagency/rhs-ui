import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconMoreHorizontal, IconSearch } from "@rhs-ui/icons";
import { SectionScroller } from "@rhs-ui/marketing/docs-header/section-scroller";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { SearchTrigger } from "@rhs-ui/primitives/search-trigger";
import { cn } from "@/lib/utils";

export interface DocsHeaderSection {
  label: string;
  href: string;
}

export interface DocsHeaderLink {
  /** Where it goes, in words: "GitHub". It is the accessible name of the icon. */
  label: string;
  href: string;
  /** The icon, 16px to 18px. */
  icon: ReactNode;
  /** These links usually leave the docs, so they open in a new tab with rel="noopener noreferrer" and say so. Set false for one that does not. */
  external?: boolean;
}

export interface DocsHeaderLabels {
  /** The name of the icon button that replaces the search field below sm. */
  search: string;
  /** The name of the menu the icon links fold into below md. */
  links: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface DocsHeaderProps extends ComponentProps<"header"> {
  /** Your mark and the name of the docs, usually already a link home. */
  brand: ReactNode;
  /** The top-level sections, in the second row: Guides, API reference, Examples. */
  sections: readonly DocsHeaderSection[];
  /** The path of the current page; the section it matches is underlined and gets aria-current="page". */
  currentHref?: string;
  /** Opens your command palette or search overlay. The field and the shortcut both call it. */
  onSearchOpen: () => void;
  /** The letter for the shortcut with Ctrl or Cmd. */
  shortcutKey?: string;
  /** The text in the search field. */
  searchPlaceholder?: string;
  /** The repository, the community: icon links on the right. Below md they fold into one menu. */
  links?: readonly DocsHeaderLink[];
  /** A theme toggle or a version select: one compact control at the end of the first row. It stays on a phone, so keep it small. */
  children?: ReactNode;
  /** Renders the section links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Keep both rows at the top of the window as the page scrolls. On by default. */
  sticky?: boolean;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<DocsHeaderLabels>;
}

const LABELS: DocsHeaderLabels = { search: "Search", links: "Links", newTab: "opens in a new tab" };

const sectionClass =
  "relative inline-flex h-11 items-center whitespace-nowrap rounded-md px-3 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 aria-[current=page]:font-medium aria-[current=page]:text-foreground after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-20 aria-[current=page]:after:opacity-100 motion-reduce:transition-none motion-reduce:after:transition-none";

/**
 * The top bar of a documentation site, in two rows. The first holds the mark,
 * a search field that is really a button opening your own palette (with the
 * right shortcut for the platform, and an icon button in its place below sm),
 * icon links to the repository and the community, and a slot for a theme or
 * version control. The second lists the
 * top-level sections with the current one underlined. The sections are plain
 * links with aria-current, not an ARIA tablist, because each one goes to
 * another page. Under md the section row scrolls sideways with fade edges and
 * the icon links fold into one menu. Pairs with a docs sidebar on the left and
 * an on-this-page rail on the right. onSearchOpen is a function, so use the
 * header from a Client Component, next to the palette it opens.
 */
export function DocsHeader({
  brand,
  sections,
  currentHref,
  onSearchOpen,
  shortcutKey,
  searchPlaceholder = "Search the docs…",
  links = [],
  children,
  linkAs: Link = "a",
  sticky = true,
  navLabel = "Sections",
  labels: custom,
  className,
  ...props
}: DocsHeaderProps) {
  const words = { ...LABELS, ...custom };
  const external = (link: DocsHeaderLink) => link.external !== false;
  const newTab = (link: DocsHeaderLink) => (external(link) ? { target: "_blank", rel: "noopener noreferrer" } : {});

  return (
    <header data-slot="docs-header" className={cn("z-40 w-full bg-background", sticky && "sticky top-0", className)} {...props}>
      {/* Two tracks below sm, where the search field is not drawn: a third, empty one would still keep its gaps and push the right-hand cluster out. */}
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-6 sm:px-6">
        <div className="shrink-0 whitespace-nowrap">{brand}</div>

        {/* Always mounted, so the keyboard shortcut works on a phone too; only the field is hidden there. */}
        <div className="hidden min-w-0 justify-center sm:flex">
          <SearchTrigger onOpen={onSearchOpen} shortcutKey={shortcutKey} placeholder={searchPlaceholder} className="max-w-md" />
        </div>

        <div className="col-start-2 flex items-center justify-self-end gap-1 sm:col-start-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground sm:hidden" aria-label={words.search} onClick={onSearchOpen}>
            <IconSearch size={18} />
          </Button>
          {links.length ? (
            <ul className="hidden items-center gap-0.5 md:flex">
              {links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <a href={link.href} {...newTab(link)}>
                      {link.icon}
                      <span className="sr-only">
                        {link.label}
                        {external(link) ? ` (${words.newTab})` : ""}
                      </span>
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {links.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground md:hidden" aria-label={words.links}>
                  <IconMoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {links.map((link) => (
                  <DropdownMenuItem key={`${link.label}-${link.href}`} asChild>
                    <a href={link.href} {...newTab(link)}>
                      {link.icon}
                      {link.label}
                      {external(link) ? <span className="sr-only"> ({words.newTab})</span> : null}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {children}
        </div>
      </div>

      <nav aria-label={navLabel} className="border-b border-border">
        <SectionScroller className="mx-auto max-w-6xl">
          <ul className="flex h-11 w-max min-w-full items-stretch gap-1 px-1 sm:px-3">
            {sections.map((section) => (
              <li key={`${section.label}-${section.href}`}>
                <Link href={section.href} aria-current={section.href === currentHref ? "page" : undefined} className={sectionClass}>
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </SectionScroller>
      </nav>
    </header>
  );
}
