"use client";

import type { ComponentProps } from "react";

import { IconArrowDown, IconArrowUp, IconMinus, IconTrendDown, IconTrendUp } from "@rhs-ui/icons";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

export interface Mover {
  /** Stable identity for the row. */
  id: string;
  /** What moved: a product, a page, a channel. */
  label: string;
  /** What it is now. */
  current: number;
  /** What it was at the start of the period. */
  previous: number;
}

export interface TopMoversListProps extends Omit<ComponentProps<"div">, "children" | "title" | "onSelect"> {
  /** Candidates for the rising half. Anything that did not rise is left out. */
  risers: readonly Mover[];
  /** Candidates for the falling half. Anything that did not fall is left out. */
  fallers: readonly Mover[];
  /** What the change is measured against: "the previous 7 days". */
  period?: string;
  /** Intl.NumberFormat options for the values: currency, compact. Whole numbers by default. Keep the object stable. */
  format?: Intl.NumberFormatOptions;
  /** Makes each row a button, called with the item. */
  onSelect?: (mover: Mover) => void;
  /** Rows per half. */
  limit?: number;
  /** Items that started below this are left out. A jump from 2 to 9 is up 350 percent and means nothing. */
  minBase?: number;
  /** Rank by the change in percent (the default) or in amount. */
  rankBy?: "percent" | "amount";
  /** The card's heading. */
  title?: string;
  /** BCP 47 locale for the figures. */
  locale?: string;
}

interface Ranked extends Mover {
  delta: number;
  /** The change as a ratio of where it started; `null` when it started from nothing. */
  ratio: number | null;
}

function rank(list: readonly Mover[], direction: 1 | -1, minBase: number, rankBy: "percent" | "amount", limit: number): Ranked[] {
  return list
    .filter((item) => Number.isFinite(item.current) && Number.isFinite(item.previous) && item.previous >= minBase)
    .map((item): Ranked => ({ ...item, delta: item.current - item.previous, ratio: item.previous > 0 ? (item.current - item.previous) / item.previous : null }))
    .filter((item) => Math.sign(item.delta) === direction)
    .sort((a, b) => {
      // Biggest move first: for fallers that is the most negative. A move from nothing has no percent and ranks last.
      const byAmount = direction * (b.delta - a.delta);
      if (rankBy === "amount") return byAmount;
      if (a.ratio === null || b.ratio === null) return a.ratio === b.ratio ? byAmount : a.ratio === null ? 1 : -1;
      return direction * (b.ratio - a.ratio) || byAmount;
    })
    .slice(0, Math.max(0, limit));
}

/**
 * The biggest risers and fallers over a period, side by side on a wide card
 * and stacked on a narrow one. Each row has the current value, where it came
 * from, and the change in percent and amount behind an arrow and the word
 * "Up" or "Down". Flat items are never listed, and `minBase` drops items that
 * only look big in percent because they started near zero. Figures are
 * tabular so the columns line up, and a half with nothing to show says so.
 */
export function TopMoversList({
  risers,
  fallers,
  period,
  format,
  onSelect,
  limit = 5,
  minBase = 0,
  rankBy = "percent",
  title = "Top movers",
  locale = "en-US",
  className,
  ...props
}: TopMoversListProps) {
  const options = format ?? { maximumFractionDigits: 0 };
  const value = new Intl.NumberFormat(locale, options);
  const signedDelta = new Intl.NumberFormat(locale, { ...options, signDisplay: "always" });
  const wholePercent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const finePercent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const delta = (amount: number) => signedDelta.formatToParts(amount).map((part) => (part.type === "minusSign" ? "−" : part.value)).join("");

  const halves = [
    { key: "up", heading: "Rising", Icon: IconTrendUp, rows: rank(risers, 1, minBase, rankBy, limit) },
    { key: "down", heading: "Falling", Icon: IconTrendDown, rows: rank(fallers, -1, minBase, rankBy, limit) },
  ] as const;

  return (
    <Card data-slot="top-movers-list" className={cn("@container w-full gap-0 py-0", className)} {...props}>
      <div className="border-b border-border">
        <CardHeader className="py-5">
          <CardTitle className="text-base tracking-[-0.01em]">{title}</CardTitle>
          {period ? <CardDescription>Compared with {period}</CardDescription> : null}
        </CardHeader>
      </div>

      <div className="grid divide-y divide-border @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
        {halves.map((half) => (
          <div key={half.key} role="group" aria-label={half.heading} data-half={half.key} className="min-w-0 pb-3">
            <h4 className="flex items-center gap-2 px-6 pt-5 pb-2 text-xs font-medium text-muted-foreground">
              <half.Icon size={14} aria-hidden="true" />
              {half.heading}
            </h4>
            {half.rows.length === 0 ? (
              <p className="flex items-center gap-2 px-6 py-6 text-sm text-muted-foreground">
                <IconMinus size={14} aria-hidden="true" />
                No movers this period
              </p>
            ) : (
              <ol role="list" className="px-3">
                {half.rows.map((item, index) => {
                  const up = item.delta > 0;
                  // A move from nothing has no percent: the pill says "New", and a screen reader still hears the direction.
                  const percent = item.ratio === null ? null : (Math.abs(item.ratio) < 0.1 ? finePercent : wholePercent).format(Math.abs(item.ratio));
                  const ChangeIcon = up ? IconArrowUp : IconArrowDown;
                  const body = (
                    <span className="grid w-full grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5">
                      <span aria-hidden="true" className="row-span-2 self-start pt-0.5 text-xs text-muted-foreground tabular-nums">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-medium" title={item.label}>
                        {item.label}
                      </span>
                      <span className="text-right text-sm font-medium tabular-nums">{value.format(item.current)}</span>
                      <span className="col-span-2 col-start-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs tabular-nums">
                        <span className="text-muted-foreground">From {value.format(item.previous)}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-flex h-5 items-center gap-1 rounded-full bg-muted px-2 font-medium text-foreground">
                            <ChangeIcon size={12} aria-hidden="true" />
                            {percent === null ? (
                              <>
                                <span className="sr-only">{up ? "Up" : "Down"}: </span>
                                New
                              </>
                            ) : (
                              `${up ? "Up" : "Down"} ${percent}`
                            )}
                          </span>
                          <span className="text-muted-foreground">{delta(item.delta)}</span>
                        </span>
                      </span>
                    </span>
                  );
                  const row = "flex w-full rounded-lg px-3 py-2.5 text-left";
                  return (
                    <li key={item.id}>
                      {onSelect ? (
                        <button
                          type="button"
                          onClick={() => onSelect(item)}
                          className={cn(row, "transition-colors duration-150 outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none")}
                        >
                          {body}
                        </button>
                      ) : (
                        <div className={row}>{body}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
