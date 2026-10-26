import { Fragment, type ComponentProps, type ElementType, type ReactNode } from "react";

import { InsetSidebarMain } from "@rhs-ui/application/inset-sidebar-shell/main";
import { InsetSidebarMenu } from "@rhs-ui/application/inset-sidebar-shell/mobile-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@rhs-ui/primitives/breadcrumb";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { cn } from "@/lib/utils";

export interface InsetSidebarCrumb {
  label: string;
  /** Leave it out for a crumb that is only a label. The last crumb is the page itself and never links. */
  href?: string;
}

export interface InsetSidebarHeader {
  /** The trail to this page, shown in the header. Below lg only the last crumb stays: the header has no room for a trail that would shrink to a few letters. */
  breadcrumbs?: readonly InsetSidebarCrumb[];
  /** Buttons on the right of the header: share, a primary action. */
  actions?: ReactNode;
}

export interface InsetSidebarShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark and name, top of the sidebar. */
  brand?: ReactNode;
  /** The navigation, usually a SidebarNav (which is itself the navigation landmark). It scrolls on its own when it is long. */
  nav: ReactNode;
  /** The foot of the sidebar: the account button. */
  footer?: ReactNode;
  /** The breadcrumbs and actions in the header of the page surface. */
  header?: InsetSidebarHeader;
  /** The page. It scrolls inside the surface; the sidebar never moves. */
  children: ReactNode;
  /** Renders the breadcrumb links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The skip link's text. Default "Skip to content". */
  skipLabel?: string;
  /** The id of the main landmark, which the skip link points at. Default "main". */
  mainId?: string;
  /** The menu button's name below md. Default "Open navigation". */
  menuLabel?: string;
  /** Gives the page its own padding (default). Turn it off for a full-bleed page such as a table. */
  padded?: boolean;
}

/**
 * An app frame where the sidebar sits straight on the page background and
 * the page is a bordered, rounded surface set in beside it, under a
 * breadcrumb header. The surface scrolls on its own, so a long page never
 * moves the sidebar, and the depth comes from one border and one radius:
 * no shadows, no dividers. Below md the sidebar becomes a left sheet opened
 * from a menu button in the header, and focus returns to that button when it
 * closes. The first pixels of a scrolled page fade out under the header; at
 * rest nothing fades, so a full-bleed table keeps its first row. The
 * landmarks are the navigation you pass, the header and main, and the skip
 * link points at main. It fills its container: it is as tall as the
 * viewport unless you give it a height.
 */
export function InsetSidebarShell({
  brand,
  nav,
  footer,
  header,
  children,
  linkAs: Link = "a",
  skipLabel = "Skip to content",
  mainId = "main",
  menuLabel = "Open navigation",
  padded = true,
  className,
  ...props
}: InsetSidebarShellProps) {
  const crumbs = header?.breadcrumbs ?? [];
  const hasHeader = crumbs.length > 0 || Boolean(header?.actions);
  const sidebar = (
    <>
      {brand ? (
        <div data-slot="inset-sidebar-shell-brand" className="flex h-14 shrink-0 items-center px-5 text-sm font-semibold md:px-4">
          {brand}
        </div>
      ) : null}
      <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
        {/* min-w-0 all the way down lets a long label in a grid-based nav truncate instead of widening the column. */}
        <div className={cn("px-3 pb-3 md:px-2 [&_nav_*]:min-w-0", brand ? "" : "pt-3")}>{nav}</div>
      </ScrollArea>
      {footer ? (
        <div data-slot="inset-sidebar-shell-footer" className="shrink-0 p-3 md:p-2">
          {footer}
        </div>
      ) : null}
    </>
  );

  return (
    <div data-slot="inset-sidebar-shell" className={cn("flex h-dvh bg-muted/50 text-foreground md:p-2 md:pl-0", className)} {...props}>
      <SkipLink target={mainId} label={skipLabel} />
      <div data-slot="inset-sidebar-shell-sidebar" className="hidden w-60 shrink-0 flex-col md:flex">
        {sidebar}
      </div>
      <div data-slot="inset-sidebar-shell-surface" className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl md:border md:border-border">
        <header className={cn("flex h-14 shrink-0 items-center gap-2 px-3 md:px-5", !hasHeader && "md:hidden")}>
          <InsetSidebarMenu label={menuLabel}>{sidebar}</InsetSidebarMenu>
          {crumbs.length ? (
            <Breadcrumb className="min-w-0 flex-1">
              {/* The list clips for truncation, which would also clip the 3px focus ring of a link: -m-1 p-1 gives the ring room inside the clip box without moving anything. */}
              <BreadcrumbList className="-m-1 flex-nowrap overflow-hidden p-1">
                {crumbs.map((crumb, index) => {
                  const last = index === crumbs.length - 1;
                  // The page you are on stays whole; the crumbs before it give way first, and below lg they are gone: beside the actions they would shrink to a few letters each.
                  return (
                    <Fragment key={`${crumb.label}-${index}`}>
                      <BreadcrumbItem className={last ? "max-w-full shrink-0" : "min-w-0 max-lg:hidden"}>
                        {last ? (
                          <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                        ) : crumb.href ? (
                          <BreadcrumbLink asChild className="truncate">
                            <Link href={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <span className="truncate">{crumb.label}</span>
                        )}
                      </BreadcrumbItem>
                      {last ? null : <BreadcrumbSeparator className="shrink-0 max-lg:hidden" />}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <div className="flex-1" />
          )}
          {header?.actions ? <div className="flex shrink-0 items-center gap-2">{header.actions}</div> : null}
        </header>
        <InsetSidebarMain id={mainId} className={cn(padded && "px-4 pt-4 pb-10 sm:px-6 sm:pt-5 lg:px-8")}>
          {children}
        </InsetSidebarMain>
      </div>
    </div>
  );
}
