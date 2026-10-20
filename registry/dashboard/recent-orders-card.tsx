"use client";

import type { ComponentProps, MouseEvent } from "react";

import { IconAlertCircle, IconArrowRight, IconBag, IconBan, IconCheck, IconClock, IconReturn, IconTruck } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type OrderStatus = "paid" | "pending" | "shipped" | "refunded" | "cancelled" | "failed";

export interface RecentOrder {
  /** Stable identity for the row. */
  id: string;
  /** The number people know the order by: "#10482". Never the platform's internal id. */
  number: string;
  /** Who ordered. The avatar is optional; initials stand in. */
  customer: { name: string; email: string; avatar?: string };
  /** When the order was placed: an ISO string, a Date or a timestamp. */
  placedAt: Date | string | number;
  /** The total in major units: 182.4 is 182.40. */
  total: number;
  /** Overrides the card's currency for this order. */
  currency?: string;
  /** Where the order stands. Shown as an icon and a word. */
  status: OrderStatus;
  /** Where the order lives. The number becomes a link. */
  href?: string;
}

export interface RecentOrdersCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The latest five to ten orders, newest first. */
  orders: readonly RecentOrder[];
  /** Called when an order number is pressed. Call `event.preventDefault()` to route yourself instead of following `href`. */
  onOpen?: (order: RecentOrder, event: MouseEvent<HTMLElement>) => void;
  /** Where the full list lives. */
  viewAllHref?: string;
  /** Skeleton rows in the same footprint while the orders load. */
  loading?: boolean;
  /** ISO 4217 code for totals. An order can carry its own. */
  currency?: string;
  /** The card's heading. */
  title?: string;
  /** A line under the heading. */
  description?: string;
  /** The moment relative dates are measured from. Defaults to the current time. */
  now?: Date | string | number;
  /** BCP 47 locale for totals and dates. */
  locale?: string;
  /** IANA zone for dates older than a week. */
  timeZone?: string;
}

/** A failed order is an outline in the destructive colour: the tinted destructive badge is 3.98:1 on white, below the 4.5:1 text needs. */
const STATUS = {
  paid: { word: "Paid", Icon: IconCheck, variant: "outline", tone: "" },
  pending: { word: "Pending", Icon: IconClock, variant: "muted", tone: "" },
  shipped: { word: "Shipped", Icon: IconTruck, variant: "outline", tone: "" },
  refunded: { word: "Refunded", Icon: IconReturn, variant: "muted", tone: "" },
  cancelled: { word: "Cancelled", Icon: IconBan, variant: "muted", tone: "" },
  failed: { word: "Failed", Icon: IconAlertCircle, variant: "outline", tone: "border-destructive/50 text-destructive" },
} as const;

const toMs = (value: Date | string | number): number => (value instanceof Date ? value.getTime() : new Date(value).getTime());

function relativeTime(when: number, now: number, relative: Intl.RelativeTimeFormat, date: Intl.DateTimeFormat): string {
  const seconds = Math.round((when - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return relative.format(0, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), "day");
  return date.format(when);
}

const linkStyle = "rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40";

function OrderNumber({ order, onOpen }: { order: RecentOrder; onOpen: RecentOrdersCardProps["onOpen"] }) {
  if (order.href) {
    return (
      <a href={order.href} onClick={(event) => onOpen?.(order, event)} className={linkStyle}>
        {order.number}
      </a>
    );
  }
  if (onOpen) {
    return (
      <button type="button" onClick={(event) => onOpen(order, event)} className={linkStyle}>
        {order.number}
      </button>
    );
  }
  return <span className="font-medium text-foreground">{order.number}</span>;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS[status];
  return (
    <Badge variant={meta.variant} className={meta.tone}>
      <meta.Icon aria-hidden="true" />
      {meta.word}
    </Badge>
  );
}

function Customer({ order }: { order: RecentOrder }) {
  return (
    <Avatar aria-hidden="true">
      {order.customer.avatar ? <AvatarImage src={order.customer.avatar} alt="" /> : null}
      <AvatarFallback>{initialsOf(order.customer.name)}</AvatarFallback>
    </Avatar>
  );
}

/**
 * The latest orders as a dashboard widget: a title, a "View all" link and a
 * real table of the newest five to ten. Each row has the order number as a
 * link, the customer with avatar and email, a relative date, a tabular total
 * and a status badge with an icon and a word. When the card is narrow, as on
 * a phone, the table turns into stacked rows; an empty list explains that
 * orders will appear here, and a skeleton keeps the height while loading.
 */
export function RecentOrdersCard({
  orders,
  onOpen,
  viewAllHref,
  loading = false,
  currency = "USD",
  title = "Recent orders",
  description,
  now,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: RecentOrdersCardProps) {
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  // The stacked rows of a phone have less room, so they say "4 min. ago" where the table says "4 minutes ago".
  const relativeShort = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone });
  const full = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone });
  const nowMs = now === undefined ? Date.now() : toMs(now);
  const money = new Map<string, Intl.NumberFormat>();
  const total = (order: RecentOrder) => {
    const code = order.currency ?? currency;
    let format = money.get(code);
    if (!format) money.set(code, (format = new Intl.NumberFormat(locale, { style: "currency", currency: code })));
    return format.format(order.total);
  };
  const placed = (order: RecentOrder, short = false) => {
    const when = toMs(order.placedAt);
    return Number.isFinite(when) ? (
      <time dateTime={new Date(when).toISOString()} title={full.format(when)} className="whitespace-nowrap" suppressHydrationWarning>
        {relativeTime(when, nowMs, short ? relativeShort : relative, date)}
      </time>
    ) : null;
  };
  const placeholders = Array.from({ length: orders.length || 5 }, (_, index) => index);

  return (
    <Card data-slot="recent-orders-card" aria-busy={loading || undefined} className={cn("@container w-full gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="border-b border-border">
        <CardHeader className="items-center px-4 py-5 @sm:px-6">
          <CardTitle className="text-base tracking-[-0.01em]">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
          {viewAllHref ? (
            <CardAction className="self-center">
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <a href={viewAllHref}>
                  View all<span className="sr-only"> orders</span>
                  <IconArrowRight />
                </a>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
      </div>

      {loading ? (
        <>
          <p role="status" className="sr-only">
            Loading orders
          </p>
          <div aria-hidden="true" className="hidden @2xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 text-xs">Order</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Placed</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="pr-6 text-right text-xs">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholders.map((index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    <TableCell className="py-3 pl-6">
                      <Skeleton className="h-4 w-14" delay={index * 70} />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-full" delay={index * 70} />
                        <div className="grid gap-1.5">
                          <Skeleton className="h-4 w-28" delay={index * 70 + 40} />
                          <Skeleton className="h-3 w-36" delay={index * 70 + 80} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-4 w-20" delay={index * 70 + 40} />
                    </TableCell>
                    <TableCell className="py-3">
                      <Skeleton className="h-5 w-[4.5rem] rounded-full" delay={index * 70 + 80} />
                    </TableCell>
                    <TableCell className="py-3 pr-6">
                      <Skeleton className="ml-auto h-4 w-16" delay={index * 70 + 120} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul aria-hidden="true" className="divide-y divide-border @2xl:hidden">
            {placeholders.map((index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-4 @sm:px-6">
                <Skeleton className="size-9 shrink-0 rounded-full" delay={index * 70} />
                <div className="grid flex-1 gap-1.5">
                  <Skeleton className="h-4 w-28" delay={index * 70 + 40} />
                  <Skeleton className="h-3 w-24" delay={index * 70 + 80} />
                </div>
                <div className="grid justify-items-end gap-1.5">
                  <Skeleton className="h-5 w-14" delay={index * 70 + 40} />
                  <Skeleton className="h-5 w-16 rounded-full" delay={index * 70 + 80} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : orders.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <IconBag size={20} />
          </span>
          <p className="mt-4 text-sm font-medium">Orders will appear here</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">As soon as a customer checks out, the order shows up in this list.</p>
        </div>
      ) : (
        <>
          <div className="hidden @2xl:block">
            <Table>
              <TableCaption className="sr-only">{title}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="pl-6 text-xs">
                    Order
                  </TableHead>
                  <TableHead scope="col" className="text-xs">
                    Customer
                  </TableHead>
                  <TableHead scope="col" className="text-xs">
                    Placed
                  </TableHead>
                  <TableHead scope="col" className="text-xs">
                    Status
                  </TableHead>
                  <TableHead scope="col" className="pr-6 text-right text-xs">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="py-3 pl-6 tabular-nums">
                      <OrderNumber order={order} onOpen={onOpen} />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Customer order={order} />
                        {/* Truncating does not narrow a table cell, so the block is capped by what the card has left after the other columns: a long address ends in an ellipsis instead of pushing Total out of the card. */}
                        <div className="max-w-[calc(100cqw-32rem)] min-w-0">
                          <p title={order.customer.name} className="truncate font-medium">
                            {order.customer.name}
                          </p>
                          <p title={order.customer.email} className="truncate text-xs text-muted-foreground">
                            {order.customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 whitespace-nowrap text-muted-foreground">{placed(order)}</TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="py-3 pr-6 text-right font-medium tabular-nums">{total(order)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul aria-label={title} className="divide-y divide-border @2xl:hidden">
            {orders.map((order) => (
              <li key={order.id} className="flex items-center gap-3 px-4 py-4 @sm:px-6">
                <Customer order={order} />
                <div className="min-w-0 flex-1">
                  <p title={order.customer.name} className="truncate text-sm font-medium">
                    {order.customer.name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
                    <OrderNumber order={order} onOpen={onOpen} />
                    {placed(order, true)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <p className="text-sm font-medium tabular-nums">{total(order)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
