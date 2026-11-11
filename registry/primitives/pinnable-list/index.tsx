"use client";

import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconPushpin } from "@rhs-ui/icons";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { cn } from "@/lib/utils";

export interface PinnableItem {
  /** Unique in the list. It is what `pinned` holds. */
  id: string;
  /** The item in a few words: "Q3 planning". It names the pin button ("Pin Q3 planning") and is read out when the item is pinned. */
  label: string;
  /** What the row shows. Default the label. */
  content?: ReactNode;
}

/** The words the list says on its own, for another language or your own wording. `{label}`, `{count}` and `{max}` are filled in. */
export interface PinnableListLabels {
  /** The name of a pin button. Default "Pin {label}". */
  pin: string;
  /** The title of the group of pinned items. Default "Pinned". */
  pinnedGroup: string;
  /** The title of the group of the others, shown while something is pinned. Default "Everything else". */
  restGroup: string;
  /** What is announced after pinning when there is a limit. Default "{label} pinned, {count} of {max}". */
  pinned: string;
  /** What is announced after pinning when there is no limit. Default "{label} pinned". */
  pinnedNoLimit: string;
  /** What is announced after unpinning. Default "{label} unpinned". */
  unpinned: string;
  /** The line that says why the other pin buttons are off. Default "You can pin up to {max} items. Unpin one to pin another." */
  limit: string;
  /** What shows when there are no items. Default "Nothing here yet". */
  empty: string;
}

export interface PinnableListProps extends Omit<ComponentProps<"div">, "children" | "defaultValue"> {
  /** The items, in the order to show them. The order inside each group is this order, so sorting stays yours. */
  items: readonly PinnableItem[];
  /** The ids of the pinned items, when you control them. */
  pinned?: readonly string[];
  /** The ids pinned to start with, when you do not control them. */
  defaultPinned?: readonly string[];
  /** Called with the ids that are pinned after the person pins or unpins an item. */
  onPinnedChange?: (pinned: string[]) => void;
  /** Draws a row's content in place of `content`, and says whether it is pinned. */
  renderItem?: (item: PinnableItem, state: { pinned: boolean }) => ReactNode;
  /** The most items that can be pinned. At the limit the pin buttons of the rest are off, and a line says why. Default no limit. */
  maxPinned?: number;
  /** The words the list says, for translation. */
  labels?: Partial<PinnableListLabels>;
}

const DEFAULT_LABELS = {
  pin: "Pin {label}",
  pinnedGroup: "Pinned",
  restGroup: "Everything else",
  pinned: "{label} pinned, {count} of {max}",
  pinnedNoLimit: "{label} pinned",
  unpinned: "{label} unpinned",
  limit: "You can pin up to {max} items. Unpin one to pin another.",
  empty: "Nothing here yet",
} satisfies PinnableListLabels;

const fill = (template: string, values: Readonly<Record<string, string | number>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/**
 * A list where items can be pinned to the top, for conversations, projects, documents and favourites. Each row has a
 * pin toggle that reports `aria-pressed` and is named for its row ("Pin Q3 planning"). Pinning moves the row into a
 * "Pinned" group above the rest with a short move (instant under reduced motion), and a polite line announces it:
 * "Q3 planning pinned, 2 of 5". The order inside each group is the order of `items`, so your own sorting is kept. With
 * `maxPinned`, the pin buttons of the other rows switch off at the limit and the reason is written under the group title
 * and tied to each of them; they stay in the tab order, so the reason can be found. Controlled with `pinned` and
 * `onPinnedChange`, or uncontrolled with `defaultPinned`.
 */
export function PinnableList({ items, pinned, defaultPinned, onPinnedChange, renderItem, maxPinned, labels, className, ...props }: PinnableListProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const [own, setOwn] = useState<readonly string[]>(defaultPinned ?? []);
  const [said, setSaid] = useState("");
  const rows = useRef(new Map<string, HTMLElement>());
  // Where each row was before the change, so the layout effect can move it from there to where it is now.
  const before = useRef<Map<string, number> | null>(null);
  // The row whose pin button had the focus: it moves to the other group as a new element, and the focus has to follow it.
  const keep = useRef<string | null>(null);

  const ids = pinned ?? own;
  const pinnedItems = items.filter((item) => ids.includes(item.id));
  const restItems = items.filter((item) => !ids.includes(item.id));
  const atLimit = maxPinned !== undefined && pinnedItems.length >= maxPinned;
  const limitId = `${base}-limit`;
  const order = `${pinnedItems.map((item) => item.id).join(",")}|${restItems.map((item) => item.id).join(",")}`;

  useLayoutEffect(() => {
    const kept = keep.current;
    if (kept) {
      keep.current = null;
      rows.current.get(kept)?.querySelector<HTMLElement>("[data-pin]")?.focus({ preventScroll: true });
    }
    const from = before.current;
    if (!from) return;
    before.current = null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const [id, element] of rows.current) {
      const start = from.get(id);
      if (start === undefined) continue;
      const distance = start - element.getBoundingClientRect().top;
      if (Math.abs(distance) < 1) continue;
      // A row that travels passes over the rows between, which paint after it: it stays on top for as long as it moves.
      element.style.zIndex = "1";
      const move = element.animate([{ transform: `translateY(${distance}px)` }, { transform: "translateY(0)" }], { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
      const settle = () => {
        element.style.zIndex = "";
      };
      move.onfinish = settle;
      move.oncancel = settle;
    }
  }, [order]);

  function change(item: PinnableItem, next: boolean) {
    if (next && atLimit) return;
    before.current = new Map([...rows.current].map(([id, element]) => [id, element.getBoundingClientRect().top] as const));
    keep.current = rows.current.get(item.id)?.contains(document.activeElement) ? item.id : null;
    const list = next ? [...ids, item.id] : ids.filter((id) => id !== item.id);
    if (pinned === undefined) setOwn(list);
    onPinnedChange?.(list);
    const count = list.filter((id) => items.some((entry) => entry.id === id)).length;
    setSaid(next ? fill(maxPinned === undefined ? words.pinnedNoLimit : words.pinned, { label: item.label, count, max: maxPinned ?? count }) : fill(words.unpinned, { label: item.label }));
  }

  const row = (item: PinnableItem, isPinned: boolean) => {
    const blocked = !isPinned && atLimit;
    return (
      <li
        key={item.id}
        ref={(element) => {
          if (element) rows.current.set(item.id, element);
          else rows.current.delete(item.id);
        }}
        data-pinned={isPinned || undefined}
        className="relative flex items-center gap-3 bg-card px-3 py-2 transition-colors duration-150 hover:bg-muted/50 motion-reduce:transition-none"
      >
        <div className="min-w-0 flex-1">{renderItem ? renderItem(item, { pinned: isPinned }) : (item.content ?? <span className="block truncate text-sm font-medium">{item.label}</span>)}</div>
        <Toggle
          size="sm"
          pressed={isPinned}
          data-pin=""
          // Not `disabled`: that takes the button out of the tab order, and the reason with it.
          aria-disabled={blocked || undefined}
          aria-describedby={blocked ? limitId : undefined}
          aria-label={fill(words.pin, { label: item.label })}
          onPressedChange={(next) => change(item, next)}
          className="shrink-0 text-muted-foreground/70 hover:text-foreground data-[state=on]:bg-muted data-[state=on]:text-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground/70"
        >
          <IconPushpin aria-hidden="true" />
        </Toggle>
      </li>
    );
  };

  const pinnedTitleId = `${base}-pinned`;
  const restTitleId = `${base}-rest`;

  return (
    <div data-slot="pinnable-list" className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-xs", className)} {...props}>
      {items.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">{words.empty}</p> : null}
      {pinnedItems.length > 0 ? (
        <div role="group" aria-labelledby={pinnedTitleId}>
          <h3 id={pinnedTitleId} className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <IconPushpin aria-hidden="true" className="size-3 shrink-0" />
            <span>{words.pinnedGroup}</span>
            <span className="font-normal tabular-nums">
              <span aria-hidden="true">{maxPinned === undefined ? pinnedItems.length : `${pinnedItems.length}/${maxPinned}`}</span>
              <span className="sr-only">{maxPinned === undefined ? `, ${pinnedItems.length}` : `, ${pinnedItems.length} of ${maxPinned}`}</span>
            </span>
          </h3>
          {atLimit ? (
            <p id={limitId} className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
              {fill(words.limit, { max: maxPinned ?? 0 })}
            </p>
          ) : null}
          <ul className="divide-y divide-border">{pinnedItems.map((item) => row(item, true))}</ul>
        </div>
      ) : null}
      {restItems.length > 0 ? (
        pinnedItems.length > 0 ? (
          <div role="group" aria-labelledby={restTitleId} className="border-t border-border">
            <h3 id={restTitleId} className="border-b border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {words.restGroup}
            </h3>
            <ul className="divide-y divide-border">{restItems.map((item) => row(item, false))}</ul>
          </div>
        ) : (
          <ul className="divide-y divide-border">{restItems.map((item) => row(item, false))}</ul>
        )
      ) : null}
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
