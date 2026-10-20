"use client";

import { useMemo, type ComponentProps } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconArrowDownLeft, IconClock, IconReceipt } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export interface Transaction {
  /** Stable identity for the row. */
  id: string;
  /** Who the money went to or came from. A long name truncates and keeps the full name in a title. */
  counterparty: string;
  /** What kind of spending or income it was: "Groceries", "Salary". */
  category?: string;
  /** When it happened: an ISO string, a Date or a timestamp. */
  date: Date | string | number;
  /** Signed, in major units: positive is money in, negative is money out. */
  amount: number;
  /** Not settled yet. Marked in words and set lighter. */
  pending?: boolean;
  /** A logo or portrait; initials stand in until it loads. */
  avatar?: string;
  /** Overrides the list's currency for this transaction. */
  currency?: string;
}

export interface TransactionListProps extends Omit<ComponentProps<"div">, "children" | "onSelect"> {
  /** The statement, in any order: the list sorts it newest first. */
  transactions: readonly Transaction[];
  /** ISO 4217 code. */
  currency?: string;
  /** BCP 47 locale for amounts, times and headings. */
  locale?: string;
  /** Day headings with the daily total, month headings, or one flat list. */
  groupBy?: "day" | "month" | "none";
  /** Makes each row a button, called with the transaction. */
  onSelect?: (transaction: Transaction) => void;
  /** Skeleton groups and rows while the statement loads. */
  loading?: boolean;
  /** Days are cut at midnight in this IANA zone. */
  timeZone?: string;
  /** The moment "Today" and "Yesterday" are measured from. Defaults to the current time. */
  now?: Date | string | number;
  /** A CSS length. Beyond it the list scrolls inside itself and the headings stay in view. */
  maxHeight?: string;
}

const DAY = 86_400_000;
const UNDATED = "undated";
const toMs = (value: Date | string | number): number => (value instanceof Date ? value.getTime() : new Date(value).getTime());
const capital = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/** "2026-10-19" as a day number, so two days can be compared without clocks. */
function dayNumber(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / DAY;
}

interface Group {
  key: string;
  items: Transaction[];
  /** Sum of the group, when every transaction shares the list's currency. */
  total: number | null;
}

/** A typographic minus, so "+" and "−" have the same width in tabular figures. */
function signed(format: Intl.NumberFormat, value: number): string {
  return format.formatToParts(value).map((part) => (part.type === "minusSign" ? "−" : part.value)).join("");
}

/**
 * A statement: transactions grouped by day under sticky headings that carry
 * the daily total, each row a counterparty, a category, a time and an
 * amount. Direction never depends on colour: money in has a plus sign and the
 * word "Received", money out a minus. Pending items are marked in words and
 * set lighter (money that is still pending has not been received, so it says
 * "Pending" and keeps its plus sign), figures are tabular and line up on the
 * decimal, and long names truncate with their full text in a title.
 */
export function TransactionList({
  transactions,
  currency = "USD",
  locale = "en-US",
  groupBy = "day",
  onSelect,
  loading = false,
  timeZone = "UTC",
  now,
  maxHeight,
  className,
  style,
  ...props
}: TransactionListProps) {
  const dayKey = useMemo(() => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }), [timeZone]);
  const money = useMemo(() => new Map<string, Intl.NumberFormat>(), [locale]);
  const format = (code: string) => {
    let cached = money.get(code);
    if (!cached) money.set(code, (cached = new Intl.NumberFormat(locale, { style: "currency", currency: code, signDisplay: "exceptZero" })));
    return cached;
  };

  const groups = useMemo<Group[]>(() => {
    // A date that cannot be read sorts last, in a group of its own, instead of breaking the list.
    const timeOf = (item: Transaction) => {
      const ms = toMs(item.date);
      return Number.isFinite(ms) ? ms : -Infinity;
    };
    const sorted = [...transactions].sort((a, b) => (timeOf(b) === timeOf(a) ? 0 : timeOf(b) > timeOf(a) ? 1 : -1));
    if (groupBy === "none") return [{ key: "all", items: sorted, total: null }];
    const byKey = new Map<string, Transaction[]>();
    for (const item of sorted) {
      const ms = timeOf(item);
      const key = Number.isFinite(ms) ? dayKey.format(ms) : UNDATED;
      const group = groupBy === "month" && key !== UNDATED ? key.slice(0, 7) : key;
      byKey.set(group, [...(byKey.get(group) ?? []), item]);
    }
    return [...byKey].map(([key, items]) => ({
      key,
      items,
      total: items.every((item) => (item.currency ?? currency) === currency) ? items.reduce((sum, item) => sum + item.amount, 0) : null,
    }));
  }, [transactions, groupBy, dayKey, currency]);

  const timeOptions: Intl.DateTimeFormatOptions =
    groupBy === "day" ? { hour: "2-digit", minute: "2-digit", timeZone } : groupBy === "none" ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone } : { day: "numeric", month: "short", timeZone };
  const timeFormat = new Intl.DateTimeFormat(locale, timeOptions);
  const fullFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const longDay = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone });
  const shortDay = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone });
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone });
  const nowMs = now === undefined ? Date.now() : toMs(now);
  const today = Number.isFinite(nowMs) ? dayNumber(dayKey.format(nowMs)) : Number.NaN;

  /** The heading of a group: "Today" with its date, "Yesterday", a weekday, or a month. */
  const heading = (group: Group): { title: string; date: string } => {
    const first = group.items[0];
    if (!first) return { title: "", date: "" };
    if (group.key === UNDATED) return { title: "No date", date: "" };
    const when = toMs(first.date);
    if (groupBy === "month") return { title: capital(monthName.format(when), locale), date: "" };
    const ago = today - dayNumber(group.key);
    if (ago === 0 || ago === 1) return { title: capital(relative.format(-ago, "day"), locale), date: shortDay.format(when) };
    return { title: capital(longDay.format(when), locale), date: "" };
  };

  const rows = (items: Transaction[]) => (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const credit = item.amount > 0;
        const when = toMs(item.date);
        const amount = signed(format(item.currency ?? currency), item.amount);
        // The word a screen reader hears before the amount: settled money out is "Paid", pending money in is "Incoming" (the Received badge is for settled credits).
        const spoken = credit ? (item.pending ? "Incoming " : null) : item.pending ? null : "Paid ";
        const body = (
          <>
            <Avatar aria-hidden="true" className={cn(item.pending && "[&_img]:opacity-60")}>
              {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
              <AvatarFallback>{initialsOf(item.counterparty)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              {/* On a phone a name wraps to a second line instead of being cut to a few letters; from @sm it is one line again. */}
              <span title={item.counterparty} className={cn("line-clamp-2 text-sm font-medium @sm:line-clamp-none @sm:block @sm:truncate", item.pending && "text-muted-foreground")}>
                {item.counterparty}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                {item.category ? (
                  <>
                    <span>{item.category}</span>
                    <span aria-hidden="true">&middot;</span>
                  </>
                ) : null}
                {Number.isFinite(when) ? (
                  <time dateTime={new Date(when).toISOString()} title={fullFormat.format(when)} className="tabular-nums">
                    {timeFormat.format(when)}
                  </time>
                ) : null}
                {credit && !item.pending ? (
                  <Badge variant="outline" className="ml-0.5">
                    <IconArrowDownLeft aria-hidden="true" />
                    Received
                  </Badge>
                ) : null}
                {item.pending ? (
                  <Badge variant="muted" className="ml-0.5">
                    <IconClock aria-hidden="true" />
                    Pending
                  </Badge>
                ) : null}
              </span>
            </span>
            <span className={cn("shrink-0 text-right text-[0.8125rem] font-medium tabular-nums @sm:text-sm", item.pending && "text-muted-foreground")}>
              {spoken ? <span className="sr-only">{spoken}</span> : null}
              {amount}
            </span>
          </>
        );
        const row = "flex w-full items-center gap-3 px-5 py-3 text-left";
        return (
          <li key={item.id} data-pending={item.pending || undefined} data-direction={credit ? "in" : "out"}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(row, "transition-colors duration-150 outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none")}
              >
                {body}
              </button>
            ) : (
              <div className={row}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );

  // `@container` also stops a long merchant name from widening the grid cell the list sits in.
  const surface = cn(
    "@container w-full rounded-xl border border-border bg-card text-card-foreground shadow-xs",
    maxHeight ? "relative overflow-y-auto" : "overflow-clip",
    className,
  );
  // A list that scrolls inside itself and has nothing to press must still be reachable by keyboard, or its lower rows can only be read with a mouse.
  const keyboardScroll = maxHeight && !onSelect ? { tabIndex: 0, role: "region", "aria-label": "Transactions" } : {};
  const scrollRing = maxHeight && !onSelect ? "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" : undefined;

  if (loading) {
    return (
      <div data-slot="transaction-list" aria-busy="true" className={surface} style={maxHeight ? { maxHeight, ...style } : style} {...props}>
        <p role="status" className="sr-only">
          Loading transactions
        </p>
        <div aria-hidden="true">
          {[0, 1].map((group) => (
            <div key={group} className={group > 0 ? "border-t border-border" : undefined}>
              <div className="flex items-center justify-between border-b border-border bg-[color-mix(in_oklch,var(--card),var(--muted)_60%)] px-5 py-2.5">
                <Skeleton className="h-3.5 w-24" delay={group * 300} />
                <Skeleton className="h-3.5 w-16" delay={group * 300 + 60} />
              </div>
              <ul className="divide-y divide-border">
                {[0, 1, 2].map((row) => (
                  <li key={row} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" delay={group * 300 + row * 70} />
                    <div className="grid flex-1 gap-1.5">
                      <Skeleton className="h-4 w-36 max-w-full" delay={group * 300 + row * 70 + 40} />
                      <Skeleton className="h-3 w-24" delay={group * 300 + row * 70 + 80} />
                    </div>
                    <Skeleton className="h-4 w-16" delay={group * 300 + row * 70 + 40} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-slot="transaction-list" className={cn(surface, scrollRing)} style={maxHeight ? { maxHeight, ...style } : style} {...keyboardScroll} {...props}>
      {transactions.length === 0 ? (
        <EmptyState icon={<IconReceipt size={22} />} title="No transactions yet" description="Payments, payouts and refunds show up here as soon as they clear." className="rounded-none border-0 py-14" />
      ) : (
        groups.map((group) => (
          <div key={group.key} className="not-first:border-t not-first:border-border">
            {groupBy === "none" ? null : (
              <h3 className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b border-border bg-[color-mix(in_oklch,var(--card),var(--muted)_60%)] px-5 py-2.5 text-xs font-medium">
                <span>
                  {/* "Today" and "Yesterday" depend on the clock, so server and browser may disagree: the shape stays the same and only the text is allowed to differ. */}
                  <span suppressHydrationWarning>{heading(group).title}</span>{" "}
                  <span className="ml-1.5 font-normal text-muted-foreground" suppressHydrationWarning>
                    {heading(group).date}
                  </span>
                </span>
                {group.total === null ? null : (
                  <span className="tabular-nums text-muted-foreground">
                    <span className="sr-only">Total </span>
                    {signed(format(currency), group.total)}
                  </span>
                )}
              </h3>
            )}
            {rows(group.items)}
          </div>
        ))
      )}
    </div>
  );
}
