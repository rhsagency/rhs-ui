"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconAlertCircle, IconBag, IconBan, IconBasket, IconCheck, IconHistory, IconPackage, IconPlus, IconSpinner, IconUndo } from "@rhs-ui/icons";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import { agoText, dateText, daysBetween, isoOf, startQuantity, type ReorderItem, type ReorderLine, type ReorderMoment } from "@rhs-ui/commerce/reorder-list/reorder";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { cn } from "@/lib/utils";

export type { ReorderItem, ReorderLine, ReorderMoment } from "@rhs-ui/commerce/reorder-list/reorder";

export interface ReorderListLabels {
  /** The heading. */
  title?: string;
  /** Under the heading. */
  description?: string;
  /** The checkbox above the lines. */
  selectAll?: string;
  /** The count beside it. `{count}` lines are selected of `{total}` that can be bought. */
  selected?: string;
  /** What a screen reader hears on a line's checkbox. `{name}`. */
  selectItem?: string;
  /** The name of a quantity field. `{name}`. */
  quantity?: string;
  /** Under a product's name. `{when}` is "3 weeks ago" once the clock is known, and the date before that. */
  lastOrdered?: string;
  /** After the price when the item does not say what it is per. */
  each?: string;
  /** The button on a line. */
  add?: string;
  /** What a screen reader hears on that button. `{quantity}` and `{name}`. */
  addName?: string;
  /** The button once the line is in the bag. */
  added?: string;
  /** What a screen reader hears on it then. `{quantity}` and `{name}`. */
  addedName?: string;
  /** The button when the quantity was raised after the line was added: `{count}` more are still to add. */
  addMore?: string;
  /** What a screen reader hears on it. `{quantity}` more and `{name}`. */
  addMoreName?: string;
  /** The button when the quantity was lowered under what is in the bag: `{count}` are in the bag. */
  inBagCount?: string;
  /** What a screen reader hears on it. `{count}` and `{name}`. */
  inBagCountName?: string;
  /** Under a line the bag refused. */
  addFailed?: string;
  /** The small button that stops a product being suggested. */
  notInterested?: string;
  /** What a screen reader hears on it. `{name}`. */
  notInterestedName?: string;
  /** In place of the line for a few seconds after "Not interested". `{name}`. */
  removed?: string;
  /** The button on that line. */
  undo?: string;
  /** What a screen reader hears on it. `{name}`. */
  undoName?: string;
  /** Before the total. */
  total?: string;
  /** Before the total once everything selected is in the bag: it then says what is there. */
  inBag?: string;
  /** Under the total: `{count}` products. */
  productOne?: string;
  productOther?: string;
  /** After it: `{count}` items, counting each unit. */
  unitOne?: string;
  unitOther?: string;
  /** The footer button when every line is selected. */
  addAll?: string;
  /** The footer button when only some are. */
  addSelected?: string;
  /** The footer button once everything selected is in the bag. */
  allAdded?: string;
  /** Under the footer when the bag refused. */
  addAllFailed?: string;
  /** What a screen reader hears after one line was added. `{quantity}` and `{name}`. */
  addedStatus?: string;
  /** After the footer button. `{count}` products. */
  addedAllOne?: string;
  addedAllOther?: string;
  /** After "Not interested". `{name}`. */
  removedStatus?: string;
  /** After Undo. `{name}`. */
  restoredStatus?: string;
  /** What a screen reader hears when the selection settles. `{count}` and `{total}`. */
  summary?: string;
  /** The empty state's heading, when no line is left. */
  emptyTitle?: string;
  /** Under it. */
  emptyDescription?: string;
}

const WORDS = {
  title: "Order again",
  description: "The things you buy regularly, at the quantity you bought last time.",
  selectAll: "Select all",
  selected: "{count} of {total} selected",
  selectItem: "Select {name}",
  quantity: "Quantity of {name}",
  lastOrdered: "Last ordered {when}",
  each: "each",
  add: "Add",
  addName: "Add {quantity} × {name} to your bag",
  added: "Added",
  addedName: "Added: {quantity} × {name}",
  addMore: "Add {count} more",
  addMoreName: "Add {quantity} more of {name} to your bag",
  inBagCount: "In bag: {count}",
  inBagCountName: "In bag: {count} × {name}",
  addFailed: "We could not add this to your bag. Try again.",
  notInterested: "Not interested",
  notInterestedName: "Not interested in {name}",
  removed: "Removed {name}.",
  undo: "Undo",
  undoName: "Undo, bring {name} back",
  total: "Total",
  inBag: "In your bag",
  productOne: "{count} product",
  productOther: "{count} products",
  unitOne: "{count} item",
  unitOther: "{count} items",
  addAll: "Add all to bag",
  addSelected: "Add selected to bag",
  allAdded: "Added to bag",
  addAllFailed: "We could not add these to your bag. Try again.",
  addedStatus: "Added {quantity} × {name} to your bag.",
  addedAllOne: "Added {count} product to your bag.",
  addedAllOther: "Added {count} products to your bag.",
  removedStatus: "We will stop suggesting {name}.",
  restoredStatus: "{name} is back in your list.",
  summary: "{count} selected, {total} in total.",
  emptyTitle: "Nothing to order again yet",
  emptyDescription: "Once you have ordered a few times, the things you buy regularly will be here, ready to add in one go.",
} satisfies Required<ReorderListLabels>;

/** How long "Removed. Undo" stays in place of a line before the line leaves for good. */
const UNDO_MS = 6000;

export interface ReorderListProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The products the customer buys regularly, in the order they are shown. */
  items: readonly ReorderItem[];
  /** The heading. Defaults to "Order again". */
  title?: string;
  /** The line under it. */
  description?: string;
  /** Called when one line's button is pressed, with the quantity to add now: the whole quantity the first time, and only the difference when the quantity was raised after the line was added. Return a promise and the button shows it is working; reject and the line says so. */
  onAdd?: (id: string, quantity: number) => void | Promise<void>;
  /** Called by the footer button with every selected line that still has something to add. A line's `quantity` is what to add now (the difference for a line that is in the bag already), not what the stepper shows. Without it the footer calls `onAdd` for each line. */
  onAddAll?: (lines: readonly ReorderLine[]) => void | Promise<void>;
  /** Called when "Not interested" is pressed. The line gives way to "Removed. Undo" for a few seconds and then leaves, so keep the product in `items` meanwhile; save it so it is not suggested again. */
  onRemove?: (id: string) => void;
  /** Called when Undo brings a removed product back, so you can take back what `onRemove` saved. */
  onUnremove?: (id: string) => void;
  /** ISO 4217 code for the prices. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same prices and dates. */
  locale?: string;
  /** The time zone whose calendar days count for "Last ordered". Use the shop's. */
  timeZone?: string;
  /** The moment to measure "Last ordered" from. Pass it from the server for a first render that matches the browser's; without it the first render shows dates and the browser's clock turns them into "3 weeks ago" once the page has loaded. */
  now?: ReorderMoment;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: ReorderListLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A sentence with a node where `{when}` is. */
function withWhen(template: string, when: ReactNode): ReactNode {
  const [before = "", after = ""] = template.split("{when}");
  return (
    <>
      {before}
      {when}
      {after}
    </>
  );
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The browser's clock, read once the page has loaded (never on the server), and again when the tab is looked at or an hour has passed. */
function useClock(given: ReorderMoment | undefined): ReorderMoment | undefined {
  const [clock, setClock] = useState<number | undefined>(undefined);
  useBrowserLayoutEffect(() => {
    if (given !== undefined) return;
    const read = () => setClock(Date.now());
    read();
    const visible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", visible);
    const interval = window.setInterval(read, 3_600_000);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(interval);
    };
  }, [given]);
  return given ?? clock;
}

/** Says a sentence once things settle, so ticking boxes quickly reads out the end result. The first render says nothing. */
function useCalmStatus(text: string, delay = 600): string {
  const [said, setSaid] = useState("");
  const spoken = useRef(text);
  useEffect(() => {
    if (spoken.current === text) return;
    spoken.current = text;
    const timeout = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timeout);
  }, [text, delay]);
  return said;
}

/** What the button on a line does: add the line, add what the stepper went up by, or nothing because the bag already holds this much. */
type RowState = "idle" | "adding" | "added" | "more" | "fewer";

interface RowProps {
  item: ReorderItem;
  id: string;
  words: Required<ReorderListLabels>;
  selected: boolean;
  /** What the stepper shows. */
  quantity: number;
  /** How many of it are in the bag already. */
  bagged: number;
  adding: boolean;
  failed: boolean;
  format: (value: number) => string;
  money: (amount: number) => string;
  when: ReactNode;
  canRemove: boolean;
  onSelect: (checked: boolean) => void;
  onQuantity: (quantity: number) => void;
  onAdd: () => void;
  onRemove: () => void;
}

function Row({ item, id, words, selected, quantity, bagged, adding, failed, format, money, when, canRemove, onSelect, onQuantity, onAdd, onRemove }: RowProps) {
  const nameId = `${id}-name`;
  const off = item.unavailable !== undefined;
  // Once a line is in the bag the stepper is measured against what is there: more is added by the difference, fewer is left alone.
  const more = quantity - bagged;
  const relation = bagged === 0 ? "none" : more === 0 ? "same" : more > 0 ? "more" : "fewer";
  const state: RowState = adding ? "adding" : relation === "none" ? "idle" : relation === "same" ? "added" : relation;
  const settled = relation === "same" || relation === "fewer";
  const label =
    relation === "same"
      ? words.added
      : relation === "more"
        ? fill(words.addMore, { count: format(more) })
        : relation === "fewer"
          ? fill(words.inBagCount, { count: format(bagged) })
          : words.add;
  const spoken =
    relation === "same"
      ? fill(words.addedName, { quantity: format(bagged), name: item.name })
      : relation === "more"
        ? fill(words.addMoreName, { quantity: format(more), name: item.name })
        : relation === "fewer"
          ? fill(words.inBagCountName, { count: format(bagged), name: item.name })
          : fill(words.addName, { quantity: format(quantity), name: item.name });
  const showFailed = failed && !adding && more > 0;
  const name = item.href ? (
    <a href={item.href} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
      {item.name}
    </a>
  ) : (
    item.name
  );
  return (
    <li
      data-slot="reorder-list-item"
      data-row-id={item.id}
      data-state={off ? "unavailable" : showFailed ? "failed" : state}
      className={cn(
        "grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 px-4 py-4 transition-colors duration-150 motion-reduce:transition-none @2xl:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] @2xl:items-center @2xl:gap-x-4 @2xl:px-5",
        !off && "hover:bg-muted/30",
      )}
    >
      <Checkbox
        checked={selected && !off}
        disabled={off}
        onCheckedChange={(next) => onSelect(next === true)}
        aria-label={fill(words.selectItem, { name: item.name })}
        className="self-center"
      />
      <span aria-hidden="true" className={cn("grid size-12 shrink-0 place-items-center self-center overflow-hidden rounded-lg border border-border bg-muted @2xl:size-14", off && "opacity-50 grayscale")}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is decorative, the name is beside it
          <img src={item.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
        ) : (
          <IconPackage className="size-5 text-muted-foreground" />
        )}
      </span>

      <div className="min-w-0">
        <p id={nameId} className={cn("text-sm leading-snug font-medium [overflow-wrap:anywhere]", off && "text-muted-foreground")}>
          {name}
        </p>
        {item.variant ? <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{item.variant}</p> : null}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {off ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <IconBan aria-hidden="true" className="size-3.5 shrink-0" />
              {item.unavailable}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <IconHistory aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{withWhen(words.lastOrdered, when)}</span>
            </span>
          )}
          {canRemove ? (
            // A taller hit area than the 16px line of small text, with the same amount taken back off the margin so the lines do not move.
            <button
              type="button"
              onClick={onRemove}
              aria-label={fill(words.notInterestedName, { name: item.name })}
              className="-my-1 inline-flex min-h-6 items-center rounded-sm py-1 underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {words.notInterested}
            </button>
          ) : null}
        </p>
      </div>

      <p className={cn("text-right text-sm font-medium tabular-nums", off && "text-muted-foreground")}>
        {money(item.price)}
        <span className="block text-xs font-normal text-muted-foreground">{item.per ?? words.each}</span>
      </p>

      <div className="col-span-3 col-start-2 flex flex-wrap items-center gap-2 @2xl:col-span-1 @2xl:col-start-5 @2xl:row-start-1 @2xl:flex-nowrap">
        <NumberInput
          value={quantity}
          onValueChange={onQuantity}
          min={1}
          max={item.max ?? 999}
          disabled={off}
          aria-label={fill(words.quantity, { name: item.name })}
          className="w-28 shrink-0"
        />
        {/* Never `disabled` while it works or once there is nothing to add: a disabled button drops the keyboard's focus to the page. aria-disabled keeps it, and the handler ignores the press. */}
        <Button
          type="button"
          variant={settled ? "secondary" : "outline"}
          disabled={off}
          aria-busy={adding || undefined}
          aria-disabled={adding || settled || undefined}
          aria-label={spoken}
          onClick={onAdd}
          className={cn("min-w-fit flex-1 @2xl:min-w-36 @2xl:flex-none", (adding || settled) && "pointer-events-none")}
        >
          {adding ? <IconSpinner /> : settled ? <IconCheck /> : <IconPlus />}
          {label}
        </Button>
      </div>

      {showFailed ? (
        <p role="alert" className="col-span-3 col-start-2 flex items-start gap-2 text-sm font-medium text-destructive @2xl:col-start-3 @2xl:col-span-3">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {words.addFailed}
        </p>
      ) : null}
    </li>
  );
}

interface RemovedRowProps {
  item: ReorderItem;
  words: Required<ReorderListLabels>;
  onUndo: () => void;
}

/** In place of a line for a few seconds after "Not interested": one line of words and the way back. */
function RemovedRow({ item, words, onUndo }: RemovedRowProps) {
  return (
    <li
      data-slot="reorder-list-item"
      data-row-id={item.id}
      data-state="removed"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-muted/30 px-4 py-3 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none @2xl:px-5"
    >
      <p className="min-w-0 flex-1 basis-40 text-sm text-muted-foreground [overflow-wrap:anywhere]">{fill(words.removed, { name: item.name })}</p>
      <Button type="button" variant="outline" size="sm" data-undo="" aria-label={fill(words.undoName, { name: item.name })} onClick={onUndo}>
        <IconUndo />
        {words.undo}
      </Button>
    </li>
  );
}

/**
 * "Order again": the products a customer buys regularly, each with what it costs, when it was last ordered
 * ("Last ordered 3 weeks ago"), a quantity that starts at what was bought last time and its own Add button, then a
 * footer with the total of everything ticked and one button that adds it all. Products that cannot be bought now
 * stay in the list, switched off, with the reason in words, and a line that is in the bag says Added with a check
 * while a polite status says it aloud. The bag is remembered per line: raise the quantity and the button says "Add 2
 * more" and sends only those 2, lower it under what is in the bag and the button says "In bag: 4" and waits. "Not
 * interested" takes a product off the list, with an Undo for a few seconds. It is the shortcut that trade and
 * grocery customers use most: the second order takes a minute.
 */
export function ReorderList({
  items,
  title,
  description,
  onAdd,
  onAddAll,
  onRemove,
  onUnremove,
  currency = "EUR",
  locale = "en-US",
  timeZone = "UTC",
  now,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: ReorderListProps) {
  const words: Required<ReorderListLabels> = { ...WORDS, ...labels };
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const timers = useRef(new Map<string, number>());
  const clock = useClock(now);
  const [quantities, setQuantities] = useState<Readonly<Record<string, number>>>({});
  const [unticked, setUnticked] = useState<ReadonlySet<string>>(new Set());
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [undoable, setUndoable] = useState<ReadonlySet<string>>(new Set());
  // How many of each product are in the bag, as far as this list knows: the quantity of the first add, plus every difference sent after it.
  const [added, setAdded] = useState<Readonly<Record<string, number>>>({});
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [allFailed, setAllFailed] = useState(false);
  const [said, setSaid] = useState("");
  const [focus, setFocus] = useState<{ id: string; undo?: boolean } | null>(null);

  // A removed product is out of every sum at once; its line stays, as "Removed. Undo", until the undo window is over.
  const visible = items.filter((item) => !removed.has(item.id));
  const shown = items.filter((item) => !removed.has(item.id) || undoable.has(item.id));
  const quantityOf = (item: ReorderItem): number => Math.max(1, Math.min(item.max ?? 999, quantities[item.id] ?? startQuantity(item)));
  const baggedOf = (item: ReorderItem): number => added[item.id] ?? 0;
  // What a press adds: the whole quantity the first time, then only what the stepper has gone up by.
  const toAdd = (item: ReorderItem): number => Math.max(0, quantityOf(item) - baggedOf(item));
  const buyable = visible.filter((item) => item.unavailable === undefined);
  const ticked = (item: ReorderItem): boolean => item.unavailable === undefined && !unticked.has(item.id);

  const picked = buyable.filter(ticked);
  const lineOf = (item: ReorderItem, quantity: number): ReorderLine => ({ id: item.id, quantity, price: item.price, total: quantity * item.price });
  // What the footer button adds: the ticked lines that have something left to add, each by its difference.
  const lines: ReorderLine[] = picked.filter((item) => toAdd(item) > 0).map((item) => lineOf(item, toAdd(item)));
  const everyTicked = buyable.length > 0 && picked.length === buyable.length;
  const nothingLeft = lines.length === 0 && picked.length > 0;
  // What the footer shows: what is still to add, and once there is nothing left, what is in the bag.
  const shownLines = nothingLeft ? picked.map((item) => lineOf(item, baggedOf(item))) : lines;
  const total = shownLines.reduce((sum, line) => sum + line.total, 0);
  const units = shownLines.reduce((sum, line) => sum + line.quantity, 0);
  const selectedTotal = picked.reduce((sum, item) => sum + quantityOf(item) * item.price, 0);

  const plural = new Intl.PluralRules(locale);
  const numbers = new Intl.NumberFormat(locale);
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const count = (one: string, other: string, value: number): string => fill(plural.select(value) === "one" ? one : other, { count: numbers.format(value) });

  // The selection is read out when it settles; adding to the bag does not change it, so it does not speak twice.
  const calm = useCalmStatus(fill(words.summary, { count: numbers.format(picked.length), total: money(selectedTotal) }));

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timeout of pending.values()) window.clearTimeout(timeout);
    };
  }, []);

  // After a line leaves, focus goes to the line that took its place, or to the section when there is none. After "Not interested" it stays on the line, on Undo.
  useEffect(() => {
    if (focus === null) return;
    const row = focus.id ? `[data-row-id="${CSS.escape(focus.id)}"]` : null;
    const target = row ? root.current?.querySelector<HTMLElement>(focus.undo ? `${row} [data-undo]` : `${row} [role="checkbox"]:not([disabled]), ${row} button:not([disabled])`) : null;
    (target ?? root.current)?.focus();
    setFocus(null);
  }, [focus]);

  function setBusyFor(key: string, on: boolean) {
    setBusy((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function addOne(item: ReorderItem) {
    const quantity = toAdd(item);
    if (busy.has(item.id) || quantity === 0 || item.unavailable !== undefined) return;
    setBusyFor(item.id, true);
    setFailed((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    try {
      await onAdd?.(item.id, quantity);
      setAdded((current) => ({ ...current, [item.id]: (current[item.id] ?? 0) + quantity }));
      setSaid(fill(words.addedStatus, { quantity: numbers.format(quantity), name: item.name }));
    } catch {
      setFailed((current) => new Set(current).add(item.id));
    } finally {
      setBusyFor(item.id, false);
    }
  }

  async function addEverything() {
    if (addingAll || lines.length === 0) return;
    const sent = lines;
    setAddingAll(true);
    setAllFailed(false);
    try {
      if (onAddAll) await onAddAll(sent);
      else await Promise.all(sent.map((line) => onAdd?.(line.id, line.quantity)));
      setAdded((current) => {
        const next = { ...current };
        for (const line of sent) next[line.id] = (next[line.id] ?? 0) + line.quantity;
        return next;
      });
      setSaid(count(words.addedAllOne, words.addedAllOther, sent.length));
    } catch {
      setAllFailed(true);
    } finally {
      setAddingAll(false);
    }
  }

  /** The undo window is over: the line leaves for good, and focus moves to the line beside it if it was still on this one. */
  function settle(key: string) {
    timers.current.delete(key);
    const row = root.current?.querySelector(`[data-row-id="${CSS.escape(key)}"]`);
    const neighbour = row?.nextElementSibling ?? row?.previousElementSibling;
    if (row?.contains(document.activeElement)) setFocus({ id: neighbour?.getAttribute("data-row-id") ?? "" });
    setUndoable((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function remove(item: ReorderItem) {
    setRemoved((current) => new Set(current).add(item.id));
    setUndoable((current) => new Set(current).add(item.id));
    setFocus({ id: item.id, undo: true });
    setSaid(fill(words.removedStatus, { name: item.name }));
    timers.current.set(item.id, window.setTimeout(() => settle(item.id), UNDO_MS));
    onRemove?.(item.id);
  }

  function restore(item: ReorderItem) {
    const pending = timers.current.get(item.id);
    if (pending !== undefined) window.clearTimeout(pending);
    timers.current.delete(item.id);
    setRemoved((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setUndoable((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setFocus({ id: item.id });
    setSaid(fill(words.restoredStatus, { name: item.name }));
    onUnremove?.(item.id);
  }

  function tickAll(on: boolean) {
    setUnticked(on ? new Set() : new Set(buyable.map((item) => item.id)));
  }

  function tick(item: ReorderItem, on: boolean) {
    setUnticked((current) => {
      const next = new Set(current);
      if (on) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  const label = nothingLeft ? words.allAdded : everyTicked ? words.addAll : words.addSelected;

  return (
    <section ref={root} tabIndex={-1} data-slot="reorder-list" aria-labelledby={`${id}-title`} className={cn("@container grid min-w-0 gap-5 outline-none", className)} {...props}>
      <header className="grid gap-1">
        <Heading id={`${id}-title`} className="text-lg leading-snug font-semibold tracking-[-0.02em]">
          {title ?? words.title}
        </Heading>
        <p className="text-sm text-muted-foreground">{description ?? words.description}</p>
      </header>

      {shown.length === 0 ? (
        <EmptyState icon={<IconBasket className="size-6" />} title={words.emptyTitle} description={words.emptyDescription} className="bg-card py-12" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {visible.length > 0 ? (
            <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-sm @2xl:px-5">
              <Checkbox
                id={`${id}-all`}
                checked={buyable.length === 0 ? false : everyTicked ? true : picked.length > 0 ? "indeterminate" : false}
                disabled={buyable.length === 0}
                onCheckedChange={(next) => tickAll(next === true)}
              />
              <label htmlFor={`${id}-all`} className="cursor-pointer font-medium">
                {words.selectAll}
              </label>
              <p aria-hidden="true" className="ml-auto text-muted-foreground tabular-nums">
                {fill(words.selected, { count: numbers.format(picked.length), total: numbers.format(buyable.length) })}
              </p>
            </div>
          ) : null}

          <ul role="list" className="divide-y divide-border">
            {shown.map((item, index) => {
              if (removed.has(item.id)) return <RemovedRow key={item.id} item={item} words={words} onUndo={() => restore(item)} />;
              const days = clock === undefined ? null : daysBetween(item.lastOrderedAt, clock, timeZone);
              const moment = isoOf(item.lastOrderedAt);
              const text = days === null ? dateText(item.lastOrderedAt, locale, timeZone) : agoText(days, locale);
              const when =
                text === null || moment === null ? null : (
                  <time dateTime={moment} title={dateText(item.lastOrderedAt, locale, timeZone, true) ?? undefined} className="whitespace-nowrap">
                    {text}
                  </time>
                );
              return (
                <Row
                  key={item.id}
                  item={item}
                  id={`${id}-row-${index}`}
                  words={words}
                  selected={ticked(item)}
                  quantity={quantityOf(item)}
                  bagged={baggedOf(item)}
                  adding={busy.has(item.id)}
                  failed={failed.has(item.id)}
                  format={numbers.format}
                  money={money}
                  when={when}
                  canRemove={Boolean(onRemove)}
                  onSelect={(on) => tick(item, on)}
                  onQuantity={(next) => setQuantities((current) => ({ ...current, [item.id]: next }))}
                  onAdd={() => void addOne(item)}
                  onRemove={() => remove(item)}
                />
              );
            })}
          </ul>

          {visible.length > 0 ? (
            <div className="grid gap-x-6 gap-y-3 border-t border-border bg-muted/40 px-4 py-4 @md:grid-cols-[minmax(0,1fr)_auto] @md:items-center @2xl:px-5">
              <div className="flex items-baseline justify-between gap-4 @md:block">
                <p className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">{nothingLeft ? words.inBag : words.total}</span>
                  <AnimatedPrice value={total / 100} currency={currency} locale={locale} className="text-xl leading-none font-semibold tracking-[-0.02em]" />
                </p>
                <p className="text-xs text-muted-foreground tabular-nums @md:mt-1">
                  {count(words.productOne, words.productOther, shownLines.length)}, {count(words.unitOne, words.unitOther, units)}
                </p>
              </div>
              <div className="grid gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant={nothingLeft ? "outline" : "default"}
                  disabled={picked.length === 0}
                  aria-busy={addingAll || undefined}
                  aria-disabled={addingAll || nothingLeft || undefined}
                  onClick={() => void addEverything()}
                  className={cn("w-full @md:w-auto @md:min-w-48", (addingAll || nothingLeft) && "pointer-events-none")}
                >
                  {addingAll ? <IconSpinner /> : nothingLeft ? <IconCheck /> : <IconBag />}
                  {label}
                </Button>
                {allFailed ? (
                  <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
                    <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {words.addAllFailed}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <p role="status" className="sr-only">
        {said}
      </p>
      <p role="status" className="sr-only">
        {calm}
      </p>
    </section>
  );
}
