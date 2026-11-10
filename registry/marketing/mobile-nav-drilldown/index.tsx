import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowRight, IconChevronLeft, IconChevronRight, IconClose, IconMenu } from "@rhs-ui/icons";
import { DrilldownBack, DrilldownLeaf, DrilldownOpen, DrilldownPanel, DrilldownSheet, DrilldownStack } from "@rhs-ui/marketing/mobile-nav-drilldown/client";
import { DRILLDOWN_LABELS, ROOT_PANEL, type DrilldownGroup, type DrilldownLabels } from "@rhs-ui/marketing/mobile-nav-drilldown/types";
import { Button } from "@rhs-ui/primitives/button";
import { SheetClose } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export type { DrilldownGroup, DrilldownLabels, DrilldownLink } from "@rhs-ui/marketing/mobile-nav-drilldown/types";

export interface DrilldownMenuProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark, in the bar at the top. */
  brand: ReactNode;
  /** The rows of the root list. A group with links opens a panel; a group without is a plain link. */
  groups: readonly DrilldownGroup[];
  /** The buttons at the foot: sign in, start free. They stay while the panels slide. */
  actions?: ReactNode;
  /** The href of the page you are on: its link gets aria-current and its group is marked. */
  current?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** A button for the top right of the bar, such as the close of a sheet. */
  closeButton?: ReactNode;
  /** The label of the group whose panel is open first. Left out, the root list. */
  defaultGroup?: string;
  /** The name of the navigation landmark, for a site that is not in English or a page with two menus. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<DrilldownLabels>;
}

const panelId = (index: number) => `group-${index}`;

/* Every class is written out in full, because Tailwind only generates what it can read in the source. */
const rowClass =
  "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-4 text-left text-[1.0625rem] font-medium tracking-[-0.01em] outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted motion-reduce:transition-none";
const linkClass =
  "grid gap-0.5 rounded-xl px-4 py-3 outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted motion-reduce:transition-none";
const backClass =
  "inline-flex h-11 items-center gap-1 rounded-lg pr-3 pl-2 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The menu itself, without a sheet around it: the mark and a close slot on
 * top, the stack of panels in the middle and the actions at the foot. The root
 * panel lists the groups; each group with links is a panel of its own that
 * slides in from the right, with a Back row that names where it returns to, a
 * title, a link to the group's own page and then its links. Use it inside your
 * own container, or let MobileNavDrilldown put it in a sheet.
 */
export function DrilldownMenu({ brand, groups, actions, current, linkAs: Link = "a", closeButton, defaultGroup, navLabel = "Main", labels: custom, className, ...props }: DrilldownMenuProps) {
  const words = { ...DRILLDOWN_LABELS, ...custom };
  const isCurrent = (href?: string) => href !== undefined && href === current;
  const holdsCurrent = (group: DrilldownGroup) => isCurrent(group.href) || Boolean(group.links?.some((link) => isCurrent(link.href)));
  const first = defaultGroup === undefined ? -1 : groups.findIndex((group) => group.label === defaultGroup);

  return (
    <div data-slot="drilldown-menu" className={cn("flex h-full min-h-0 flex-col bg-background text-foreground", className)} {...props}>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border pr-2 pl-6">
        <div className="min-w-0">{brand}</div>
        {closeButton}
      </div>

      <nav aria-label={navLabel} className="relative min-h-0 flex-1 overflow-clip">
        <DrilldownStack defaultPanel={first === -1 ? undefined : panelId(first)} className="absolute inset-0">
          <DrilldownPanel id={ROOT_PANEL} label={words.menu}>
            <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              <ul className="grid gap-0.5">
                {groups.map((group, index) => (
                  <li key={`${group.label}-${index}`}>
                    {group.links?.length ? (
                      <DrilldownOpen target={panelId(index)} className={rowClass}>
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="truncate">{group.label}</span>
                          {holdsCurrent(group) ? (
                            <>
                              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground" />
                              <span className="sr-only">({words.currentSection})</span>
                            </>
                          ) : null}
                        </span>
                        <IconChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                      </DrilldownOpen>
                    ) : (
                      <DrilldownLeaf>
                        <Link href={group.href ?? "#"} aria-current={isCurrent(group.href) ? "page" : undefined} className={rowClass}>
                          {group.label}
                        </Link>
                      </DrilldownLeaf>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </DrilldownPanel>

          {groups.map((group, index) =>
            group.links?.length ? (
              <DrilldownPanel key={`${group.label}-${index}`} id={panelId(index)} label={group.label} className="-left-px border-l border-border">
                <div className="shrink-0 px-2 pt-2">
                  <DrilldownBack aria-label={words.back.replace("{name}", words.menu)} className={backClass}>
                    <IconChevronLeft aria-hidden="true" className="size-5" />
                    {words.menu}
                  </DrilldownBack>
                </div>
                <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
                  <h2 className="px-4 pt-3 pb-4 text-[1.75rem] leading-none font-medium tracking-[-0.04em]">{group.label}</h2>
                  <ul className="grid gap-0.5">
                    {group.href ? (
                      <li className="mb-1 border-b border-border pb-1">
                        <DrilldownLeaf>
                          <Link href={group.href} aria-current={isCurrent(group.href) ? "page" : undefined} className={cn(linkClass, "flex items-center justify-between gap-3 text-base font-medium")}>
                            {words.all.replace("{name}", group.label)}
                            <IconArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                          </Link>
                        </DrilldownLeaf>
                      </li>
                    ) : null}
                    {group.links.map((link) => (
                      <li key={`${link.label}-${link.href}`}>
                        <DrilldownLeaf>
                          <Link href={link.href} aria-current={isCurrent(link.href) ? "page" : undefined} className={linkClass}>
                            <span className="text-base font-medium">{link.label}</span>
                            {link.description ? <span className="text-sm leading-snug text-muted-foreground">{link.description}</span> : null}
                          </Link>
                        </DrilldownLeaf>
                      </li>
                    ))}
                  </ul>
                </div>
              </DrilldownPanel>
            ) : null,
          )}
        </DrilldownStack>
      </nav>

      {actions ? <div className="grid shrink-0 gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] *:w-full">{actions}</div> : null}
    </div>
  );
}

export interface MobileNavDrilldownProps extends Pick<DrilldownMenuProps, "brand" | "groups" | "actions" | "current" | "linkAs" | "navLabel" | "labels"> {
  /** Open or closed, when you control it. Pair with onOpenChange. */
  open?: boolean;
  /** Whether the sheet starts open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called when the sheet opens or closes, by the visitor or because a link was followed. */
  onOpenChange?: (open: boolean) => void;
  /** The edge the sheet slides in from. */
  side?: "left" | "right";
  /** Your own button to open the sheet with; it replaces the menu button. */
  trigger?: ReactNode;
  /** Classes for the menu button. It is shown at every width: hide it from md up with className="md:hidden". */
  className?: string;
}

/**
 * The phone menu that navigates the way a native app does. A menu button opens
 * a sheet from the left that holds a stack of panels: the root lists your
 * groups, and a group with links slides them in as a panel of its own, with a
 * Back row that names where it returns to. Focus moves to the first row of a
 * panel that opens and back to the group's row when you return, Escape goes up
 * a level and only then closes the sheet, and the panels you cannot see are
 * inert, so their links are never tabbable. Reduced motion swaps the slide for
 * an instant change. Better than folding groups open in place once a group
 * holds more than six links. The sheet starts over at the root each time it
 * opens, and every link closes it. onOpenChange is a function, so use the menu
 * from a Client Component if you control it.
 */
export function MobileNavDrilldown({ brand, groups, actions, current, linkAs, open, defaultOpen, onOpenChange, side = "left", trigger, navLabel, labels: custom, className }: MobileNavDrilldownProps) {
  const words = { ...DRILLDOWN_LABELS, ...custom };

  return (
    <DrilldownSheet
      trigger={
        trigger ?? (
          <Button variant="ghost" size="icon" className={className} aria-label={words.open}>
            <IconMenu size={18} />
          </Button>
        )
      }
      title={words.menu}
      description={words.description}
      side={side}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <DrilldownMenu
        brand={brand}
        groups={groups}
        actions={actions}
        current={current}
        linkAs={linkAs}
        navLabel={navLabel}
        labels={custom}
        closeButton={
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label={words.close}>
              <IconClose size={18} />
            </Button>
          </SheetClose>
        }
      />
    </DrilldownSheet>
  );
}
