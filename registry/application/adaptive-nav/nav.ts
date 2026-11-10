/**
 * The words and the small decisions behind AdaptiveNav, as plain functions:
 * they hold no state and call no hook, so a Server Component can use them too.
 */

import type { ReactNode } from "react";

/** The three shapes the navigation takes: a bar along the bottom, a rail of icons, a full sidebar. */
export type NavForm = "bar" | "rail" | "sidebar";

/** One destination. */
export interface AdaptiveNavItem {
  /** A stable identity: `current` and `onNavigate` use it. Unique within the list. */
  id: string;
  /** What people call it. It is always the item's name, in a tooltip when only the icon shows. */
  label: string;
  /** An icon element, drawn at 20px. */
  icon: ReactNode;
  /** Where it goes. With one the item is a link; without, a button, and `onNavigate` is the only thing that happens. */
  href?: string;
  /** A count or a short word on the item: 12, "New". Nothing is drawn for 0 or an empty string. */
  badge?: number | string;
  /** What the badge counts, said after it to a screen reader: "open orders". */
  badgeLabel?: string;
  /** The heading of the group the item sits under in the sidebar. Items next to each other with the same group share a heading. */
  group?: string;
}

/** The words the navigation says, for translation. `{label}` is filled in. */
export interface AdaptiveNavLabels {
  /** The name of the navigation landmark. Default "Main". */
  nav?: string;
  /** The last button of the bottom bar, and the title of the sheet it opens. Default "More". */
  more?: string;
  /** The name of that button while the current page is one of the items in the sheet. Default "More, current page: {label}". */
  moreCurrent?: string;
  /** The sheet's close button. Default "Close". */
  close?: string;
  /** The name of the page area beside the navigation, which scrolls on its own and so takes focus. Default "Page content". */
  content?: string;
}

export const DEFAULT_LABELS = {
  nav: "Main",
  more: "More",
  moreCurrent: "More, current page: {label}",
  close: "Close",
  content: "Page content",
} satisfies Required<AdaptiveNavLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? (values[key] ?? mark) : mark));
}

/** The container widths where the navigation changes shape. They follow the compact, medium and expanded window classes. */
export interface AdaptiveNavBreakpoints {
  /** From this width the bar becomes a rail. Default 600. */
  medium?: number;
  /** From this width the rail becomes a sidebar. Default 840. */
  expanded?: number;
}

/** The form for a container that is `width` wide. */
export function formFor(width: number, { medium = 600, expanded = 840 }: AdaptiveNavBreakpoints = {}): NavForm {
  return width < medium ? "bar" : width < expanded ? "rail" : "sidebar";
}

/** How many places the bottom bar has: the destinations and, when something is left over, the button that opens the rest. */
export const BAR_SLOTS = 5;

/** The items the bottom bar shows and the ones that wait in the sheet. Without `extras` (a header or footer to put in the sheet) five or fewer items all fit. */
export function splitForBar(items: readonly AdaptiveNavItem[], extras: boolean): { shown: readonly AdaptiveNavItem[]; rest: readonly AdaptiveNavItem[] } {
  if (items.length <= BAR_SLOTS && !extras) return { shown: items, rest: [] };
  const shown = items.slice(0, BAR_SLOTS - 1);
  return { shown, rest: items.slice(shown.length) };
}

/** Items in runs that share a group, in order. Items without a group make a run of their own with no heading. */
export function groupItems(items: readonly AdaptiveNavItem[]): { label: string | undefined; items: AdaptiveNavItem[] }[] {
  const groups: { label: string | undefined; items: AdaptiveNavItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.label === item.group) last.items.push(item);
    else groups.push({ label: item.group, items: [item] });
  }
  return groups;
}

/** Whether the badge has anything to say. */
export function hasBadge(item: AdaptiveNavItem): boolean {
  return item.badge !== undefined && item.badge !== "" && item.badge !== 0;
}

/** The badge as one phrase for a screen reader: "12 open orders". */
export function badgeSpeech(item: AdaptiveNavItem): string {
  return hasBadge(item) ? [String(item.badge), item.badgeLabel].filter(Boolean).join(" ") : "";
}
