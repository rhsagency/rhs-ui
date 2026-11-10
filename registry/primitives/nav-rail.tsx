"use client";

import { createContext, Fragment, useContext, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { NotificationBadge } from "@rhs-ui/primitives/notification-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface NavRailEntry {
  /** What `current` and `onSelect` speak. Unique within the rail. */
  id: string;
  /** The name of the area. It is the tooltip, the label under the icon and the accessible name. */
  label: string;
  /** The icon, as an element: `<IconHome />`. */
  icon: ReactNode;
  /** Where it goes. Without one the entry is a button and only calls `onSelect`. */
  href?: string;
  /** A count (hidden at 0, "99+" above 99) or `true` for a dot, from NotificationBadge. */
  badge?: number | true;
  /** What the badge stands for, for a screen reader: "unread messages" after a count ("Messages 3 unread messages"), or "report" after a dot ("Reports New report"). Default "updates". */
  badgeLabel?: string;
  /** Entries that follow each other with the same group sit together; a thin rule is drawn where the group changes. */
  group?: string;
}

export interface NavRailProps extends Omit<ComponentProps<"div">, "children" | "onSelect"> {
  /** The areas, in order. */
  items: readonly NavRailEntry[];
  /** The `id` of the area you are in: it is filled and carries `aria-current`. */
  current?: string;
  /** Called with the `id` of the area that was chosen. A plain click on an entry that has an `href` goes here too. */
  onSelect?: (id: string) => void;
  /** Above the list: the brand mark. */
  top?: ReactNode;
  /** Pinned below the list, which scrolls without it: settings and the account. Use `NavRailItem` for entries that should match. */
  bottom?: ReactNode;
  /** A wider rail: the label sits under each icon, so there are no tooltips. */
  showLabels?: boolean;
  /** On hover, or when focus is inside, a panel with the labels slides out over the content. The rail keeps its width, so nothing shifts. Ignored with `showLabels`. */
  expandOnHover?: boolean;
  /** Keeps the panel open, for a toggle of your own or a screenshot. Only with `expandOnHover`. */
  expanded?: boolean;
  /** The name of the navigation landmark. Default "Main". */
  label?: string;
}

export interface NavRailItemProps extends Omit<NavRailEntry, "id" | "group"> {
  /** What `onSelect` is called with. Only needed when you handle the press. */
  id?: string;
  /** This is the area you are in: filled and marked `aria-current`. */
  current?: boolean;
  /** Called with the `id` when the item is chosen. A plain click on an item that has an `href` goes here too. */
  onSelect?: (id: string | undefined) => void;
}

type Mode = "icons" | "labels" | "expand";
/** What the rail around an item is: icons with tooltips, labels under the icons, or a panel that expands. Null outside a rail. */
const RailMode = createContext<Mode | null>(null);

/** A press the browser should handle itself: a modified click opens a new tab. */
const plain = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/**
 * One area of the rail: an icon in a tile, filled and marked `aria-current` when it is the current one,
 * with its name in a tooltip, under the icon or beside it, depending on the rail. Use it in the `top`
 * and `bottom` slots for settings or a help link, so they look like the rest.
 */
export function NavRailItem({ id, label, icon, href, badge, badgeLabel = "updates", current = false, onSelect }: NavRailItemProps) {
  const context = useContext(RailMode);
  const mode = context ?? "icons";
  const stacked = mode === "labels";
  const expands = mode === "expand";
  const glyph = badge ? (
    <NotificationBadge label={badgeLabel} count={badge === true ? 1 : badge} dot={badge === true}>
      {icon}
    </NotificationBadge>
  ) : (
    icon
  );
  const root = cn(
    "group/item relative flex shrink-0 items-center rounded-lg text-muted-foreground outline-none select-none",
    "transition-[background-color,color] duration-150 motion-reduce:transition-none",
    "focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-disabled:opacity-50",
    "[&_svg:not([class*='size-'])]:size-5",
    stacked ? "w-full flex-col gap-1 px-1 py-1.5 hover:text-foreground aria-[current=page]:text-foreground" : "hover:bg-muted hover:text-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:hover:bg-primary",
    expands ? "h-10 w-full gap-3 overflow-hidden pr-2.5 pl-3.5" : !stacked && "size-10 justify-center",
  );
  const body = (
    <>
      {/* The label comes first in the markup, so the name reads "Messages 3 unread messages" and not the other way round; order draws the icon first. */}
      <span
        className={cn(
          stacked && "order-last w-full truncate text-center text-[0.6875rem] leading-none font-medium",
          expands && "order-last text-sm font-medium whitespace-nowrap opacity-0 transition-opacity duration-150 group-focus-within/rail:opacity-100 group-hover/rail:opacity-100 group-data-[expanded]/rail:opacity-100 motion-reduce:transition-none",
          !stacked && !expands && "sr-only",
        )}
      >
        {label}
        {/* A space at the end of a line is not drawn; it keeps "Messages 3", not "Messages3", for anything that reads the visible text. */}{" "}
      </span>
      {stacked ? (
        <span className="order-first grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 group-hover/item:bg-muted group-aria-[current=page]/item:bg-primary group-aria-[current=page]/item:text-primary-foreground group-aria-[current=page]/item:group-hover/item:bg-primary motion-reduce:transition-none">{glyph}</span>
      ) : (
        <span className="order-first grid size-5 shrink-0 place-items-center">{glyph}</span>
      )}
    </>
  );
  const press = (event: MouseEvent<HTMLElement>) => {
    if (!onSelect) return;
    if (href) {
      if (!plain(event)) return;
      event.preventDefault();
    }
    onSelect(id);
  };
  const control = href ? (
    <a href={href} aria-current={current ? "page" : undefined} onClick={press} className={root}>
      {body}
    </a>
  ) : (
    <button type="button" aria-current={current ? "page" : undefined} onClick={press} className={root}>
      {body}
    </button>
  );
  // The tooltip needs the provider of the rail; an item with no rail around it is just the control.
  if (mode !== "icons" || context === null) return control;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The slim rail of icon destinations down the left of a chat tool, a console or any app with many
 * areas. Each area is one icon with its name in a tooltip and in the accessible name, the current one
 * is filled and marked with `aria-current`, and a count or a dot comes from NotificationBadge. The areas
 * are a plain list, so Tab walks them. A brand mark goes on top and settings and the account in a group
 * pinned below, which stays put while the list scrolls on a short screen. `showLabels` puts the names
 * under the icons; `expandOnHover` slides a labelled panel over the content, without moving it.
 */
export function NavRail({ items, current, onSelect, top, bottom, showLabels = false, expandOnHover = false, expanded = false, label = "Main", className, ...props }: NavRailProps) {
  const mode: Mode = showLabels ? "labels" : expandOnHover ? "expand" : "icons";
  return (
    <RailMode value={mode}>
      <TooltipProvider delayDuration={150} skipDelayDuration={500}>
        {/* The outer box keeps the width of the rail; in expand mode the panel inside it grows over the content. */}
        <div data-slot="nav-rail" data-mode={mode} data-expanded={mode === "expand" && expanded ? "" : undefined} className={cn("group/rail relative h-full shrink-0", showLabels ? "w-20" : "w-16", className)} {...props}>
          <div
            className={cn(
              "flex h-full w-full flex-col overflow-hidden border-r border-border bg-background",
              mode === "expand" && "absolute inset-y-0 left-0 z-30 transition-[width,box-shadow] duration-200 group-focus-within/rail:w-56 group-focus-within/rail:shadow-sm group-hover/rail:w-56 group-hover/rail:shadow-sm group-data-[expanded]/rail:w-56 group-data-[expanded]/rail:shadow-sm motion-reduce:transition-none",
            )}
          >
            {top ? <div className={cn("flex shrink-0 items-center pt-3 pb-2", mode === "expand" ? "px-4" : "justify-center px-2")}>{top}</div> : null}
            <nav aria-label={label} className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2 [mask-image:linear-gradient(to_bottom,transparent,#000_0.5rem,#000_calc(100%-0.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="m-0 grid list-none gap-1 p-0">
                {items.map((item, index) => (
                  <Fragment key={item.id}>
                    {index > 0 && item.group !== items[index - 1]?.group ? <li role="presentation" aria-hidden="true" className="mx-2 my-1.5 h-px bg-border" /> : null}
                    <li className="flex justify-center">
                      <NavRailItem id={item.id} label={item.label} icon={item.icon} href={item.href} badge={item.badge} badgeLabel={item.badgeLabel} current={item.id === current} onSelect={onSelect ? () => onSelect(item.id) : undefined} />
                    </li>
                  </Fragment>
                ))}
              </ul>
            </nav>
            {bottom ? <div className={cn("flex shrink-0 flex-col gap-1 border-t border-border px-2 py-3", mode !== "expand" && "items-center")}>{bottom}</div> : null}
          </div>
        </div>
      </TooltipProvider>
    </RailMode>
  );
}
