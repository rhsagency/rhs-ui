"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { IconChevronLeft, IconChevronRight, IconClose, IconPlus, IconPushpin } from "@rhs-ui/icons";
import { DisabledReason } from "@rhs-ui/primitives/disabled-reason";
import { Tabs } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface ClosableTab {
  /** What `value`, `onValueChange` and `onClose` speak. Unique among the tabs. */
  id: string;
  /** The name on the tab. A long one is cut at 12rem; the whole name is its tooltip. */
  label: string;
  /** An icon element ahead of the label: `<IconFileCode />`. */
  icon?: ReactNode;
  /** Give the tab a close button. Default true; `false` pins it: a small pin stands where the button would be, so every tab keeps the same room. */
  closable?: boolean;
  /** Unsaved changes: a dot stands where the close button is until the pointer or focus is on the tab, and the name of the tab says so. */
  dirty?: boolean;
}

/** The words the tabs speak, for another language or your own wording. */
export interface ClosableTabsLabels {
  /** The name of a close button; `{label}` is the tab. Default "Close {label}". */
  close: string;
  /** Said after the name of a tab with unsaved changes. Default "unsaved changes". */
  dirty: string;
  /** Why the plus button is off at the limit; `{max}` is `maxTabs`. Default "You can have {max} tabs open. Close one to open another." */
  limit: string;
  /** Said politely once a tab is gone; `{label}` is its name. Default "{label} closed". */
  closed: string;
}

export interface ClosableTabsProps extends Omit<ComponentProps<typeof Tabs>, "children" | "value" | "defaultValue" | "onValueChange" | "orientation" | "dir"> {
  /** The tabs, in order. */
  tabs: readonly ClosableTab[];
  /** The id of the selected tab, when you control it. */
  value?: string;
  /** The id of the tab to start on, when you do not. Default the first. */
  defaultValue?: string;
  /** Called with the id of the tab that was chosen, and of the neighbour that takes over when the selected tab is closed. */
  onValueChange?: (id: string) => void;
  /** Called with the id of the tab the person wants closed, by its button, a middle click or Delete. Nothing closes until you remove it from `tabs`, so you can ask first. */
  onClose?: (id: string) => void;
  /** Called by the plus button at the end. Add the tab and select it; focus then follows to it. Without it there is no plus. */
  onAdd?: () => void;
  /** The name of the plus button. Default "New tab". */
  addLabel?: string;
  /** The most tabs there can be. At that many the plus button stays in the tab order, dimmed, and says why. */
  maxTabs?: number;
  /** The name of the tab list for assistive technology. Default "Open tabs". */
  label?: string;
  /** The words the tabs speak. */
  labels?: Partial<ClosableTabsLabels>;
  /** The panels: `TabsContent` from @rhs-ui/primitives/tabs, one per id. Or leave them out and show the content yourself. */
  children?: ReactNode;
}

const WORDS: ClosableTabsLabels = {
  close: "Close {label}",
  dirty: "unsaved changes",
  limit: "You can have {max} tabs open. Close one to open another.",
  closed: "{label} closed",
};

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);

const FADE_BOTH = "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]";
const FADE_START = "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem)]";
const FADE_END = "[mask-image:linear-gradient(90deg,#000_calc(100%-2.5rem),transparent)]";
const ARROW =
  "absolute top-1/2 z-20 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground motion-reduce:transition-none [@media(hover:hover)]:inline-flex [&_svg]:size-3.5";

/**
 * A tab strip for things that are open and can be shut: files, reports, queries. Each tab has its own close
 * button, named after it ("Close Report Q3"); a middle click or Delete on a tab asks for it to close too, and a
 * dot replaces the button on a tab with unsaved changes. Closing is always your decision: `onClose` is only a
 * request, so you can ask first, and when the selected tab is gone the nearest neighbour (the one to its right,
 * or the one to its left at the end) becomes selected and takes focus. The plus at the end calls `onAdd` and
 * dims with a reason at `maxTabs`. More tabs than room scroll sideways behind fade edges (with arrows where there
 * is a pointer; touch swipes), with the selected tab kept in view. Built on Tabs: arrow keys, Home and End move,
 * and panels are `TabsContent` children.
 */
export function ClosableTabs({ tabs, value, defaultValue, onValueChange, onClose, onAdd, addLabel = "New tab", maxTabs, label = "Open tabs", labels, className, children, ...props }: ClosableTabsProps) {
  const words = { ...WORDS, ...labels };
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.id ?? "");
  const current = value ?? own;
  const ids = tabs.map((tab) => tab.id);
  const signature = ids.join("\u0000");
  const track = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const [said, setSaid] = useState("");
  // The tab the pointer is on and the tab that has focus: either one shows its close button and its background.
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const atLimit = maxTabs !== undefined && tabs.length >= maxTabs;

  const choose = (id: string) => {
    if (value === undefined) setOwn(id);
    onValueChange?.(id);
  };

  const update = () => {
    const element = track.current;
    if (!element) return;
    const next = { start: element.scrollLeft > 2, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 };
    setEdges((now) => (now.start === next.start && now.end === next.end ? now : next));
  };
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
    // `update` reads a ref and sets state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // The selected tab scrolls into view inside the strip, never the page.
  useEffect(() => {
    const scroller = track.current;
    const tab = scroller?.querySelector<HTMLElement>("[role='tab'][data-state='active']");
    if (!scroller || !tab) return;
    const view = scroller.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    const before = box.left - view.left - 40;
    const after = box.right - view.right + 40;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (before < 0) scroller.scrollBy({ left: before, behavior });
    else if (after > 0) scroller.scrollBy({ left: after, behavior });
  }, [current, signature]);

  const nudge = (direction: 1 | -1) => {
    const element = track.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth * 0.6, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const focusTab = (id: string) => track.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`)?.focus();
  const retry = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(retry.current), []);

  /** Moves focus, and keeps trying for a moment while it is held by a dialog that is still closing or has dropped to the page, so a confirmation in between does not lose it. */
  const settle = (focus: () => void) => {
    window.clearTimeout(retry.current);
    let tries = 0;
    const attempt = () => {
      const active = document.activeElement;
      const adrift = !active || active === document.body;
      if (tries === 0 || adrift) focus();
      if (tries++ < 12 && (adrift || document.activeElement?.closest("[role='alertdialog'], [role='dialog']"))) retry.current = window.setTimeout(attempt, 120);
    };
    attempt();
  };

  // What happened to the strip since the last render: which tab the person asked to close, how the order was, and whether a tab was just added.
  const closing = useRef<{ id: string; label: string } | null>(null);
  const adding = useRef(false);
  const before = useRef({ ids, count: tabs.length });
  useEffect(() => {
    const previous = before.current;
    before.current = { ids, count: tabs.length };

    // The selected tab is gone: the nearest neighbour takes over, to the right first.
    if (ids.length && !ids.includes(current)) {
      const at = previous.ids.indexOf(current);
      const neighbour = at === -1 ? ids[0] : (previous.ids.slice(at + 1).find((id) => ids.includes(id)) ?? previous.ids.slice(0, at).reverse().find((id) => ids.includes(id)) ?? ids[0]);
      if (neighbour !== undefined) choose(neighbour);
      return;
    }

    // A tab the person asked to close has gone: say so, and put focus on the tab that is selected now, or on the plus if none is left.
    const pending = closing.current;
    if (pending && !ids.includes(pending.id)) {
      closing.current = null;
      setSaid(fill(words.closed, { label: pending.label }));
      if (ids.length) settle(() => focusTab(current));
      else settle(() => strip.current?.querySelector<HTMLElement>("[data-slot='closable-tabs-add']")?.focus());
    }

    // A tab was added from the plus: focus follows to the one that is selected.
    if (adding.current && tabs.length > previous.count) {
      adding.current = false;
      settle(() => focusTab(current));
    }
    // `choose` and `words` are read from the render that changed the tabs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, current]);

  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  function ask(tab: ClosableTab) {
    if (tab.closable === false || !onClose) return;
    closing.current = { id: tab.id, label: tab.label };
    onClose(tab.id);
  }

  return (
    <Tabs
      data-slot="closable-tabs"
      value={current}
      onValueChange={(next) => {
        // The person has moved on from whatever they asked to close.
        closing.current = null;
        choose(next);
      }}
      className={cn("min-w-0 gap-0", className)}
      {...props}
    >
      <div ref={strip} className="relative flex items-end">
        {/* The hairline sits under the tabs, and the underline of the selected tab covers it. */}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-border" />
        <div className="relative z-10 min-w-0">
          {edges.start ? (
            <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)} className={cn(ARROW, "left-0")}>
              <IconChevronLeft />
            </button>
          ) : null}
          <div
            ref={track}
            onScroll={update}
            className={cn("relative overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", edges.start && edges.end ? FADE_BOTH : edges.start ? FADE_START : edges.end ? FADE_END : null)}
          >
            {/* One grid, one column a tab. The tablist holds only tabs, as ARIA wants (it is display: contents, so its tabs are the grid's); each close button comes after it and sits in the same cell as its tab. */}
            <div className="grid w-max auto-cols-max grid-flow-col items-end gap-x-0.5 px-0.5 pb-px">
              <TabsPrimitive.List aria-label={label} className="contents">
                {tabs.map((tab, index) => {
                  const closable = tab.closable !== false && Boolean(onClose);
                  // A pinned tab keeps the room of a close button, with a pin in it, so the row does not read as uneven at rest.
                  const pinned = tab.closable === false && Boolean(onClose);
                  return (
                    <TabsPrimitive.Trigger
                      key={tab.id}
                      value={tab.id}
                      data-tab-id={tab.id}
                      data-hot={hover === tab.id || focus === tab.id}
                      title={tab.label}
                      style={{ gridColumn: index + 1, gridRow: 1 }}
                      // Without panels there is nothing for aria-controls to point at.
                      {...(children ? {} : { "aria-controls": undefined })}
                      onFocus={() => setFocus(tab.id)}
                      onBlur={() => setFocus(null)}
                      onPointerEnter={() => setHover(tab.id)}
                      onPointerLeave={() => setHover(null)}
                      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                        if (event.key !== "Delete" || !closable) return;
                        event.preventDefault();
                        ask(tab);
                      }}
                      onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
                        // The browser's autoscroll circle would open on a middle press.
                        if (event.button === 1) event.preventDefault();
                      }}
                      onAuxClick={(event: MouseEvent<HTMLButtonElement>) => {
                        if (event.button !== 1 || !closable) return;
                        event.preventDefault();
                        ask(tab);
                      }}
                      className={cn(
                        "relative inline-flex h-9 items-center gap-2 rounded-md pl-3 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none select-none",
                        "transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 data-[hot=true]:bg-muted/70 data-[state=active]:text-foreground motion-reduce:transition-none",
                        "after:pointer-events-none after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity after:duration-150 data-[state=active]:after:opacity-100 motion-reduce:after:transition-none",
                        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                        closable || pinned ? "pr-8" : "pr-3",
                      )}
                    >
                      {tab.icon}
                      <span className="max-w-48 truncate">{tab.label}</span>
                      {tab.dirty ? <span className="sr-only">, {words.dirty}</span> : null}
                      {pinned ? <IconPushpin size={12} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-muted-foreground/60" /> : null}
                    </TabsPrimitive.Trigger>
                  );
                })}
              </TabsPrimitive.List>
              {tabs.map((tab, index) => {
                if (tab.closable === false || !onClose) return null;
                const hot = hover === tab.id || focus === tab.id;
                const shown = tab.id === current || hot || Boolean(tab.dirty);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    tabIndex={-1}
                    data-shown={shown}
                    aria-label={fill(words.close, { label: tab.label })}
                    style={{ gridColumn: index + 1, gridRow: 1 }}
                    onClick={() => ask(tab)}
                    onPointerEnter={() => setHover(tab.id)}
                    onPointerLeave={() => setHover(null)}
                    className={cn(
                      "z-10 mr-1.5 grid size-5 place-items-center self-center justify-self-end rounded-md text-muted-foreground outline-none",
                      "transition-[opacity,background-color,color] duration-150 hover:bg-foreground/10 hover:text-foreground motion-reduce:transition-none",
                      // Seen on the selected tab, on hover and focus, and always on a tab with unsaved changes (it shows a dot); always on a screen without hover.
                      "opacity-0 data-[shown=true]:opacity-100 [@media(hover:none)]:opacity-100",
                    )}
                  >
                    <IconClose size={12} strokeWidth={2.25} className={cn("col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none", tab.dirty && !hot && "opacity-0")} />
                    {tab.dirty ? <span aria-hidden="true" className={cn("col-start-1 row-start-1 size-2 rounded-full bg-foreground transition-opacity duration-150 motion-reduce:transition-none", hot && "opacity-0")} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
          {edges.end ? (
            <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)} className={cn(ARROW, "right-0")}>
              <IconChevronRight />
            </button>
          ) : null}
        </div>
        {onAdd ? (
          <div className="relative z-10 flex h-9 shrink-0 items-center pl-1">
            <DisabledReason disabled={atLimit} reason={fill(words.limit, { max: String(maxTabs ?? "") })} placement="bottom">
              <button
                type="button"
                data-slot="closable-tabs-add"
                aria-label={addLabel}
                onClick={() => {
                  adding.current = true;
                  onAdd();
                }}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:size-4"
              >
                <IconPlus />
              </button>
            </DisabledReason>
          </div>
        ) : null}
      </div>
      {children ? <div className="pt-4">{children}</div> : null}
      <span role="status" aria-live="polite" className="sr-only">
        {said}
      </span>
    </Tabs>
  );
}
