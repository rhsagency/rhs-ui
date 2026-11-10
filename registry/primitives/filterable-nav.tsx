"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { EmptySearch } from "@rhs-ui/primitives/empty-search";
import { MatchHighlight } from "@rhs-ui/primitives/match-highlight";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export interface FilterableNavItem {
  /** The text of the link. Typing marks the letters that matched in it. */
  label: string;
  /** Where the link goes. */
  href: string;
  /** A short tag at the end of the row: an HTTP method ("GET"), "New", "Beta". */
  badge?: string;
  /** Words that find this link without being in its label: "authentication" finds "Sign-in methods". The one that matched is shown under the label. */
  keywords?: readonly string[];
}

export interface FilterableNavGroup {
  /** The heading of the group. Typing searches it too. */
  label: string;
  /** The links of the group, in the order they are listed. */
  items: readonly FilterableNavItem[];
  /** Whether the group folds away. Default true. */
  collapsible?: boolean;
  /** Start open. A group that holds the current page starts open anyway. Default false. */
  defaultOpen?: boolean;
}

export interface FilterableNavLabels {
  /** The name of the filter field. Default "Filter links". */
  field?: string;
  /** The line under the field while nothing is typed; `{count}` is how many links there are. Default "{count} links". */
  total?: string;
  /** The line (and the announcement) while filtering, for one result. Default "{count} result". */
  one?: string;
  /** The same for any other number of results. Default "{count} results". */
  other?: string;
  /** The button of the empty state. It has its own name, so it is not mistaken for the clear button in the field. Default "Show all links". */
  clear?: string;
}

export interface FilterableNavProps extends Omit<ComponentProps<"nav">, "children" | "onChange"> {
  /** The links, in groups. Group names are searched too: typing "webhooks" finds everything in a group of that name. */
  groups: readonly FilterableNavGroup[];
  /** The address of the page being shown. Its link gets aria-current="page", and its group starts open and scrolled into view. */
  currentHref?: string;
  /** The text in the empty field. Default "Filter…". */
  placeholder?: string;
  /** Called with the address of a link chosen with a plain click; the browser's own navigation is then skipped, so route yourself. */
  onNavigate?: (href: string) => void;
  /** What is typed, when you control it. */
  query?: string;
  /** What the field starts with, when you do not. */
  defaultQuery?: string;
  /** Called with the text of the field whenever it changes. */
  onQueryChange?: (query: string) => void;
  /** The locale the counts are written in. Default "en-US". */
  locale?: string;
  /** The words used, for another language. */
  labels?: FilterableNavLabels;
}

/** A text without its accents and capitals, the way a search compares. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

interface Hit {
  item: FilterableNavItem;
  /** The keyword that made the link match when its label alone does not. */
  keyword: string | null;
}

interface Section {
  key: string;
  group: FilterableNavGroup;
  hits: Hit[];
}

const plain = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const HEADING = "font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase";

/** A soft fade where the list runs on past its edge, so a cut-off row says there is more. */
const FADE_BOTH = "[mask-image:linear-gradient(transparent,#000_1.25rem,#000_calc(100%-1.75rem),transparent)]";
const FADE_TOP = "[mask-image:linear-gradient(transparent,#000_1.25rem)]";
const FADE_BOTTOM = "[mask-image:linear-gradient(#000_calc(100%-1.75rem),transparent)]";

/**
 * A navigation list with a filter of its own, for references and settings with more links than anyone scans: an
 * API with 300 endpoints. Typing narrows the links across every group (each word must be found, in the label, the
 * group's name or a keyword), marks the letters that matched, keeps a group heading only where something matches
 * and opens folded groups that hold a match. The result count is announced politely, Escape clears the field, the
 * arrow keys walk from the field into the list and back, and a search with no match offers a button to clear it
 * instead of a blank panel. Give it a height (or a parent with one) and the list scrolls inside it.
 */
export function FilterableNav({
  groups,
  currentHref,
  placeholder = "Filter…",
  onNavigate,
  query,
  defaultQuery = "",
  onQueryChange,
  locale = "en-US",
  labels,
  className,
  "aria-label": ariaLabel = "Documentation",
  ...props
}: FilterableNavProps) {
  const words = {
    field: labels?.field ?? "Filter links",
    total: labels?.total ?? "{count} links",
    one: labels?.one ?? "{count} result",
    other: labels?.other ?? "{count} results",
    clear: labels?.clear ?? "Show all links",
  };
  const [own, setOwn] = useState(defaultQuery);
  const typed = query ?? own;
  const setQuery = (next: string) => {
    if (query === undefined) setOwn(next);
    onQueryChange?.(next);
  };
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const [overrides, setOverrides] = useState<Readonly<Record<string, boolean>>>({});
  const [status, setStatus] = useState("");
  const root = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  // What was typed, as words. The marks take them as typed; the comparison takes them folded.
  const terms = typed.trim().split(/\s+/).filter(Boolean);
  const folded = terms.map(fold);
  const filtering = terms.length > 0;

  const isCurrent = (href: string) => currentHref !== undefined && href === currentHref;
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  const sections = useMemo<Section[]>(() => {
    if (!folded.length) return [];
    return groups
      .map((group, index) => {
        const groupText = fold(group.label);
        const hits = group.items.flatMap<Hit>((item) => {
          const label = fold(item.label);
          const keywords = item.keywords ?? [];
          const haystack = [groupText, label, ...keywords.map(fold)].join(" ");
          if (!folded.every((term) => haystack.includes(term))) return [];
          const inLabel = folded.every((term) => label.includes(term) || groupText.includes(term));
          const keyword = inLabel ? null : (keywords.find((word) => folded.some((term) => fold(word).includes(term))) ?? null);
          return [{ item, keyword }];
        });
        return { key: `${index}:${group.label}`, group, hits };
      })
      .filter((section) => section.hits.length > 0);
    // `folded` is made from `typed`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, typed]);

  const count = sections.reduce((sum, section) => sum + section.hits.length, 0);
  const sentence = (n: number) => (n === 1 ? words.one : words.other).replace("{count}", numbers.format(n));

  // The count is told once the typing pauses, not at every letter. Nothing found is told by the empty state itself.
  useEffect(() => {
    if (!filtering || count === 0) {
      setStatus("");
      return;
    }
    const timer = window.setTimeout(() => setStatus(sentence(count)), 350);
    return () => window.clearTimeout(timer);
    // `sentence` is made from the words and the locale, which do not change while someone types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtering, count, typed]);

  const updateEdges = () => {
    const list = scroller.current;
    if (!list) return;
    const next = { top: list.scrollTop > 2, bottom: list.scrollTop + list.clientHeight < list.scrollHeight - 2 };
    setEdges((previous) => (previous.top === next.top && previous.bottom === next.bottom ? previous : next));
  };
  useEffect(() => {
    const list = scroller.current;
    const inner = content.current;
    if (!list || !inner) return;
    updateEdges();
    // The list grows and shrinks as groups open and typing narrows it, and the box itself can be resized.
    const observer = new ResizeObserver(updateEdges);
    observer.observe(list);
    observer.observe(inner);
    return () => observer.disconnect();
    // `updateEdges` reads a ref and sets state: the one from this render is as good as any.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The current page scrolls into view inside the list, never the page: only the list's own scroll moves.
  useEffect(() => {
    const list = scroller.current;
    const current = list?.querySelector<HTMLElement>("[aria-current='page']");
    if (!list || !current || filtering) return;
    const view = list.getBoundingClientRect();
    const box = current.getBoundingClientRect();
    if (box.top < view.top || box.bottom > view.bottom) list.scrollTop += box.top - view.top - (view.height - box.height) / 2;
    // Only a new current page moves the list; opening a group or typing does not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHref]);

  const field = () => root.current?.querySelector<HTMLInputElement>("input[type='search']") ?? null;
  const stops = () => Array.from(scroller.current?.querySelectorAll<HTMLElement>("[data-nav-stop]") ?? []);

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const all = stops();
    const from = all.indexOf(event.target as HTMLElement);
    if (from === -1) return;
    if (event.key === "Escape") {
      event.preventDefault();
      field()?.focus();
      return;
    }
    const next = event.key === "ArrowDown" ? from + 1 : event.key === "ArrowUp" ? from - 1 : event.key === "Home" ? 0 : event.key === "End" ? all.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    if (next < 0) field()?.focus();
    else all[Math.min(next, all.length - 1)]?.focus();
  }

  const open = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!onNavigate || event.defaultPrevented || !plain(event)) return;
    event.preventDefault();
    onNavigate(href);
  };

  const row = ({ item, keyword }: Hit) => {
    const current = isCurrent(item.href);
    return (
      <li key={`${item.label}-${item.href}`}>
        <a
          data-nav-stop=""
          href={item.href}
          aria-current={current ? "page" : undefined}
          onClick={(event) => open(event, item.href)}
          className={cn(
            "flex min-h-8 items-center gap-2.5 rounded-md px-2.5 py-1 text-sm outline-none transition-colors duration-150 motion-reduce:transition-none",
            "focus-visible:ring-[3px] focus-visible:ring-ring/40",
            current ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate">
              <MatchHighlight text={item.label} query={terms} />
            </span>
            {keyword ? (
              <span className="block truncate text-xs text-muted-foreground">
                <MatchHighlight text={keyword} query={terms} />
              </span>
            ) : null}
          </span>
          {item.badge ? <span className="shrink-0 rounded-sm border border-border px-1 font-mono text-[0.6875rem] leading-4 tracking-wide text-muted-foreground uppercase">{item.badge}</span> : null}
        </a>
      </li>
    );
  };

  const filtered = sections.length ? (
    <div className="grid gap-4">
      {sections.map((section) => (
        <div key={section.key} className="grid gap-1">
          <p className={cn(HEADING, "flex items-center justify-between gap-2 px-2.5 py-1")}>
            <span className="min-w-0 truncate">
              <MatchHighlight text={section.group.label} query={terms} />
            </span>
            <span className="tabular-nums">{numbers.format(section.hits.length)}</span>
          </p>
          <ul className="grid gap-0.5">{section.hits.map(row)}</ul>
        </div>
      ))}
    </div>
  ) : (
    <EmptySearch
      query={typed.trim()}
      className="py-8"
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setQuery("");
            field()?.focus();
          }}
        >
          {words.clear}
        </Button>
      }
    />
  );

  const browse = (
    <div className="grid gap-3">
      {groups.map((group, index) => {
        if (!group.items.length) return null;
        const key = `${index}:${group.label}`;
        const holdsCurrent = group.items.some((item) => isCurrent(item.href));
        const links = <ul className="grid gap-0.5">{group.items.map((item) => row({ item, keyword: null }))}</ul>;
        if (group.collapsible === false) {
          return (
            <div key={key} className="grid gap-1">
              <p className={cn(HEADING, "px-2.5 py-1")}>{group.label}</p>
              {links}
            </div>
          );
        }
        const isOpen = overrides[key] ?? (group.defaultOpen === true || holdsCurrent);
        return (
          <Collapsible key={key} open={isOpen} onOpenChange={(next) => setOverrides((previous) => ({ ...previous, [key]: next }))} className="grid gap-0.5">
            <CollapsibleTrigger
              data-nav-stop=""
              className={cn("group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40", HEADING)}
            >
              <IconChevronRight size={12} className="shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
              <span className="min-w-0 flex-1 truncate">{group.label}</span>
              <span className="tabular-nums">{numbers.format(group.items.length)}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-1">{links}</CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );

  return (
    <nav ref={root} data-slot="filterable-nav" aria-label={ariaLabel} className={cn("flex min-h-0 flex-col gap-2", className)} {...props}>
      <div className="grid shrink-0 gap-2">
        <SearchInput
          value={typed}
          onValueChange={setQuery}
          placeholder={placeholder}
          aria-label={words.field}
          autoComplete="off"
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" || event.defaultPrevented) return;
            const first = stops()[0];
            if (!first) return;
            event.preventDefault();
            first.focus();
          }}
        />
        <p aria-hidden="true" className="px-0.5 text-xs text-muted-foreground tabular-nums">
          {filtering ? (count === 0 ? " " : sentence(count)) : words.total.replace("{count}", numbers.format(total))}
        </p>
      </div>

      <div
        ref={scroller}
        onKeyDown={walk}
        onScroll={updateEdges}
        // The padding (and the pull-back margin that keeps the spacing) gives the ring of the first row room above it: the scroller clips whatever leaves its box.
        className={cn("relative -mx-1 -mt-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-1 [scrollbar-width:thin]", edges.top && edges.bottom ? FADE_BOTH : edges.top ? FADE_TOP : edges.bottom ? FADE_BOTTOM : null)}
      >
        <div ref={content}>{filtering ? filtered : browse}</div>
      </div>

      <span role="status" className="sr-only">
        {status}
      </span>
    </nav>
  );
}
