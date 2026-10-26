import { Fragment, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowLeft } from "@rhs-ui/icons";
import { SettingsTabRow } from "@rhs-ui/application/settings-shell/tab-row";
import { PageHeader } from "@rhs-ui/primitives/page-header";
import { Separator } from "@rhs-ui/primitives/separator";
import { SidebarNav, type SidebarNavGroup, type SidebarNavLink } from "@rhs-ui/primitives/sidebar-nav";
import { cn } from "@/lib/utils";

export type SettingsLink = SidebarNavLink;
export type SettingsGroup = SidebarNavGroup;

export interface SettingsShellProps extends Omit<ComponentProps<"div">, "title"> {
  /** The pages of the settings, in labelled groups: Account, Workspace, Developers. */
  groups: readonly SettingsGroup[];
  /** The path of the page being shown; its link is marked aria-current="page". */
  currentHref: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The page's title. */
  title: string;
  /** The title's element: "h1" (the default) because this is the page, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  /** One or two sentences under the title: what this page is for. */
  description?: string;
  /** Buttons at the right of the title: Save, View profile. */
  actions?: ReactNode;
  /** Adds a "Back to app" link above the navigation. */
  backHref?: string;
  /** The back link's text. Default "Back to app". */
  backLabel?: string;
  /** The navigation's name for screen readers. Default "Settings". */
  label?: string;
  /** The sections of this page, one after another. */
  children: ReactNode;
}

/**
 * A settings layout: the pages in grouped side navigation, then a page
 * title and one focused column of at most 42rem, so cards and rows keep a
 * readable line. On a phone the groups become a row of links that scrolls
 * sideways with faded edges; from md the navigation sticks under the top of
 * the viewport on a tall page. The column holds one section or twenty:
 * sections follow each other with the same gap, so account and workspace
 * pages are built from the same pieces. It renders on the server; pass your
 * router's Link as linkAs.
 */
export function SettingsShell({
  groups,
  currentHref,
  linkAs: Link = "a",
  title,
  titleAs,
  description,
  actions,
  backHref,
  backLabel = "Back to app",
  label = "Settings",
  children,
  className,
  ...props
}: SettingsShellProps) {
  const current = (href: string) => (href === currentHref || currentHref.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <div
      data-slot="settings-shell"
      className={cn("mx-auto grid w-full gap-x-12 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-[13.5rem_minmax(0,42rem)] md:justify-center md:py-12", className)}
      {...props}
    >
      <div className="relative min-w-0 md:sticky md:top-8 md:max-h-[calc(100dvh-4rem)] md:-ml-1 md:self-start md:overflow-y-auto md:px-1">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex h-8 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 md:px-2.5"
          >
            <IconArrowLeft className="size-4" />
            {backLabel}
          </Link>
        ) : null}
        <div className="mt-4 hidden md:block">
          <SidebarNav label={label} groups={groups} currentHref={currentHref} linkAs={Link} />
        </div>
        <SettingsTabRow label={label} className="md:hidden">
          {groups.map((group, index) => (
            <Fragment key={`${group.label ?? "group"}-${index}`}>
              {index > 0 ? (
                <li aria-hidden="true" className="flex shrink-0 items-center px-1">
                  <Separator orientation="vertical" className="h-4" />
                </li>
              ) : null}
              {group.links.map((link) => (
                <li key={`${link.label}-${link.href}`} className="shrink-0">
                  <Link
                    href={link.href}
                    aria-current={current(link.href)}
                    className="inline-flex h-10 items-center border-b-2 border-transparent px-3 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset aria-[current=page]:border-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </Fragment>
          ))}
        </SettingsTabRow>
      </div>
      <div data-slot="settings-shell-content" className="min-w-0">
        <PageHeader title={title} titleAs={titleAs} description={description} actions={actions} />
        <div className="mt-8 grid gap-8">{children}</div>
      </div>
    </div>
  );
}
