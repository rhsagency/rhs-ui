"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Tabs } from "@rhs-ui/primitives/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface FolderTab {
  /** What `value` and `onValueChange` speak. Unique among the tabs. */
  value: string;
  /** The name on the tab. A long one is cut at 12rem and shown whole in a tooltip. */
  label: string;
  /** An icon element ahead of the label: `<IconFileSheet />`. */
  icon?: ReactNode;
  /** Dimmed and not selectable. */
  disabled?: boolean;
}

export interface FolderTabsProps extends Omit<ComponentProps<typeof Tabs>, "children" | "value" | "defaultValue" | "onValueChange" | "orientation" | "dir" | "activationMode"> {
  /** The tabs, in order. */
  tabs: readonly FolderTab[];
  /** The selected tab, when you control it. */
  value?: string;
  /** The tab to start on, when you do not. Default the first. */
  defaultValue?: string;
  /** Called with the value of the tab that was chosen. */
  onValueChange?: (value: string) => void;
  /** Tab height: 28, 32 or 40px (the selected tab is 4px taller). Default "md". */
  size?: "sm" | "md" | "lg";
  /** The name of the tab list for assistive technology. Default "Tabs". */
  label?: string;
  /** Classes for the folder body the panels sit in, for its padding or its minimum height. */
  panelClassName?: string;
  /** The panels: `TabsContent` from @rhs-ui/primitives/tabs, one per value. */
  children?: ReactNode;
}

type Size = NonNullable<FolderTabsProps["size"]>;

/** Written out whole so Tailwind can see them: the selected tab is one step taller and takes the edge of the body. */
const SIZE: Record<Size, string> = {
  sm: "h-7 px-3 text-[0.8125rem] data-[state=active]:h-8",
  md: "h-8 px-3.5 text-sm data-[state=active]:h-9",
  lg: "h-10 px-4 text-[0.9375rem] data-[state=active]:h-11",
};

/** The fade at the ends of the scrolling row. A second, solid layer keeps the 1px baseline whole, or the body's top edge would open at the corners. */
const FADE_BOTH =
  "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent),linear-gradient(#000,#000)] [mask-position:0_0,0_100%] [mask-repeat:no-repeat] [mask-size:100%_100%,100%_1px]";
const FADE_START =
  "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem),linear-gradient(#000,#000)] [mask-position:0_0,0_100%] [mask-repeat:no-repeat] [mask-size:100%_100%,100%_1px]";
const FADE_END =
  "[mask-image:linear-gradient(90deg,#000_calc(100%-2.5rem),transparent),linear-gradient(#000,#000)] [mask-position:0_0,0_100%] [mask-repeat:no-repeat] [mask-size:100%_100%,100%_1px]";

const ARROW =
  "absolute top-1/2 z-20 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:size-4";

/** A tab. Its name is cut at 12rem; when it is cut, hovering (or tabbing to) it shows the whole name. */
function Folder({ tab, size }: { tab: FolderTab; size: Size }) {
  const text = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState(false);
  const isCut = () => {
    const element = text.current;
    return element !== null && element.scrollWidth > element.clientWidth + 0.5;
  };
  return (
    <TabsPrimitive.Trigger
      value={tab.value}
      disabled={tab.disabled}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible") && isCut()) setTip(true);
      }}
      onBlur={() => setTip(false)}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0 font-medium whitespace-nowrap outline-none select-none",
        "transition-[color,background-color,border-color] duration-150 motion-reduce:transition-none",
        "focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Behind: a quiet tone, standing on the baseline. A tint of the text colour, so it stays darker than the body in both themes.
        "border-border/70 bg-foreground/[0.045] text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground",
        // In front: the body's own surface, and one pixel lower so it covers the baseline under it.
        "data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground",
        // Its focus ring is drawn on three sides by an overlay: a ring on all four would paint a bar along the bottom edge and break the join with the body.
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-t-[calc(var(--radius-lg)-1px)] after:border-[3px] after:border-b-0 after:border-transparent data-[state=active]:focus-visible:ring-0 data-[state=active]:focus-visible:after:border-ring/40",
        SIZE[size],
      )}
    >
      {tab.icon}
      <Tooltip open={tip} onOpenChange={(next) => setTip(next && isCut())}>
        <TooltipTrigger asChild>
          <span ref={text} className="min-w-0 max-w-48 truncate">
            {tab.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tab.label}</TooltipContent>
      </Tooltip>
    </TabsPrimitive.Trigger>
  );
}

/**
 * Tabs shaped like folders, for content that belongs to the tab above it: a workbook, a set of open documents, a
 * record with its parts. The selected tab shares its surface with the body underneath and covers the body's top
 * edge, so bar and content read as one object with no seam in light or dark; the other tabs sit a little lower in
 * a muted tone. A long name is cut with an ellipsis and read whole from a tooltip. More tabs than room scroll
 * sideways behind fade edges (with arrows for the mouse), the selected tab scrolls into view, and arrow keys,
 * Home and End move between tabs. The body keeps its shape and a minimum height with nothing in it.
 */
export function FolderTabs({ tabs, value, defaultValue, onValueChange, size = "md", label = "Tabs", panelClassName, className, children, ...props }: FolderTabsProps) {
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.value ?? "");
  const current = value ?? own;
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const signature = tabs.map((tab) => `${tab.value}:${tab.label}`).join("|");

  const update = () => {
    const element = track.current;
    if (!element) return;
    const next = { start: element.scrollLeft > 2, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 };
    setEdges((previous) => (previous.start === next.start && previous.end === next.end ? previous : next));
  };

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    // A web font arriving changes every width.
    void document.fonts?.ready.then(update);
    return () => observer.disconnect();
    // `update` reads a ref and sets state: the one from this render is as good as any.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // The selected tab scrolls into view inside the row, never the page: only the row's own scroll moves.
  useEffect(() => {
    const scroller = track.current;
    const tab = scroller?.querySelector<HTMLElement>("[role='tab'][data-state='active']");
    if (!scroller || !tab) return;
    const view = scroller.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    const margin = 44;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const before = box.left - view.left - margin;
    const after = box.right - view.right + margin;
    if (before < 0) scroller.scrollBy({ left: before, behavior });
    else if (after > 0) scroller.scrollBy({ left: after, behavior });
  }, [current, signature]);

  const nudge = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    element.scrollBy({ left: direction * element.clientWidth * 0.7, behavior });
  };

  if (!tabs.length) return null;

  return (
    <Tabs
      data-slot="folder-tabs"
      value={current}
      onValueChange={(next) => {
        if (value === undefined) setOwn(next);
        onValueChange?.(next);
      }}
      className={cn("gap-0", className)}
      {...props}
    >
      <TooltipProvider delayDuration={300}>
        <div className="relative">
          {edges.start ? (
            <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)} className={cn(ARROW, "left-1")}>
              <IconChevronLeft />
            </button>
          ) : null}
          <div
            ref={track}
            onScroll={update}
            className={cn(
              "relative flex overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              edges.start && edges.end ? FADE_BOTH : edges.start ? FADE_START : edges.end ? FADE_END : null,
            )}
          >
            {/* The baseline is this list's own bottom border and runs the whole width of what scrolls. */}
            <TabsPrimitive.List aria-label={label} className="flex w-max min-w-full items-end gap-0.5 border-b border-border px-2">
              {tabs.map((tab) => (
                <Folder key={tab.value} tab={tab} size={size} />
              ))}
            </TabsPrimitive.List>
          </div>
          {edges.end ? (
            <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)} className={cn(ARROW, "right-1")}>
              <IconChevronRight />
            </button>
          ) : null}
        </div>
      </TooltipProvider>
      <div
        data-slot="folder-tabs-body"
        className={cn(
          "min-h-40 min-w-0 rounded-b-xl border border-t-0 border-border bg-card p-4 text-card-foreground sm:p-5",
          "[&_[data-slot=tabs-content]:focus-visible]:rounded-md [&_[data-slot=tabs-content]:focus-visible]:ring-[3px] [&_[data-slot=tabs-content]:focus-visible]:ring-ring/40",
          panelClassName,
        )}
      >
        {children}
      </div>
    </Tabs>
  );
}
