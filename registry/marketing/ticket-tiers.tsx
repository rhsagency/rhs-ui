"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconMinus, IconPlus } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface TicketTier {
  /** A stable key, sent back in onSelect: "standard". */
  id: string;
  /** What it is called: "Standard". */
  name: string;
  /** One line on who it is for. */
  description?: string;
  /** The price of one ticket in the list's currency, in whole units: 129 or 129.5. */
  price: number;
  /** What the ticket includes, a line each. */
  includes: readonly string[];
  /** How many tickets are left. Leave it out for no limit; 0 is sold out. */
  remaining?: number;
  /** When sales open, as an ISO 8601 time. Before it the tier shows as not on sale yet. */
  saleStart?: string;
  /** When this price ends and the next begins, as an ISO 8601 time. After it the tier shows as ended. */
  saleEnd?: string;
  /** The most one order can hold. The list's `maxPerOrder` when left out. */
  max?: number;
}

export interface TicketSelection {
  /** The `id` of the tier. */
  tierId: string;
  /** How many tickets, within the stock and the limit per order. */
  quantity: number;
}

export interface TicketTiersLabels {
  /** The name of the section when it has no title. */
  tickets: string;
  /** The badge of a tier with none left, and its button. */
  soldOut: string;
  /** The badge of a tier whose sale is over, and its button. */
  saleEnded: string;
  /** The badge of a tier that has not opened. {date} stands for the day it opens. */
  onSale: string;
  /** The button of a tier that has not opened. */
  notYet: string;
  /** The button of a tier with a sale window while the clock is not known yet: before the page has mounted and no `now` was passed. */
  checking: string;
  /** The badge when stock is shown. {count} stands for the number. */
  left: string;
  /** The same badge when stock is low, set in the heavy style. */
  onlyLeft: string;
  /** Said under the price while the price will rise. {date} stands for the day. */
  rises: string;
  /** The small line above what a ticket includes. */
  includes: string;
  /** The name of the stepper for assistive technology. {tier} stands for the tier's name. */
  quantityFor: string;
  /** The name of the minus button for assistive technology. */
  fewer: string;
  /** The name of the plus button for assistive technology. */
  more: string;
  /** The line under the stepper. {max} stands for the most one order can hold. */
  limit: string;
  /** Said when the reader asks for more than is left. {count} stands for the number left. */
  stockLimit: string;
  /** Said when the reader asks for more than one order may hold. {max} stands for the limit. */
  orderLimit: string;
  /** The small word over the price of the chosen tickets. */
  total: string;
  /** The button for one ticket. */
  buyOne: string;
  /** The button for several tickets. {count} stands for the number of tickets. */
  buyMany: string;
}

const LABELS: TicketTiersLabels = {
  tickets: "Ticket types",
  soldOut: "Sold out",
  saleEnded: "Sale ended",
  onSale: "On sale {date}",
  notYet: "Not on sale yet",
  checking: "Checking availability",
  left: "{count} left",
  onlyLeft: "Only {count} left",
  rises: "Price rises on {date}",
  includes: "Includes",
  quantityFor: "Tickets for {tier}",
  fewer: "Fewer tickets",
  more: "More tickets",
  limit: "Up to {max} per order",
  stockLimit: "Only {count} left, so {count} is the most you can buy.",
  orderLimit: "The limit is {max} per order.",
  total: "Total",
  buyOne: "Buy 1 ticket",
  buyMany: "Buy {count} tickets",
};

export interface TicketTiersProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSelect"> {
  /** The ticket types, usually three or four, cheapest first. A tier that is sold out or not open yet keeps its place. */
  tiers: readonly TicketTier[];
  /** Called when a reader buys: which tier and how many. The list does no checkout of its own. */
  onSelect: (selection: TicketSelection) => void;
  /** The heading: "Tickets for Kestrel Summit". */
  title?: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The ISO 4217 currency of every price. "USD" by default. */
  currency?: string;
  /** The language prices and dates are written in. "en-US" by default. */
  locale?: string;
  /** The time zone dates are written in, so the server and the browser agree. "UTC" by default. */
  timeZone?: string;
  /**
   * The moment the sale windows are judged against. Leave it out and they follow the reader's clock, which is known
   * only after the page has mounted: until then a tier with a sale window shows as checking, with no badge, a muted
   * price and a disabled button, so the server never renders a tier open that the browser would close. Pass it, the
   * same on the server and in the browser, and nothing is ever checking.
   */
  now?: Date | string | number;
  /** The most one order can hold unless a tier says otherwise. 10 by default. */
  maxPerOrder?: number;
  /** At or below this many left, the badge turns heavy and says "Only". 5 by default. */
  lowStock?: number;
  /** The level of the heading: 2 by default. Tier names sit one level below it. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TicketTiersLabels>;
}

/** Fills {name} markers in a sentence with text or nodes. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Columns by how many cards there are, written out so Tailwind sees every class. A count that does not divide the row never leaves a lonely card: three go from one column straight to three, four from two to four. */
const COLUMNS = [
  "mx-auto max-w-md",
  "mx-auto max-w-md",
  "mx-auto max-w-3xl @2xl:grid-cols-2",
  "mx-auto max-w-xl @4xl:max-w-none @4xl:grid-cols-3",
  "mx-auto max-w-xl @2xl:max-w-none @2xl:grid-cols-2 @5xl:grid-cols-4",
];

/** The reader's clock, known only after mount; a fixed moment is used as it is. */
function useNow(fixed: TicketTiersProps["now"]): Date | null {
  const [current, setCurrent] = useState<Date | null>(null);
  useEffect(() => {
    if (fixed !== undefined) return undefined;
    const tick = () => setCurrent(new Date());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [fixed]);
  return fixed !== undefined ? new Date(fixed) : current;
}

/** Minus, the number and plus. At a limit the plus stays focusable and says why, so nobody meets a dead button. */
function Stepper({ value, max, label, describedBy, labels, onChange, onLimit }: { value: number; max: number; label: string; describedBy: string; labels: TicketTiersLabels; onChange: (value: number) => void; onLimit: () => void }) {
  const button =
    "grid h-full w-10 place-items-center text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground motion-reduce:transition-none";
  return (
    <div role="group" aria-label={label} aria-describedby={describedBy} className="inline-flex h-10 items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs">
      <button type="button" aria-label={labels.fewer} aria-disabled={value <= 1 || undefined} onClick={() => value > 1 && onChange(value - 1)} className={cn(button, "border-r border-input")}>
        <IconMinus aria-hidden="true" size={14} />
      </button>
      <output className="grid min-w-11 place-items-center px-1 text-sm font-medium tabular-nums">{value}</output>
      <button type="button" aria-label={labels.more} aria-disabled={value >= max || undefined} onClick={() => (value >= max ? onLimit() : onChange(value + 1))} className={cn(button, "border-l border-input")}>
        <IconPlus aria-hidden="true" size={14} />
      </button>
    </div>
  );
}

/** "pending" is a tier with a sale window while the clock is not known: it is neither open nor closed yet, so it claims neither. */
type TierState = "sold-out" | "pending" | "not-yet" | "ended" | "open";

interface TierCardProps {
  tier: TicketTier;
  now: Date | null;
  currency: string;
  locale: string;
  timeZone: string;
  maxPerOrder: number;
  lowStock: number;
  labels: TicketTiersLabels;
  onSelect: (selection: TicketSelection) => void;
  Name: "h2" | "h3" | "h4" | "h5";
  nameId: string;
  /** Whether any tier can wear a badge. Then every card keeps a row for it, so the names and descriptions line up. */
  badgeRow: boolean;
}

function TierCard({ tier, now, currency, locale, timeZone, maxPerOrder, lowStock, labels, onSelect, Name, nameId, badgeRow }: TierCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [problem, setProblem] = useState<string | null>(null);
  const hintId = useId();
  const moment = now && !Number.isNaN(now.getTime()) ? now.getTime() : null;
  const start = tier.saleStart ? Date.parse(tier.saleStart) : Number.NaN;
  const end = tier.saleEnd ? Date.parse(tier.saleEnd) : Number.NaN;
  // Stock does not depend on the clock. Everything else does: without it a tier that has a sale window is pending, never open.
  const state: TierState =
    tier.remaining !== undefined && tier.remaining <= 0 ? "sold-out" : moment === null ? (tier.saleStart || tier.saleEnd ? "pending" : "open") : moment < start ? "not-yet" : moment >= end ? "ended" : "open";
  const stock = tier.remaining ?? Number.POSITIVE_INFINITY;
  const order = tier.max ?? maxPerOrder;
  const limit = Math.max(1, Math.min(stock, order));
  const count = Math.min(quantity, limit);
  // 129 is shown as €129, not €129.00; a price with cents keeps them, and so does every total made from it.
  const whole = Number.isInteger(tier.price);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) });
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone });
  const date = (iso: string) => <time dateTime={iso}>{day.format(new Date(iso))}</time>;
  const total = money.format((Math.round(tier.price * 100) * count) / 100);
  const open = state === "open";
  const pending = state === "pending";

  let badge: ReactNode = null;
  if (state === "sold-out") badge = <Badge variant="muted">{labels.soldOut}</Badge>;
  else if (state === "ended") badge = <Badge variant="muted">{labels.saleEnded}</Badge>;
  // One child: the badge is a flex row with a gap, and two children (the words, then the date) would add that gap to the space between them.
  else if (state === "not-yet") badge = <Badge variant="outline"><span>{fill(labels.onSale, { date: date(tier.saleStart ?? "") })}</span></Badge>;
  else if (open && tier.remaining !== undefined) {
    const low = tier.remaining <= lowStock;
    badge = <Badge variant={low ? "default" : "outline"}>{text(low ? labels.onlyLeft : labels.left, { count: tier.remaining })}</Badge>;
  }

  function change(next: number) {
    setQuantity(next);
    setProblem(null);
  }

  return (
    <li className="row-span-4 grid min-w-0 grid-rows-subgrid gap-y-0">
      <article aria-labelledby={nameId} data-state={state} className={cn("row-span-4 grid min-w-0 grid-rows-subgrid gap-y-0 rounded-2xl border border-border p-6", open ? "bg-card shadow-xs" : "bg-muted/40")}>
        <div className="flex flex-col">
          <Name id={nameId} className="text-lg leading-snug font-medium tracking-[-0.02em]">
            {tier.name}
          </Name>
          {/* The badge has a row of its own above the name, the same height on every card, so a long name or a long date never pushes one card's text below its neighbours'. It is drawn first and written second, so a screen reader still meets the heading before it. */}
          {badgeRow ? <div className="order-first mb-3 flex min-h-5 items-center">{badge}</div> : null}
          {tier.description ? <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{tier.description}</p> : null}
        </div>

        <div className="mt-6">
          <p className={cn("text-[2.5rem] leading-none font-medium tracking-[-0.05em] tabular-nums", !open && "text-muted-foreground")}>{money.format(tier.price)}</p>
          {open && tier.saleEnd ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <IconClock aria-hidden="true" className="size-4 shrink-0" />
              <span>{fill(labels.rises, { date: date(tier.saleEnd) })}</span>
            </p>
          ) : pending && tier.saleEnd ? (
            // Whether the price still rises is not known yet, so nothing is claimed; the line keeps its height for when it is.
            <p aria-hidden="true" className="mt-3 h-5" />
          ) : null}
        </div>

        {/* A ticket with nothing listed keeps its row, empty, so the rows of its neighbours still line up. */}
        <div className={cn("mt-6", tier.includes.length > 0 && "border-t border-border pt-5")}>
          {tier.includes.length > 0 ? (
            <>
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.includes}</p>
              <ul role="list" className="mt-3.5 grid gap-3">
                {tier.includes.map((line) => (
                  <li key={line} className={cn("flex items-start gap-2.5 text-sm leading-snug", !open && "text-muted-foreground")}>
                    <IconCheck aria-hidden="true" className="mt-px size-4 shrink-0" />
                    <span className="min-w-0 text-pretty">{line}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="mt-6 self-end border-t border-border pt-5">
          {open ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <Stepper
                  value={count}
                  max={limit}
                  label={text(labels.quantityFor, { tier: tier.name })}
                  describedBy={hintId}
                  labels={labels}
                  onChange={change}
                  onLimit={() => setProblem(stock <= order ? text(labels.stockLimit, { count: stock }) : text(labels.orderLimit, { max: order }))}
                />
                <p className="text-right">
                  <span className="block text-xs text-muted-foreground">{labels.total}</span>
                  <span className="block text-lg leading-tight font-medium tracking-[-0.02em] tabular-nums">{total}</span>
                </p>
              </div>
              <p id={hintId} role="status" className={cn("mt-3 flex items-start gap-1.5 text-xs leading-snug", problem ? "font-medium text-destructive" : "text-muted-foreground")}>
                {problem ? <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" /> : null}
                {problem ?? text(labels.limit, { max: limit })}
              </p>
              <Button type="button" size="lg" onClick={() => onSelect({ tierId: tier.id, quantity: count })} className="mt-4 w-full">
                {text(count === 1 ? labels.buyOne : labels.buyMany, { count })}
              </Button>
            </>
          ) : (
            <Button type="button" size="lg" disabled aria-busy={pending || undefined} className="w-full">
              {state === "sold-out" ? labels.soldOut : state === "ended" ? labels.saleEnded : pending ? labels.checking : labels.notYet}
            </Button>
          )}
        </div>
      </article>
    </li>
  );
}

/**
 * The ticket types of an event with the purchase rules that plain cards
 * skip: what each costs, what it includes, how many are left, when the price
 * rises, and a quantity stepper that stops at the stock and at the limit per
 * order and says why in words. A tier that is sold out, ended or not on sale yet
 * keeps its place with a disabled button and a clear label, so the reader sees
 * the whole range and what they missed. The sale windows are judged on the
 * reader's clock after mount, or on the `now` you pass. Until the clock is
 * known a tier with a sale window shows as checking (no badge, a muted price,
 * a disabled button that says so), so the server never renders a tier open
 * that the browser would close; pass `now` from the server and nothing is ever
 * checking. For conferences, workshops, concerts and fundraising dinners.
 */
export function TicketTiers({
  tiers,
  onSelect,
  title,
  description,
  currency = "USD",
  locale = "en-US",
  timeZone = "UTC",
  now: fixed,
  maxPerOrder = 10,
  lowStock = 5,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: TicketTiersProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const now = useNow(fixed);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Name = `h${title ? headingLevel + 1 : headingLevel}` as "h2" | "h3" | "h4" | "h5";
  // Worked out from the data alone, not from the clock, so the server and the browser agree on it.
  const badgeRow = tiers.some((tier) => tier.remaining !== undefined || Boolean(tier.saleStart) || Boolean(tier.saleEnd));
  return (
    <section data-slot="ticket-tiers" aria-labelledby={title ? `${id}-title` : undefined} aria-label={title ? undefined : labels.tickets} className={cn("@container w-full break-words", className)} {...props}>
      {title ? (
        <div className="mx-auto max-w-2xl text-center">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      {/* Every card spans four rows of this grid and passes them on (subgrid), so the prices, the lists and the buttons line up. */}
      <ul role="list" className={cn("grid gap-5", title && "mt-10 @3xl:mt-12", COLUMNS[Math.min(tiers.length, 4)])}>
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            now={now}
            currency={currency}
            locale={locale}
            timeZone={timeZone}
            maxPerOrder={maxPerOrder}
            lowStock={lowStock}
            labels={labels}
            onSelect={onSelect}
            Name={Name}
            nameId={`${id}-${tier.id}`}
            badgeRow={badgeRow}
          />
        ))}
      </ul>
    </section>
  );
}
