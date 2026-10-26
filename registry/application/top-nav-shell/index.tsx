import type { ComponentProps, ElementType, ReactNode } from "react";

import { TopNavHeader } from "@rhs-ui/application/top-nav-shell/header";
import { TopNavMenu } from "@rhs-ui/application/top-nav-shell/menu";
import { PageHeader, type PageHeaderProps } from "@rhs-ui/primitives/page-header";
import { SheetClose } from "@rhs-ui/primitives/sheet";
import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { cn } from "@/lib/utils";

export interface TopNavLink {
  label: string;
  href: string;
  /** Shown in the phone menu only, where each link has room for one. */
  icon?: ReactNode;
  /** A count or a short word after the label: "3", "New". */
  badge?: string;
}

export interface TopNavShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark and name, usually already a link home. */
  brand: ReactNode;
  /** The areas of the product. Four short links fit one row at md next to a labelled action; five need collapse="lg". More belong in a sidebar. */
  links: readonly TopNavLink[];
  /** The path of the current page; its link gets aria-current="page". */
  currentHref: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** A search trigger, usually SearchTrigger. It sits in the header from the collapse width and at the top of the menu below it. */
  search?: ReactNode;
  /** Buttons next to the account: "New project", a bell. From the collapse width they sit in the header; below it they move to the foot of the menu. */
  actions?: ReactNode;
  /** The account button or avatar menu, always in the header. */
  account?: ReactNode;
  /** The title, description and actions of the page, drawn with PageHeader at the top of the content. */
  pageHeader?: Omit<PageHeaderProps, "className">;
  /** The foot of the page: legal links, a language. */
  footer?: ReactNode;
  /** The page. */
  children: ReactNode;
  /** How wide the header and the content run: 72rem (default), 80rem, or the whole width. */
  width?: "default" | "wide" | "full";
  /**
   * The width from which the links, the search and the actions sit in the
   * header row; below it they move into a sheet opened from a menu button.
   * "md" (default) is 768px. Five links next to a labelled action need about
   * 820px, so choose "lg" (1024px) for them: the row would crowd a tablet.
   */
  collapse?: "md" | "lg";
  /** The skip link's text. Default "Skip to content". */
  skipLabel?: string;
  /** The id of the main landmark, which the skip link points at. Default "main". */
  mainId?: string;
  /** The menu button's name below the collapse width. Default "Open menu". */
  menuLabel?: string;
}

const WIDTH = { default: "max-w-6xl", wide: "max-w-7xl", full: "max-w-none" } as const;

/** What changes with the collapse width, written out whole so Tailwind generates every class. */
const COLLAPSE = {
  md: {
    brand: "md:mr-3",
    links: "hidden md:block",
    // Between md and lg the row has no room for a search field: a SearchTrigger shrinks to its icon (its words stay for screen readers).
    search: "hidden min-w-0 md:block md:max-lg:[&_[data-slot=search-trigger]]:w-9 md:max-lg:[&_[data-slot=search-trigger]]:justify-center md:max-lg:[&_[data-slot=search-trigger]]:px-0 md:max-lg:[&_[data-slot=search-trigger]>span]:sr-only",
    actions: "hidden items-center gap-2 md:flex",
  },
  lg: {
    brand: "lg:mr-3",
    links: "hidden lg:block",
    search: "hidden min-w-0 lg:block",
    actions: "hidden items-center gap-2 lg:flex",
  },
} as const;

/**
 * An app frame with the navigation along the top: a sticky 56px header
 * with the brand, the links (the current one marked with aria-current), a
 * search trigger, your actions and the account, then an optional page
 * header, the page in a width-limited container and an optional footer.
 * Below the collapse width (md, or lg when you ask for it) the links move
 * into a sheet opened from a menu button, with the search at its top and the
 * actions at its foot; the sheet closes by itself if the window grows past
 * that width. The header draws its bottom border only once the page has
 * scrolled. It suits a product with five areas or fewer, where a sidebar
 * would be mostly empty. The shell renders on the server, so a Server
 * Component can pass its router's Link as linkAs; only the scroll border of
 * the header and the menu sheet are client pieces.
 */
export function TopNavShell({
  brand,
  links,
  currentHref,
  linkAs: Link = "a",
  search,
  actions,
  account,
  pageHeader,
  footer,
  children,
  width = "default",
  collapse = "md",
  skipLabel = "Skip to content",
  mainId = "main",
  menuLabel = "Open menu",
  className,
  ...props
}: TopNavShellProps) {
  const frame = cn("mx-auto w-full px-4 sm:px-6", WIDTH[width]);
  const row = COLLAPSE[collapse];
  const current = (href: string) => (href === currentHref || currentHref.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <div data-slot="top-nav-shell" className={cn("relative flex min-h-dvh flex-col bg-background text-foreground", className)} {...props}>
      <SkipLink target={mainId} label={skipLabel} />
      <TopNavHeader>
        <div className={cn(frame, "flex h-14 items-center gap-2")}>
          <TopNavMenu label={menuLabel} brand={brand} collapse={collapse}>
            {/* w-full beats a width class of your own, so the search fills the menu like the rows under it. */}
            {search ? <div className="px-4 pt-4 [&>*]:w-full! [&>*]:max-w-none!">{search}</div> : null}
            <nav aria-label="Main" className="relative grid gap-0.5 overflow-y-auto p-3">
              {links.map((link) => (
                <SheetClose key={`${link.label}-${link.href}`} asChild>
                  <Link
                    href={link.href}
                    aria-current={current(link.href)}
                    className="flex h-11 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground [&_svg]:size-[18px] [&_svg]:shrink-0"
                  >
                    {link.icon}
                    <span className="flex-1 truncate">{link.label}</span>
                    {link.badge ? <span className="rounded-full bg-background px-1.5 font-mono text-[0.6875rem] tabular-nums">{link.badge}</span> : null}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            {actions ? <div className="mt-auto grid gap-2 border-t border-border p-4 *:w-full">{actions}</div> : null}
          </TopNavMenu>

          <div data-slot="top-nav-shell-brand" className={cn("flex shrink-0 items-center text-sm font-semibold", row.brand)}>
            {brand}
          </div>

          <nav aria-label="Main" className={row.links}>
            <ul className="flex items-center gap-0.5">
              {links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link
                    href={link.href}
                    aria-current={current(link.href)}
                    className="flex h-8 items-center gap-1.5 rounded-md px-3 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                  >
                    {link.label}
                    {link.badge ? <span className="rounded-full bg-background px-1.5 font-mono text-[0.6875rem] tabular-nums">{link.badge}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            {search ? <div className={row.search}>{search}</div> : null}
            {actions ? <div className={row.actions}>{actions}</div> : null}
            {account}
          </div>
        </div>
      </TopNavHeader>

      <main id={mainId} tabIndex={-1} className={cn(frame, "flex-1 py-8 outline-none sm:py-10")}>
        {pageHeader ? <PageHeader {...pageHeader} className="mb-8" /> : null}
        {children}
      </main>

      {footer ? (
        <footer data-slot="top-nav-shell-footer" className="border-t border-border">
          <div className={cn(frame, "py-6 text-sm text-muted-foreground")}>{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
