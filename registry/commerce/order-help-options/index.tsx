"use client";

import { useId, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconBan, IconCheck, IconClock, IconHelp, IconInfo, IconMessage, IconPackage, IconPin, IconReturn, IconTruck, IconXCircle } from "@rhs-ui/icons";
import { HELP_WORDS, dayKeyOf, helpActionsFor, type OrderHelpAction, type OrderHelpOrder, type OrderHelpStatus, type OrderHelpWords } from "@rhs-ui/commerce/order-help-options/help";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

export type { OrderHelpAction, OrderHelpOrder, OrderHelpStatus } from "@rhs-ui/commerce/order-help-options/help";

export interface OrderHelpLabels extends Partial<OrderHelpWords> {
  /** The heading. */
  title?: string;
  /** Before the order's number. */
  order?: string;
  /** The names of the five states, in the badge. */
  status?: Partial<Record<OrderHelpStatus, string>>;
  /** The sentence under the heading for each state: why the list looks the way it does. */
  lead?: Partial<Record<OrderHelpStatus, string>>;
  /** Added to the delivered sentence when the delivery day is known. `{date}`. */
  deliveredOn?: string;
  /** Added to the delivered sentence while a return can be started. `{date}`. */
  returnOpenLead?: string;
  /** Added to the delivered sentence once the window has closed. `{date}`. */
  returnClosedLead?: string;
  /** The title of the contact row. */
  contactTitle?: string;
  /** The contact button, when the contact has no label of its own. */
  contactLabel?: string;
  /** Names the list of actions for a screen reader. */
  actions?: string;
}

const WORDS = {
  ...HELP_WORDS,
  title: "Need help with this order?",
  order: "Order",
  status: { processing: "Processing", packed: "Packed", shipped: "On its way", delivered: "Delivered", cancelled: "Cancelled" },
  lead: {
    processing: "We are getting your order ready. You can still change the address or cancel it until it is packed.",
    packed: "Your order is packed and waiting for the courier. It can no longer be changed or cancelled.",
    shipped: "Your order is on its way. Follow it with Track, and return items once it has arrived.",
    delivered: "Your order has been delivered.",
    cancelled: "This order was cancelled. If something looks wrong, tell us below.",
  },
  deliveredOn: "Your order was delivered on {date}.",
  returnOpenLead: "You can return items until {date}.",
  returnClosedLead: "The return window closed on {date}.",
  contactTitle: "Something else?",
  contactLabel: "Contact us",
  actions: "What you can do with this order",
} satisfies Required<OrderHelpLabels>;

const STATUS = {
  processing: { icon: IconClock, variant: "outline" },
  packed: { icon: IconPackage, variant: "outline" },
  shipped: { icon: IconTruck, variant: "default" },
  delivered: { icon: IconCheck, variant: "secondary" },
  cancelled: { icon: IconXCircle, variant: "muted" },
} as const;

const ICONS: Record<string, ReactNode> = {
  track: <IconTruck />,
  "change-address": <IconPin />,
  cancel: <IconBan />,
  return: <IconReturn />,
  report: <IconAlertCircle />,
};

export interface OrderHelpOptionsProps extends Omit<ComponentProps<"section">, "children" | "title" | "onSelect"> {
  /** The order: its number, where it is, and the dates the actions depend on. */
  order: OrderHelpOrder;
  /** The actions, when you have worked them out yourself. Without them the block works them out from the status: track while it ships, change the address and cancel until it is packed, return from delivery until the window closes, report always. */
  actions?: readonly OrderHelpAction[];
  /** Called with the id of the action whose button was pressed. Actions with an `href` are links and do not call it. */
  onSelect?: (id: string) => void;
  /** The row at the end, for everything the list does not cover. */
  contact?: { href: string; label?: string; description?: string };
  /** The moment to measure the return window from, as an ISO date or date-time. Pass it from the server and the first render matches the browser's; without it the window counts as open until the browser's clock says otherwise. */
  now?: string;
  /** Locale for the dates. Always passed, so server and browser agree. */
  locale?: string;
  /** The time zone whose calendar days count: the shop's. A bare date such as "2026-11-14" is a calendar day and ignores it. */
  timeZone?: string;
  /** The heading's element: "h2" (the default) inside a page, "h1" when this is the page. */
  headingAs?: "h1" | "h2";
  /** The words, for another language. */
  labels?: OrderHelpLabels;
}

const noSubscription = (): (() => void) => () => undefined;

const writeDate = (value: string, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value) ? "UTC" : timeZone }).format(date);
};

/**
 * "Need help with this order?": the things a person can still do with one order, each with a line on what it does
 * and a button, and the ones they cannot do kept in the list, dimmed, with the reason and the date in words
 * ("Cancelling closes when the order is packed"); those buttons are aria-disabled rather than disabled, so a
 * keyboard lands on them and hears the reason. Where the order is leads the block as text, so people see why
 * the list looks the way it does. Track opens while it ships, changing the address and cancelling close when it
 * is packed, returns open at delivery and close with the window, and reporting a problem is always there. A
 * contact row at the end covers the rest. It answers "what can I still do?" before anyone opens a chat.
 */
export function OrderHelpOptions({ order, actions, onSelect, contact, now, locale = "en-US", timeZone = "UTC", headingAs: Heading = "h2", labels, className, ...props }: OrderHelpOptionsProps) {
  const words = { ...WORDS, ...labels, status: { ...WORDS.status, ...labels?.status }, lead: { ...WORDS.lead, ...labels?.lead } };
  const id = useId();
  // Today in the shop's time zone. The browser's clock is read after the page has loaded, so a cached page never claims a window is open or shut on a day it cannot know.
  const today = useSyncExternalStore(
    noSubscription,
    () => dayKeyOf(now ?? Date.now(), timeZone),
    () => (now === undefined ? null : dayKeyOf(now, timeZone)),
  );
  const date = (value: string) => writeDate(value, locale, timeZone, { day: "numeric", month: "long" });
  const list = actions ?? helpActionsFor(order, { today, date, words });
  const state = STATUS[order.status];

  const closes = order.returnUntil ? dayKeyOf(order.returnUntil, "UTC") : null;
  const delivered = order.deliveredAt ? words.deliveredOn.replace("{date}", writeDate(order.deliveredAt, locale, timeZone, { weekday: "long", day: "numeric", month: "long" })) : words.lead.delivered;
  const lead =
    order.status !== "delivered"
      ? words.lead[order.status]
      : [delivered, order.returnUntil ? (today === null || closes === null || today <= closes ? words.returnOpenLead : words.returnClosedLead).replace("{date}", date(order.returnUntil)) : null].filter(Boolean).join(" ");

  return (
    <section data-slot="order-help-options" aria-labelledby={`${id}-title`} className={cn("@container w-full min-w-0", className)} {...props}>
      <Card className="gap-0 overflow-hidden py-0">
        <header className="grid gap-3 px-5 py-5 @[34rem]:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Heading id={`${id}-title`} className="text-lg leading-snug font-semibold tracking-[-0.02em]">
              {words.title}
            </Heading>
            <p className="flex items-center gap-2.5 text-sm text-muted-foreground tabular-nums">
              {words.order} {order.number}
              <Badge variant={state.variant}>
                <state.icon />
                {words.status[order.status]}
              </Badge>
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p>
        </header>

        <Separator />
        <ul aria-label={words.actions}>
          {list.map((action, index) => {
            const reasonId = `${id}-${action.id}-reason`;
            const label = action.label ?? action.title;
            const solid = action.primary && action.available;
            return (
              <li key={action.id}>
                {index > 0 ? <Separator /> : null}
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-3 px-5 py-4 @[34rem]:grid-cols-[auto_minmax(0,1fr)_auto] @[34rem]:px-6 @[34rem]:py-5">
                  <span aria-hidden="true" className={cn("grid size-9 shrink-0 place-items-center rounded-lg border border-border [&_svg]:size-[18px]", action.available ? "bg-muted/60 text-foreground" : "bg-muted/30 text-muted-foreground")}>
                    {action.icon ?? ICONS[action.id] ?? <IconHelp />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{action.description}</p>
                    {!action.available && action.reason ? (
                      <p id={reasonId} className="mt-2 flex items-start gap-2 text-xs leading-relaxed font-medium text-foreground">
                        <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">{action.reason}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="col-start-2 @[34rem]:col-start-3 @[34rem]:row-start-1">
                    {action.available && action.href ? (
                      <Button asChild size="sm" variant={solid ? "default" : "outline"} className="@max-[34rem]:w-full">
                        <a href={action.href}>{label}</a>
                      </Button>
                    ) : (
                      // aria-disabled, not disabled: the button stays in the tab order, so Tab lands on it and the reason under it is read out. It looks disabled and does nothing when pressed.
                      <Button
                        type="button"
                        size="sm"
                        variant={solid ? "default" : "outline"}
                        aria-disabled={!action.available || undefined}
                        aria-describedby={!action.available && action.reason ? reasonId : undefined}
                        onClick={action.available ? () => onSelect?.(action.id) : undefined}
                        className="aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:focus-visible:ring-ring aria-disabled:active:translate-y-0! @max-[34rem]:w-full"
                      >
                        {label}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {contact ? (
          <>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-muted/40 px-5 py-4 @[34rem]:px-6">
              <div className="flex min-w-0 max-w-md items-start gap-3">
                <IconMessage aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{words.contactTitle}</p>
                  {contact.description ? <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{contact.description}</p> : null}
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <a href={contact.href}>{contact.label ?? words.contactLabel}</a>
              </Button>
            </div>
          </>
        ) : null}
      </Card>
    </section>
  );
}
