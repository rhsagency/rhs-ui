"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconChevronDown, IconChevronUp, IconGrip } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { clamp, fill, moveId, resolveOrder, slotTops, type Slot } from "@rhs-ui/primitives/rank-list/order";
import { cn } from "@/lib/utils";

export interface RankItem {
  /** A stable id. The order is a list of these. */
  id: string;
  /** The name of the item. It is announced when the item is picked up and moved. */
  label: string;
  /** A line under the label. */
  description?: string;
}

/** Every sentence the list says. `{label}`, `{position}` and `{total}` are filled in. Each one can be replaced, for another language or your own voice. */
export interface RankListMessages {
  /** The name of a row's grip: "Reorder Launch checklist". */
  handle: string;
  /** What a screen reader hears with a grip, so it knows the keys. */
  instructions: string;
  /** Announced when a row is picked up with the keyboard. */
  pickedUp: string;
  /** Announced each time the lifted row changes place: "Moved to position 2 of 5". */
  moved: string;
  /** Announced when the row is dropped. */
  dropped: string;
  /** Announced when the move is cancelled. */
  cancelled: string;
  /** The name of the Move up button. */
  moveUp: string;
  /** The name of the Move down button. */
  moveDown: string;
  /** What the list says when there is nothing in it. */
  empty: string;
}

const MESSAGES: RankListMessages = {
  handle: "Reorder {label}",
  instructions: "To pick up a row, press Space. While it is lifted, use the arrow keys to move it, Space to drop it and Escape to cancel.",
  pickedUp: "Picked up {label}, position {position} of {total}. Use the arrow keys to move it, Space to drop it, Escape to cancel.",
  moved: "Moved to position {position} of {total}",
  dropped: "Dropped {label} at position {position} of {total}",
  cancelled: "Cancelled. {label} is back at position {position} of {total}",
  moveUp: "Move {label} up",
  moveDown: "Move {label} down",
  empty: "Nothing to rank yet",
};

export interface RankListProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The things to put in order. */
  items: readonly RankItem[];
  /** The ids in the order they are ranked, when you control the list. Items that are not named follow in their own order. */
  value?: readonly string[];
  /** The order to start with, when you do not control the list. Default: the order of `items`. */
  defaultValue?: readonly string[];
  /** Called with the new order when a row is dropped in a new place. Never during the drag. */
  onValueChange?: (value: string[]) => void;
  /** Show each row's rank, 1 to n, in tabular figures. It renumbers as rows are moved. Default true. */
  numbered?: boolean;
  /** Add Move up and Move down buttons to every row, for people and devices that cannot drag. Default false. */
  moveButtons?: boolean;
  /** The tallest the list grows before it scrolls inside itself, a number of px or any CSS length. While dragging, it scrolls itself at its edges. */
  maxHeight?: number | string;
  /** Turn the whole list off. */
  disabled?: boolean;
  /** The field's name, for a plain form submit: one hidden input for each id, in rank order. */
  name?: string;
  /** Every sentence the list says. Each can be replaced. */
  messages?: Partial<RankListMessages>;
  /** The name of the list for a screen reader. Give this or `aria-labelledby`. */
  "aria-label"?: string;
  /** The id of a visible element that names the list. */
  "aria-labelledby"?: string;
}

/** A row that is picked up: where everything sat, and where the row is now. */
interface Lift {
  id: string;
  /** Where it was picked up, and where it would be dropped. */
  from: number;
  to: number;
  mode: "keyboard" | "pointer";
  slots: Record<string, Slot>;
  gap: number;
  origin: number;
  /** How far the pointer has carried the row from its place. */
  dy: number;
  /** The pointer is up and the row is settling into its place. */
  dropping: boolean;
}

/** The nearest ancestor that scrolls, or null for the page. */
function scrollParentOf(element: HTMLElement | null): HTMLElement | null {
  for (let node = element?.parentElement ?? null; node; node = node.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

const SETTLE = 170;

/**
 * Put things in order: a list for ranking options, ordering steps or
 * prioritising work. Each row has a grip for the mouse and for touch, and the
 * keyboard works the way it does in every accessible sortable list: Space picks
 * a row up, the arrow keys move it, Space drops it and Escape cancels, with
 * "Moved to position 2 of 5" announced politely. Move up and Move down buttons
 * are there on request for assistive technology that cannot drag. The rank
 * numbers renumber live, the lifted row gets a fine outline instead of a
 * shadow while the others make room (no animation under reduced motion), and
 * the list scrolls itself at its edges while a row is dragged. The new order is
 * reported once, when the row is dropped.
 */
export function RankList({
  items,
  value,
  defaultValue,
  onValueChange,
  numbered = true,
  moveButtons = false,
  maxHeight,
  disabled = false,
  name,
  messages: custom,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: RankListProps) {
  const text = useMemo<RankListMessages>(() => ({ ...MESSAGES, ...custom }), [custom]);
  const helpId = useId();
  const [own, setOwn] = useState<readonly string[]>(() => resolveOrder(defaultValue, items));
  const order = useMemo(() => resolveOrder(value ?? own, items), [value, own, items]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const [lift, setLift] = useState<Lift | null>(null);
  const [note, setNote] = useState("");
  const list = useRef<HTMLOListElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  // The lift as the handlers see it right now: state is a render behind a pointer that moves faster.
  const live = useRef<Lift | null>(null);
  const drag = useRef<{ pointerId: number; grab: number; y: number } | null>(null);
  const frame = useRef(0);
  const settle = useRef(0);
  const refocus = useRef<{ id: string; part: "handle" | "up" | "down" } | null>(null);
  const total = order.length;

  function hold(next: Lift | null) {
    live.current = next;
    setLift(next);
  }

  const say = (template: string, id: string, position: number) => setNote(fill(template, { label: byId.get(id)?.label ?? "", position, total }));

  /** Measure the rows where they are, before any of them moves. */
  function measure() {
    const slots: Record<string, Slot> = {};
    for (const id of order) {
      const row = rows.current.get(id);
      if (row) slots[id] = { top: row.offsetTop, height: row.offsetHeight };
    }
    const first = slots[order[0] ?? ""];
    const second = slots[order[1] ?? ""];
    return { slots, gap: first && second ? Math.max(0, second.top - (first.top + first.height)) : 0, origin: first?.top ?? 0 };
  }

  function pickUp(id: string, mode: Lift["mode"]): Lift | null {
    const from = order.indexOf(id);
    if (from < 0 || live.current) return null;
    const next: Lift = { id, from, to: from, mode, ...measure(), dy: 0, dropping: false };
    hold(next);
    return next;
  }

  /** End the lift. A new order is reported once, here. */
  function putDown(lifted: Lift, announce: boolean) {
    window.clearTimeout(settle.current);
    window.cancelAnimationFrame(frame.current);
    drag.current = null;
    hold(null);
    const next = moveId(order, lifted.from, lifted.to);
    if (next.some((id, index) => id !== order[index])) {
      if (value === undefined) setOwn(next);
      onValueChange?.(next);
    }
    refocus.current = { id: lifted.id, part: "handle" };
    if (announce) say(text.dropped, lifted.id, lifted.to + 1);
  }

  function cancel(lifted: Lift) {
    window.clearTimeout(settle.current);
    window.cancelAnimationFrame(frame.current);
    drag.current = null;
    hold(null);
    say(text.cancelled, lifted.id, lifted.from + 1);
  }

  function moveBy(id: string, delta: -1 | 1) {
    const from = order.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= total) return;
    const next = moveId(order, from, to);
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
    refocus.current = { id, part: delta < 0 ? "up" : "down" };
    say(text.moved, id, to + 1);
  }

  function onHandleKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (disabled) return;
    const current = live.current;
    if (!current) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        const picked = pickUp(id, "keyboard");
        if (picked) say(text.pickedUp, id, picked.from + 1);
      }
      return;
    }
    if (current.id !== id || current.mode !== "keyboard") return;
    const go = (to: number) => {
      event.preventDefault();
      const clamped = clamp(to, 0, total - 1);
      if (clamped === current.to) return;
      hold({ ...current, to: clamped });
      say(text.moved, id, clamped + 1);
    };
    if (event.key === "ArrowUp") go(current.to - 1);
    else if (event.key === "ArrowDown") go(current.to + 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(total - 1);
    else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      putDown(current, true);
    }
  }

  /** Walk the lifted row to where the pointer carries it, and let its neighbours make room when its leading edge passes their middles. */
  function follow() {
    const current = live.current;
    const pointer = drag.current;
    const box = list.current;
    if (!current || !pointer || !box || current.dropping) return;
    const me = current.slots[current.id];
    const last = current.slots[order[order.length - 1] ?? ""];
    if (!me || !last) return;
    const y = pointer.y - box.getBoundingClientRect().top;
    const dy = clamp(y - pointer.grab - me.top, current.origin - me.top, last.top + last.height - (me.top + me.height));
    const topEdge = me.top + dy;
    const bottomEdge = topEdge + me.height;
    let to = current.to;
    for (let guard = 0; guard < order.length; guard += 1) {
      const display = moveId(order, current.from, to);
      const tops = slotTops(display, current.slots, current.gap, current.origin);
      const after = display[to + 1];
      const before = display[to - 1];
      const afterTop = tops[to + 1];
      const beforeTop = tops[to - 1];
      // The edge that leads the way counts, so the first and the last place can be reached by rows of any height.
      if (after !== undefined && afterTop !== undefined && bottomEdge > afterTop + (current.slots[after]?.height ?? 0) / 2) to += 1;
      else if (before !== undefined && beforeTop !== undefined && topEdge < beforeTop + (current.slots[before]?.height ?? 0) / 2) to -= 1;
      else break;
    }
    if (dy !== current.dy || to !== current.to) hold({ ...current, dy, to });
  }

  /** While a row is held near the top or bottom edge of whatever scrolls, scroll it: faster the closer to the edge. */
  function scrollLoop() {
    const pointer = drag.current;
    if (!pointer || !live.current || live.current.dropping) return;
    const scroller = scrollParentOf(list.current);
    const top = scroller ? scroller.getBoundingClientRect().top : 0;
    const bottom = scroller ? scroller.getBoundingClientRect().bottom : window.innerHeight;
    const zone = Math.min(72, (bottom - top) / 4);
    const toward = pointer.y < top + zone ? -clamp((top + zone - pointer.y) / zone, 0, 1) : pointer.y > bottom - zone ? clamp((pointer.y - (bottom - zone)) / zone, 0, 1) : 0;
    if (toward !== 0) {
      if (scroller) scroller.scrollTop += toward * 18;
      else window.scrollBy(0, toward * 18);
      follow();
    }
    frame.current = window.requestAnimationFrame(scrollLoop);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (disabled || !event.isPrimary || event.button !== 0 || live.current) return;
    const picked = pickUp(id, "pointer");
    const box = list.current;
    const me = picked?.slots[id];
    if (!picked || !box || !me) return;
    drag.current = { pointerId: event.pointerId, grab: event.clientY - box.getBoundingClientRect().top - me.top, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    frame.current = window.requestAnimationFrame(scrollLoop);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current.y = event.clientY;
    follow();
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const current = live.current;
    if (!current || drag.current?.pointerId !== event.pointerId) return;
    window.cancelAnimationFrame(frame.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      putDown(current, true);
      return;
    }
    // Let go: the row slides into its place, then the order is committed.
    hold({ ...current, dropping: true });
    settle.current = window.setTimeout(() => putDown(current, true), SETTLE);
  }

  function onPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    const current = live.current;
    if (current && !current.dropping && drag.current?.pointerId === event.pointerId) cancel(current);
  }

  // Escape puts a lifted row back. It is heard at the top of the window while a row is lifted, so a dialog around the list does not close on it.
  useEffect(() => {
    if (!lift) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      const current = live.current;
      if (event.key !== "Escape" || !current || current.dropping) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      cancel(current);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lift?.id]);

  useEffect(
    () => () => {
      window.clearTimeout(settle.current);
      window.cancelAnimationFrame(frame.current);
    },
    [],
  );

  // After a row has moved, its grip (or the button that moved it) is where the focus belongs; the move may have dropped it.
  useEffect(() => {
    const target = refocus.current;
    if (!target) return;
    refocus.current = null;
    const row = rows.current.get(target.id);
    let element = row?.querySelector<HTMLElement>(target.part === "handle" ? "[data-slot=rank-list-handle]" : `[data-move=${target.part}]`);
    if (!element || element.hasAttribute("disabled")) element = row?.querySelector<HTMLElement>("[data-move]:not([disabled])") ?? row?.querySelector<HTMLElement>("[data-slot=rank-list-handle]");
    element?.focus();
  });

  // A row moved with the keyboard stays in view.
  useEffect(() => {
    if (lift?.mode === "keyboard") rows.current.get(lift.id)?.scrollIntoView({ block: "nearest" });
  }, [lift?.mode, lift?.id, lift?.to]);

  const display = lift ? moveId(order, lift.from, lift.to) : order;
  const tops = lift ? slotTops(display, lift.slots, lift.gap, lift.origin) : [];
  const Tag = (numbered ? "ol" : "ul") as "ol";

  return (
    <div
      data-slot="rank-list"
      data-dragging={lift ? "" : undefined}
      style={{ maxHeight, ...style }}
      className={cn("relative w-full min-w-0", maxHeight !== undefined && "relative overflow-y-auto overscroll-contain", className)}
      {...props}
    >
      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{text.empty}</p>
      ) : (
        <Tag ref={list} role="list" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} className="relative flex flex-col gap-2">
          {order.map((id, index) => {
            const item = byId.get(id);
            if (!item) return null;
            const mine = lift && lift.id === id ? lift : null;
            const lifted = mine !== null;
            const slot = lift?.slots[id];
            const place = display.indexOf(id);
            const following = mine !== null && mine.mode === "pointer" && !mine.dropping;
            const shift = !lift || !slot ? 0 : following ? mine.dy : (tops[place] ?? slot.top) - slot.top;
            return (
              <li
                key={id}
                ref={(element) => {
                  if (element) rows.current.set(id, element);
                  else rows.current.delete(id);
                }}
                data-slot="rank-list-row"
                data-lifted={lifted || undefined}
                style={shift ? { transform: `translateY(${shift}px)` } : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg border border-border bg-card py-2 pr-3 pl-1.5 text-card-foreground select-none",
                  lift && !following && "transition-transform duration-200 ease-out motion-reduce:transition-none",
                  lifted ? "z-10 border-foreground ring-1 ring-foreground ring-inset" : "",
                  // Off, but still readable: the surface goes quiet and the grip and the number dim, while the name and the line under it keep their colours (a dimmed row fell below 4.5:1).
                  disabled && "border-border/70 bg-muted/40",
                )}
              >
                <button
                  type="button"
                  data-slot="rank-list-handle"
                  disabled={disabled}
                  aria-label={fill(text.handle, { label: item.label })}
                  aria-describedby={helpId}
                  aria-roledescription="sortable"
                  aria-pressed={mine?.mode === "keyboard"}
                  onKeyDown={(event) => onHandleKeyDown(event, id)}
                  // Space presses a button when it comes up; the lift is already done on the way down.
                  onKeyUp={(event) => {
                    if (event.key === " ") event.preventDefault();
                  }}
                  onBlur={() => {
                    const current = live.current;
                    if (current?.id === id && current.mode === "keyboard") cancel(current);
                  }}
                  onPointerDown={(event) => onPointerDown(event, id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  // The grip is 32px; this reaches the 44px target.
                  className="relative grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 before:absolute before:-inset-1.5 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent aria-pressed:bg-muted aria-pressed:text-foreground motion-reduce:transition-none [&_svg]:size-4"
                >
                  <IconGrip />
                </button>
                {numbered ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md text-xs font-medium tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                      lifted ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                      disabled && "opacity-50",
                    )}
                  >
                    {place + 1}
                  </span>
                ) : null}
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate text-sm leading-5 font-medium">{item.label}</span>
                  {item.description ? <span className="line-clamp-2 text-xs leading-4 text-muted-foreground">{item.description}</span> : null}
                </span>
                {moveButtons ? (
                  <span className="flex shrink-0 items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      data-move="up"
                      disabled={disabled || index === 0 || lift !== null}
                      aria-label={fill(text.moveUp, { label: item.label })}
                      onClick={() => moveBy(id, -1)}
                      className="text-foreground/70 hover:text-foreground"
                    >
                      <IconChevronUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      data-move="down"
                      disabled={disabled || index === total - 1 || lift !== null}
                      aria-label={fill(text.moveDown, { label: item.label })}
                      onClick={() => moveBy(id, 1)}
                      className="text-foreground/70 hover:text-foreground"
                    >
                      <IconChevronDown />
                    </Button>
                  </span>
                ) : null}
              </li>
            );
          })}
        </Tag>
      )}
      <p id={helpId} className="sr-only">
        {text.instructions}
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {note}
      </p>
      {name ? order.map((id) => <input key={id} type="hidden" name={name} value={id} disabled={disabled} />) : null}
    </div>
  );
}
