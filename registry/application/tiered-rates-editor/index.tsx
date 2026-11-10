"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconInfo, IconPlus, IconTrash } from "@rhs-ui/icons";
import { CellInput } from "@rhs-ui/application/tiered-rates-editor/cell-input";
import {
  DEFAULT_LABELS,
  describeTiers,
  endOf,
  fill,
  formatNumber,
  refusalFor,
  tidyTiers,
  unitFor,
  widestRefusal,
  withAdded,
  withFrom,
  withRate,
  withoutTier,
  type Tier,
  type TierUnit,
  type TieredRatesEditorLabels,
} from "@rhs-ui/application/tiered-rates-editor/tiers";
import { Button } from "@rhs-ui/primitives/button";
import { CurrencyInput } from "@rhs-ui/primitives/currency-input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { Tier, TierUnit, TieredRatesEditorLabels } from "@rhs-ui/application/tiered-rates-editor/tiers";

export interface TieredRatesEditorProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The tiers, first to last, when you control the editor: `{ from, rate }` each. A tier ends one below where the next begins. */
  value?: readonly Tier[];
  /** The tiers to begin with, when the editor keeps them itself. */
  defaultValue?: readonly Tier[];
  /** Called with all the tiers whenever one changes, a tier is added or one is removed. */
  onValueChange?: (value: Tier[]) => void;
  /** What the ranges count: "kg", "orders", or a pair for the plural, `{ one: "order", other: "orders" }`. Default "units". */
  unit?: TierUnit;
  /** The heading of the rate column, and the start of the note: "Price per unit", "Commission". Default "Rate". */
  rateLabel?: string;
  /** An ISO currency code. With it the rate is money: edited as an amount and stored in minor units (cents). Without it the rate is a plain number. */
  currency?: string;
  /** A mark after a plain rate: "%" for a commission. Not used with a currency. */
  rateSuffix?: string;
  /** The fewest tiers: removing stops there. Default 1. */
  minRows?: number;
  /** The most tiers: adding stops there. Default 10. */
  maxRows?: number;
  /** The language of the numbers and of the note. Default "en-US". */
  locale?: string;
  /** Turn the whole editor off. */
  disabled?: boolean;
  /** The words the editor says, for translation. */
  labels?: TieredRatesEditorLabels;
}

/**
 * An editable table of tiers for volume prices, weight-based shipping and
 * tiered commissions. Each row has a From, an automatic To (always one below
 * the next row's From; the last row says "and up") and a rate, so editing a
 * From moves the To above it and a gap or an overlap cannot be entered. A tier
 * that would end before it starts is refused, with the reason in words, once
 * typing pauses or the cell is left (so "7" on its way to "75" is never
 * refused), at once only when no further digit could help; the reason takes
 * the place of the note, so nothing moves. Add puts a tier after the last
 * one, removing a tier hands its range to the one before it, and a note under
 * the table says the resulting ranges in words. The fields are named by row
 * ("Tier 2, from"), numbers sit in tabular figures, and on a phone the table
 * fits without scrolling (below 20rem of width the Tier column is left out, the
 * fields keep their names), or else scrolls inside its own frame.
 */
export function TieredRatesEditor({
  value,
  defaultValue,
  onValueChange,
  unit = "units",
  rateLabel = "Rate",
  currency,
  rateSuffix,
  minRows = 1,
  maxRows = 10,
  locale = "en-US",
  disabled = false,
  labels,
  className,
  ...props
}: TieredRatesEditorProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const [own, setOwn] = useState<readonly Tier[]>(defaultValue ?? []);
  // Why the last start was refused. It stays until something is changed, so it can still be read after the cell has put the old number back.
  const [refusal, setRefusal] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const focusAfter = useRef<string | null>(null);
  const tiers = tidyTiers(value ?? own);
  const count = (n: number) => formatNumber(n, 0, locale);
  const money = currency ? new Intl.NumberFormat(locale, { style: "currency", currency }) : null;
  const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const rateText = (rate: number) => (money ? money.format(rate / 100) : `${plain.format(rate)}${rateSuffix ?? ""}`);
  const note = describeTiers(tiers, { rateLabel, unit, locale, words, rate: rateText });
  const noteId = `${base}-note`;
  // Only an editor with a start to type into can refuse one.
  const reasonSample = tiers.length > 1 && !disabled ? widestRefusal(words, count) : null;

  // After an add or a remove the focus goes to a field that is still there, so the keyboard carries on where it was.
  useEffect(() => {
    if (focusAfter.current) {
      document.getElementById(focusAfter.current)?.focus();
      focusAfter.current = null;
    }
  });

  function commit(next: Tier[]) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function add() {
    const next = withAdded(tiers);
    const added = next[next.length - 1];
    setRefusal(null);
    commit(next);
    focusAfter.current = `${base}-rate-${next.length - 1}`;
    if (added) setSaid(fill(words.added, { tier: next.length, from: count(added.from) }));
  }

  function remove(index: number) {
    const next = withoutTier(tiers, index);
    setRefusal(null);
    commit(next);
    focusAfter.current = `${base}-rate-${Math.min(index, next.length - 1)}`;
    setSaid(index === 0 ? fill(words.removedFirst, { from: count(next[0]?.from ?? 1) }) : fill(words.removed, { tier: index + 1, into: index }));
  }

  return (
    <div data-slot="tiered-rates-editor" className={cn("@container overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", disabled && "opacity-60", className)} {...props}>
      <Table aria-describedby={noteId} className="min-w-0 @xs:min-w-[19.5rem] @xl:min-w-[36rem]">
        <TableCaption className="sr-only">{words.caption}</TableCaption>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead scope="col" className="hidden w-9 pr-0 pl-3 text-xs @xs:table-cell @xl:w-20 @xl:pr-3 @xl:pl-4">
              <span className="@xl:sr-only">{words.tierColumn}</span>
            </TableHead>
            <TableHead scope="col" className="w-[4.5rem] pr-2 pl-1.5 text-right text-xs @xs:w-[5.25rem] @xs:pr-4 @xl:w-36 @xl:pr-6 @xl:pl-3">
              {words.from} <span className="block font-normal @xl:inline">({unitFor(unit, 2, locale)})</span>
            </TableHead>
            <TableHead scope="col" className="w-12 pr-1 pl-1.5 text-right text-xs @xs:w-14 @xl:w-28 @xl:pr-6 @xl:pl-3" title={words.autoHint}>
              {words.to} <span className="block font-normal @xl:inline">({unitFor(unit, 2, locale)})</span>
              <span className="sr-only">, {words.autoHint}</span>
            </TableHead>
            <TableHead scope="col" className="pr-2 pl-1 text-left text-xs @xs:pr-3 @xs:pl-4 @xl:pr-6 @xl:pl-3 @xl:text-right">
              {rateLabel}
            </TableHead>
            <TableHead scope="col" className="w-9 pr-1 pl-0 @xl:w-14 @xl:pr-3">
              <span className="sr-only">{words.actionsColumn}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers.map((tier, index) => {
            const to = endOf(tiers, index);
            const number = index + 1;
            return (
              <TableRow key={index} className="hover:bg-transparent">
                <TableHead scope="row" className="hidden pr-0 pl-3 text-sm font-medium text-muted-foreground tabular-nums @xs:table-cell @xl:pr-3 @xl:pl-4 @xl:text-foreground">
                  <span aria-hidden="true" className="@xl:hidden">
                    {number}
                  </span>
                  <span className="sr-only @xl:not-sr-only">{fill(words.tier, { tier: number })}</span>
                </TableHead>
                <TableCell className="px-1 py-2 @xl:px-3">
                  {index === 0 ? (
                    <span className="ml-auto flex h-9 w-16 items-center justify-end rounded-md border border-dashed border-input bg-muted/40 px-3 text-sm tabular-nums @xs:w-[4.5rem] @xl:w-32">{count(tier.from)}</span>
                  ) : (
                    <CellInput
                      value={tier.from}
                      locale={locale}
                      disabled={disabled}
                      aria-label={fill(words.fromField, { tier: number })}
                      refuse={(next, settled) => refusalFor(tiers, index, next, words, count, settled)}
                      onRefuse={setRefusal}
                      onValueChange={(from) => {
                        if (from !== null) commit(withFrom(tiers, index, from));
                      }}
                      className="ml-auto w-16 @xs:w-[4.5rem] @xl:w-32"
                    />
                  )}
                </TableCell>
                <TableCell className="px-1 py-2 text-right text-sm text-muted-foreground tabular-nums @xl:px-3">
                  <span className="block px-0 whitespace-nowrap @xl:px-3">{to === null ? words.andUp : count(to)}</span>
                </TableCell>
                <TableCell className="px-1 py-2 @xl:px-3">
                  {currency ? (
                    <CurrencyInput
                      id={`${base}-rate-${index}`}
                      value={tier.rate}
                      currency={currency}
                      locale={locale}
                      disabled={disabled}
                      aria-label={fill(words.rateField, { tier: number, rate: rateLabel })}
                      onValueChange={(rate) => {
                        setRefusal(null);
                        commit(withRate(tiers, index, rate));
                      }}
                      className="mr-auto w-[5.25rem] @xs:w-[6.5rem] @xl:mr-0 @xl:ml-auto @xl:w-40"
                    />
                  ) : (
                    <CellInput
                      id={`${base}-rate-${index}`}
                      value={tier.rate}
                      decimals={2}
                      suffix={rateSuffix}
                      locale={locale}
                      disabled={disabled}
                      aria-label={fill(words.rateField, { tier: number, rate: rateLabel })}
                      onValueChange={(rate) => {
                        setRefusal(null);
                        commit(withRate(tiers, index, rate));
                      }}
                      className="mr-auto w-[5.25rem] @xs:w-[6.5rem] @xl:mr-0 @xl:ml-auto @xl:w-40"
                    />
                  )}
                </TableCell>
                <TableCell className="py-2 pr-1 pl-0 text-right @xl:pr-3">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={disabled || tiers.length <= minRows} aria-label={fill(words.remove, { tier: number })} onClick={() => remove(index)} className="text-muted-foreground hover:text-foreground">
                    <IconTrash aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button type="button" variant="outline" size="sm" disabled={disabled || tiers.length >= maxRows} onClick={add}>
          <IconPlus aria-hidden="true" />
          {words.add}
        </Button>
      </div>

      {/* The note under the table is also where the reason a start was refused is shown, on top of it. The band is as tall as the longer of the two (the reason is measured from an unseen sample), so a reason covers the note exactly and nothing moves when it comes or goes. */}
      <div className="relative grid">
        <p id={noteId} className="col-start-1 row-start-1 flex border-t border-border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <span className="my-auto flex items-start gap-2.5">
            <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{note}</span>
          </span>
        </p>

        {reasonSample ? (
          <p aria-hidden="true" className="invisible col-start-1 row-start-1 flex gap-2.5 border-t border-transparent px-4 py-3 text-xs leading-5 font-medium select-none">
            <span className="size-4 shrink-0" />
            <span>{reasonSample}</span>
          </p>
        ) : null}

        {/* Kept in the page when empty, with no size of its own: a live region that appears together with its message is often never read. */}
        <div role="status" aria-live="polite" className="absolute inset-x-0 bottom-0 flex flex-col not-empty:min-h-full">
          {refusal ? (
            <p data-slot="tiered-rates-editor-refusal" className="flex grow border-t border-destructive/30 bg-card px-4 py-3 text-xs leading-5 font-medium text-destructive">
              <span className="my-auto flex items-start gap-2.5">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>{refusal}</span>
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
