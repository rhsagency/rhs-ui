"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconBasket, IconCart, IconCheck, IconRepeat, IconSpinner } from "@rhs-ui/icons";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import { buildList, formatAmount, type ShoppableItem, type ShoppableLine, type ShoppableRow } from "@rhs-ui/commerce/shoppable-list/list";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { cn } from "@/lib/utils";

export type { ShoppableItem, ShoppableLine, ShoppableProduct } from "@rhs-ui/commerce/shoppable-list/list";

export interface ShoppableListLabels {
  /** The name and label of the servings field. */
  servings?: string;
  /** Above the list. `{count}` is how many are checked and `{total}` how many can be bought. */
  selected?: string;
  selectAll?: string;
  clearAll?: string;
  /** Under a line that has an amount. `{amount}`: "400 g". */
  need?: string;
  /** After it, when the line is bought in packs. `{count}`. */
  packOne?: string;
  packOther?: string;
  /** In place of the amount on a line that is unchecked. */
  skipped?: string;
  outOfStock?: string;
  /** On a line that now has its substitute. */
  substitute?: string;
  /** Before the substitute's name, on a sold-out line. */
  swapIntro?: string;
  /** The swap button. */
  swap?: string;
  /** The swap button's name for a screen reader. `{name}` is the sold-out product and `{substitute}` the one offered. */
  swapName?: string;
  /** On a swapped line. `{name}` is the product that was out of stock. */
  swapped?: string;
  undo?: string;
  total?: string;
  /** The count under the total. `{count}`. */
  itemOne?: string;
  itemOther?: string;
  /** The button. `{count}`. */
  addOne?: string;
  addOther?: string;
  /** The button when nothing is checked. */
  addNone?: string;
  added?: string;
  addFailed?: string;
  /** What a screen reader hears once the lines are in the cart. `{count}`. */
  addedStatus?: string;
  /** What a screen reader hears after a change. `{count}`, `{available}` and `{total}`. */
  status?: string;
}

const WORDS = {
  servings: "Servings",
  selected: "{count} of {total} selected",
  selectAll: "Select all",
  clearAll: "Clear all",
  need: "Need {amount}",
  packOne: "{count}\u00a0pack",
  packOther: "{count}\u00a0packs",
  skipped: "Skipped",
  outOfStock: "Out of stock",
  substitute: "Substitute",
  swapIntro: "Available instead:",
  swap: "Swap",
  swapName: "Swap {name} for {substitute}",
  swapped: "Instead of {name}, which is out of stock.",
  undo: "Undo",
  total: "Total",
  itemOne: "{count} item",
  itemOther: "{count} items",
  addOne: "Add {count} item to cart",
  addOther: "Add {count} items to cart",
  addNone: "Add to cart",
  added: "Added to cart",
  addFailed: "We could not add these to your cart. Try again.",
  addedStatus: "Added {count} to your cart.",
  status: "{count} of {available} items selected, {total} in total.",
} satisfies Required<ShoppableListLabels>;

export interface ShoppableListProps extends Omit<ComponentProps<"div">, "children" | "title" | "onToggle"> {
  /** The lines of the list, in the order they are shown. */
  items: readonly ShoppableItem[];
  /** The heading: the recipe or the project. */
  title: string;
  /** A line under the heading: "35 minutes, serves 4". */
  meta?: ReactNode;
  /** Called with the checked lines when the button is pressed: product, packs and price, ready for the cart. Return a promise and the button shows it is working; reject and the shopper is told. */
  onAddAll?: (lines: readonly ShoppableLine[]) => void | Promise<void>;
  /** Called when a line is checked or unchecked, by the shopper or by a swap. */
  onToggle?: (id: string, checked: boolean) => void;
  /** Called when a sold-out line is swapped for its substitute, or swapped back. */
  onSwap?: (id: string, swapped: boolean) => void;
  /** The number of servings the amounts are written for. Pass it and the list gets a servings field; every amount, and the packs it takes, scales with it. */
  servings?: number;
  /** The servings to start on, when the reader should not begin at `servings`. */
  defaultServings?: number;
  /** The fewest servings. Defaults to 1. */
  minServings?: number;
  /** The most servings. Defaults to 24. */
  maxServings?: number;
  /** Called when the servings change. */
  onServingsChange?: (servings: number) => void;
  /** ISO 4217 code for the prices. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same text. */
  locale?: string;
  /** The words, for another language. */
  labels?: ShoppableListLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Says a sentence once things settle, so ticking boxes quickly reads out the end result. The first render says nothing. */
function useCalmStatus(text: string, delay = 500): string {
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

interface RowProps {
  row: ShoppableRow;
  id: string;
  words: Required<ShoppableListLabels>;
  money: (amount: number) => string;
  amountText: (row: ShoppableRow) => string | null;
  onCheckedChange: (checked: boolean) => void;
  onSwap: (swapped: boolean) => void;
}

function Row({ row, id, words, money, amountText, onCheckedChange, onSwap }: RowProps) {
  const { item, product, on, available, swapped } = row;
  const nameId = `${id}-name`;
  const infoId = `${id}-info`;
  const need = amountText(row);
  const skipped = available && !on;
  const sold = !available;
  const offer = sold && item.substitute ? item.substitute : null;

  return (
    <li data-slot="shoppable-list-item" data-state={sold ? "sold-out" : on ? "on" : "off"} className="@container py-4">
      <div className="flex items-start gap-3">
        <Checkbox id={`${id}-box`} checked={on} disabled={sold} onCheckedChange={(next) => onCheckedChange(next === true)} aria-labelledby={nameId} aria-describedby={infoId} className="mt-[3px]" />
        {/* The price sits at the end of the row when the row is wide enough, and under the details when it is not, so a name always has room to be read. */}
        <label htmlFor={`${id}-box`} className={cn("grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 @min-[20rem]:grid-cols-[auto_minmax(0,1fr)_auto]", sold ? "cursor-default" : "cursor-pointer")}>
          <span className={cn("grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted transition-opacity duration-150 motion-reduce:transition-none", !on && "opacity-50")}>
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is decorative, the name is beside it
              <img src={product.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            ) : (
              <IconBasket aria-hidden="true" className="size-4 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0">
            <span id={nameId} className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-snug font-medium", !on && "text-muted-foreground")}>
              <span className="min-w-0 [overflow-wrap:anywhere]">{product.name}</span>
              {sold ? <Badge variant="muted">{words.outOfStock}</Badge> : null}
              {swapped ? <Badge variant="secondary">{words.substitute}</Badge> : null}
            </span>
            <span id={infoId} className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
              {product.detail ? <span className="block [overflow-wrap:anywhere]">{product.detail}</span> : null}
              {skipped ? <span className="block">{words.skipped}</span> : need ? <span className="block">{need}</span> : null}
            </span>
          </span>
          {sold ? null : (
            <span className={cn("col-start-2 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums @min-[20rem]:col-start-3 @min-[20rem]:row-start-1 @min-[20rem]:block @min-[20rem]:text-right", on ? "font-medium" : "text-muted-foreground")}>
              {money(row.total)}
              {row.packs > 1 ? <span className="text-xs font-normal text-muted-foreground @min-[20rem]:block">{`${row.packs}\u00a0×\u00a0${money(product.price)}`}</span> : null}
            </span>
          )}
        </label>
      </div>

      {offer ? (
        <div className="mt-3 ml-[30px] flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-dashed border-border bg-muted/30 py-2 pr-2 pl-3">
          <p className="min-w-0 text-xs text-muted-foreground">
            {words.swapIntro} <span className="font-medium text-foreground [overflow-wrap:anywhere]">{offer.name}</span> <span className="tabular-nums">{money(offer.price)}</span>
          </p>
          <Button type="button" size="sm" variant="outline" aria-label={fill(words.swapName, { name: item.name, substitute: offer.name })} onClick={() => onSwap(true)}>
            <IconRepeat />
            {words.swap}
          </Button>
        </div>
      ) : null}

      {swapped ? (
        // One flowing sentence with Undo at the end of it, as a link: it has no padding, so it never sits off the edge of the text.
        <p className="mt-3 ml-[30px] text-xs text-muted-foreground">
          {fill(words.swapped, { name: item.name })}{" "}
          <Button type="button" size="sm" variant="link" className="h-auto p-0 align-baseline text-xs font-medium text-foreground underline" onClick={() => onSwap(false)}>
            {words.undo}
          </Button>
        </p>
      ) : null}
    </li>
  );
}

/**
 * A recipe or a project as a shopping list: every line has a checkbox, the product, the amount needed and its
 * price, and one button adds everything checked to the cart. Change the servings and every amount scales,
 * with the number of packs it takes (600 g needs two 500 g packs). Things the reader already has can be
 * unchecked, a line that is sold out says so and offers its substitute with a swap, and the count and the
 * total are a polite status that waits for the ticking to stop. The button hands your cart the products and
 * packs, with the substitute's id where one was chosen.
 */
export function ShoppableList({
  items,
  title,
  meta,
  onAddAll,
  onToggle,
  onSwap,
  servings: base,
  defaultServings,
  minServings = 1,
  maxServings = 24,
  onServingsChange,
  currency = "EUR",
  locale = "en-US",
  labels,
  className,
  ...props
}: ShoppableListProps) {
  const words: Required<ShoppableListLabels> = { ...WORDS, ...labels };
  const id = useId();
  const [servings, setServings] = useState(defaultServings ?? base ?? 1);
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(() => new Set(items.filter((item) => item.defaultChecked === false).map((item) => item.id)));
  const [swappedIds, setSwappedIds] = useState<ReadonlySet<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [outcome, setOutcome] = useState<{ key: string; kind: "added" | "failed" } | null>(null);

  const { rows, lines, total } = buildList(items, { servings, base: base ?? servings, unchecked, swapped: swappedIds });
  const available = rows.filter((row) => row.available);
  const count = lines.length;
  const everything = available.length > 0 && count === available.length;

  const plural = new Intl.PluralRules(locale);
  const number = (value: number): string => new Intl.NumberFormat(locale).format(value);
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const itemsText = (value: number): string => fill(plural.select(value) === "one" ? words.itemOne : words.itemOther, { count: number(value) });
  const packText = (value: number): string => fill(plural.select(value) === "one" ? words.packOne : words.packOther, { count: number(value) });
  const amountText = (row: ShoppableRow): string | null => {
    const { item, needed, packs, product } = row;
    if (item.note && needed === undefined) return item.note;
    if (needed === undefined) return null;
    const amount = fill(words.need, { amount: formatAmount(needed, item.unit, locale) });
    // A pack of one is just the thing itself: the quantity under the price says it.
    return product.packSize && product.packSize !== 1 ? `${amount}\u00a0· ${packText(packs)}` : amount;
  };

  const key = lines.map((line) => `${line.id}x${line.quantity}`).join(",");
  const shown = outcome && outcome.key === key ? outcome : null;
  const added = shown?.kind === "added";
  const said = useCalmStatus(fill(words.status, { count: number(count), available: number(available.length), total: money(total) }));

  useEffect(() => {
    if (outcome?.kind !== "added") return;
    const timeout = window.setTimeout(() => setOutcome(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [outcome]);

  function setChecked(itemId: string, checked: boolean) {
    setUnchecked((current) => {
      const next = new Set(current);
      if (checked) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
    onToggle?.(itemId, checked);
  }

  function setAll(checked: boolean) {
    const changed = available.filter((row) => row.on !== checked);
    setUnchecked(checked ? new Set() : new Set(items.map((item) => item.id)));
    for (const row of changed) onToggle?.(row.item.id, checked);
  }

  function swap(itemId: string, swapped: boolean) {
    setSwappedIds((current) => {
      const next = new Set(current);
      if (swapped) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
    onSwap?.(itemId, swapped);
    // Choosing the substitute is a decision to buy it; going back to a sold-out product leaves nothing to buy.
    setChecked(itemId, swapped);
  }

  function changeServings(next: number) {
    setServings(next);
    onServingsChange?.(next);
  }

  async function add() {
    // The button stays focusable while it works and after it has worked, so it ignores the press instead of being disabled.
    if (!onAddAll || adding || added || count === 0) return;
    const sent = key;
    setAdding(true);
    setOutcome(null);
    try {
      await onAddAll(lines);
      setOutcome({ key: sent, kind: "added" });
    } catch {
      setOutcome({ key: sent, kind: "failed" });
    } finally {
      setAdding(false);
    }
  }

  if (!items.length) return null;

  return (
    <div data-slot="shoppable-list" role="group" aria-labelledby={`${id}-title`} className={cn("grid w-full grid-cols-[minmax(0,1fr)] gap-5", className)} {...props}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="grid min-w-0 gap-1">
          <h3 id={`${id}-title`} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
            {title}
          </h3>
          {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
        </div>
        {base !== undefined ? (
          <div className="grid gap-2">
            <Label htmlFor={`${id}-servings`}>{words.servings}</Label>
            <NumberInput id={`${id}-servings`} className="w-32" min={minServings} max={maxServings} value={servings} onValueChange={changeServings} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <p aria-hidden="true" className="text-sm text-muted-foreground tabular-nums">
            {fill(words.selected, { count: number(count), total: number(available.length) })}
          </p>
          <Button type="button" variant="ghost" size="sm" className="-mr-2" disabled={available.length === 0} onClick={() => setAll(!everything)}>
            {everything ? words.clearAll : words.selectAll}
          </Button>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card px-4 shadow-xs">
          {rows.map((row, index) => (
            <Row
              key={row.item.id}
              row={row}
              id={`${id}-row-${index}`}
              words={words}
              money={money}
              amountText={amountText}
              onCheckedChange={(checked) => setChecked(row.item.id, checked)}
              onSwap={(swapped) => swap(row.item.id, swapped)}
            />
          ))}
        </ul>
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{words.total}</p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{itemsText(count)}</p>
          </div>
          <AnimatedPrice value={total / 100} currency={currency} locale={locale} className="text-xl leading-none font-semibold tracking-[-0.02em]" />
        </div>
        {onAddAll ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {/* Never `disabled` while it works or once it has worked: a disabled button drops the keyboard's focus to the page. aria-disabled keeps it, and the handler ignores the press. The added state is drawn at full contrast. A long label wraps instead of running out of the card. */}
            <Button
              type="button"
              size="lg"
              variant={added ? "outline" : "default"}
              disabled={count === 0}
              aria-busy={adding || undefined}
              aria-disabled={adding || added || undefined}
              onClick={() => void add()}
              className={cn("h-auto min-h-11 w-full px-4 py-2 text-center text-balance whitespace-normal", (adding || added) && "pointer-events-none")}
            >
              {adding ? <IconSpinner /> : added ? <IconCheck /> : <IconCart />}
              {added ? words.added : count === 0 ? words.addNone : fill(plural.select(count) === "one" ? words.addOne : words.addOther, { count: number(count) })}
            </Button>
            {shown?.kind === "failed" ? (
              <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {words.addFailed}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
      <p role="status" className="sr-only">
        {shown?.kind === "added" ? fill(words.addedStatus, { count: itemsText(count) }) : ""}
      </p>
    </div>
  );
}
