"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";

import { IconCheck, IconChevronDown, IconMoreHorizontal, IconSearch } from "@rhs-ui/icons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@rhs-ui/primitives/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface BreadcrumbSibling {
  /** The name of the page, as it reads in the list. */
  label: string;
  /** Where it goes. The entry whose address is the crumb's own is the one that is checked. */
  href: string;
}

export interface BreadcrumbSiblingsItem {
  /** The name of the crumb, as it reads in the trail. */
  label: string;
  /** Where the crumb goes. It is also how its own entry is found, and checked, in its list of siblings. */
  href: string;
  /** The pages at this level, this one included. A crumb with siblings gets a chevron that opens them. */
  siblings?: readonly BreadcrumbSibling[];
}

export interface BreadcrumbSiblingsLabels {
  /** The name of a chevron button, and of the list it opens; `{label}` is its crumb. Default "Pages in {label}". */
  pagesIn?: string;
  /** The name of the button that stands for the folded levels; `{count}` is how many. Default "Show {count} more levels". */
  more?: string;
  /** The same when a single level is folded. Default "Show 1 more level"; without it a `more` of your own is used for every count. */
  moreOne?: string;
  /** The name and placeholder of the filter field. Default "Filter pages". */
  filter?: string;
  /** What a filter that matches nothing says. Default "No pages match". */
  empty?: string;
  /** What is said politely while you type; `{count}` is how many pages match and `{total}` how many there are. Default "{count} of {total} pages". */
  count?: string;
}

export interface BreadcrumbSiblingsProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The trail, from the top to the page you are on. The last one is the current page. */
  items: readonly BreadcrumbSiblingsItem[];
  /** Called with the address when a crumb or a sibling is chosen with a plain click, instead of the browser following the link. A modified click still opens the address. */
  onNavigate?: (href: string) => void;
  /** The most crumbs shown. A longer trail keeps the first and the last ones and folds the levels between them into a menu; one that does not fit its box folds more, down to the first and the last. Default 4. */
  maxVisible?: number;
  /** What sits between the crumbs. Default a slash. */
  separator?: ReactNode;
  /** The words used, for another language. */
  labels?: BreadcrumbSiblingsLabels;
}

/** A list longer than this gets a filter field. */
const FILTER_ABOVE = 12;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const trigger =
  "group/crumb inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted data-[state=open]:text-foreground motion-reduce:transition-none";

const clip = "min-w-0 max-w-[8.5rem] truncate sm:max-w-[13rem]";

/**
 * The current page is the crumb that gives way when the trail is too wide. It is squeezed when its label is cut
 * and its box is narrower than its own maximum width: a label that is cut at the maximum is only a long label.
 */
function squeezed(list: HTMLElement): boolean {
  const page = list.querySelector<HTMLElement>("[data-slot=breadcrumb-page]");
  if (!page) return false;
  const most = Number.parseFloat(getComputedStyle(page).maxWidth);
  return page.scrollWidth > page.clientWidth + 1 && page.clientWidth < (Number.isFinite(most) ? most : Number.POSITIVE_INFINITY) - 1;
}

/**
 * A breadcrumb in which every level opens a menu of its siblings, so people move sideways without going
 * up first. The label stays a link to its own page and the small chevron beside it is a separate button,
 * named "Pages in Projects", so both work from the keyboard. The menu lists the pages at that level
 * with the current one checked. A list of more than twelve is not a menu but a small dialog: a filter
 * field in focus, a list of links under it and the number of matches said politely. A trail that is too
 * long keeps its first and last crumbs and folds the ones in between into a "..." menu, and so does a trail
 * that does not fit its box: it measures itself and folds one more level at a time, until the label of the
 * current page is whole. It is built on Breadcrumb, so the markup, the separators and aria-current are the same.
 */
export function BreadcrumbSiblings({ items, onNavigate, maxVisible = 4, separator = "/", labels, className, ...props }: BreadcrumbSiblingsProps) {
  const words = {
    pagesIn: labels?.pagesIn ?? "Pages in {label}",
    more: (count: number): string => {
      if (count === 1 && labels?.moreOne) return labels.moreOne;
      if (count === 1 && !labels?.more) return "Show 1 more level";
      return (labels?.more ?? "Show {count} more levels").replace("{count}", String(count));
    },
    filter: labels?.filter ?? "Filter pages",
    empty: labels?.empty ?? "No pages match",
    count: labels?.count ?? "{count} of {total} pages",
  };
  const list = useRef<HTMLOListElement>(null);
  // How many levels are folded for lack of width, on top of the ones maxVisible folds. It belongs to one trail: a new trail starts whole.
  const signature = [maxVisible, ...items.flatMap((item) => [item.label, item.href])].join("|");
  const [fit, setFit] = useState({ signature: "", squeeze: 0 });
  const squeeze = fit.signature === signature ? fit.squeeze : 0;
  const [first, ...rest] = items;
  const keep = Math.max(1, Math.round(maxVisible) - 1 - squeeze);

  // After every render: if the current page is squeezed, fold one more level. A layout effect runs before anything is painted, so the trail settles unseen.
  useIsoLayoutEffect(() => {
    const element = list.current;
    if (element && keep > 1 && rest.length > 1 && squeezed(element)) setFit({ signature, squeeze: squeeze + 1 });
  });

  // When the box changes width: wider, the whole trail gets another chance (the effect above folds it again if it does not fit); narrower, it may be squeezed now.
  // The answer comes on the next frame: a change of layout inside the observer callback ends in "loop completed with undelivered notifications".
  useIsoLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    let width = element.clientWidth;
    let frame = 0;
    const measure = () => {
      const next = element.clientWidth;
      const grew = next > width;
      width = next;
      if (grew) flushSync(() => setFit({ signature, squeeze: 0 }));
      else if (squeezed(element)) flushSync(() => setFit((now) => ({ signature, squeeze: (now.signature === signature ? now.squeeze : 0) + 1 })));
    };
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer.observe(element);
    // A web font arriving changes the width of the labels.
    void document.fonts?.ready.then(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [signature]);

  if (!first) return null;
  const fold = rest.length > keep;
  const hidden = fold ? rest.slice(0, rest.length - keep) : [];
  const tail = fold ? rest.slice(rest.length - keep) : rest;
  const crumbs = [first, ...tail];

  const navigate = (href: string) => (event: MouseEvent<HTMLElement>) => {
    if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(href);
  };
  const divider = (key: string) => (
    <BreadcrumbSeparator key={key} className="text-muted-foreground/60 select-none">
      {separator}
    </BreadcrumbSeparator>
  );

  // One list item per crumb and per separator, as Breadcrumb has them. The folded levels sit right after the first crumb.
  const entries: ReactNode[] = [];
  crumbs.forEach((item, index) => {
    const last = index === crumbs.length - 1;
    if (index > 0) entries.push(divider(`before-${item.label}-${item.href}`));
    entries.push(
      // Only the current page gives way when the trail is too wide: the other crumbs keep their labels (up to their own maximum), so a lost pixel never turns every label into an ellipsis.
      <BreadcrumbItem key={`${item.label}-${item.href}`} className={cn("min-w-0 gap-0.5", last ? "shrink" : "shrink-0")}>
        {last ? (
          <BreadcrumbPage className={clip}>{item.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink href={item.href} onClick={navigate(item.href)} className={clip}>
            {item.label}
          </BreadcrumbLink>
        )}
        {item.siblings?.length ? <SiblingsMenu item={item} last={last} words={words} navigate={navigate} /> : null}
      </BreadcrumbItem>,
    );
    if (index === 0 && hidden.length) {
      entries.push(divider("before-fold"));
      entries.push(
        <BreadcrumbItem key="fold" className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={words.more(hidden.length)} className={trigger}>
              <IconMoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              {hidden.map((level) => (
                <DropdownMenuItem key={`${level.label}-${level.href}`} asChild>
                  <a href={level.href} onClick={navigate(level.href)}>
                    <span className="truncate">{level.label}</span>
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>,
      );
    }
  });

  return (
    <Breadcrumb data-slot="breadcrumb-siblings" className={cn("min-w-0", className)} {...props}>
      {/* One line, always: on a narrow screen the label of the current page gives way, and a separator is never left alone at the end of a line. The gaps are tighter below sm, where every pixel counts. */}
      <BreadcrumbList ref={list} className="flex-nowrap gap-1 sm:gap-2">
        {entries}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

interface SiblingsMenuProps {
  item: BreadcrumbSiblingsItem;
  last: boolean;
  words: { pagesIn: string; filter: string; empty: string; count: string };
  navigate: (href: string) => (event: MouseEvent<HTMLElement>) => void;
}

/** What a sibling looks like in either list: a row with the check of the current page in front of its name. */
function SiblingLabel({ here, label }: { here: boolean; label: string }) {
  return (
    <>
      {here ? <IconCheck aria-hidden="true" size={16} className="absolute left-2 text-foreground" /> : null}
      <span className={cn("truncate", here && "font-medium")}>{label}</span>
    </>
  );
}

/** The chevron of a crumb and what it opens: a menu of links, or for a long list a dialog with a filter. */
function SiblingsMenu(props: SiblingsMenuProps) {
  return (props.item.siblings?.length ?? 0) > FILTER_ABOVE ? <FilterableSiblings {...props} /> : <PlainSiblings {...props} />;
}

/** Twelve pages or fewer: a menu of links, as the keyboard and the screen reader expect of a menu. */
function PlainSiblings({ item, last, words, navigate }: SiblingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={words.pagesIn.replace("{label}", item.label)} className={trigger}>
        <IconChevronDown size={14} className="transition-transform duration-200 group-data-[state=open]/crumb:rotate-180 motion-reduce:transition-none" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-max max-w-[min(20rem,var(--radix-dropdown-menu-content-available-width))] min-w-52 p-1">
        {(item.siblings ?? []).map((sibling) => (
          <DropdownMenuItem key={`${sibling.label}-${sibling.href}`} asChild>
            <a href={sibling.href} aria-current={sibling.href === item.href ? (last ? "page" : "location") : undefined} onClick={navigate(sibling.href)} className="relative pl-8">
              <SiblingLabel here={sibling.href === item.href} label={sibling.label} />
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * More than twelve pages: a filter field and a list under it do not fit in a menu (a menu may hold only items), so
 * this is a dialog. The field has the focus when it opens; typing narrows the list, Enter follows the first match, Arrow
 * Down moves into the links, Arrow Up from the first one returns to the field and Escape closes. How many pages match
 * is said politely, and a filter that matches nothing says so.
 */
function FilterableSiblings({ item, last, words, navigate }: SiblingsMenuProps) {
  const siblings = item.siblings ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const needle = query.trim().toLowerCase();
  const shown = useMemo(() => (needle ? siblings.filter((sibling) => sibling.label.toLowerCase().includes(needle)) : siblings), [siblings, needle]);
  const status = !shown.length ? words.empty : needle ? words.count.replace("{count}", String(shown.length)).replace("{total}", String(siblings.length)) : "";

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A key that is part of composing a character (an IME) is not a command.
    if (event.nativeEvent.isComposing) return;
    const links = Array.from(list.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    // -1 is the field.
    const at = links.indexOf(event.target as HTMLAnchorElement);
    const move = (to: number) => {
      event.preventDefault();
      if (to < 0) input.current?.focus();
      else links[Math.min(to, links.length - 1)]?.focus();
    };
    if (event.key === "ArrowDown" && links.length) move(at + 1);
    else if (event.key === "ArrowUp" && at >= 0) move(at - 1);
    else if (event.key === "Home" && at >= 0) move(0);
    else if (event.key === "End" && at >= 0) move(links.length - 1);
    else if (event.key === "Enter" && at < 0) {
      event.preventDefault();
      links[0]?.click();
    } else if (at >= 0 && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Typing while a link has the focus goes back to the field, and the letter lands there.
      input.current?.focus();
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger aria-label={words.pagesIn.replace("{label}", item.label)} className={trigger}>
        <IconChevronDown size={14} className="transition-transform duration-200 group-data-[state=open]/crumb:rotate-180 motion-reduce:transition-none" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // The dialog is named after its crumb: "Pages in Northwind".
        aria-label={words.pagesIn.replace("{label}", item.label)}
        onKeyDown={onKeyDown}
        className="w-max max-w-[min(20rem,var(--radix-popover-content-available-width))] min-w-52 p-1"
      >
        <div className="relative px-0.5 pb-1">
          <IconSearch aria-hidden="true" size={16} className="pointer-events-none absolute top-[calc(50%-0.125rem)] left-3 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={input}
            type="search"
            enterKeyHint="go"
            autoComplete="off"
            spellCheck={false}
            aria-label={words.filter}
            placeholder={words.filter}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pr-2 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
        </div>
        <ul ref={list} className="relative m-0 max-h-64 list-none overflow-y-auto p-0">
          {shown.map((sibling) => {
            const here = sibling.href === item.href;
            return (
              <li key={`${sibling.label}-${sibling.href}`}>
                <a
                  href={sibling.href}
                  aria-current={here ? (last ? "page" : "location") : undefined}
                  onClick={(event) => {
                    navigate(sibling.href)(event);
                    setOpen(false);
                  }}
                  className="relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-none select-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
                >
                  <SiblingLabel here={here} label={sibling.label} />
                </a>
              </li>
            );
          })}
        </ul>
        {/* The words are in the polite status; the visible copy is a picture of it. */}
        {!shown.length ? (
          <p aria-hidden="true" className="px-2 py-6 text-center text-sm text-muted-foreground">
            {words.empty}
          </p>
        ) : null}
        <p role="status" className="sr-only">
          {status}
        </p>
      </PopoverContent>
    </Popover>
  );
}
