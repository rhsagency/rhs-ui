"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Tabs, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface ResponsiveTab {
  /** What `value` and `onValueChange` speak. Unique among the tabs. */
  value: string;
  /** The name of the section: the tab's text and the option's text. */
  label: string;
  /** An icon element ahead of the label, in the tabs and in the select: `<IconBell />`. */
  icon?: ReactNode;
  /** A number after the label (unread, open): shown in both forms. */
  count?: number;
  /** Dimmed and not selectable, in the tabs and in the select. */
  disabled?: boolean;
}

export interface ResponsiveTabsProps extends Omit<ComponentProps<typeof Tabs>, "children" | "value" | "defaultValue" | "onValueChange" | "orientation" | "dir" | "activationMode"> {
  /** The sections, in order. */
  tabs: readonly ResponsiveTab[];
  /** The selected tab, when you control it. */
  value?: string;
  /** The tab to start on, when you do not. Default the first one that is not disabled. */
  defaultValue?: string;
  /** Called with the value of the tab that was chosen, in either form. */
  onValueChange?: (value: string) => void;
  /** A container width in px. Narrower than this it is a select, wider it is tabs, whatever the labels. Left out, it measures: it becomes a select exactly when the labels stop fitting. */
  breakpoint?: number;
  /** The name of the tab list and of the select for assistive technology: "Account settings". */
  label: string;
  /** `line` (an underline, the default) or `pill` (a segmented control). */
  variant?: "line" | "pill";
  /** The locale the counts are written in. Default "en-US". */
  locale?: string;
  /** The panels: `TabsContent` from @rhs-ui/primitives/tabs, one per value. They stay mounted in place while the control changes shape. */
  children?: ReactNode;
}

type Shape = "pending" | "tabs" | "select";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The number after a tab's label. It follows the tab's state (the selected tab's is a shade darker) and says "," first to a screen reader, so "Notifications, 3" is not read as one phrase. */
function Count({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-muted px-1.5 text-[0.6875rem] font-medium text-muted-foreground tabular-nums transition-colors duration-150 motion-reduce:transition-none",
        "group-data-[state=active]/tab:bg-foreground/10 group-data-[state=active]/tab:text-foreground",
        "group-data-[variant=pill]/list:bg-foreground/[0.07] group-data-[variant=pill]/list:group-data-[state=active]/tab:bg-muted",
      )}
    >
      <span className="sr-only">, </span>
      {value}
    </span>
  );
}

/**
 * A tab list that turns into one select when its container is too narrow to show every label, the usual fix for a
 * settings page or a dashboard with five or six sections. It measures its own box, not the window, so the same
 * component is tabs in a wide column and a select in a side panel. The select is the house Select (never the
 * browser's) and shows the current tab's icon and label. Nothing is rebuilt when the shape changes: the panels
 * stay mounted where they are, so a half-typed field survives a resize; focus moves from the active tab to the
 * select (and back) when it had it; arrows move between tabs and typing jumps in the list, as in each form.
 */
export function ResponsiveTabs({ tabs, value, defaultValue, onValueChange, breakpoint, label, variant = "line", locale = "en-US", className, children, ...props }: ResponsiveTabsProps) {
  const [own, setOwn] = useState(defaultValue ?? tabs.find((tab) => !tab.disabled)?.value ?? tabs[0]?.value ?? "");
  const current = value ?? own;
  const choose = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  const format = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [shape, setShape] = useState<Shape>("pending");
  const shapeNow = useRef<Shape>("pending");
  const handoff = useRef<"tab" | "select" | null>(null);
  const [open, setOpen] = useState(false);
  const signature = tabs.map((tab) => `${tab.value}:${tab.label}:${tab.count ?? ""}`).join("|");

  // The container decides, never the window. The tab list stays laid out (only hidden) while the select shows, so its natural width is always there to compare. Before the first measure (the server render, with no script) it is shown as tabs, clipped to its box.
  useIsoLayoutEffect(() => {
    const host = root.current;
    const list = bar.current;
    if (!host || !list) return;
    const measure = () => {
      const available = host.clientWidth;
      // A box that is not laid out (display: none) tells nothing: keep the shape it has.
      if (available <= 0) return;
      const next: Shape = (breakpoint === undefined ? list.scrollWidth > available + 1 : available < breakpoint) ? "select" : "tabs";
      if (shapeNow.current === next) return;
      // Remember which control had focus: it is about to disappear, and its counterpart takes it below.
      const held = document.activeElement;
      handoff.current = held instanceof HTMLElement && host.contains(held) ? (held.closest("[role='tab']") ? "select" : held.closest("[data-slot='select-trigger']") ? "tab" : null) : null;
      shapeNow.current = next;
      setShape(next);
    };
    measure();
    // The observer answers on the next frame: a change of layout in its own callback ends in "loop completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer.observe(host);
    observer.observe(list);
    // A web font arriving changes every width.
    void document.fonts?.ready.then(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [breakpoint, signature, variant]);

  useIsoLayoutEffect(() => {
    const to = handoff.current;
    handoff.current = null;
    if (to === "select") trigger.current?.focus({ preventScroll: true });
    else if (to === "tab") bar.current?.querySelector<HTMLElement>("[role='tab'][data-state='active']")?.focus({ preventScroll: true });
  }, [shape]);

  // An open list does not outlive the select it hangs from.
  useEffect(() => {
    if (shape !== "select") setOpen(false);
  }, [shape]);

  return (
    <Tabs
      data-slot="responsive-tabs"
      data-shape={shape}
      value={current}
      onValueChange={choose}
      className={cn(
        "gap-4",
        // Radix makes every panel a tab stop, and the tabs item draws nothing on it: the focused panel gets the same ring as the rest.
        "[&_[data-slot=tabs-content]:focus-visible]:rounded-md [&_[data-slot=tabs-content]:focus-visible]:ring-[3px] [&_[data-slot=tabs-content]:focus-visible]:ring-ring/40",
        className,
      )}
      {...props}
    >
      <div ref={root} className="relative min-w-0">
        {/* Before the first measure the tabs show, clipped to their box so a long row cannot widen the page: the server render has a navigation too, and the layout effect picks the select before the first client paint. While the select shows, this is out of the flow, clipped and hidden (not removed): it keeps its width to measure, its ids for the panels' labels, and nobody can reach it. */}
        <div className={cn(shape === "pending" && "overflow-hidden", shape === "select" && "pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden")}>
          <TabsList ref={bar} aria-label={label} variant={variant} className={shape === "select" ? "w-max" : variant === "line" ? "w-full" : "max-w-full"}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className="group/tab">
                {tab.icon}
                {tab.label}
                {tab.count !== undefined ? <Count value={format.format(tab.count)} /> : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className={cn(shape !== "select" && "hidden")}>
          <Select value={current} onValueChange={choose} open={open} onOpenChange={setOpen}>
            <SelectTrigger ref={trigger} aria-label={label} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value} disabled={tab.disabled}>
                  <span className="inline-flex min-w-0 items-center gap-2">
                    {tab.icon ? <span className="inline-flex shrink-0 text-muted-foreground [&_svg]:size-4">{tab.icon}</span> : null}
                    <span className="truncate">{tab.label}</span>
                    {/* An option is named from its own text, so the count carries no hidden words: the name and what is seen stay the same. */}
                    {tab.count !== undefined ? (
                      <span className="inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-muted px-1.5 text-[0.6875rem] font-medium text-muted-foreground tabular-nums [[data-highlighted]_&]:bg-background">
                        {format.format(tab.count)}
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {children}
    </Tabs>
  );
}
