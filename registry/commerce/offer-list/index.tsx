"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconStar, IconTag } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import {
  CONDITIONS,
  FIRST_DIRECTION,
  SORT_KEYS,
  WORDS,
  bestTotalOf,
  capitalise,
  deliveryText,
  fill,
  sortOffers,
  totalOf,
  type Offer,
  type OfferCondition,
  type OfferListLabels,
  type OfferSort,
  type OfferSortDirection,
  type OfferSortKey,
} from "@rhs-ui/commerce/offer-list/offers";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export type { Offer, OfferCondition, OfferDelivery, OfferListLabels, OfferSort, OfferSortDirection, OfferSortKey } from "@rhs-ui/commerce/offer-list/offers";

export interface OfferListProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The offers to list, in the order you want them when no sort is chosen. */
  offers: readonly Offer[];
  /** The column and direction the list is sorted by, when you control it. */
  sort?: OfferSort;
  /** The sort to begin with. Without one the offers keep the order you gave them. */
  defaultSort?: OfferSort;
  /** Called when a column head or the sort control on a phone is used. The list sorts itself, so this is only for you to remember the choice or to ask your server. */
  onSort?: (sort: OfferSort) => void;
  /** Called with the offer when its button is pressed. Return a promise and the button shows it is working. Without it there are no buttons. */
  onAdd?: (offer: Offer) => void | Promise<void>;
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Always pass your application locale, so amounts, ratings and dates are written the same on the server and in the browser. */
  locale?: string;
  /** The time zone a delivery that carries a time of day is read in, for instance "2026-11-05T18:00:00Z". A date-only day such as "2026-11-05" is a calendar day and is shown as it is in every time zone. Always pass it, so the day does not shift between the server and the browser. */
  timeZone?: string;
  /** Marks the offer with the lowest price with shipping as "Best price", in words as well as with a mark. Needs two offers or more. */
  highlightBest?: boolean;
  /** The heading. Defaults to "Other offers". */
  title?: string;
  /** The line under the heading. Defaults to the number of offers and a note that shipping is in the price. */
  description?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: OfferListLabels;
}

/** The rank of a condition as filled dots. The dots are only a picture of the word next to them. */
function Grade({ condition }: { condition: OfferCondition }) {
  const filled = CONDITIONS.length - CONDITIONS.indexOf(condition);
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-[3px]">
      {CONDITIONS.map((step, index) => (
        <span key={step} className={cn("size-1.5 rounded-full", index < filled ? "bg-foreground" : "bg-foreground/20")} />
      ))}
    </span>
  );
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | undefined)?.then === "function";

/**
 * Other offers for the same product, the way a marketplace or a shop for used goods lists them: who sells it and how
 * well they are rated, the condition (with what the word means in a tooltip), what it costs with shipping, when it
 * arrives, and a button to add that offer. The columns sort, and a screen reader is told how. The cheapest total
 * carries the words "Best price" as well as a mark, so it is not found by colour or by a badge alone. Amounts are in
 * minor units and tabular. On a phone every row becomes a card with the same information, the conditions are written
 * out under the badge, where a tooltip would not open, and a sort control takes the place of the column heads. A touch
 * screen wide enough for the table gets the conditions written out in it too.
 */
export function OfferList({
  offers,
  sort,
  defaultSort,
  onSort,
  onAdd,
  currency = "EUR",
  locale = "en-US",
  timeZone = "UTC",
  highlightBest = true,
  title,
  description,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: OfferListProps) {
  const words = { ...WORDS, ...labels, columns: { ...WORDS.columns, ...labels?.columns }, orders: { ...WORDS.orders, ...labels?.orders } };
  const id = useId();
  const [own, setOwn] = useState<OfferSort | undefined>(defaultSort);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const current = sort ?? own;
  const rows = sortOffers(offers, current);
  const best = highlightBest ? bestTotalOf(offers) : undefined;
  const number = new Intl.NumberFormat(locale);
  const rating = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const plural = new Intl.PluralRules(locale);
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const conditionOf = (condition: OfferCondition) => ({ ...WORDS.conditions[condition], ...labels?.conditions?.[condition] });

  const choose = (next: OfferSort) => {
    if (sort === undefined) setOwn(next);
    onSort?.(next);
    setStatus(fill(words.sorted, { order: words.orders[next.key][next.direction] }));
  };
  const toggle = (key: OfferSortKey) => {
    if (current?.key === key) choose({ key, direction: current.direction === "ascending" ? "descending" : "ascending" });
    else choose({ key, direction: FIRST_DIRECTION[key] });
  };
  const ariaSort = (key: OfferSortKey): OfferSortDirection | "none" => (current?.key === key ? current.direction : "none");

  const add = async (offer: Offer) => {
    if (!onAdd) return;
    const result = onAdd(offer);
    if (isThenable(result)) {
      setBusy(offer.id);
      try {
        await result;
      } catch {
        // Nothing was added, so nothing is confirmed; the caller shows what went wrong.
        setBusy(null);
        return;
      }
      setBusy(null);
    }
    setAdded(offer.id);
    setStatus(fill(words.addedStatus, { seller: offer.seller }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(null), 2400);
  };

  const sellerBlock = (offer: Offer): ReactNode => {
    const rated = offer.rating;
    const count = offer.ratingCount ?? 0;
    const sentence =
      rated === undefined
        ? undefined
        : offer.ratingCount === undefined
          ? fill(words.rated, { rating: rating.format(rated) })
          : fill(plural.select(count) === "one" ? words.ratedOne : words.ratedOther, { rating: rating.format(rated), count: number.format(count) });
    return (
      <>
        <span className="block text-sm font-medium text-pretty">{offer.seller}</span>
        {rated === undefined ? null : (
          <span role="img" aria-label={sentence} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <IconStar size={12} fill="currentColor" className="text-foreground" />
            <span aria-hidden="true">
              <span className="font-medium text-foreground">{rating.format(rated)}</span>
              {offer.ratingCount === undefined ? null : ` (${number.format(count)})`}
            </span>
          </span>
        )}
        {offer.note ? <span className="mt-1.5 block max-w-[38ch] text-xs leading-snug text-pretty text-muted-foreground">{offer.note}</span> : null}
      </>
    );
  };

  const priceBlock = (offer: Offer, isBest: boolean): ReactNode => (
    <span className="grid justify-items-end gap-1">
      {isBest ? (
        <Badge className="mb-0.5">
          <IconCheck />
          {words.bestPrice}
        </Badge>
      ) : null}
      <span className="text-base leading-none font-semibold tracking-[-0.01em] tabular-nums">{money(totalOf(offer))}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {offer.shipping === 0 ? fill(words.breakdownFree, { price: money(offer.price) }) : fill(words.breakdownPaid, { price: money(offer.price), shipping: money(offer.shipping) })}
      </span>
    </span>
  );

  const addButton = (offer: Offer, isBest: boolean, full = false): ReactNode => {
    const done = added === offer.id;
    return (
      <Button
        type="button"
        size={full ? "lg" : "sm"}
        variant={isBest ? "default" : "outline"}
        loading={busy === offer.id}
        aria-label={fill(words.addNamed, { action: done ? words.added : words.add, seller: offer.seller, condition: conditionOf(offer.condition).label ?? "", total: money(totalOf(offer)) })}
        onClick={() => void add(offer)}
        className={cn("min-w-28 motion-reduce:transition-none", full && "w-full")}
      >
        {done ? (
          <>
            <IconCheck />
            {words.added}
          </>
        ) : (
          words.add
        )}
      </Button>
    );
  };

  const summary = description ?? (offers.length === 0 ? "" : fill(plural.select(offers.length) === "one" ? words.summaryOne : words.summaryOther, { count: number.format(offers.length) }));
  const columnHead = (key: OfferSortKey, text: string, className?: string): ReactNode => (
    <TableHead scope="col" sort={ariaSort(key)} onSort={() => toggle(key)} className={className}>
      {text}
    </TableHead>
  );

  return (
    <TooltipProvider>
      <section data-slot="offer-list" aria-labelledby={`${id}-title`} className={cn("@container min-w-0", className)} {...props}>
        <header className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <Heading id={`${id}-title`} className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">
              {title ?? words.title}
            </Heading>
            {summary ? <p className="mt-1 text-sm text-pretty text-muted-foreground">{summary}</p> : null}
          </div>
          {offers.length > 1 ? (
            <div className="flex items-center gap-2 @4xl:hidden">
              <span aria-hidden="true" className="text-xs text-muted-foreground">
                {words.sortBy}
              </span>
              <Select
                value={current ? `${current.key}:${current.direction}` : ""}
                onValueChange={(value) => {
                  const [key, direction] = value.split(":");
                  choose({ key: key as OfferSortKey, direction: direction as OfferSortDirection });
                }}
              >
                <SelectTrigger aria-label={words.sortBy} className="w-auto min-w-44 data-[size=default]:h-11">
                  <SelectValue placeholder={words.defaultOrder} />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORT_KEYS.flatMap((key) =>
                    (["ascending", "descending"] as const).map((direction) => (
                      <SelectItem key={`${key}:${direction}`} value={`${key}:${direction}`}>
                        {capitalise(words.orders[key][direction], locale)}
                      </SelectItem>
                    )),
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </header>

        {offers.length === 0 ? (
          <p className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            <IconTag aria-hidden="true" className="size-4 shrink-0" />
            {words.empty}
          </p>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card @4xl:block">
              <Table>
                <TableCaption className="sr-only">{title ?? words.title}</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {columnHead("rating", words.columns.seller, "pl-5")}
                    {columnHead("condition", words.columns.condition)}
                    {columnHead("delivery", words.columns.delivery)}
                    {columnHead("price", words.columns.price, "text-right")}
                    {onAdd ? (
                      <TableHead scope="col" className="pr-5">
                        <span className="sr-only">{words.actions}</span>
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((offer) => {
                    const isBest = best !== undefined && totalOf(offer) === best;
                    const condition = conditionOf(offer.condition);
                    return (
                      <TableRow key={offer.id} data-best={isBest || undefined} className={cn("border-border", isBest && "bg-muted/40")}>
                        <TableHead scope="row" className={cn("h-auto py-4 pl-5 align-middle font-normal whitespace-normal text-foreground", isBest && "shadow-[inset_3px_0_0_0_var(--foreground)]")}>
                          {sellerBlock(offer)}
                        </TableHead>
                        <TableCell className="py-4 align-middle">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="-mx-1.5 inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
                              >
                                <Grade condition={offer.condition} />
                                <span className="underline decoration-muted-foreground/60 decoration-dotted underline-offset-4">{condition.label}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <span className="font-medium">{condition.label}.</span> {condition.hint}
                            </TooltipContent>
                          </Tooltip>
                          {/* A tooltip never opens on a tap, and a tablet in landscape gets this table: where there is no hover the meaning is written out, as the cards do. */}
                          <span className="mt-1 hidden max-w-[26ch] text-xs leading-snug text-pretty text-muted-foreground [@media(hover:none)]:block">{condition.hint}</span>
                        </TableCell>
                        <TableCell className="py-4 align-middle text-sm whitespace-nowrap tabular-nums">{deliveryText(offer.delivery, locale, timeZone, words.range)}</TableCell>
                        <TableCell className="py-4 text-right align-middle">{priceBlock(offer, isBest)}</TableCell>
                        {onAdd ? <TableCell className="py-4 pr-5 text-right align-middle">{addButton(offer, isBest)}</TableCell> : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <ul role="list" aria-labelledby={`${id}-title`} className="grid gap-3 @4xl:hidden">
              {rows.map((offer) => {
                const isBest = best !== undefined && totalOf(offer) === best;
                const condition = conditionOf(offer.condition);
                return (
                  <li key={offer.id} data-best={isBest || undefined} className={cn("grid gap-4 rounded-xl border bg-card p-4", isBest ? "border-foreground" : "border-border")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">{sellerBlock(offer)}</div>
                      <div className="shrink-0 text-right">{priceBlock(offer, isBest)}</div>
                    </div>
                    <dl className="grid gap-3 border-t border-border pt-4 text-sm">
                      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
                        <dt className="text-muted-foreground">{words.columns.condition}</dt>
                        <dd className="min-w-0">
                          <span className="flex items-center gap-2 font-medium">
                            <Grade condition={offer.condition} />
                            {condition.label}
                          </span>
                          <span className="mt-1 block text-xs leading-snug text-pretty text-muted-foreground">{condition.hint}</span>
                        </dd>
                      </div>
                      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
                        <dt className="text-muted-foreground">{words.columns.delivery}</dt>
                        <dd className="tabular-nums">{deliveryText(offer.delivery, locale, timeZone, words.range)}</dd>
                      </div>
                    </dl>
                    {onAdd ? addButton(offer, isBest, true) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <p role="status" aria-live="polite" className="sr-only">
          {status}
        </p>
      </section>
    </TooltipProvider>
  );
}
