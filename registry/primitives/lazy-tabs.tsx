"use client";

import { useEffect, useReducer, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface LazyTab {
  /** What `value` and `onValueChange` speak. Unique among the tabs. */
  value: string;
  /** The name on the tab. */
  label: string;
  /** What the panel holds: a function that returns a promise of it, run the first time the tab opens (or is prefetched), or the content itself, shown at once. */
  load: (() => Promise<ReactNode>) | ReactNode;
  /** The panel while it loads, in the shape of what is coming. Overrides `skeleton`. */
  skeleton?: ReactNode;
  /** An icon element ahead of the label: `<IconReceipt />`. */
  icon?: ReactNode;
  /** Dimmed and not selectable. */
  disabled?: boolean;
}

/** The words of the panels and the announcements, for another language or your own wording. `{tab}` is the name of the tab. */
export interface LazyTabsLabels {
  /** Said politely while a tab loads. Default "Loading {tab}". */
  loading: string;
  /** Said politely when it has loaded. Default "{tab} loaded". */
  loaded: string;
  /** The heading of a panel that failed. Default "Could not load {tab}". */
  error: string;
  /** The text on the button that tries again. Default "Retry". */
  retry: string;
}

export interface LazyTabsProps extends Omit<ComponentProps<typeof Tabs>, "children" | "value" | "defaultValue" | "onValueChange"> {
  /** The tabs, in order. */
  tabs: readonly LazyTab[];
  /** The selected tab, when you control it. */
  value?: string;
  /** The tab to start on, when you do not. Default the first. */
  defaultValue?: string;
  /** Called with the `value` of the tab that was chosen. */
  onValueChange?: (value: string) => void;
  /** Start loading a tab when the pointer rests on it or it gets focus, so it is often ready by the time it is chosen. Default true. */
  prefetchOnHover?: boolean;
  /** Keep a panel that has loaded mounted (hidden) when you leave it, so what is inside keeps its state and its scroll position. Default false: it unmounts and comes back from what was loaded, without asking again. */
  keepMounted?: boolean;
  /** The panel of every tab while it loads, unless the tab brings its own. Default a few lines. */
  skeleton?: ReactNode;
  /** `line` (an underline, the default) or `pill` (a segmented control). */
  variant?: "line" | "pill";
  /** The name of the tab list for assistive technology: "Customer". */
  label?: string;
  /** The words of the panels and the announcements. */
  labels?: Partial<LazyTabsLabels>;
  /** Classes for every panel, for its padding or its minimum height. */
  panelClassName?: string;
}

type Entry = { status: "loading" } | { status: "ready"; content: ReactNode } | { status: "error"; detail: string | undefined };

const WORDS: LazyTabsLabels = { loading: "Loading {tab}", loaded: "{tab} loaded", error: "Could not load {tab}", retry: "Retry" };

const fill = (template: string, tab: string): string => template.replace("{tab}", tab);

/** The row fades out where more of it is hidden, so a cut-off tab reads as "scroll" and not as "broken". */
const FADE_BOTH = "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]";
const FADE_START = "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem)]";
const FADE_END = "[mask-image:linear-gradient(90deg,#000_calc(100%-2.5rem),transparent)]";

/** Used when a tab brings no skeleton of its own. */
function Lines(): React.JSX.Element {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" delay={120} />
      <Skeleton className="h-4 w-5/6" delay={240} />
      <Skeleton className="h-4 w-2/3" delay={360} />
    </div>
  );
}

/**
 * Tabs for dashboards and records where every panel costs a request. A panel runs its loader the first time it
 * opens, shows the skeleton you give it, and keeps what it loaded, so coming back is instant. If the request
 * fails the panel says "Could not load Billing" with a Retry button, and only that panel is affected. Hovering or
 * focusing a tab starts its request early; a tab that is loading swaps its icon for a small spinner (without an icon
 * its label pulses) and its panel is aria-busy, and no tab ever changes width for it; leaving a tab never cancels a
 * request that is already running, so the answer is waiting when you come back. A tab whose content is plain (no
 * function) behaves like an ordinary one. A row that is wider than its box scrolls sideways behind fade edges, with
 * the selected tab kept in view.
 */
export function LazyTabs({ tabs, value, defaultValue, onValueChange, prefetchOnHover = true, keepMounted = false, skeleton, variant = "line", label, labels, panelClassName, className, ...props }: LazyTabsProps) {
  const words = { ...WORDS, ...labels };
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.value ?? "");
  const current = value ?? own;

  // What has been asked and what came back lives in a ref, so a request that finishes after a re-render still finds it; `refresh` draws it.
  const store = useRef<Record<string, Entry>>({});
  const running = useRef(new Set<string>());
  const latest = useRef(tabs);
  const alive = useRef(true);
  const dwell = useRef<Record<string, number>>({});
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const track = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    latest.current = tabs;
  });
  useEffect(() => {
    alive.current = true;
    const timers = dwell.current;
    return () => {
      alive.current = false;
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  /** Runs the loader of a tab once. A tab already loading or loaded is left alone unless `again` is set (Retry). */
  function start(tabValue: string, again = false) {
    const tab = latest.current.find((item) => item.value === tabValue);
    if (!tab || typeof tab.load !== "function" || running.current.has(tabValue) || (!again && store.current[tabValue]?.status === "ready")) return;
    const load = tab.load as () => Promise<ReactNode>;
    running.current.add(tabValue);
    store.current[tabValue] = { status: "loading" };
    refresh();
    // A loader that throws at once is a failed request like any other.
    new Promise<ReactNode>((resolve) => resolve(load()))
      .then(
        (content): Entry => ({ status: "ready", content }),
        (error: unknown): Entry => ({ status: "error", detail: error instanceof Error ? error.message : undefined }),
      )
      .then((entry) => {
        running.current.delete(tabValue);
        store.current[tabValue] = entry;
        if (alive.current) refresh();
      });
  }

  const measure = () => {
    const element = track.current;
    if (!element) return;
    const next = { start: element.scrollLeft > 2, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 };
    setEdges((now) => (now.start === next.start && now.end === next.end ? now : next));
  };
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
    // `measure` reads a ref and sets state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The selected tab is kept in view inside the row (never the page), clear of the fade; the first time it just is there.
  useEffect(() => {
    const scroller = track.current;
    const tab = scroller?.querySelector<HTMLElement>("[role='tab'][data-state='active']");
    if (!scroller || !tab) return;
    const view = scroller.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    const before = box.left - view.left - 48;
    const after = box.right - view.right + 48;
    const delta = before < 0 ? before : after > 0 ? after : 0;
    const calm = !placed.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (delta) scroller.scrollBy({ left: delta, behavior: calm ? "auto" : "smooth" });
    placed.current = true;
  }, [current]);

  // The tab you are on loads when it opens, and is asked for once however often this runs.
  useEffect(() => {
    start(current);
    // `start` reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const nameOf = (tabValue: string): string => tabs.find((tab) => tab.value === tabValue)?.label ?? tabValue;
  const statusOf = (tab: LazyTab): Entry["status"] => (typeof tab.load === "function" ? (store.current[tab.value]?.status ?? "loading") : "ready");
  const status = statusOf(tabs.find((tab) => tab.value === current) ?? { value: current, label: current, load: null });

  // What a screen reader hears: that a tab is loading, and that it arrived. A failure speaks for itself, as an alert.
  const [said, setSaid] = useState("");
  const last = useRef<{ value: string; status: Entry["status"] } | null>(null);
  useEffect(() => {
    const before = last.current;
    last.current = { value: current, status };
    if (status === "loading") setSaid(fill(words.loading, nameOf(current)));
    else if (status === "ready" && before?.value === current && before.status === "loading") setSaid(fill(words.loaded, nameOf(current)));
    else setSaid("");
    // The words and names are read from the render that changed the status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, status]);

  const aim = (tabValue: string) => {
    if (!prefetchOnHover) return;
    window.clearTimeout(dwell.current[tabValue]);
    // A moment of rest, so sweeping across the row asks for nothing.
    dwell.current[tabValue] = window.setTimeout(() => start(tabValue), 120);
  };

  return (
    <Tabs
      data-slot="lazy-tabs"
      value={current}
      onValueChange={(next) => {
        if (value === undefined) setOwn(next);
        onValueChange?.(next);
      }}
      className={cn("min-w-0 gap-4", className)}
      {...props}
    >
      {/* A long row scrolls sideways behind fade edges; the padding (and the matching negative margin) leaves room for the focus ring inside the scroller, and the scroll padding keeps a tab reached by the keyboard clear of the fade. */}
      <div
        ref={track}
        onScroll={measure}
        className={cn("relative -m-1 scroll-px-12 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", edges.start && edges.end ? FADE_BOTH : edges.start ? FADE_START : edges.end ? FADE_END : null)}
      >
        <TabsList aria-label={label} variant={variant} className={cn("min-w-max", variant === "line" && "w-full gap-3 sm:gap-4")}>
          {tabs.map((tab) => {
            const loading = statusOf(tab) === "loading" && store.current[tab.value] !== undefined;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                aria-busy={loading || undefined}
                onFocus={() => prefetchOnHover && start(tab.value)}
                onPointerEnter={(event) => event.pointerType === "mouse" && aim(tab.value)}
                onPointerLeave={() => window.clearTimeout(dwell.current[tab.value])}
                className="group-data-[variant=pill]/list:px-3"
              >
                {/* The spinner takes the place of the icon, in the same 16px box, so no tab ever changes width when a request starts or ends. */}
                {tab.icon ? (
                  <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
                    {loading ? <Spinner size={16} label="" role="presentation" /> : tab.icon}
                  </span>
                ) : null}
                <span data-on={loading && !tab.icon} className="data-[on=true]:animate-pulse">
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {tabs.map((tab) => {
        const lazy = typeof tab.load === "function";
        const entry = store.current[tab.value];
        const state = statusOf(tab);
        const body =
          state === "ready" ? (
            // A short fade, so the content does not snap in over the skeleton it replaces.
            <div className="motion-safe:animate-rhs-fade-in">{lazy ? (entry as Extract<Entry, { status: "ready" }>).content : (tab.load as ReactNode)}</div>
          ) : state === "error" ? (
            <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-4 py-8 text-center">
              <span className="grid size-9 place-items-center rounded-full bg-destructive/10 text-destructive">
                <IconAlertCircle size={18} />
              </span>
              <div className="grid max-w-sm gap-0.5">
                <p className="text-sm font-medium">{fill(words.error, tab.label)}</p>
                {(entry as Extract<Entry, { status: "error" }>).detail ? <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{(entry as Extract<Entry, { status: "error" }>).detail}</p> : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => start(tab.value, true)}>
                <IconRefresh />
                {words.retry}
              </Button>
            </div>
          ) : (
            (tab.skeleton ?? skeleton ?? <Lines />)
          );
        return (
          <TabsContent
            key={tab.value}
            value={tab.value}
            // Only a panel that has something to keep is kept; one that is still loading or has failed goes when you leave it.
            {...(keepMounted && state === "ready" ? { forceMount: true as const } : {})}
            aria-busy={tab.value === current && state === "loading" ? true : undefined}
            className={cn("min-w-0 data-[state=inactive]:hidden", panelClassName)}
          >
            {body}
          </TabsContent>
        );
      })}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </span>
    </Tabs>
  );
}
