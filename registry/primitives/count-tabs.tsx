"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface CountTab {
  /** What `value` and `onValueChange` speak. Unique among the tabs. */
  value: string;
  /** The name of the view: "Open". */
  label: string;
  /** How many things are in it. Leave it out for a tab that has no number. */
  count?: number;
  /** The count is on its way: a small skeleton stands in for it and the name says it is loading. */
  loading?: boolean;
  /** The tab is switched off: it cannot be chosen and is skipped by the arrow keys. A count of zero does not do this; the empty view stays reachable. */
  disabled?: boolean;
}

export interface CountTabsLabels {
  /** The hidden words after the label for a count of one; `{count}` is the number. Default "{count} item". */
  one?: string;
  /** The same for any other count. Default "{count} items". */
  other?: string;
  /** The same above `max`, where the number on screen is "99+". Default "more than {count} items". */
  many?: string;
  /** The same while the count loads. Default "loading count". */
  loading?: string;
}

export interface CountTabsProps extends Omit<ComponentProps<typeof Tabs>, "children" | "value" | "defaultValue" | "onValueChange"> {
  /** The tabs, in order. Each carries its own count. */
  tabs: readonly CountTab[];
  /** The selected tab, when you control it. */
  value?: string;
  /** The tab to start on, when you do not. Default the first. */
  defaultValue?: string;
  /** Called with the `value` of the tab that was chosen, with a click or the arrow keys. */
  onValueChange?: (value: string) => void;
  /** `line` (an underline, the default) or `pill` (a segmented control). */
  variant?: "line" | "pill";
  /** Counts above this show as "99+": the number you give, plus. Default 99. */
  max?: number;
  /** The locale the counts are written in. Default "en-US". */
  locale?: string;
  /** The name of the tab list for assistive technology: "Pull requests". */
  label?: string;
  /** The hidden words that make up each tab's name, for another language. */
  labels?: CountTabsLabels;
  /** The panels: `TabsContent` from @rhs-ui/primitives/tabs, one per value. Or leave them out and show one list yourself. */
  children?: ReactNode;
}

/**
 * Tabs that show how much is in each view: "Open 12", "Closed 48", "All 60". The count sits by the
 * label in tabular figures, so a changing number does not shuffle the row, and it collapses to "99+"
 * above a limit. It is part of the name a screen reader hears ("Open, 12 items"). While a count is
 * loading a small skeleton stands in, and a view with nothing in it dims but stays reachable. When the
 * count of the tab you are on changes, it is announced once and politely; the others stay quiet.
 * Built on Tabs, so arrow keys move and select, and a long row scrolls sideways on a phone.
 */
export function CountTabs({ tabs, value, defaultValue, onValueChange, variant = "line", max = 99, locale = "en-US", label, labels, className, children, ...props }: CountTabsProps) {
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.value ?? "");
  const current = value ?? own;
  const format = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const words = { one: labels?.one ?? "{count} item", other: labels?.other ?? "{count} items", many: labels?.many ?? "more than {count} items", loading: labels?.loading ?? "loading count" };

  const phrase = (count: number): string => (count > max ? words.many.replace("{count}", format.format(max)) : (count === 1 ? words.one : words.other).replace("{count}", format.format(count)));
  /** What follows the label in the name of a tab, hidden: ", 12 items". */
  const hint = (tab: CountTab): string | null => (tab.loading ? words.loading : tab.count === undefined ? null : phrase(tab.count));

  // Only the count of the tab you are on is news. It is told once, after it has changed: not on arrival, not for other tabs,
  // and a count that comes back from loading is compared with the one it had before.
  const selected = tabs.find((tab) => tab.value === current);
  const known = selected && !selected.loading ? selected.count : undefined;
  const before = useRef<{ value: string; count: number | undefined }>({ value: current, count: known });
  const [message, setMessage] = useState("");
  useEffect(() => {
    const last = before.current;
    before.current = { value: current, count: known ?? (last.value === current ? last.count : undefined) };
    if (last.value !== current) setMessage("");
    else if (selected && known !== undefined && last.count !== undefined && last.count !== known) setMessage(`${selected.label}, ${phrase(known)}`);
    // `phrase` and `selected` are read from the render that changed the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, known]);

  return (
    <Tabs
      data-slot="count-tabs"
      value={current}
      onValueChange={(next) => {
        if (value === undefined) setOwn(next);
        onValueChange?.(next);
      }}
      className={cn("min-w-0 gap-4", className)}
      {...props}
    >
      {/* A long row scrolls sideways; the padding (and the matching negative margin) leaves room for the focus ring inside the scroller. */}
      <div className="relative -m-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList aria-label={label} variant={variant} className={cn("min-w-max", variant === "line" && "w-full gap-3 sm:gap-4")}>
          {tabs.map((tab) => {
            const empty = !tab.loading && tab.count === 0;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                aria-busy={tab.loading || undefined}
                // Without panels there is nothing for aria-controls to point at.
                {...(children ? {} : { "aria-controls": undefined })}
                data-empty={empty || undefined}
                className="group/tab group-data-[variant=pill]/list:px-2.5 data-[empty]:data-[state=inactive]:text-muted-foreground/80"
              >
                {tab.label}
                {/* The name is the label and, hidden, the count in words; the number you see is the same thing, written short. */}
                {hint(tab) ? <span className="sr-only">, {hint(tab)}</span> : null}
                {tab.loading ? (
                  <Skeleton className="h-4.5 w-6 rounded-full" />
                ) : tab.count !== undefined ? (
                  <Badge
                    variant="muted"
                    aria-hidden="true"
                    className={cn(
                      "h-[1.125rem] min-w-[1.125rem] px-1.5 text-[0.6875rem] tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                      "group-data-[state=active]/tab:bg-foreground/10 group-data-[state=active]/tab:text-foreground",
                      "group-data-[variant=pill]/list:bg-transparent group-data-[variant=pill]/list:px-1 group-data-[variant=pill]/list:group-data-[state=active]/tab:bg-muted",
                      empty && "opacity-75",
                    )}
                  >
                    {/* The space is collapsed on screen; it keeps "Open 12", not "Open12", for anything that reads the visible text. */}
                    {" "}
                    {tab.count > max ? `${format.format(max)}+` : format.format(tab.count)}
                  </Badge>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </span>
      {children}
    </Tabs>
  );
}
