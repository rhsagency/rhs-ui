import type { ComponentProps, ElementType, ReactNode } from "react";

import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface FeedNavItem {
  /** Where the entry goes. */
  href: string;
  /** The entry's name: written in the left column, under the icon in the bottom bar. */
  label: string;
  /** An icon element: 24px in the left column, 20px in the bottom bar. */
  icon: ReactNode;
  /** A count on the item. Hidden at 0, shown as 99+ above 99. */
  badge?: number;
  /** What the count is about, read after the number: "unread". Default "new". */
  badgeLabel?: string;
}

export interface FeedTab {
  /** Identifies the tab: it is what `activeTab` and `onTabChange` use. */
  id: string;
  /** The tab's name, such as "For you". */
  label: string;
}

export interface FeedShellLabels {
  /** The name of the main navigation, in the left column and in the bottom bar. Default "Primary". */
  primary?: string;
  /** The name of the right column for screen readers. Default "Search and suggestions". */
  widgets?: string;
  /** The name of the feed's tabs. Default "Feed". */
  tabs?: string;
  /** The skip link's text. Default "Skip to content". */
  skip?: string;
}

/** Tabs come as a set: the row, the one that is current, and what happens when another is pressed. */
type FeedTabsProps =
  | { tabs?: undefined; activeTab?: undefined; onTabChange?: undefined }
  | {
      /** Views of the same feed, as equal tabs under the title: `{ id, label }`. */
      tabs: readonly FeedTab[];
      /** The `id` of the current tab. Show its posts in `children`. */
      activeTab: string;
      /** A tab was pressed. Switch `activeTab` and the posts in `children` in response. */
      onTabChange: (id: string) => void;
    };

export type FeedShellProps = Omit<ComponentProps<"div">, "children"> &
  FeedTabsProps & {
    /** The places of the app. Three to five: from md they are a list in the left column, below md they are the bottom bar. */
    nav: readonly FeedNavItem[];
    /** The path of the page being shown; its entry is marked aria-current="page". */
    currentHref: string;
    /** Renders the links of the navigation. Defaults to "a"; pass your router's Link. */
    linkAs?: ElementType;
    /** Your mark, at the top of the left column. */
    brand?: ReactNode;
    /** The one thing people come to do: a Post button. It sits under the navigation from md and floats above the bottom bar below it, so it is only ever shown once. */
    primaryAction?: ReactNode;
    /** The account button, at the foot of the left column from md. */
    account?: ReactNode;
    /** The title of the feed: "Home". A string becomes an h2; pass your own heading to choose the level. */
    header: ReactNode;
    /** The right column: a search field, who to follow, topics. Below xl it follows the feed. */
    widgets?: ReactNode;
    /** The words the shell uses, for translation. */
    labels?: FeedShellLabels;
    /** The id of the main landmark, which the skip link points at. Default "main". */
    mainId?: string;
    /** The posts. Draw them as one list; the shell draws the lines between the columns, not between the posts. */
    children: ReactNode;
  };

const NAV_LINK = [
  "relative flex h-12 items-center gap-4 rounded-full px-4 text-[1.0625rem] text-foreground outline-none",
  "transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 active:bg-muted/70 motion-reduce:transition-none",
  "aria-[current=page]:font-semibold [&_svg]:size-6 [&_svg]:shrink-0",
].join(" ");

const BAR_LINK = [
  "flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground outline-none transition-colors duration-150 motion-reduce:transition-none",
  "focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 active:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground [&_svg]:size-5",
].join(" ");

/** The count, as it is drawn: 99+ above 99. */
const shown = (count: number) => (count > 99 ? "99+" : String(count));

/**
 * The layout for a community or social feed: navigation and a primary action
 * on the left, a centre column 38rem wide with a sticky header (the title and
 * equal tabs such as For you and Following) over the posts, and widgets on
 * the right. Below xl the widgets follow the feed; below md the navigation
 * becomes a bottom tab bar that clears the home indicator and the primary
 * action floats above it. The page itself scrolls, not a box inside it, so the
 * browser's scroll restoration, find in page and the back button behave as
 * on any page. It renders on the server; pass your router's Link as linkAs.
 */
export function FeedShell({
  nav,
  currentHref,
  linkAs: Link = "a",
  brand,
  primaryAction,
  account,
  header,
  tabs,
  activeTab,
  onTabChange,
  widgets,
  labels,
  mainId = "main",
  children,
  className,
  ...props
}: FeedShellProps) {
  const text = { primary: "Primary", widgets: "Search and suggestions", tabs: "Feed", skip: "Skip to content", ...labels };
  const current = (href: string) => (href === currentHref || currentHref.startsWith(`${href}/`) ? "page" : undefined);
  const title = typeof header === "string" ? <h2>{header}</h2> : header;

  const top = (
    <div className="sticky top-0 z-20 bg-background">
      <div className={cn("flex h-14 items-center px-4 text-[1.0625rem] font-semibold tracking-[-0.02em]", !tabs && "border-b border-border")}>{title}</div>
      {tabs ? (
        <TabsList variant="line" aria-label={text.tabs} className="w-full gap-0">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="h-12 flex-1 text-[0.9375rem] group-data-[variant=line]/list:pb-0">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      ) : null}
    </div>
  );

  return (
    <div
      data-slot="feed-shell"
      className={cn(
        "relative mx-auto grid min-h-dvh w-full max-w-[74rem] grid-cols-1 bg-background text-foreground pb-[calc(4rem_+_env(safe-area-inset-bottom))] md:grid-cols-[16rem_minmax(0,38rem)] md:justify-center md:pb-0 xl:grid-cols-[16rem_minmax(0,38rem)_20rem]",
        className,
      )}
      {...props}
    >
      <SkipLink target={mainId} label={text.skip} />

      {/* From md this column holds the navigation and sticks; below md it holds only the primary action, which floats. */}
      <div
        data-slot="feed-shell-nav"
        className="relative max-md:contents md:sticky md:top-0 md:row-span-2 md:flex md:max-h-dvh md:flex-col md:self-start md:overflow-y-auto md:px-3 md:py-3 xl:row-span-1"
      >
        {brand ? <header className="flex h-12 items-center px-4 text-lg font-semibold max-md:hidden">{brand}</header> : null}
        <nav aria-label={text.primary} className="mt-1 max-md:hidden">
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                <Link href={item.href} aria-current={current(item.href)} className={NAV_LINK}>
                  {item.icon}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-semibold text-background tabular-nums">
                      <span aria-hidden="true">{shown(item.badge)}</span>
                      <span className="sr-only">, {item.badge} {item.badgeLabel ?? "new"}</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {primaryAction ? (
          <div
            data-slot="feed-shell-action"
            className="mt-4 px-1 *:w-full max-md:fixed max-md:right-4 max-md:bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] max-md:z-40 max-md:mt-0 max-md:p-0 max-md:*:w-auto max-md:*:shadow-sm"
          >
            {primaryAction}
          </div>
        ) : null}
        {account ? <div className="mt-4 border-t border-border pt-3 max-md:hidden">{account}</div> : null}
      </div>

      <main id={mainId} tabIndex={-1} data-slot="feed-shell-feed" className="min-w-0 outline-none md:border-x md:border-border">
        {tabs ? (
          <Tabs value={activeTab} onValueChange={onTabChange} className="gap-0">
            {top}
            {/* tabIndex -1: the posts hold their own controls, and a panel that is a tab stop would show no ring. */}
            <TabsContent value={activeTab} tabIndex={-1}>
              {children}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {top}
            {children}
          </>
        )}
      </main>

      {widgets ? (
        <aside
          aria-label={text.widgets}
          data-slot="feed-shell-widgets"
          className="relative grid grid-cols-1 content-start gap-4 border-t border-border px-4 py-6 md:col-start-2 md:border-x md:px-5 xl:sticky xl:top-0 xl:col-start-3 xl:max-h-dvh xl:self-start xl:overflow-y-auto xl:border-x-0 xl:border-t-0 xl:px-0 xl:py-3 xl:pl-6"
        >
          {widgets}
        </aside>
      ) : null}

      <nav
        aria-label={text.primary}
        data-slot="feed-shell-bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => (
            <li key={`${item.label}-${item.href}`}>
              <Link href={item.href} aria-current={current(item.href)} className={BAR_LINK}>
                <span className="relative">
                  {item.icon}
                  {item.badge ? (
                    <span className="absolute -top-1 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-semibold text-background tabular-nums">
                      <span aria-hidden="true">{shown(item.badge)}</span>
                      <span className="sr-only">, {item.badge} {item.badgeLabel ?? "new"}</span>
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
