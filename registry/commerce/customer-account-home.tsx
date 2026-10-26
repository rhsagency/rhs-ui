import type { ComponentProps, ElementType, ReactNode } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconArrowRight, IconBag, IconCheck, IconClock, IconPackage, IconTruck, IconXCircle } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

export type AccountOrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export interface AccountOrderItem {
  /** Identity of the product, for your list's key. */
  id: string;
  /** Names the thumbnail for a screen reader. */
  name: string;
  /** Picture source. Without one the tile shows a parcel. */
  image?: string;
}

export interface AccountLatestOrder {
  /** The number the customer knows: "NW-20418". */
  number: string;
  /** Where the order is. It picks the badge and the sentence. */
  status: AccountOrderStatus;
  /** When it was placed, as an ISO date or date-time. */
  placedAt: string;
  /** The products in it. Three thumbnails are drawn, the rest become "+2". */
  items: readonly AccountOrderItem[];
  /** How many products the order holds when `items` carries only the first few. Defaults to `items.length`. */
  itemCount?: number;
  /** The order total in minor units. */
  total?: number;
  /** When it arrives or arrived, as an ISO date. Written out in words. */
  deliveryDate?: string;
  /** The order page. */
  href?: string;
  /** Where the carrier's tracking is. The Track link appears while the order is on its way. */
  trackHref?: string;
}

export interface AccountLink {
  /** "Orders", "Addresses", "Returns". */
  label: string;
  /** Where the tile goes. Rendered through `linkAs`, so a router's Link gets it as `href`. */
  href: string;
  /** A number to show large: how many orders, addresses, open returns. Zero is shown too. */
  count?: number;
  /** A line under the label: what is behind the link, or its state ("2 cards saved", "Verify your email"). */
  hint?: string;
  /** A small icon for the link, drawn at 18px and decorative. */
  icon?: ReactNode;
}

export interface CustomerAccountHomeLabels {
  /** The greeting. `{name}`. */
  welcome?: string;
  /** Under the greeting. `{date}` is the month and year. */
  memberSince?: string;
  /** The small title of the latest-order card. */
  latestOrder?: string;
  /** Before an order's number. */
  order?: string;
  /** The track link. */
  track?: string;
  /** The link to the order page, when it is not on its way. */
  viewOrder?: string;
  /** "Placed {date}". */
  placed?: string;
  /** Said to a screen reader for the "+2" tile. `{count}`: "and 2 more". */
  more?: string;
  /** One item. `{count}`. */
  itemOne?: string;
  /** Several items. `{count}`. */
  itemOther?: string;
  /** The names of the four states, in the badge. */
  status?: Partial<Record<AccountOrderStatus, string>>;
  /** The sentence for a delivered order that has a date. `{date}`: "Delivered on Thursday 29 October". Without a date the status name is used. */
  delivered?: string;
  /** The sentence for an order on its way that has an arrival date. `{date}`: "Arriving Thursday 29 October". */
  arriving?: string;
  /** The sentence for an order on its way that has no date. */
  onItsWay?: string;
  /** The sentence for an order being prepared that has an expected date. `{date}`: "Expected Friday 30 October". */
  expected?: string;
  /** The sentence for an order being prepared that has no date. */
  preparing?: string;
  /** The sentence for a cancelled order. */
  cancelled?: string;
  /** The empty card's title. */
  noOrders?: string;
  /** Under it. */
  noOrdersHint?: string;
  /** The empty card's action. */
  startShopping?: string;
  /** Names the list of links for a screen reader. */
  account?: string;
}

const WORDS = {
  welcome: "Welcome back, {name}",
  memberSince: "Member since {date}",
  latestOrder: "Latest order",
  order: "Order",
  track: "Track order",
  viewOrder: "View order",
  placed: "Placed {date}",
  more: "and {count} more",
  itemOne: "{count} item",
  itemOther: "{count} items",
  status: { processing: "Processing", shipped: "On its way", delivered: "Delivered", cancelled: "Cancelled" },
  delivered: "Delivered on {date}",
  arriving: "Arriving {date}",
  onItsWay: "On its way to you",
  expected: "Expected {date}",
  preparing: "We are getting it ready",
  cancelled: "This order was cancelled",
  noOrders: "No orders yet",
  noOrdersHint: "When you place your first order it shows up here, with where it is and when it arrives.",
  startShopping: "Start shopping",
  account: "Your account",
} satisfies Required<CustomerAccountHomeLabels>;

const STATUS = {
  processing: { icon: IconClock, variant: "outline" },
  shipped: { icon: IconTruck, variant: "default" },
  delivered: { icon: IconCheck, variant: "secondary" },
  cancelled: { icon: IconXCircle, variant: "muted" },
} as const;

export interface CustomerAccountHomeProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The customer's first name, for the greeting. */
  name: string;
  /** When the account was made, as an ISO date: "2024-03-14". Shown as the month and the year. */
  memberSince?: string;
  /** The most recent order. Without it the card becomes "No orders yet" with a way to start shopping, so a new account never meets a hole. */
  latestOrder?: AccountLatestOrder;
  /** Where "Start shopping" goes when there is no order. */
  shopHref?: string;
  /** The links of the account area, as a grid of tiles: orders, addresses, returns, payment methods, help. */
  links: readonly AccountLink[];
  /** A line under the grid for a nudge or a loyalty note: "Verify your email to get order updates", with its button. */
  nudge?: ReactNode;
  /** ISO 4217 code for the order total. */
  currency?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Locale for the dates and the amount. Always passed, so server and browser agree. */
  locale?: string;
  /** IANA time zone the date-times are read in. A bare date such as "2026-10-15" is a calendar day and ignores it. */
  timeZone?: string;
  /** The greeting's element: "h1" (the default) when this is the page, "h2" inside a page that has one. */
  headingAs?: "h1" | "h2";
  /** Draws a thumbnail: plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: { src: string; alt: string }, className: string) => ReactNode;
  /** The words, for another language. */
  labels?: CustomerAccountHomeLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A date or date-time in words. A bare date is a calendar day, so it reads the same in every time zone. */
function writeDate(value: string, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? "UTC" : timeZone }).format(date);
}

function DefaultImage(image: { src: string; alt: string }, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className={className} />;
}

/**
 * The front door of "My account": a greeting with the member's name and since when, the latest order with its
 * status in words, up to three thumbnails and a Track link while it is on its way, and a grid of links with a
 * number or a line each, so people see how many orders and addresses they have before they open one. A slot
 * under the grid holds a nudge such as a verification reminder. Without any order the latest-order card
 * becomes "No orders yet" with a way to start shopping. It gives the account area a start page instead of
 * dropping people on a list.
 */
export function CustomerAccountHome({
  name,
  memberSince,
  latestOrder,
  shopHref,
  links,
  nudge,
  currency = "EUR",
  linkAs: Link = "a",
  locale = "en-US",
  timeZone = "UTC",
  headingAs: Heading = "h1",
  renderImage = DefaultImage,
  labels,
  className,
  ...props
}: CustomerAccountHomeProps) {
  const words = { ...WORDS, ...labels, status: { ...WORDS.status, ...labels?.status } };
  const numbers = new Intl.NumberFormat(locale);
  const Sub = Heading === "h1" ? "h2" : "h3";
  const since = memberSince ? writeDate(memberSince, locale, timeZone, { month: "long", year: "numeric" }) : null;

  let order: ReactNode = null;
  if (latestOrder) {
    const state = STATUS[latestOrder.status];
    const count = latestOrder.itemCount ?? latestOrder.items.length;
    const shown = latestOrder.items.slice(0, 3);
    const more = Math.max(0, count - shown.length);
    const day = latestOrder.deliveryDate ? writeDate(latestOrder.deliveryDate, locale, timeZone, { weekday: "long", day: "numeric", month: "long" }) : null;
    const sentence =
      latestOrder.status === "delivered"
        ? day
          ? fill(words.delivered, { date: day })
          : words.status.delivered
        : latestOrder.status === "shipped"
          ? day
            ? fill(words.arriving, { date: day })
            : words.onItsWay
          : latestOrder.status === "processing"
            ? day
              ? fill(words.expected, { date: day })
              : words.preparing
            : words.cancelled;
    const placed = fill(words.placed, { date: writeDate(latestOrder.placedAt, locale, timeZone, { day: "numeric", month: "long", year: "numeric" }) });
    const meta = [placed, fill(count === 1 ? words.itemOne : words.itemOther, { count: numbers.format(count) }), latestOrder.total !== undefined ? formatMoney({ amount: latestOrder.total, currency }, locale) : null].filter(Boolean);
    const tile = "overflow-hidden rounded-lg border border-border bg-muted";
    const cancelled = latestOrder.status === "cancelled";
    order = (
      <Card className="gap-0 p-0" data-status={latestOrder.status}>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 sm:px-6">
          <Sub className="text-sm font-medium">{words.latestOrder}</Sub>
          <Badge variant={state.variant}>
            <state.icon />
            {words.status[latestOrder.status]}
          </Badge>
        </div>
        <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6">
          <ul className={cn("flex min-w-0 items-center gap-2", cancelled && "opacity-60 grayscale")}>
            {shown.map((item) => (
              <li key={item.id} className="w-14 min-w-0 shrink sm:w-16">
                <AspectRatio ratio={1} className={cn(tile, "grid place-items-center")}>
                  {item.image ? (
                    renderImage({ src: item.image, alt: item.name }, "size-full object-cover")
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <IconPackage aria-hidden="true" className="size-5" />
                      <span className="sr-only">{item.name}</span>
                    </span>
                  )}
                </AspectRatio>
              </li>
            ))}
            {more > 0 ? (
              <li className="w-14 min-w-0 shrink sm:w-16">
                <AspectRatio ratio={1} className={cn(tile, "grid place-items-center text-sm font-medium text-muted-foreground tabular-nums")}>
                  <span aria-hidden="true">+{numbers.format(more)}</span>
                  <span className="sr-only">{fill(words.more, { count: numbers.format(more) })}</span>
                </AspectRatio>
              </li>
            ) : null}
          </ul>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-[-0.01em] tabular-nums">
              {latestOrder.href ? (
                <Link href={latestOrder.href} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {words.order} {latestOrder.number}
                </Link>
              ) : (
                <>
                  {words.order} {latestOrder.number}
                </>
              )}
            </p>
            {/* Each fact is one unbreakable piece and carries its own dot in the padding on its left. The row is pulled left by that padding and clipped, so the dot of whatever starts a line is cut off and a line never begins with one. */}
            <p className="mt-0.5 overflow-hidden text-sm text-muted-foreground tabular-nums">
              <span className="-ml-3 flex flex-wrap">
                {meta.map((part, index) => (
                  <span key={part} className="relative pl-3 whitespace-nowrap">
                    {index > 0 ? (
                      <span aria-hidden="true" className="absolute left-0 w-3 text-center">
                        ·
                      </span>
                    ) : null}
                    {part}
                  </span>
                ))}
              </span>
            </p>
            <p className={cn("mt-2 text-sm font-medium", cancelled && "text-muted-foreground")}>{sentence}</p>
          </div>
          {latestOrder.status === "shipped" && latestOrder.trackHref ? (
            <Button asChild>
              <Link href={latestOrder.trackHref}>
                <IconTruck />
                {words.track}
              </Link>
            </Button>
          ) : latestOrder.href ? (
            <Button asChild variant="outline">
              <Link href={latestOrder.href}>
                {words.viewOrder}
                <IconArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </Card>
    );
  } else {
    order = (
      <>
        <Sub className="sr-only">{words.latestOrder}</Sub>
        <EmptyState icon={<IconBag className="size-6" />} title={words.noOrders} description={words.noOrdersHint} className="bg-card py-10">
          {shopHref ? (
            <Button asChild>
              <Link href={shopHref}>{words.startShopping}</Link>
            </Button>
          ) : null}
        </EmptyState>
      </>
    );
  }

  return (
    <section data-slot="customer-account-home" className={cn("py-10 sm:py-14", className)} {...props}>
      <header>
        <Heading className="text-3xl leading-[1.1] font-medium tracking-[-.045em] text-balance sm:text-5xl">{fill(words.welcome, { name })}</Heading>
        {since ? <p className="mt-3 text-base text-muted-foreground">{fill(words.memberSince, { date: since })}</p> : null}
      </header>

      <div className="mt-8 sm:mt-10">{order}</div>

      <nav aria-label={words.account} className="mt-6">
        <ul className="flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={`${link.label}-${link.href}`} className="flex min-w-0 grow basis-[9.5rem]">
              <Link
                href={link.href}
                className="group/link flex min-w-0 flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-[border-color,background-color] duration-150 outline-none hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                <span className="flex items-start justify-between gap-3">
                  {link.icon ? (
                    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/60 text-foreground [&_svg]:size-[18px]">
                      {link.icon}
                    </span>
                  ) : (
                    <span />
                  )}
                  <IconArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:text-foreground motion-reduce:transition-none" />
                </span>
                <span className="flex min-h-5 items-center justify-between gap-3">
                  <span className="text-sm font-medium">{link.label}</span>
                  {link.count !== undefined ? <span className={cn("text-xl leading-none font-semibold tracking-[-0.02em] tabular-nums", link.count === 0 && "text-muted-foreground")}>{numbers.format(link.count)}</span> : null}
                </span>
                {link.hint ? <span className="-mt-2.5 text-xs leading-relaxed text-muted-foreground">{link.hint}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {nudge ? <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm">{nudge}</div> : null}
    </section>
  );
}
