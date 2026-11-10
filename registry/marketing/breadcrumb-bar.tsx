import { Fragment, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowLeft, IconHistory, IconMoreHorizontal } from "@rhs-ui/icons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@rhs-ui/primitives/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface BreadcrumbBarCrumb {
  label: string;
  /** Where the crumb leads. Leave it out on the last crumb: the page you are on is not a link. */
  href?: string;
}

export interface BreadcrumbBarUpdated {
  /** The words people read: "Updated 3 March 2026". Format the date on your side, in the language and time zone of the page. */
  label: string;
  /** The same moment for machines, as a valid date string: "2026-03-03". */
  dateTime: string;
}

export interface BreadcrumbBarLabels {
  /** The name of the trail, for a screen reader. */
  trail: string;
  /** The name of the single link a phone shows, and what is said before the name of the parent: "Back to". */
  back: string;
  /** The name of the button that opens the folded part of a long trail. {count} is how many levels it holds. */
  more: string;
}

export interface BreadcrumbBarProps extends Omit<ComponentProps<"div">, "children"> {
  /** The path to this page, from the top: the last crumb is the page itself. */
  trail: readonly BreadcrumbBarCrumb[];
  /** The right of the bar: Share, Print, an Edit link. Small buttons or links, they stay on a phone. */
  actions?: ReactNode;
  /** When the page last changed. Shown from lg up: between md and lg the trail and the actions need the room. */
  updated?: BreadcrumbBarUpdated;
  /** How many crumbs show before the middle folds into a menu. At least 3. */
  maxItems?: number;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<BreadcrumbBarLabels>;
}

const LABELS: BreadcrumbBarLabels = { trail: "Breadcrumb", back: "Back to", more: "Show {count} more levels" };

/**
 * One slim row between the header and the content: where this page sits on the
 * left, a slot for page actions on the right, and when it last changed. From
 * md up the left side is the full ordered trail ending in the current page
 * (aria-current), with the middle folded into a menu once it is longer than
 * maxItems; below md it is one Back link to the parent, which is what people
 * want on a phone. The trail has priority over everything else on the row: its
 * crumbs never wrap, and when the row runs short only the current page gives
 * way and ends in an ellipsis. It is deliberately smaller than SubpageHeader,
 * for sites that need orientation without a title band. No state of its own,
 * so it renders on the server.
 */
export function BreadcrumbBar({ trail, actions, updated, maxItems = 4, linkAs: Link = "a", labels: custom, className, ...props }: BreadcrumbBarProps) {
  const words = { ...LABELS, ...custom };
  if (!trail.length) return null;

  // Keep the first crumb and the last few; the ones in between go into the menu.
  const keep = Math.max(1, Math.max(3, maxItems) - 2);
  const folded = trail.length > Math.max(3, maxItems);
  const first = trail[0];
  const hidden = folded ? trail.slice(1, trail.length - keep) : [];
  const tail = folded ? trail.slice(trail.length - keep) : trail.slice(1);
  const parent = trail
    .slice(0, -1)
    .reverse()
    .find((crumb) => crumb.href);

  // The trail has priority: every crumb but the last keeps its width (a very long label is cut at 10rem, with an ellipsis, rather than pushing
  // the bar apart), and only the current page gives way, so the bar never wraps a crumb onto a second line.
  const crumb = (entry: BreadcrumbBarCrumb, isLast: boolean) =>
    isLast || !entry.href ? (
      <BreadcrumbPage className={cn("block truncate", isLast ? "max-w-[26rem]" : "max-w-[10rem] font-normal text-muted-foreground")} aria-current={isLast ? "page" : undefined}>
        {entry.label}
      </BreadcrumbPage>
    ) : (
      <BreadcrumbLink asChild className="block max-w-[10rem] truncate">
        <Link href={entry.href}>{entry.label}</Link>
      </BreadcrumbLink>
    );

  return (
    <div data-slot="breadcrumb-bar" className={cn("border-b border-border bg-background", className)} {...props}>
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Breadcrumb aria-label={words.trail} className="hidden min-w-0 md:block">
          <BreadcrumbList className="flex-nowrap">
            {first ? <BreadcrumbItem className={trail.length === 1 ? "min-w-0" : "shrink-0"}>{crumb(first, trail.length === 1)}</BreadcrumbItem> : null}
            {hidden.length ? (
              <>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className="shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={words.more.replace("{count}", String(hidden.length))}
                      className="inline-flex size-7 items-center justify-center rounded-md outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted data-[state=open]:text-foreground motion-reduce:transition-none"
                    >
                      <IconMoreHorizontal aria-hidden="true" className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {hidden.map((entry, index) =>
                        entry.href ? (
                          <DropdownMenuItem key={`${entry.label}-${index}`} asChild>
                            <Link href={entry.href}>{entry.label}</Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem key={`${entry.label}-${index}`} disabled>
                            {entry.label}
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              </>
            ) : null}
            {tail.map((entry, index) => (
              <Fragment key={`${entry.label}-${index}`}>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className={index === tail.length - 1 ? "min-w-0" : "shrink-0"}>{crumb(entry, index === tail.length - 1)}</BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* A phone has no room for a trail, and what people reach for is the way back. */}
        <nav aria-label={words.trail} className="-ml-2 min-w-0 md:hidden">
          {parent?.href ? (
            <Link
              href={parent.href}
              className="inline-flex h-10 max-w-full items-center gap-1.5 rounded-md pr-3 pl-2 text-sm font-medium outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              <IconArrowLeft aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">{words.back} </span>
              <span className="truncate">{parent.label}</span>
            </Link>
          ) : (
            <span aria-current="page" className="block truncate pl-2 text-sm font-medium">
              {trail[trail.length - 1]?.label}
            </span>
          )}
        </nav>

        {updated || actions ? (
          <div className="flex shrink-0 items-center gap-3">
            {updated ? (
              <p className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
                <IconHistory aria-hidden="true" className="size-3.5" />
                <time dateTime={updated.dateTime}>{updated.label}</time>
              </p>
            ) : null}
            {updated && actions ? <span aria-hidden="true" className="hidden h-4 w-px bg-border lg:block" /> : null}
            {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
