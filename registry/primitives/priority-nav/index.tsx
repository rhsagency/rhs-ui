import type { ComponentProps, ElementType, MouseEvent, ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { DropdownMenuItem } from "@rhs-ui/primitives/dropdown-menu";
import { PriorityNavRow, type PriorityNavEntry } from "@rhs-ui/primitives/priority-nav/overflow";
import { cn } from "@/lib/utils";

export interface PriorityNavItem {
  /** The text of the link. */
  label: string;
  /** Where the link goes. */
  href: string;
  /** A number after the label: open issues, unread items. It stays with the link in the row and in the menu. */
  count?: number;
  /** An icon element ahead of the label: `<IconBook />`. */
  icon?: ReactNode;
}

export interface PriorityNavLabels {
  /** The count in the name of the menu button, for one link; `{count}` is the number. Default "{count} link". */
  one?: string;
  /** The same for any other number of links. Default "{count} links". */
  other?: string;
}

export interface PriorityNavProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The links, in the order they should read in the row and in the menu. */
  items: readonly PriorityNavItem[];
  /** The address of the page being shown. Its link gets aria-current="page" and is never moved into the menu. A page below a link's address (/issues/42) belongs to the longest link that contains it. */
  currentHref?: string;
  /** The text of the menu button, followed in its name by how many links it holds: "More, 3 links". Default "More". */
  moreLabel?: string;
  /** Called with the address of a link chosen with a plain click, in the row or the menu; the browser's own navigation is then skipped, so route yourself. A function, so use it from a Client Component. */
  onNavigate?: (href: string) => void;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** `line` underlines the current page, on a hairline; `pill` fills it. Default "line". */
  variant?: "line" | "pill";
  /** The locale the counts are written in. Default "en-US". */
  locale?: string;
  /** Words for the name of the menu button, for another language. */
  labels?: PriorityNavLabels;
}

/** A page below a link belongs to it ("/repo/issues/42" is in "/repo/issues"); the longest link that contains it wins, so "/repo" never claims "/repo/issues/42". */
function currentIndexOf(items: readonly PriorityNavItem[], currentHref: string | undefined): number {
  if (currentHref === undefined) return -1;
  const pathOf = (href: string) => href.split(/[?#]/, 1)[0] ?? "";
  const path = pathOf(currentHref);
  const exact = items.findIndex((item) => pathOf(item.href) === path);
  if (exact !== -1) return exact;
  let best = -1;
  let length = 0;
  items.forEach((item, index) => {
    const base = pathOf(item.href).replace(/\/+$/, "");
    if (base !== "" && path.startsWith(`${base}/`) && base.length > length) {
      best = index;
      length = base.length;
    }
  });
  return best;
}

/** Every link is medium weight, current or not, so choosing one never changes any width. */
const LINK =
  "group/link relative inline-flex shrink-0 items-center gap-2 font-medium whitespace-nowrap text-muted-foreground outline-none select-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 aria-[current=page]:text-foreground motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const VARIANT = {
  line: "h-10 rounded-md px-3 text-sm after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-20 aria-[current=page]:after:opacity-100 motion-reduce:after:transition-none",
  pill: "h-8 rounded-full px-3 text-[0.8125rem] hover:bg-muted/70 aria-[current=page]:bg-muted data-[state=open]:bg-muted/70",
} as const;

/**
 * A row of section links (Overview, Issues, Pull requests, Settings) that never wraps and never scrolls: it shows
 * as many links as fit and moves the rest into a More menu, in the same order. Unlike a plain overflow row it keeps
 * the current page in view: when that page would fall into the menu it takes the place of the last link that
 * fits, and that one moves in its place. Every link exists once in the accessibility tree, aria-current marks the
 * page, a count stays with its link, and the menu button is named after how many links it holds. It measures its
 * own width, so it works in a header, a card or a sidebar. With `linkAs` it is rendered by a Server Component.
 */
export function PriorityNav({
  items,
  currentHref,
  moreLabel = "More",
  onNavigate,
  linkAs: Link = "a",
  variant = "line",
  locale = "en-US",
  labels,
  className,
  "aria-label": ariaLabel = "Section",
  ...props
}: PriorityNavProps) {
  const numbers = new Intl.NumberFormat(locale);
  const at = currentIndexOf(items, currentHref);
  const linkClass = cn(LINK, VARIANT[variant]);

  const entries: PriorityNavEntry[] = items.map((item, index) => {
    const current = index === at;
    const count = item.count === undefined ? null : numbers.format(item.count);
    const press = onNavigate
      ? (event: MouseEvent<HTMLElement>) => {
          // A modified click opens the address the way the browser does; only a plain one is yours.
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onNavigate(item.href);
        }
      : undefined;
    const countBadge =
      count === null ? null : (
        <Badge variant="muted" className="h-[1.125rem] min-w-[1.125rem] px-1.5 text-[0.6875rem] tabular-nums transition-colors duration-150 group-aria-[current=page]/link:bg-foreground/10 group-aria-[current=page]/link:text-foreground motion-reduce:transition-none">
          <span className="sr-only">, </span>
          {count}
        </Badge>
      );
    const inside = (
      <>
        {item.icon}
        <span className="min-w-0 truncate">{item.label}</span>
        {countBadge}
      </>
    );
    return {
      id: String(index),
      current,
      link: (
        <Link href={item.href} aria-current={current ? "page" : undefined} onClick={press} className={linkClass}>
          {inside}
        </Link>
      ),
      // The same box, without an address: measuring it can neither navigate nor prefetch anything.
      probe: <span className={linkClass}>{inside}</span>,
      item: (
        <DropdownMenuItem asChild>
          <Link href={item.href} aria-current={current ? "page" : undefined} onClick={press}>
            {item.icon}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {count === null ? null : (
              <span className="pl-4 text-xs text-muted-foreground tabular-nums">
                <span className="sr-only">, </span>
                {count}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
      ),
    };
  });

  return (
    <nav data-slot="priority-nav" data-variant={variant} aria-label={ariaLabel} className={cn("relative min-w-0", variant === "line" && "border-b border-border", className)} {...props}>
      <PriorityNavRow entries={entries} moreLabel={moreLabel} one={labels?.one ?? "{count} link"} other={labels?.other ?? "{count} links"} locale={locale} moreClassName={linkClass} />
    </nav>
  );
}
