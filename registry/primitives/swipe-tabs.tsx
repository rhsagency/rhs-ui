"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SwipeTab {
  /** What `value` and `onValueChange` speak. Unique among the tabs. */
  value: string;
  /** The name on the tab. */
  label: string;
  /** An icon element ahead of the label: `<IconHome />`. */
  icon?: ReactNode;
  /** The panel: whatever belongs under this tab. It scrolls on its own when it is taller than the component. */
  content: ReactNode;
}

/** The words the component says on its own, for another language or your own wording. */
export interface SwipeTabsLabels {
  /** Said politely when a swipe lands on a tab, since no focus moves. `{tab}`, `{n}` and `{count}` are filled in. Default "{tab}, tab {n} of {count}". */
  swiped: string;
}

export interface SwipeTabsProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The tabs and their panels, in order. */
  tabs: readonly SwipeTab[];
  /** The selected tab, when you control it. */
  value?: string;
  /** The tab to start on, when you do not. Default the first. */
  defaultValue?: string;
  /** Called with the `value` of the tab that was chosen: by a tap, by the arrow keys, or by a swipe once the panel has settled. */
  onValueChange?: (value: string) => void;
  /** Mount only the selected panel and the ones next to it; the others stay empty until a swipe is about to reach them. Default false. */
  lazy?: boolean;
  /** Let a finger (or a trackpad) swipe between panels. Off, the panels only change with the tabs and the arrow keys, and slide the same way. Default true. */
  swipeable?: boolean;
  /** The name of the tab list for assistive technology: "Trip". */
  label?: string;
  /** The words of the announcement after a swipe. */
  labels?: Partial<SwipeTabsLabels>;
  /** Classes for the bar of tabs, for a sticky bar or another background. */
  barClassName?: string;
  /** Classes for every panel, for its padding. Default `p-4`. */
  panelClassName?: string;
}

const WORDS: SwipeTabsLabels = { swiped: "{tab}, tab {n} of {count}" };

/** How long the track must be quiet before a swipe counts as landed. A `scrollend` event ends the wait at once. */
const SETTLE_MS = 120;
/** The longest a slide that a tap started is waited for before the position, not the tap, decides. */
const REACH_MS = 1400;

const clamp = (n: number, low: number, high: number): number => Math.min(high, Math.max(low, n));

const prefersLess = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Marks which edges of a scrolling bar have more behind them ("l", "r", "lr"), for the fades that say so. */
function markEdges(scroller: HTMLElement, rtl: boolean): void {
  const max = scroller.scrollWidth - scroller.clientWidth;
  // In right-to-left text the offset counts down from zero, so the left edge is the far one.
  const left = rtl ? max + scroller.scrollLeft : scroller.scrollLeft;
  const value = `${left > 2 ? "l" : ""}${max - left > 2 ? "r" : ""}`;
  if (scroller.dataset.fade !== value) scroller.dataset.fade = value;
}

/**
 * Tabs for phones, where the panels are one wide row you swipe along and the tab bar above follows your
 * finger: the underline slides continuously from tab to tab as you drag, and each label takes on the
 * selected colour as the line reaches it. The panels sit in a horizontal scroll-snap track, so the browser does
 * the swiping, the momentum and the snapping; the component only reads where the track is. Tapping a tab
 * scrolls to its panel, a swipe selects the new tab once the track has settled, and only the visible panel
 * is exposed to assistive technology while the others are inert. With a mouse it is plain tabs: click, or
 * Left, Right, Home and End on the tab list. Vertical scrolling inside a panel is never blocked. With reduced
 * motion the slide becomes an instant change. A bar of many tabs scrolls sideways and keeps the line in view.
 */
export function SwipeTabs({ tabs, value, defaultValue, onValueChange, lazy = false, swipeable = true, label, labels, barClassName, panelClassName, className, ...props }: SwipeTabsProps) {
  const uid = useId();
  const words = { ...WORDS, ...labels };
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.value ?? "");
  const current = value ?? own;
  const found = tabs.findIndex((tab) => tab.value === current);
  const index = found === -1 ? 0 : found;
  const count = tabs.length;

  const bar = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const captions = useRef<(HTMLSpanElement | null)[]>([]);
  /** Where each label sits in the bar, measured, so the line can be drawn between two of them. */
  const boxes = useRef<{ left: number; width: number }[]>([]);
  /** Where the track is, in panels: 1.5 is halfway between the second and the third. */
  const progress = useRef(index);
  const touching = useRef(false);
  /** A slide the component started: the panel it is on its way to, and when it set off. */
  const goal = useRef<{ index: number; at: number } | null>(null);
  const quiet = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const ready = useRef(false);
  /** -1 in right-to-left text, read when the sizes are measured. */
  const flow = useRef<1 | -1>(1);
  const [said, setSaid] = useState("");
  const [drawn, setDrawn] = useState(false);

  const choose = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  // The listeners below are set up once; they read what the last render knew through this.
  const live = useRef({ index, tabs, lazy, choose, said: words.swiped });
  useEffect(() => {
    live.current = { index, tabs, lazy, choose, said: words.swiped };
  });

  /** +1 for left-to-right text, -1 for right-to-left, where the track's scroll offset counts down from zero. */
  const sign = useCallback((): 1 | -1 => (track.current && getComputedStyle(track.current).direction === "rtl" ? -1 : 1), []);
  /** Where the track is, in panels. Below zero or past the last one while it bounces at an end. */
  const at = useCallback((): number => {
    const el = track.current;
    return el ? (el.scrollLeft * sign()) / Math.max(1, el.clientWidth) : 0;
  }, [sign]);

  /** Draws the line, and the colour of each label, for a position between panels. Writes to the DOM directly: it runs on every scroll frame. */
  const paint = useCallback((position: number) => {
    progress.current = position;
    const list = boxes.current;
    const el = line.current;
    if (!el || !list.length) return;
    const low = clamp(Math.floor(position), 0, list.length - 1);
    const from = list[low];
    const to = list[Math.min(low + 1, list.length - 1)];
    if (!from || !to) return;
    const t = clamp(position - low, 0, 1);
    const left = from.left + (to.left - from.left) * t;
    const width = from.width + (to.width - from.width) * t;
    el.style.transform = `translateX(${left}px)`;
    el.style.width = `${width}px`;
    buttons.current.forEach((button, i) => button?.style.setProperty("--swipe-w", clamp(1 - Math.abs(position - i), 0, 1).toFixed(3)));
    // A bar wider than the screen scrolls with the line, so the selected tab is never out of sight.
    const scroller = bar.current;
    if (scroller && scroller.scrollWidth > scroller.clientWidth + 1) {
      const max = scroller.scrollWidth - scroller.clientWidth;
      const want = clamp(left + width / 2 - scroller.clientWidth / 2, 0, max);
      scroller.scrollLeft = flow.current === -1 ? want - max : want;
    }
    if (scroller) markEdges(scroller, flow.current === -1);
  }, []);

  const measure = useCallback(() => {
    const next: { left: number; width: number }[] = [];
    buttons.current.forEach((button, i) => {
      const caption = captions.current[i];
      if (button && caption) next[i] = { left: button.offsetLeft + caption.offsetLeft, width: caption.offsetWidth };
    });
    boxes.current = next;
    flow.current = track.current && getComputedStyle(track.current).direction === "rtl" ? -1 : 1;
    paint(progress.current);
  }, [paint]);

  /** Slides the track to a panel, or jumps when `animate` is off. Does nothing when it is already there. */
  const slideTo = useCallback(
    (target: number, animate: boolean) => {
      const el = track.current;
      if (!el || !el.clientWidth) return;
      const here = at();
      if (Math.abs(here - target) < 0.01) return;
      // The labels were coloured for the new selection a moment ago; take them back to where the track really is.
      paint(here);
      goal.current = { index: target, at: performance.now() };
      // With `lazy` the panels in between are empty: start one panel away, so the slide is always one panel long and never shows a blank.
      if (animate && live.current.lazy && Math.abs(here - target) > 1.5) el.scrollLeft = (target - Math.sign(target - here)) * el.clientWidth * sign();
      el.scrollTo({ left: target * el.clientWidth * sign(), behavior: animate && !prefersLess() ? "smooth" : "auto" });
    },
    [at, paint, sign],
  );

  /** The track has stopped: whichever panel it rests on is the selected one. A slide the component started is waited for. */
  const settle = useCallback(() => {
    window.clearTimeout(quiet.current);
    if (touching.current) return;
    const { index: shown, tabs: list, choose: pick, said: template } = live.current;
    const position = at();
    const target = goal.current;
    if (target) {
      if (Math.abs(position - target.index) > 0.02 && performance.now() - target.at < REACH_MS) {
        quiet.current = window.setTimeout(settle, SETTLE_MS);
        return;
      }
      goal.current = null;
    }
    const next = clamp(Math.round(position), 0, list.length - 1);
    const tab = list[next];
    // Let go between two panels, or past an end, and the browser has already snapped back to the selected one.
    if (next === shown || !tab) return;
    pick(tab.value);
    setSaid(template.replace("{tab}", tab.label).replace("{n}", String(next + 1)).replace("{count}", String(list.length)));
    // A controlled parent may refuse the change; then the track goes back to the tab that is still selected.
    window.setTimeout(() => {
      if (!touching.current && live.current.index !== next) slideTo(live.current.index, true);
    }, 80);
  }, [at, slideTo]);

  // The first paint is already on the right panel, with the line under the right tab.
  useLayoutEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = live.current.index * el.clientWidth * sign();
    progress.current = live.current.index;
    measure();
    ready.current = true;
    setDrawn(true);
  }, [measure, sign]);

  // The tab was chosen from outside the track (a tap, a key, a new `value`): slide there. A swipe that got here first is already on it.
  useLayoutEffect(() => {
    if (!touching.current) slideTo(index, ready.current);
  }, [index, slideTo]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.addEventListener("scrollend", settle);
    return () => el.removeEventListener("scrollend", settle);
  }, [settle]);

  // Rotating the phone or loading a font changes sizes: keep the panel in place and the line under its label.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width && !touching.current) {
        width = el.clientWidth;
        el.scrollLeft = live.current.index * width * sign();
      }
      measure();
    });
    observer.observe(el);
    captions.current.forEach((caption) => caption && observer.observe(caption));
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [measure, sign, count]);

  useEffect(
    () => () => {
      window.clearTimeout(quiet.current);
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const labelsKey = tabs.map((tab) => tab.label).join("\u0000");
  useLayoutEffect(() => {
    measure();
    // Only the words decide the sizes; `tabs` itself is a new array on every render.
  }, [labelsKey, measure]);

  function onScroll() {
    if (frame.current === undefined) {
      frame.current = requestAnimationFrame(() => {
        frame.current = undefined;
        paint(clamp(at(), 0, Math.max(0, live.current.tabs.length - 1)));
      });
    }
    window.clearTimeout(quiet.current);
    quiet.current = window.setTimeout(settle, SETTLE_MS);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const toward = sign();
    const step = event.key === "ArrowRight" ? toward : event.key === "ArrowLeft" ? -toward : 0;
    const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : step ? (index + step + count) % count : -1;
    const tab = tabs[next];
    if (next < 0 || !tab) return;
    event.preventDefault();
    choose(tab.value);
    buttons.current[next]?.focus();
  }

  return (
    <div data-slot="swipe-tabs" data-ready={drawn ? "true" : "false"} className={cn("group/swipe-tabs flex min-w-0 flex-col", className)} {...props}>
      <div className={cn("relative z-10 shrink-0 bg-background", barClassName)}>
        <div
          ref={bar}
          onScroll={(event) => markEdges(event.currentTarget, flow.current === -1)}
          className="relative overflow-x-auto [scrollbar-width:none] data-[fade=l]:[mask-image:linear-gradient(90deg,transparent,#000_2rem)] data-[fade=lr]:[mask-image:linear-gradient(90deg,transparent,#000_2rem,#000_calc(100%-2rem),transparent)] data-[fade=r]:[mask-image:linear-gradient(90deg,#000_calc(100%-2rem),transparent)] [&::-webkit-scrollbar]:hidden"
        >
          <div role="tablist" aria-label={label} aria-orientation="horizontal" onKeyDown={onKeyDown} className="relative flex w-max min-w-full border-b border-border">
            {tabs.map((tab, i) => {
              const selected = i === index;
              return (
                <button
                  key={tab.value}
                  ref={(node) => {
                    buttons.current[i] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`${uid}-panel-${i}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => choose(tab.value)}
                  style={{ "--swipe-w": selected ? 1 : 0 } as CSSProperties}
                  className={cn(
                    "relative flex h-12 shrink-0 grow basis-auto items-center justify-center px-3 text-sm font-medium whitespace-nowrap outline-none select-none",
                    // The colour is read from the line's position, one tab after the other, while a finger is down; at rest it is 0 or 1.
                    "text-[color:color-mix(in_oklab,var(--foreground)_calc(var(--swipe-w,0)*100%),var(--muted-foreground))]",
                    "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 active:bg-muted/60",
                    // Before the line is drawn (server markup, no script) the selected tab carries its own.
                    "after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 aria-selected:after:opacity-100 group-data-[ready=true]/swipe-tabs:after:hidden",
                  )}
                >
                  <span
                    ref={(node) => {
                      captions.current[i] = node;
                    }}
                    className="relative inline-flex items-center gap-1.5 [&_svg]:size-4 [&_svg]:shrink-0"
                  >
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              );
            })}
            <span ref={line} aria-hidden="true" className="pointer-events-none absolute -bottom-px left-0 h-0.5 w-0 rounded-full bg-foreground opacity-0 group-data-[ready=true]/swipe-tabs:opacity-100" />
          </div>
        </div>
      </div>
      <div
        ref={track}
        data-swipeable={swipeable ? "true" : "false"}
        onScroll={onScroll}
        onTouchStart={() => {
          touching.current = true;
          goal.current = null;
          window.clearTimeout(quiet.current);
        }}
        onTouchEnd={() => {
          touching.current = false;
          quiet.current = window.setTimeout(settle, SETTLE_MS);
        }}
        onTouchCancel={() => {
          touching.current = false;
          quiet.current = window.setTimeout(settle, SETTLE_MS);
        }}
        className="relative flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] data-[swipeable=false]:overflow-x-hidden [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, i) => {
          const selected = i === index;
          return (
            <div
              key={tab.value}
              role="tabpanel"
              id={`${uid}-panel-${i}`}
              aria-labelledby={`${uid}-tab-${i}`}
              inert={!selected}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "relative w-full min-w-0 shrink-0 snap-start snap-always overflow-y-auto p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
                panelClassName,
              )}
            >
              {lazy && Math.abs(i - index) > 1 ? null : tab.content}
            </div>
          );
        })}
      </div>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </span>
    </div>
  );
}
