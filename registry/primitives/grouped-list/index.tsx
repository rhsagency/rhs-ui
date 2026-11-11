"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { cn } from "@/lib/utils";

/** One group of the list: a heading and the items under it. */
export interface ListGroup<Item> {
  /** Unique in the list. It is what `getGroupLabel` receives to work out the heading, so it can be a date: "2026-11-10". */
  id: string;
  /** The heading. Default the `id`. */
  label?: string;
  /** What the jump rail shows for the group. Default the first character of the heading, in capitals. */
  railLabel?: string;
  /** The items under the heading, in the order to show them. A group with no items is left out. */
  items: readonly Item[];
}

/** The words the list says on its own, for another language or your own wording. `{count}` and `{group}` are filled in. */
export interface GroupedListLabels {
  /** The count when a group has one item, as the plural rules of the locale call it. Default "{count} item". */
  countOne: string;
  /** The count for any other number. Default "{count} items". */
  countOther: string;
  /** The name of the jump rail. Default "Jump to a group". */
  index: string;
  /** The name of one rail button. Default "Go to {group}". */
  jump: string;
  /** What shows when there are no groups. Default "Nothing to show". */
  empty: string;
}

export interface GroupedListProps<Item> extends Omit<ComponentProps<"div">, "children" | "aria-label" | "ref"> {
  /** Names the scrolling list for assistive technology: "Contacts". Required, because the list can take focus and a focusable region needs a name. */
  label: string;
  /** The groups, in order. */
  groups: readonly ListGroup<Item>[];
  /** Draws one item. Its result goes inside a list item that already has padding and a rule between items. */
  renderItem: (item: Item, group: ListGroup<Item>) => ReactNode;
  /** A key for each item. Default `item.id`, then the place in its group. */
  getItemKey?: (item: Item, index: number) => string | number;
  /** The heading of a group, when it has to be worked out: turn a date into "Today" and "Yesterday". Without it the heading is the group's `label`, then its `id`. */
  getGroupLabel?: (group: ListGroup<Item>) => string;
  /** Keep each heading under the top edge while its group scrolls, until the next heading pushes it out. Default true. */
  stickyHeaders?: boolean;
  /** Add a rail beside the list with one button per group, to jump to it. For alphabetical lists. The rail is one Tab stop: Up, Down, Home and End move between its buttons, Enter or Space jump. Each button is 24 pixels tall, so give the list about 24 pixels for every group or the rail scrolls. Default false. */
  indexRail?: boolean;
  /** The locale that picks "1 item" or "3 items". Default "en-US". */
  locale?: string;
  /** What shows in place of the groups when there are none. */
  empty?: ReactNode;
  /** Classes for every list item. */
  itemClassName?: string;
  /** The words the list says, for translation. */
  labels?: Partial<GroupedListLabels>;
}

const DEFAULT_LABELS = {
  countOne: "{count} item",
  countOther: "{count} items",
  index: "Jump to a group",
  jump: "Go to {group}",
  empty: "Nothing to show",
} satisfies GroupedListLabels;

const fill = (template: string, values: Readonly<Record<string, string | number>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/**
 * A long list under group headings: days, letters, teams. Each heading is an `h3` above a real list, so a screen reader
 * user can move by heading or by list, and each shows how many items it holds. With `stickyHeaders` the heading of the
 * group being read stays under the top edge and is pushed out cleanly by the next one. With `indexRail` a strip of
 * buttons beside the list jumps to a group, moves the focus to its heading and marks the group you are in; it lists
 * only the groups that exist, so there is no Q when nothing starts with Q. The rail is a single Tab stop, like a
 * toolbar: Up, Down, Home and End move between the letters and Enter or Space jump, so a keyboard user is not made to
 * Tab through twenty buttons. Each button is 24 pixels tall; in a list too short for all of them the rail scrolls and
 * keeps the letter in view. Give the list a height (`h-96`): it scrolls inside it, and the scroll area can take the
 * keyboard focus. To turn dates into "Today" and "Yesterday", pass `getGroupLabel`. A list takes functions as props,
 * so render it from a client component.
 */
export function GroupedList<Item>({
  label,
  groups,
  renderItem,
  getItemKey,
  getGroupLabel,
  stickyHeaders = true,
  indexRail = false,
  locale = "en-US",
  empty,
  itemClassName,
  labels,
  className,
  ...props
}: GroupedListProps<Item>) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const root = useRef<HTMLDivElement>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const headings = useRef(new Map<string, HTMLElement>());
  // While the list scrolls itself to a group, the scroll is not allowed to move the marker.
  const lock = useRef(0);
  const railBox = useRef<HTMLDivElement>(null);
  // The rail button the arrow keys have walked to. Null while the rail has no focus: its one Tab stop is then the group in view.
  const [walked, setWalked] = useState<string | null>(null);

  const shown = groups.filter((group) => group.items.length > 0);
  const ids = shown.map((group) => group.id);
  const idsKey = ids.join("\u0000");
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const plural = new Intl.PluralRules(locale);

  const titleOf = (group: ListGroup<Item>) => getGroupLabel?.(group) ?? group.label ?? group.id;
  const rail = indexRail && shown.length > 1 ? shown.map((group) => ({ id: group.id, text: group.railLabel ?? ([...titleOf(group)][0] ?? "").toUpperCase() })) : [];
  // The one button of the rail that is in the Tab order: where the arrow keys are, else the group in view.
  const stop = [walked, active].find((id) => id != null && rail.some((item) => item.id === id)) ?? rail[0]?.id;

  const viewportOf = () => root.current?.querySelector<HTMLElement>("[data-slot='scroll-area-viewport']") ?? null;

  useEffect(() => {
    if (rail.length === 0) return;
    const viewport = viewportOf();
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (performance.now() < lock.current) return;
      const top = viewport.getBoundingClientRect().top;
      let current = ids[0];
      for (const id of ids) {
        const element = sections.current.get(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top - top <= 1) current = id;
        else break;
      }
      // At the very end the last group may never reach the top: it is the one in view.
      if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2) current = ids.at(-1) ?? current;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
    // The groups are read by their ids: a new array with the same groups must not rebind the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rail.length, idsKey]);

  // A rail too tall for the list scrolls by itself. Keep the marked letter in view by moving the rail and nothing else: scrollIntoView would drag the page along.
  useEffect(() => {
    const box = railBox.current;
    const mark = box?.querySelector<HTMLElement>("[aria-current=true]");
    if (!box || !mark || box.scrollHeight <= box.clientHeight) return;
    const edge = box.getBoundingClientRect();
    const at = mark.getBoundingClientRect();
    if (at.top < edge.top) box.scrollTop -= edge.top - at.top;
    else if (at.bottom > edge.bottom) box.scrollTop += at.bottom - edge.bottom;
  }, [active, rail.length]);

  /** Up, Down, Home and End walk the letters of the rail. Nothing is jumped to until Enter or Space, as a click would. */
  function onRailKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const here = buttons.findIndex((button) => button === document.activeElement);
    if (here < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : Math.min(buttons.length - 1, Math.max(0, here + (event.key === "ArrowDown" ? 1 : -1)));
    event.preventDefault();
    buttons[next]?.focus();
  }

  function jump(id: string) {
    const viewport = viewportOf();
    const section = sections.current.get(id);
    const heading = headings.current.get(id);
    if (!viewport || !section || !heading) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The scroll box is moved by hand: scrollIntoView would also scroll the page behind it.
    const top = section.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
    lock.current = performance.now() + (reduce ? 50 : 600);
    viewport.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    heading.focus({ preventScroll: true });
    setActive(id);
  }

  return (
    <div ref={root} data-slot="grouped-list" className={cn("flex min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs", className)} {...props}>
      <ScrollArea
        role="region"
        aria-label={label}
        // The scroll area wraps its content in a table, which grows with the widest line instead of letting text truncate; and its focus ring sits inside, where the frame does not clip it.
        className="min-h-0 min-w-0 flex-1 [&_[data-radix-scroll-area-viewport]>div]:block! [&_[data-slot=scroll-area-viewport]]:focus-visible:ring-inset"
      >
        {shown.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{empty ?? words.empty}</p>
        ) : (
          shown.map((group, index) => {
            const headingId = `${base}-${index}`;
            const count = group.items.length;
            const countText = fill(plural.select(count) === "one" ? words.countOne : words.countOther, { count });
            return (
              <div
                key={group.id}
                ref={(element) => {
                  if (element) sections.current.set(group.id, element);
                  else sections.current.delete(group.id);
                }}
              >
                <h3
                  ref={(element) => {
                    if (element) headings.current.set(group.id, element);
                    else headings.current.delete(group.id);
                  }}
                  id={headingId}
                  tabIndex={-1}
                  className={cn(
                    // Only a bottom edge: the rule between two groups belongs to the list above, so a heading stuck under the card's own border never doubles it.
                    "flex items-baseline gap-2 border-b border-border bg-muted px-4 py-1.5 text-[0.8125rem] font-semibold tracking-[-0.01em] outline-none",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset",
                    stickyHeaders && "sticky top-0 z-10",
                  )}
                >
                  <span className="min-w-0 truncate">{titleOf(group)}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                    <span aria-hidden="true">{count}</span>
                    <span className="sr-only">{`, ${countText}`}</span>
                  </span>
                </h3>
                <ul aria-labelledby={headingId} className={cn("divide-y divide-border", index < shown.length - 1 && "border-b border-border")}>
                  {group.items.map((item, position) => (
                    <li key={getItemKey ? getItemKey(item, position) : ((item as { id?: string | number }).id ?? position)} className={cn("px-4 py-2.5", itemClassName)}>
                      {renderItem(item, group)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </ScrollArea>
      {rail.length > 0 ? (
        // One composite control: a single Tab stop, and the arrow keys do the walking. The rail scrolls, without a bar, when the list is too short for every letter.
        <div
          ref={railBox}
          role="toolbar"
          aria-orientation="vertical"
          aria-label={words.index}
          onKeyDown={onRailKeyDown}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setWalked(null);
          }}
          className="relative flex w-7 shrink-0 flex-col overflow-y-auto overscroll-contain border-l border-border bg-card py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {rail.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={fill(words.jump, { group: item.text })}
              aria-current={active === item.id ? "true" : undefined}
              tabIndex={item.id === stop ? 0 : -1}
              onFocus={() => setWalked(item.id)}
              onClick={() => jump(item.id)}
              // 24 pixels tall, the least a target may be; the auto margins centre a short rail and let a long one scroll from its first letter.
              className="grid h-6 shrink-0 place-items-center text-[0.6875rem] leading-none font-medium text-muted-foreground outline-none transition-colors duration-150 first:mt-auto last:mb-auto hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset aria-[current=true]:bg-muted aria-[current=true]:text-foreground motion-reduce:transition-none"
            >
              {item.text}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
