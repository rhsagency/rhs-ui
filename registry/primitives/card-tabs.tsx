"use client";

import { useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { Tabs, TabsContent } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface CardTab {
  /** What `value` and `onValueChange` speak. Unique among the tabs. */
  value: string;
  /** The name of the choice. It is the accessible name of the tab. */
  title: string;
  /** One line under the title: what choosing it means. It is the tab's description. */
  description?: string;
  /** An icon element in a tile at the start of the card: `<IconBriefcase />`. */
  icon?: ReactNode;
  /** A number at the end of the title row: open items, seats, results. It is part of the tab's name. */
  count?: number;
  /** The card cannot be chosen and the arrow keys skip it. */
  disabled?: boolean;
}

export interface CardTabsProps extends Omit<ComponentProps<typeof Tabs>, "children" | "value" | "defaultValue" | "onValueChange" | "orientation"> {
  /** The cards, in order. */
  tabs: readonly CardTab[];
  /** The selected tab, when you control it. */
  value?: string;
  /** The tab to start on, when you do not. Default the first. */
  defaultValue?: string;
  /** Called with the `value` of the card that was chosen, with a click or the arrow keys. */
  onValueChange?: (value: string) => void;
  /** `horizontal` lays the cards out as a grid above the panel; `vertical` makes them a list beside it (above it on a phone). Default "horizontal". */
  orientation?: "horizontal" | "vertical";
  /** How many cards share a row from the `sm` breakpoint up, for a horizontal grid. On a phone they stack in the same order. Default the number of tabs, at most 3. */
  columns?: 1 | 2 | 3 | 4;
  /** The locale the counts are written in. Default "en-US". */
  locale?: string;
  /** The name of the tab list for assistive technology: "Deploy to". */
  label?: string;
  /** Classes for the list of cards. */
  listClassName?: string;
  /** The panels: `CardTabsContent`, one per value. */
  children?: ReactNode;
}

const COLUMNS = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" } as const;

/**
 * Tabs whose triggers are cards, for choosing between jobs, plans or modes: an icon in a tile, a title, one
 * line saying what the choice means and an optional count. The selected card has a stronger border and an
 * inverted tile, which read without colour. They are real tabs with tabpanels, so arrow keys move and
 * select and the panel of the selected card is announced and linked to it; a card is named by what it shows,
 * title, count and line, so what someone sees is what a voice command or a screen reader says. In a grid the
 * arrow keys also move up and down by the number of cards in a row, as many as the layout really has, so a
 * phone's single column works too. A vertical list puts the cards beside the panel.
 */
export function CardTabs({ tabs, value, defaultValue, onValueChange, orientation = "horizontal", columns, locale = "en-US", label, listClassName, className, children, ...props }: CardTabsProps) {
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const format = new Intl.NumberFormat(locale);
  const vertical = orientation === "vertical";
  const across = columns ?? (Math.min(Math.max(tabs.length, 1), 3) as 1 | 2 | 3);

  /** Up and down in a grid: by a whole row, as the layout is right now. Radix moves along the row itself. */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (vertical || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    const from = triggers.current.findIndex((node) => node === document.activeElement);
    if (from < 0) return;
    const step = Math.max(1, getComputedStyle(event.currentTarget).gridTemplateColumns.split(" ").filter(Boolean).length);
    const dir = event.key === "ArrowDown" ? 1 : -1;
    let to = from + dir * step;
    // A short last row: from a card above a gap, going down lands on the last card.
    if (dir === 1 && to >= tabs.length && Math.floor(from / step) < Math.floor((tabs.length - 1) / step)) to = tabs.length - 1;
    while (to >= 0 && to < tabs.length && tabs[to]?.disabled) to += dir * step;
    if (to < 0 || to >= tabs.length) return;
    event.preventDefault();
    // Focus selects: these tabs activate automatically, as Tabs does.
    triggers.current[to]?.focus();
  }

  return (
    <Tabs
      data-slot="card-tabs"
      orientation={orientation}
      {...(value === undefined ? { defaultValue: defaultValue ?? tabs[0]?.value } : { value })}
      onValueChange={onValueChange}
      className={cn("min-w-0 gap-5", vertical && "md:grid md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start md:gap-8", className)}
      {...props}
    >
      <TabsPrimitive.List aria-label={label} onKeyDown={onKeyDown} className={cn("grid min-w-0 grid-cols-1 gap-3", vertical ? "gap-2" : COLUMNS[across], listClassName)}>
        {tabs.map((tab, i) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            ref={(node) => {
              triggers.current[i] = node;
            }}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "group/card-tab relative flex w-full min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none",
              "transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
              "hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/40",
              // A second, inner line makes the border twice as strong: a shape change, not only a shade.
              "data-[state=active]:border-foreground data-[state=active]:shadow-[inset_0_0_0_1px_var(--foreground)] data-[state=active]:hover:border-foreground",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {tab.icon ? (
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-foreground transition-colors duration-150 group-data-[state=active]/card-tab:border-primary group-data-[state=active]/card-tab:bg-primary group-data-[state=active]/card-tab:text-primary-foreground motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-[1.125rem]"
              >
                {tab.icon}
              </span>
            ) : null}
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium">{tab.title}</span>
                {tab.count !== undefined ? (
                  <span className="h-5 shrink-0 rounded-full bg-muted px-2 text-xs leading-5 font-medium text-muted-foreground tabular-nums transition-colors duration-150 group-data-[state=active]/card-tab:bg-foreground/10 group-data-[state=active]/card-tab:text-foreground motion-reduce:transition-none">{format.format(tab.count)}</span>
                ) : null}
              </span>
              {tab.description ? <span className="text-xs leading-relaxed text-muted-foreground">{tab.description}</span> : null}
            </span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </Tabs>
  );
}

/**
 * The panel of one card: put what the card stands for in it. `value` is the card's value. The selected panel is
 * a tab stop (that is how the keyboard gets from the cards into it), so it shows a ring while it has focus.
 */
export function CardTabsContent({ className, ...props }: ComponentProps<typeof TabsContent>) {
  return <TabsContent data-slot="card-tabs-content" className={cn("min-w-0 rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/40", className)} {...props} />;
}
