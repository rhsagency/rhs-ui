import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";
import { StickyAside } from "@rhs-ui/marketing/blog-index-sidebar/sticky-aside";

export interface BlogTopic {
  /** A stable key, and what `currentTopic` matches: "engineering". */
  slug: string;
  /** The name as readers see it. */
  label: string;
  /** The topic's page. */
  href: string;
  /** How many posts the topic holds. */
  count?: number;
}

export interface PopularPost {
  title: string;
  href: string;
  /** A short line under the title: "12,480 reads" or "Anouk de Wit · 8 min". */
  meta?: string;
}

export interface BlogIndexSidebarProps extends Omit<ComponentProps<"div">, "children"> {
  /** The main column: a PostFeed, a BlogList or your own list. */
  children: ReactNode;
  /** Where the search form sends its GET request, with the field as `q` (see `searchName`). The search widget shows when this or `onSearch` is given. */
  searchAction?: string;
  /** The field's name in the query string. */
  searchName?: string;
  /** Handle the search yourself instead of navigating. Receives the trimmed query on submit, and an empty string when the field is cleared (the clear button, Escape or deleting the text), so a filtered list can return to everything. Works inside a Client Component. */
  onSearch?: (query: string) => void;
  /** The search form's accessible name, which also labels the field. */
  searchLabel?: string;
  /** The field's placeholder. */
  searchPlaceholder?: string;
  /** Topics as links with their post counts. */
  topics?: readonly BlogTopic[];
  /** The heading of the topic list. */
  topicsTitle?: string;
  /** The `slug` of the topic being shown; its row is marked with aria-current. */
  currentTopic?: string;
  /** Posts to point at, as a numbered list. */
  popular?: readonly PopularPost[];
  /** The heading of the popular list. */
  popularTitle?: string;
  /** A slot at the end of the sidebar: a newsletter sign-up, an about card. */
  aside?: ReactNode;
  /** Gives the aside slot a landmark name, so it joins the other regions. */
  asideLabel?: string;
  /** The level of the widget headings: 2 (the default) under a page title, 3 under a section heading. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the topic and popular-post links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The sidebar's landmark name. */
  sidebarLabel?: string;
  /** Read after each topic's count: "12 posts". */
  countLabel?: string;
  /** Locale for the post counts. */
  locale?: string;
}

const LEVEL = { 2: "h2", 3: "h3", 4: "h4" } as const;

const widgetTitle = "text-xs font-medium tracking-[.14em] text-muted-foreground uppercase";
const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * A blog front page in two columns: your post list on the left, and on the
 * right a sidebar that sticks below the header on wide screens and drops
 * under the posts on a phone. The sidebar holds four optional widgets, each
 * its own labelled region so screen reader users can jump between them:
 * search first (a plain GET form, or your own handler that also hears the
 * field being cleared), topics with post counts and the current one marked, a
 * numbered list of popular posts, and a slot for a newsletter. It sticks
 * below the header; one taller than the window pins by its bottom edge
 * instead, so the last widget stays in view while the page scrolls. Set
 * `--sticky-top` (for example `className="[--sticky-top:4rem]"`) to the
 * height of your sticky header.
 */
export function BlogIndexSidebar({
  children,
  searchAction,
  searchName = "q",
  onSearch,
  searchLabel = "Search posts",
  searchPlaceholder = "Search posts",
  topics = [],
  topicsTitle = "Topics",
  currentTopic,
  popular = [],
  popularTitle = "Popular posts",
  aside,
  asideLabel,
  headingLevel = 2,
  linkAs: Link = "a",
  sidebarLabel = "Sidebar",
  countLabel = "posts",
  locale = "en-US",
  className,
  ...props
}: BlogIndexSidebarProps) {
  const uid = useId();
  const Heading = LEVEL[headingLevel];
  const counts = new Intl.NumberFormat(locale);
  const hasSearch = Boolean(searchAction || onSearch);
  return (
    <div data-slot="blog-index-sidebar" className={cn("grid gap-14 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16", className)} {...props}>
      <div data-slot="blog-index-sidebar-main" className="min-w-0">
        {children}
      </div>
      <StickyAside
        data-slot="blog-index-sidebar-aside"
        aria-label={sidebarLabel}
        className="grid content-start gap-10 sm:grid-cols-2 lg:sticky lg:top-[min(var(--sticky-top,6rem),calc(100svh_-_var(--aside-h,0px)_-_1rem))] lg:flex lg:flex-col lg:self-start"
      >
        {hasSearch ? (
          <form
            role="search"
            aria-label={searchLabel}
            action={searchAction}
            method="get"
            className="sm:col-span-2 lg:col-auto"
            onSubmit={
              onSearch
                ? (event) => {
                    event.preventDefault();
                    const value = new FormData(event.currentTarget).get(searchName);
                    onSearch(typeof value === "string" ? value.trim() : "");
                  }
                : undefined
            }
          >
            <SearchInput
              name={searchName}
              aria-label={searchLabel}
              placeholder={searchPlaceholder}
              className="h-10"
              onValueChange={
                onSearch
                  ? (value) => {
                      // The clear button, Escape and deleting the text all end up here: the list must not keep an old query.
                      if (!value) onSearch("");
                    }
                  : undefined
              }
            />
          </form>
        ) : null}
        {topics.length ? (
          <section aria-labelledby={`${uid}-topics`}>
            <Heading id={`${uid}-topics`} className={widgetTitle}>
              {topicsTitle}
            </Heading>
            <ul role="list" className="mt-3 grid gap-0.5">
              {topics.map((topic) => {
                const current = topic.slug === currentTopic;
                return (
                  <li key={topic.slug}>
                    <Link
                      href={topic.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "relative flex h-9 items-center justify-between gap-3 rounded-md px-3 text-sm transition-colors duration-150 motion-reduce:transition-none",
                        focusRing,
                        current
                          ? "bg-muted font-medium text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{topic.label}</span>
                      {topic.count !== undefined ? (
                        <Badge variant={current ? "default" : "outline"} className={cn("tabular-nums", !current && "text-muted-foreground")}>
                          {counts.format(topic.count)}
                          <span className="sr-only"> {countLabel}</span>
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        {popular.length ? (
          <section aria-labelledby={`${uid}-popular`}>
            <Heading id={`${uid}-popular`} className={widgetTitle}>
              {popularTitle}
            </Heading>
            <ol role="list" className="mt-4 grid gap-5">
              {popular.map((post, index) => (
                <li key={`${post.href}-${post.title}`} className="group relative flex gap-4">
                  <span aria-hidden="true" className="w-6 shrink-0 text-2xl leading-none font-medium tracking-[-.04em] text-muted-foreground/70 tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={post.href}
                      className="block rounded-sm text-sm leading-snug font-medium text-balance outline-none after:absolute after:-inset-x-2 after:-inset-y-1.5 group-hover:underline group-hover:underline-offset-4 focus-visible:after:rounded-md focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40"
                    >
                      {post.title}
                    </Link>
                    {post.meta ? <p className="mt-1 text-xs text-muted-foreground">{post.meta}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {aside ? (
          asideLabel ? (
            <section aria-label={asideLabel} className="sm:col-span-2 lg:col-auto">
              {aside}
            </section>
          ) : (
            <div className="sm:col-span-2 lg:col-auto">{aside}</div>
          )
        ) : null}
      </StickyAside>
    </div>
  );
}
