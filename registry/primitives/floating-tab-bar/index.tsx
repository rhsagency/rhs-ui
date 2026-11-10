import type { ComponentProps, ElementType, MouseEvent, ReactNode, RefObject } from "react";

import { FloatingTabBarShell } from "@rhs-ui/primitives/floating-tab-bar/shell";
import { NotificationBadge } from "@rhs-ui/primitives/notification-badge";
import { cn } from "@/lib/utils";

export interface FloatingTabBarItem {
  /** What `current` and `onSelect` speak. Unique within the bar. */
  id: string;
  /** The name of the destination. Only the current item shows it; every item keeps it as its accessible name. */
  label: string;
  /** The icon, as an element: `<IconHome />`. */
  icon: ReactNode;
  /** Where it goes. Without one the item is a button and only calls `onSelect`. */
  href?: string;
  /** A count (hidden at 0, "99+" above 99) or `true` for a dot, from NotificationBadge. */
  badge?: number | true;
  /** What the badge stands for, for a screen reader: "unread messages" after a count, "update" after a dot. Default "updates". */
  badgeLabel?: string;
}

export interface FloatingTabBarProps extends Omit<ComponentProps<"nav">, "children" | "onSelect"> {
  /** The destinations, in order. Three to five fit on a phone. */
  items: readonly FloatingTabBarItem[];
  /** The `id` of the destination you are on: it carries `aria-current` and shows its label. */
  current?: string;
  /** Called with the `id` of the destination that was chosen. A plain click on an item that has an `href` goes here too, so you can route yourself. A function, so use it from a Client Component. */
  onSelect?: (id: string) => void;
  /** Slide off the screen while the page scrolls down, and come back on any upward move. Default false. */
  hideOnScroll?: boolean;
  /** The element that scrolls, when it is not the page (an app screen with its own scroller). It must exist before the bar does. */
  scrollRef?: RefObject<HTMLElement | null>;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark. Default "Main". */
  label?: string;
}

/** A press the browser should handle itself: a modified click opens a new tab. */
const plain = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const ITEM = cn(
  "group/floating-tab relative flex h-11 min-w-0 items-center rounded-full px-2.5 text-muted-foreground outline-none select-none",
  "transition-colors duration-200 hover:bg-muted hover:text-foreground motion-reduce:transition-none",
  "focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:hover:bg-primary aria-[current=page]:hover:text-primary-foreground",
  "[&_svg:not([class*='size-'])]:size-5",
);

/**
 * A bottom navigation for mobile web that floats above the content as a rounded island instead of spanning
 * the edge of the screen. Only the current destination shows its label, so five of them fit in 320px; the
 * others are icons, and every item keeps its name for assistive technology. The current one is filled and
 * marked with `aria-current`, a count or a dot comes from NotificationBadge, and the island clears the home
 * indicator with the safe-area inset. With `hideOnScroll` it slides away as you scroll down and returns on
 * any upward move or when a key brings focus into it. The expansion is instant under reduced motion. Taps
 * pass through the space around the island. With `linkAs` it renders in a Server Component; only the
 * scroll behaviour is client code.
 */
export function FloatingTabBar({ items, current, onSelect, hideOnScroll = false, scrollRef, linkAs: Link = "a", label = "Main", className, ...props }: FloatingTabBarProps) {
  return (
    <FloatingTabBarShell aria-label={label} hideOnScroll={hideOnScroll} scrollRef={scrollRef} className={className} {...props}>
      <ul className="pointer-events-auto m-0 flex max-w-full min-w-0 list-none items-center gap-0.5 rounded-full border border-border bg-background p-1.5 shadow-sm">
        {items.map((item) => {
          const active = item.id === current;
          // Two digits are wider than one: the badge sits further out, so it does not cover half of the icon, and the label keeps clear of it.
          const wide = typeof item.badge === "number" && item.badge >= 10;
          const glyph = item.badge ? (
            <NotificationBadge
              label={item.badgeLabel ?? "updates"}
              count={item.badge === true ? 1 : item.badge}
              dot={item.badge === true}
              className={wide ? "[&>span:last-child]:-top-2.5 [&>span:last-child]:-right-3.5" : "[&>span:last-child]:-top-2 [&>span:last-child]:-right-2.5"}
            >
              {item.icon}
            </NotificationBadge>
          ) : (
            item.icon
          );
          const press = onSelect
            ? (event: MouseEvent<HTMLElement>) => {
                if (item.href) {
                  if (event.defaultPrevented || !plain(event)) return;
                  event.preventDefault();
                }
                onSelect(item.id);
              }
            : undefined;
          const body = (
            <>
              {/* The label comes first in the markup, so the name reads "Inbox 3 unread messages" and not the other way round; order draws the icon first. */}
              <span className="grid min-w-0 grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out group-aria-[current=page]/floating-tab:grid-cols-[1fr] group-aria-[current=page]/floating-tab:opacity-100 motion-reduce:transition-none">
                <span className="min-w-0 overflow-hidden">
                  <span className={cn("block truncate pr-1 text-[0.8125rem] leading-none font-medium whitespace-nowrap", wide ? "pl-4" : typeof item.badge === "number" && item.badge > 0 ? "pl-3" : "pl-2")}>{item.label}</span>
                </span>
              </span>
              <span className="order-first grid size-5 shrink-0 place-items-center">{glyph}</span>
            </>
          );
          return (
            <li key={item.id} className={cn("flex min-w-0", active ? "shrink" : "shrink-0")}>
              {item.href ? (
                <Link href={item.href} aria-current={active ? "page" : undefined} onClick={press} className={ITEM}>
                  {body}
                </Link>
              ) : (
                <button type="button" aria-current={active ? "page" : undefined} onClick={press} className={ITEM}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </FloatingTabBarShell>
  );
}
