"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconChevronLeft } from "@rhs-ui/icons";
import { BottomNav } from "@rhs-ui/primitives/bottom-nav";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface MobileTab {
  /** Identifies the tab: it is what `activeTab` and `onTabChange` use. */
  id: string;
  label: string;
  /** An icon element, drawn at 20px above the label. */
  icon: ReactNode;
  /** Where the tab goes when it is a real link. Default `#<id>`. */
  href?: string;
  /** A count on the icon, for example unread messages. */
  badge?: number;
}

export interface MobileTabShellProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** The screen's title: large at the top of the content, and in the app bar once the content has scrolled past it. */
  title: string;
  /** The title's element: "h1" (the default) because this is the screen, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  /** Adds a back button to the app bar. */
  onBack?: () => void;
  /** The back button's name for screen readers. Default "Back". */
  backLabel?: string;
  /** Icon buttons at the right of the app bar: search, notifications. */
  actions?: ReactNode;
  /** Three to five tabs. */
  tabs: readonly MobileTab[];
  /** The `id` of the current tab. */
  activeTab: string;
  /** A tab was pressed. Without it the tabs are plain links and follow their href. */
  onTabChange?: (id: string) => void;
  /** The tab bar's name for screen readers. Default "Primary". */
  tabsLabel?: string;
  /** The one main action of the screen, floating above the tab bar at the right: a round button. */
  fab?: ReactNode;
  /** Gives the content a 16px side padding (default). Turn it off for edge-to-edge rows. */
  padded?: boolean;
  /** Changes when the screen changes, a tab or a detail view inside it: the content then starts at the top and fades in. Default the active tab. A title that only counts (Inbox, 3) should not change it. */
  screenKey?: string;
  /** The id of the main landmark. Default "main". */
  mainId?: string;
  /** The screen. */
  children: ReactNode;
}

/**
 * A phone-first app frame: a top app bar with an optional back button and
 * actions, the screen's title large at the top of the content (it moves
 * into the bar once the content has scrolled past it, and the bar draws its
 * border then), content that scrolls on its own and never drags the page
 * (overscroll-contain), and a bottom tab bar of three to five links that
 * clears the home indicator. A `fab` floats above the tab bar. The content
 * ends where the tab bar begins, so nothing hides behind it. When the screen
 * changes, the new title takes focus (never on the first render, and not
 * when a tab was pressed, which keeps its focus), so the change is
 * announced. From md up the screen centres at phone width inside a quiet
 * frame, so the same screen previews on a desktop.
 */
export function MobileTabShell({
  title,
  titleAs: Title = "h1",
  onBack,
  backLabel = "Back",
  actions,
  tabs,
  activeTab,
  onTabChange,
  tabsLabel = "Primary",
  fab,
  padded = true,
  screenKey,
  mainId = "main",
  children,
  className,
  ...props
}: MobileTabShellProps) {
  const scroller = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const tabBar = useRef<HTMLDivElement>(null);
  const [condensed, setCondensed] = useState(false);

  // The large title is part of the content. Once it has scrolled out under the bar, the bar takes over: an observer, not a scroll listener.
  useEffect(() => {
    const root = scroller.current;
    const target = heading.current;
    if (!root || !target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setCondensed(entry ? !entry.isIntersecting : false), { root, rootMargin: "-14px 0px 0px 0px", threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // A new screen starts at its top and fades in, but never on the first render.
  const screen = screenKey ?? activeTab;
  const firstScreen = useRef(screen);
  const moved = useRef(false);
  if (firstScreen.current !== screen) moved.current = true;
  const shownScreen = useRef(screen);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
    if (shownScreen.current === screen) return;
    shownScreen.current = screen;
    // The control that opened the screen is usually gone with the old one, which would leave focus on the body: the new title takes it, as in WizardShell, so the screen is announced. A pressed tab keeps its focus.
    if (tabBar.current?.contains(document.activeElement)) return;
    heading.current?.focus({ preventScroll: true });
  }, [screen]);

  const items = tabs.map((tab) => ({ href: tab.href ?? `#${tab.id}`, label: tab.label, icon: tab.icon, badge: tab.badge }));
  const current = items[tabs.findIndex((tab) => tab.id === activeTab)]?.href ?? "";

  function pressTab(event: MouseEvent<HTMLDivElement>) {
    if (!onTabChange || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest("a[href]");
    const tab = tabs.find((entry) => (entry.href ?? `#${entry.id}`) === link?.getAttribute("href"));
    if (!tab) return;
    event.preventDefault();
    onTabChange(tab.id);
  }

  return (
    <div
      data-slot="mobile-tab-shell"
      className={cn(
        "relative flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground md:mx-auto md:my-6 md:h-[min(52rem,calc(100dvh-3rem))] md:w-[24.375rem] md:rounded-[2.25rem] md:border md:border-border md:ring-8 md:ring-muted",
        className,
      )}
      {...props}
    >
      <header
        data-slot="mobile-tab-shell-bar"
        data-condensed={condensed ? "true" : "false"}
        className="relative z-10 shrink-0 border-b border-transparent bg-background pt-[env(safe-area-inset-top)] transition-colors duration-200 data-[condensed=true]:border-border motion-reduce:transition-none"
      >
        <div className="flex h-12 items-center gap-1 px-2">
          {onBack ? (
            <Button type="button" variant="ghost" size="icon" aria-label={backLabel} onClick={onBack} className="shrink-0">
              <IconChevronLeft className="size-5" />
            </Button>
          ) : null}
          <p
            aria-hidden="true"
            className={cn(
              "min-w-0 flex-1 truncate text-[0.9375rem] font-semibold tracking-[-0.01em] transition-[opacity,translate] duration-200 motion-reduce:transition-none",
              onBack ? "pl-1" : "pl-2",
              condensed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            )}
          >
            {title}
          </p>
          {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <main ref={scroller} id={mainId} tabIndex={0} className="absolute inset-0 overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40">
          <Title ref={heading} tabIndex={-1} className="px-4 pt-1 pb-4 text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.04em] text-balance outline-none">
            {title}
          </Title>
          <div key={screen} className={cn(moved.current && "motion-safe:animate-rhs-step-in", padded && "px-4", fab ? "pb-24" : "pb-6")}>
            {children}
          </div>
        </main>
        {fab ? <div data-slot="mobile-tab-shell-fab" className="pointer-events-none absolute right-4 bottom-4 z-10 [&>*]:pointer-events-auto">{fab}</div> : null}
      </div>

      <div ref={tabBar} onClick={pressTab} className="shrink-0">
        <BottomNav
          items={items}
          current={current}
          label={tabsLabel}
          className="static bg-background backdrop-blur-none md:block [&_a]:relative [&_a]:min-h-14 [&_a]:justify-center [&_a[aria-current=page]]:after:absolute [&_a[aria-current=page]]:after:inset-x-6 [&_a[aria-current=page]]:after:top-0 [&_a[aria-current=page]]:after:h-0.5 [&_a[aria-current=page]]:after:rounded-full [&_a[aria-current=page]]:after:bg-foreground [&_a[aria-current=page]_svg]:stroke-[2.25]"
        />
      </div>
    </div>
  );
}
