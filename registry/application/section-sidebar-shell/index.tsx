import type { ComponentProps, ElementType, ReactNode } from "react";

import { SectionRow } from "@rhs-ui/application/section-sidebar-shell/section-row";
import { SidebarMenu } from "@rhs-ui/application/section-sidebar-shell/sidebar-menu";
import { SidebarNav, type SidebarNavGroup } from "@rhs-ui/primitives/sidebar-nav";
import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { cn } from "@/lib/utils";

export interface ShellSection {
  /** Identifies the section: it is what `activeSection` and the keys of `sidebars` use. */
  id: string;
  /** The section's name in the header, and the sheet's heading below md. */
  label: string;
  /** Where the section starts. A real link, so middle click and copy link work. */
  href: string;
}

export interface SectionSidebarShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark and name, at the left of the header, usually already a link home. */
  brand: ReactNode;
  /** The top-level sections of the product, in the header. Five or fewer fit one row from md; below it they scroll. */
  sections: readonly ShellSection[];
  /** The `id` of the current section. It is underlined and carries aria-current. */
  activeSection: string;
  /** The pages of each section, by section id, in the SidebarNav shape. A section without an entry has no sidebar. */
  sidebars: Readonly<Record<string, readonly SidebarNavGroup[]>>;
  /** The path of the page being shown; its link in the sidebar is marked aria-current="page". */
  currentHref: string;
  /** Renders the links of the sections and the sidebar. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The account button or avatar menu, at the right of the header. */
  account?: ReactNode;
  /** The foot of the sidebar: a usage meter, a help link. It is repeated in the sheet below md. */
  sidebarFooter?: ReactNode;
  /** Gives the page its own padding (default). Turn it off for a full-bleed page such as a table. */
  padded?: boolean;
  /** The skip link's text. Default "Skip to content". */
  skipLabel?: string;
  /** The id of the main landmark, which the skip link points at. Default "main". */
  mainId?: string;
  /** The menu button's name below md. Default "Open navigation". */
  menuLabel?: string;
  /** The sections row's name for screen readers. Default "Sections". */
  sectionsLabel?: string;
  /** The name of the sidebar and of the sheet's description; `{section}` becomes the current section's name. Default "{section} pages". */
  pagesLabel?: string;
  /** The page. It scrolls inside the shell; the header and the sidebar never move. */
  children: ReactNode;
}

const SECTION_LINK = [
  "group/section relative flex h-11 items-center px-1 text-sm whitespace-nowrap text-muted-foreground outline-none md:h-14",
  "transition-colors duration-150 hover:text-foreground motion-reduce:transition-none aria-[current=true]:text-foreground",
  "after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-foreground",
  "after:transition-transform after:duration-200 motion-reduce:after:transition-none aria-[current=true]:after:scale-x-100",
].join(" ");

/** The label sits in a pill that shows hover and keyboard focus without boxing in the tall link around it. */
const SECTION_LABEL =
  "rounded-md px-2 py-1.5 transition-colors duration-150 group-hover/section:bg-muted group-focus-visible/section:ring-[3px] group-focus-visible/section:ring-ring/40 motion-reduce:transition-none";

/**
 * An app frame with two tiers of navigation: the sections of the product
 * along the top (the current one underlined and marked aria-current), and a
 * sidebar that lists only the pages of that section, so a long product never
 * means a long sidebar. Switching section swaps the sidebar and leaves focus
 * on the link you used. Below md the sidebar is a left sheet opened from a
 * menu button, and the sections become a row of links under the brand that
 * scrolls sideways with faded edges. The header never moves and the page
 * scrolls on its own. It fills its container: it is as tall as the viewport
 * unless you give it a height. It renders on the server, so a Server
 * Component can pass its router's Link as linkAs.
 */
export function SectionSidebarShell({
  brand,
  sections,
  activeSection,
  sidebars,
  currentHref,
  linkAs: Link = "a",
  account,
  sidebarFooter,
  padded = true,
  skipLabel = "Skip to content",
  mainId = "main",
  menuLabel = "Open navigation",
  sectionsLabel = "Sections",
  pagesLabel = "{section} pages",
  children,
  className,
  ...props
}: SectionSidebarShellProps) {
  const active = sections.find((section) => section.id === activeSection);
  const groups = sidebars[activeSection] ?? [];
  const pages = pagesLabel.replace("{section}", active?.label ?? "").trim();
  const nav = groups.length ? <SidebarNav key={activeSection} label={pages} groups={groups} currentHref={currentHref} linkAs={Link} /> : null;

  return (
    <div data-slot="section-sidebar-shell" className={cn("relative flex h-dvh min-w-0 flex-col bg-background text-foreground", className)} {...props}>
      <SkipLink target={mainId} label={skipLabel} />

      {/* The header's rule is drawn under the links, so the current section's underline lies over it. */}
      <header
        data-slot="section-sidebar-shell-header"
        className="relative shrink-0 bg-background before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border"
      >
        <div className="flex flex-wrap items-center gap-x-2 px-4 md:flex-nowrap md:gap-x-4">
          <div className="flex h-14 min-w-0 items-center gap-1">
            {nav ? (
              <SidebarMenu label={menuLabel} title={active?.label ?? ""} description={pages} footer={sidebarFooter}>
                {nav}
              </SidebarMenu>
            ) : null}
            <div data-slot="section-sidebar-shell-brand" className="flex shrink-0 items-center text-sm font-semibold">
              {brand}
            </div>
          </div>
          <SectionRow label={sectionsLabel} className="order-last -mx-4 w-[calc(100%_+_2rem)] md:order-none md:mx-0 md:w-auto md:flex-1">
            {sections.map((section) => (
              <li key={section.id} className="shrink-0">
                <Link href={section.href} aria-current={section.id === activeSection ? "true" : undefined} className={SECTION_LINK}>
                  <span className={SECTION_LABEL}>{section.label}</span>
                </Link>
              </li>
            ))}
          </SectionRow>
          {account ? <div className="ml-auto flex h-14 shrink-0 items-center gap-2 md:ml-0">{account}</div> : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {nav ? (
          <aside data-slot="section-sidebar-shell-sidebar" className="hidden w-60 shrink-0 flex-col border-r border-border bg-muted/40 md:flex">
            {/* A plain overflow box: the links are already in the tab order, so the list adds no stop of its own. */}
            <div
              key={activeSection}
              className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]"
            >
              {/* min-w-0 all the way down lets a long label in a grid-based nav truncate instead of widening the column. */}
              <div className="p-3 [&_nav_*]:min-w-0">{nav}</div>
            </div>
            {sidebarFooter ? <div className="shrink-0 border-t border-border p-3">{sidebarFooter}</div> : null}
          </aside>
        ) : null}
        <main
          id={mainId}
          tabIndex={0}
          className={cn(
            "relative min-w-0 flex-1 overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
            padded && "px-4 py-6 sm:px-8 sm:py-8",
          )}
        >
          {children}
        </main>
      </div>

      <p role="status" className="sr-only">
        {active?.label}
      </p>
    </div>
  );
}
