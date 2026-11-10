"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";

import { IconBag, IconCalendar, IconCompass, IconFolder, IconHeart, IconHome, IconInbox, IconLibrary, IconSearch, IconUser, IconUsers } from "@rhs-ui/icons";
import { FloatingTabBar, type FloatingTabBarItem } from "@rhs-ui/primitives/floating-tab-bar";
import { cn } from "@/lib/utils";

/**
 * Pins the bar to the screen of the phone instead of the window, and stands in for the safe-area inset. `env()` is 0 in
 * a mock, so the real inset of a phone with a home indicator (34px) is written out: that leaves the island about 22px
 * above the indicator drawn below.
 */
const MOCK_BAR = "absolute pb-[2.125rem]";

/** A phone: a black bezel, the status bar, a screen and the home indicator the bar has to clear. */
function Phone({ children, caption, label }: { children: ReactNode; caption: string; label: string }): React.JSX.Element {
  return (
    <figure className="m-0 grid min-w-0 content-start justify-items-center gap-4">
      <div className="w-full max-w-[20rem] rounded-[2.75rem] bg-black p-1.5 ring-1 ring-border">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-background">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 text-xs font-semibold text-foreground tabular-nums">
            <span>9:41</span>
            <span className="absolute top-2.5 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <span className="h-2.5 w-5 rounded-[3px] border border-foreground/70" />
          </div>
          {/* `relative` makes the screen the frame the bar is pinned to; on a real page the bar is fixed to the window. */}
          <section aria-label={label} className="relative h-[34rem] pt-11">
            {children}
          </section>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-1 w-28 -translate-x-1/2 rounded-full bg-foreground/80" />
        </div>
      </div>
      <figcaption className="max-w-[20rem] text-center text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

const PRODUCTS: readonly (readonly [string, string, string])[] = [
  ["Halcyon desk lamp", "Matte steel, dimmer", "€89.00"],
  ["Kestrel daypack", "18 L, waxed canvas", "€129.00"],
  ["Northwind mug set", "Four stoneware mugs", "€34.00"],
];

const MESSAGES: readonly (readonly [string, string, string, boolean])[] = [
  ["Mara Okafor", "Launch checklist is ready", "09:12", true],
  ["Jonas Lindqvist", "Invoice 2231 is ready", "08:47", true],
  ["Priya Raman", "Kestrel packaging samples", "Yesterday", true],
  ["Tomasz Wrona", "Review moved to 14:00", "Mon", false],
];

const ARTICLES: readonly (readonly [string, string, string])[] = [
  ["Why the best interfaces are the quietest", "Halcyon Journal", "6 min"],
  ["A week in the Dolomites, day by day", "Kestrel Field Notes", "9 min"],
  ["The case for a four-pixel grid", "Northwind Design", "4 min"],
  ["What we learned from fourteen failed exports", "Halcyon Journal", "7 min"],
  ["Linen, wool and the slow wardrobe", "The Slow Shelf", "5 min"],
  ["How a small bakery halved its food waste", "Northwind Weekly", "8 min"],
  ["Reading a map before you need it", "Kestrel Field Notes", "3 min"],
  ["Notes on typography for small screens", "Halcyon Journal", "6 min"],
  ["The long road to a calm inbox", "The Slow Shelf", "5 min"],
  ["Ten-minute dinners that are not shortcuts", "Northwind Weekly", "4 min"],
];

/** A picture drawn with shapes, so it follows the theme. */
function Thumb({ i }: { i: number }): React.JSX.Element {
  return (
    <span aria-hidden="true" className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
      <span className="absolute top-2 right-2 size-3.5 rounded-full bg-foreground/15" />
      <span className="absolute -bottom-3 -left-2 h-8 w-12 rounded-[50%] bg-foreground/10" style={{ transform: `translateX(${(i % 3) * 8}px)` }} />
    </span>
  );
}

const ROW = "flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5";

/** What a shop lists: a picture, a name, a line and a price. */
function ProductRows(): React.JSX.Element {
  return (
    <>
      {PRODUCTS.map(([name, line, price], i) => (
        <li key={name} className={ROW}>
          <Thumb i={i} />
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{line}</span>
          </span>
          <span className="shrink-0 text-sm tabular-nums">{price}</span>
        </li>
      ))}
    </>
  );
}

/** What an inbox lists: a sender, a subject and a time, with the unread ones heavier. */
function MessageRows(): React.JSX.Element {
  return (
    <>
      {MESSAGES.map(([from, subject, time, unread]) => (
        <li key={from} className={ROW}>
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {from
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <span className="grid min-w-0 flex-1 gap-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{from}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{time}</span>
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>{subject}</span>
              {unread ? (
                <span className="size-2 shrink-0 rounded-full bg-foreground">
                  <span className="sr-only">Unread</span>
                </span>
              ) : null}
            </span>
          </span>
        </li>
      ))}
    </>
  );
}

/** What a reader lists: a picture, a headline over two lines, and the source with the reading time. */
function ArticleRows(): React.JSX.Element {
  return (
    <>
      {ARTICLES.map(([headline, source, minutes], i) => (
        <li key={headline} className={ROW}>
          <Thumb i={i} />
          <span className="grid min-w-0 flex-1 gap-1">
            <span className="line-clamp-2 text-sm leading-snug font-medium">{headline}</span>
            <span className="truncate text-xs text-muted-foreground">
              {source} · {minutes}
            </span>
          </span>
        </li>
      ))}
    </>
  );
}

/** The page behind the bar: a title and a list that scrolls. The bottom padding keeps the last row clear of the island. */
function Screen({ title, subtitle, children, scroller }: { title: string; subtitle: string; children: ReactNode; scroller?: RefObject<HTMLDivElement | null> }): React.JSX.Element {
  return (
    <div
      ref={scroller}
      // A list that scrolls can be reached and scrolled with the keyboard.
      {...(scroller ? { tabIndex: 0, role: "region", "aria-label": title } : {})}
      className="relative h-full overflow-y-auto px-4 pt-2 pb-28 outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 [&::-webkit-scrollbar]:hidden"
    >
      <h2 className="text-2xl leading-none font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <ul className="m-0 mt-5 grid list-none gap-3 p-0">{children}</ul>
    </div>
  );
}

const SHOP: readonly FloatingTabBarItem[] = [
  { id: "home", label: "Home", icon: <IconHome /> },
  { id: "search", label: "Search", icon: <IconSearch /> },
  { id: "saved", label: "Saved", icon: <IconHeart /> },
  { id: "bag", label: "Bag", icon: <IconBag />, badge: 2, badgeLabel: "items in your bag" },
  { id: "account", label: "Account", icon: <IconUser /> },
];

const WORK: readonly FloatingTabBarItem[] = [
  { id: "inbox", label: "Inbox", icon: <IconInbox />, badge: 12, badgeLabel: "unread messages" },
  { id: "calendar", label: "Calendar", icon: <IconCalendar /> },
  { id: "files", label: "Files", icon: <IconFolder /> },
  { id: "team", label: "Team", icon: <IconUsers />, badge: true, badgeLabel: "update" },
];

const READ: readonly FloatingTabBarItem[] = [
  { id: "today", label: "Today", icon: <IconCompass /> },
  { id: "library", label: "Library", icon: <IconLibrary /> },
  { id: "saved", label: "Saved", icon: <IconHeart /> },
];

function labelOf(items: readonly FloatingTabBarItem[], id: string): string {
  return items.find((item) => item.id === id)?.label ?? "";
}

function Five(): React.JSX.Element {
  const [current, setCurrent] = useState("home");
  return (
    <>
      <Screen title={labelOf(SHOP, current)} subtitle="Five destinations, and only one shows its name.">
        <ProductRows />
      </Screen>
      <FloatingTabBar className={MOCK_BAR} label="Shop" items={SHOP} current={current} onSelect={setCurrent} />
    </>
  );
}

function Counts(): React.JSX.Element {
  const [current, setCurrent] = useState("inbox");
  return (
    <>
      <Screen title={labelOf(WORK, current)} subtitle="12 unread, one update from the team.">
        <MessageRows />
      </Screen>
      <FloatingTabBar className={MOCK_BAR} label="Workspace" items={WORK} current={current} onSelect={setCurrent} />
    </>
  );
}

function Hiding(): React.JSX.Element {
  const [current, setCurrent] = useState("today");
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <>
      <Screen title={labelOf(READ, current)} subtitle="Scroll down and the bar leaves; scroll up a little and it is back." scroller={scroller}>
        <ArticleRows />
      </Screen>
      <FloatingTabBar className={MOCK_BAR} label="Reader" items={READ} current={current} onSelect={setCurrent} hideOnScroll scrollRef={scroller} />
    </>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-x-6 gap-y-12 px-4 py-10 sm:px-6 md:grid-cols-3">
      <Phone label="Shop" caption="Five destinations in 320px: the current one shows its name, the rest are icons that keep theirs for screen readers.">
        <Five />
      </Phone>
      <Phone label="Workspace" caption="A count and a dot come from NotificationBadge, and are read out with the name: Inbox, 12 unread messages.">
        <Counts />
      </Phone>
      <Phone label="Reader" caption="hideOnScroll: it slides away on the way down and comes back on any upward move. Tabbing into it brings it back too.">
        <Hiding />
      </Phone>
    </div>
  );
}
