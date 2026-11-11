"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@rhs-ui/icons";
import { buttonVariants } from "@rhs-ui/primitives/button";
import { PaginationEllipsis, paginationRange } from "@rhs-ui/primitives/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export interface AdaptivePaginationLabels {
  /** The name of a page number's button; `{page}` is the number. Default "Page {page}". */
  page?: string;
  /** The text of the compact label, and what is announced after a change; `{page}` and `{count}` are the numbers. Default "Page {page} of {count}". */
  pageOf?: string;
  /** The name of the button that goes to page 1 (wide layout). Default "First page". */
  first?: string;
  /** The name of the button that goes back one page. Default "Previous page". */
  previous?: string;
  /** The name of the button that goes on one page. Default "Next page". */
  next?: string;
  /** The name of the button that goes to the last page (wide layout). Default "Last page". */
  last?: string;
  /** The name and heading of the list of pages in the compact layout. Default "Go to page". */
  goTo?: string;
  /** The reason in the tooltip of the buttons that go back, on the first page. Default "You are on the first page". */
  atFirst?: string;
  /** The reason in the tooltip of the buttons that go on, on the last page. Default "You are on the last page". */
  atLast?: string;
}

export interface AdaptivePaginationProps extends Omit<ComponentProps<"nav">, "children" | "onChange"> {
  /** The current page, counted from 1. */
  page: number;
  /** How many pages there are. */
  pageCount: number;
  /** Called with the page that was asked for (1 to `pageCount`) when a control is used with a plain click or the keyboard. Not called for the current page or for a control that is off. */
  onPageChange?: (page: number) => void;
  /** Turns every control into a real link to the address you return, so the pages can be crawled and opened in a new tab. */
  hrefFor?: (page: number) => string;
  /** The same as `hrefFor` for a Server Component, which cannot pass a function: an address with `{page}` in it, such as "/orders?page={page}". */
  hrefTemplate?: string;
  /** How many page numbers sit on each side of the current one when there is room. Default 1. */
  siblingCount?: number;
  /** Where the controls sit in the width they have. Default "center". */
  align?: "start" | "center" | "end";
  /** The locale the numbers are written in. Default "en-US". */
  locale?: string;
  /** The words used, for another language. */
  labels?: AdaptivePaginationLabels;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** What a control is, so that focus can be handed to its counterpart when the layout changes. */
type Part = "first" | "previous" | "page" | "trigger" | "next" | "last";

/** A button is 2.25rem; the row has a 0.25rem gap. */
const UNIT = 2.25;
const GAP = 0.25;
/** Columns of the list of pages in the compact layout. */
const COLUMNS = 5;

/** The width in rem the wide layout needs: first, previous, the numbers, next and last, with room to spare. */
function wideWidth(items: readonly (number | "ellipsis")[]): number {
  const widths = [UNIT, UNIT, ...items.map((item) => (item === "ellipsis" ? UNIT : Math.max(UNIT, 1 + String(item).length * 0.55))), UNIT, UNIT];
  return widths.reduce((sum, width) => sum + width, 0) + GAP * (widths.length - 1) + 0.75;
}

/** A press the browser should handle itself: a modified click opens a new tab. */
const plain = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

interface ControlProps {
  part: Part;
  label: string;
  href?: string;
  /** A control that goes nowhere right now. It is aria-disabled, not disabled, so it keeps focus and can say why. */
  disabled?: boolean;
  reason?: string;
  current?: boolean;
  /** Draw the control as a labelled outline button (the compact layout) instead of a quiet icon. */
  outlined?: boolean;
  onPress?: (event: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
  className?: string;
}

/**
 * One control of the pager. A link when it has an address, a button when it has not. Always wrapped in the
 * same tooltip, so it is the same element whether it is enabled or not, and focus stays on it when it
 * becomes the end of the list.
 */
function Control({ part, label, href, disabled = false, reason, current = false, outlined = false, onPress, children, className }: ControlProps) {
  // The tooltip is always controlled: only a control that is off has a reason to show.
  const [hint, setHint] = useState(false);
  const classes = cn(
    buttonVariants({ variant: current || outlined ? "outline" : "ghost" }),
    "min-w-9 px-2 tabular-nums aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:text-foreground",
    disabled && (outlined ? "aria-disabled:hover:bg-background aria-disabled:hover:border-border" : "aria-disabled:hover:bg-transparent"),
    current && "border-foreground/25 bg-muted font-semibold",
    className,
  );
  const press = (event: MouseEvent<HTMLElement>) => {
    if (disabled || current) {
      event.preventDefault();
      return;
    }
    onPress?.(event);
  };
  const shared = { "data-pager": part, "aria-label": label, "aria-disabled": disabled || undefined, "aria-current": current ? ("page" as const) : undefined, className: classes, onClick: press };
  const control = href !== undefined ? (
    <a {...shared} href={disabled ? undefined : href} role={disabled ? "link" : undefined} tabIndex={disabled ? 0 : undefined}>
      {children}
    </a>
  ) : (
    <button type="button" {...shared}>
      {children}
    </button>
  );
  return (
    <Tooltip open={disabled && Boolean(reason) && hint} onOpenChange={setHint}>
      <TooltipTrigger {...AS_CHILD}>{control}</TooltipTrigger>
      <TooltipContent side="top">{reason}</TooltipContent>
    </Tooltip>
  );
}

/**
 * One pagination that fits its box. It measures the width of its own container, not the window, so it
 * behaves the same in a narrow card and in a wide table footer. With room it shows first, previous, a
 * window of page numbers with ellipses, next and last; without room it shows previous, "Page 3 of 12"
 * as a button that opens the list of pages, and next. The current page carries aria-current, the end
 * buttons say why they are off in a tooltip while staying focusable, and when the layout changes the
 * focused control is handed to its counterpart, so keyboard focus is never lost. With `hrefFor` or
 * `hrefTemplate` every control is a real link.
 */
export function AdaptivePagination({ page, pageCount, onPageChange, hrefFor, hrefTemplate, siblingCount = 1, align = "center", locale = "en-US", labels, className, "aria-label": ariaLabel = "Pagination", ...props }: AdaptivePaginationProps) {
  const words = {
    page: labels?.page ?? "Page {page}",
    pageOf: labels?.pageOf ?? "Page {page} of {count}",
    first: labels?.first ?? "First page",
    previous: labels?.previous ?? "Previous page",
    next: labels?.next ?? "Next page",
    last: labels?.last ?? "Last page",
    goTo: labels?.goTo ?? "Go to page",
    atFirst: labels?.atFirst ?? "You are on the first page",
    atLast: labels?.atLast ?? "You are on the last page",
  };
  const count = Math.max(1, Math.round(pageCount));
  const at = Math.min(Math.max(Math.round(page), 1), count);
  const format = new Intl.NumberFormat(locale);
  const number = (n: number) => format.format(n);
  const pageOf = words.pageOf.replace("{page}", number(at)).replace("{count}", number(count));
  const items = paginationRange(at, count, Math.max(0, Math.round(siblingCount)));
  const need = wideWidth(items);
  const addressOf = hrefFor ?? (hrefTemplate ? (n: number) => hrefTemplate.replace("{page}", String(n)) : undefined);

  const headingId = useId();
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const wideNow = useRef(false);
  const handoff = useRef<Part | null>(null);

  // The container decides. Until it has been measured the compact layout stands in: it fits anywhere.
  useIsoLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const next = element.clientWidth >= need * rem;
      if (next === wideNow.current) return;
      // Remember which control had focus: it is about to disappear, and its counterpart will take over below.
      const held = document.activeElement?.closest<HTMLElement>("[data-pager]");
      handoff.current = held && element.contains(held) ? ((held.dataset.pager as Part | undefined) ?? null) : null;
      wideNow.current = next;
      setWide(next);
      // The list of pages goes away with the compact layout, and it must not come back open the next time that layout does.
      if (next) setListOpen(false);
    };
    measure();
    // The observer answers on the next frame: a change of layout in its own callback ends in "loop completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [need]);

  useIsoLayoutEffect(() => {
    const part = handoff.current;
    handoff.current = null;
    const element = root.current;
    if (!part || !element) return;
    const find = (selector: string) => element.querySelector<HTMLElement>(selector);
    const target = wide
      ? part === "trigger"
        ? find('[data-pager="page"][aria-current="page"]')
        : null
      : part === "page"
        ? find('[data-pager="trigger"]')
        : part === "first"
          ? find('[data-pager="previous"]')
          : part === "last"
            ? find('[data-pager="next"]')
            : null;
    target?.focus({ preventScroll: true });
  }, [wide]);

  const go = (n: number) => (event: MouseEvent<HTMLElement>) => {
    if (!onPageChange) return;
    // A link with a handler is a button that has an address: the router takes a plain click, a modified one opens the address.
    if (event.currentTarget.tagName === "A") {
      if (!plain(event)) return;
      event.preventDefault();
    }
    onPageChange(Math.min(Math.max(n, 1), count));
  };
  const href = (n: number) => addressOf?.(Math.min(Math.max(n, 1), count));
  const onFirstPage = at <= 1;
  const onLastPage = at >= count;

  const previous = (
    <li key="previous">
      <Control part="previous" label={words.previous} href={href(at - 1)} disabled={onFirstPage} reason={words.atFirst} outlined={!wide} onPress={go(at - 1)}>
        <IconChevronLeft />
      </Control>
    </li>
  );
  const next = (
    <li key="next">
      <Control part="next" label={words.next} href={href(at + 1)} disabled={onLastPage} reason={words.atLast} outlined={!wide} onPress={go(at + 1)}>
        <IconChevronRight />
      </Control>
    </li>
  );

  const focusPage = (n: number) => grid.current?.querySelector<HTMLElement>(`[data-page="${n}"]`)?.focus();
  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = Number((event.target as HTMLElement).closest<HTMLElement>("[data-page]")?.dataset.page);
    if (!from) return;
    const to =
      event.key === "ArrowRight" ? from + 1 : event.key === "ArrowLeft" ? from - 1 : event.key === "ArrowDown" ? from + COLUMNS : event.key === "ArrowUp" ? from - COLUMNS : event.key === "PageDown" ? from + COLUMNS * 4 : event.key === "PageUp" ? from - COLUMNS * 4 : event.key === "Home" ? 1 : event.key === "End" ? count : null;
    if (to === null) return;
    event.preventDefault();
    focusPage(Math.min(Math.max(to, 1), count));
  };
  // The list opens on the current page, scrolled so that it is in the middle.
  const openOnCurrent = (event: Event) => {
    event.preventDefault();
    const list = grid.current;
    const current = list?.querySelector<HTMLElement>("[data-page][tabindex='0']");
    if (!list || !current) return;
    list.scrollTop = current.offsetTop - list.clientHeight / 2 + current.offsetHeight / 2;
    current.focus({ preventScroll: true });
  };

  return (
    <nav ref={root} data-slot="adaptive-pagination" data-layout={wide ? "wide" : "compact"} aria-label={ariaLabel} className={cn("w-full min-w-0", className)} {...props}>
      <TooltipProvider delayDuration={150}>
        <ul className={cn("m-0 flex list-none items-center gap-1 p-0", align === "start" ? "justify-start" : align === "end" ? "justify-end" : "justify-center")}>
          {wide ? (
            <li key="first">
              <Control part="first" label={words.first} href={href(1)} disabled={onFirstPage} reason={words.atFirst} onPress={go(1)}>
                <IconChevronsLeft />
              </Control>
            </li>
          ) : null}
          {previous}
          {wide ? (
            items.map((item, index) =>
              item === "ellipsis" ? (
                <li key={`gap-${index < 3 ? "start" : "end"}`}>
                  <PaginationEllipsis />
                </li>
              ) : (
                <li key={`page-${item}`}>
                  <Control part="page" label={words.page.replace("{page}", number(item))} href={href(item)} current={item === at} onPress={go(item)}>
                    {number(item)}
                  </Control>
                </li>
              ),
            )
          ) : (
            <li key="trigger">
              <Popover open={listOpen} onOpenChange={setListOpen}>
                <PopoverTrigger asChild>
                  <button type="button" data-pager="trigger" className={cn(buttonVariants({ variant: "outline" }), "min-w-0 gap-1.5 px-3 tabular-nums")}>
                    {pageOf}
                    <IconChevronDown />
                  </button>
                </PopoverTrigger>
                {/* The dialog is named by its own heading: without a name a screen reader announces just "dialog". */}
                <PopoverContent align="center" aria-labelledby={headingId} onOpenAutoFocus={openOnCurrent} className="w-64 max-w-(--radix-popover-content-available-width) p-2">
                  <p id={headingId} className="px-1.5 pb-2 text-xs font-medium text-muted-foreground">
                    {words.goTo}
                  </p>
                  <div ref={grid} role="group" onKeyDown={onGridKey} className="relative grid max-h-56 grid-cols-5 gap-1 overflow-y-auto p-0.5">
                    {Array.from({ length: count }, (_, index) => index + 1).map((n) => {
                      const target = href(n);
                      const choice = cn(
                        buttonVariants({ variant: n === at ? "default" : "ghost" }),
                        "h-9 min-w-0 px-0 tabular-nums",
                      );
                      // The list closes itself: a close button around a link would not, because a handler that takes the click has already prevented its default.
                      const choose = (event: MouseEvent<HTMLElement>) => {
                        if (n !== at) go(n)(event);
                        setListOpen(false);
                      };
                      return target !== undefined ? (
                        <a key={n} data-page={n} href={target} aria-label={words.page.replace("{page}", number(n))} aria-current={n === at ? "page" : undefined} tabIndex={n === at ? 0 : -1} onClick={choose} className={choice}>
                          {number(n)}
                        </a>
                      ) : (
                        <button key={n} type="button" data-page={n} aria-label={words.page.replace("{page}", number(n))} aria-current={n === at ? "page" : undefined} tabIndex={n === at ? 0 : -1} onClick={choose} className={choice}>
                          {number(n)}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </li>
          )}
          {next}
          {wide ? (
            <li key="last">
              <Control part="last" label={words.last} href={href(count)} disabled={onLastPage} reason={words.atLast} onPress={go(count)}>
                <IconChevronsRight />
              </Control>
            </li>
          ) : null}
        </ul>
      </TooltipProvider>
      <span role="status" className="sr-only">
        {pageOf}
      </span>
    </nav>
  );
}
