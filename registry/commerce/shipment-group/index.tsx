import { useId, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCalendar, IconCheck, IconClock, IconPackage, IconTruck, IconWarehouse, IconXCircle } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { writeDate, writeWindow } from "@rhs-ui/commerce/shipment-group/shipment";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** Where a shipment is in its life. */
export type ShipmentStatus = "pending" | "preparing" | "shipped" | "out-for-delivery" | "delivered" | "delayed" | "cancelled";

/** A normal shipment, one that ships on a set day because it is not out yet, or one waiting for stock. */
export type ShipmentKind = "standard" | "preorder" | "backorder";

export interface ShipmentMethod {
  /** The delivery method as the customer chose it: "Standard delivery", "Pick-up point". */
  name: string;
  /** What it costs, in minor units. Zero is written "Free". */
  price: number;
  /** The first day it can arrive, as an ISO date: "2026-10-23". */
  from?: string;
  /** The last day it can arrive. Leave it out for a single day. */
  to?: string;
}

export interface Shipment {
  /** Identity of the shipment, for your list's key. */
  id: string;
  /** Where it ships from: the warehouse, or the seller. "Kestrel Outdoor, Rotterdam". */
  origin: string;
  /** Defaults to "standard". A pre-order or a backorder is labelled in words and says when it ships. */
  kind?: ShipmentKind;
  /** For a pre-order or a backorder: the day it ships, as an ISO date. */
  shipsOn?: string;
  /** How it travels, what it costs and when it arrives. */
  method: ShipmentMethod;
}

export interface ShipmentGroupLabels {
  /** The heading. `{index}` and `{total}`. */
  shipment?: string;
  /** The name of the group when there is only one shipment and so no heading. */
  single?: string;
  /** Under the heading. `{origin}`. */
  from?: string;
  /** Written in place of a delivery cost of zero. */
  free?: string;
  /** Joins the two ends of an arrival window. `{from}` and `{to}`. */
  window?: string;
  /** In front of the arrival. `{when}`. */
  arrives?: string;
  /** In front of the day it came, once the shipment is delivered. `{when}`. */
  arrived?: string;
  /** When the arrival is not known yet. */
  arrivesLater?: string;
  /** Written in place of the arrival on a cancelled shipment. */
  cancelledNote?: string;
  /** The badge on a pre-order. */
  preorder?: string;
  /** The badge on a backorder. */
  backorder?: string;
  /** What a pre-order says about when it ships. `{date}`. */
  shipsOn?: string;
  /** What a backorder says about when it ships. `{date}`. */
  backorderShipsOn?: string;
  /** The Change button. */
  change?: string;
  /** The name of the Change button for a screen reader. `{shipment}` is the heading. */
  changeName?: string;
  /** The badge for each status. */
  statuses?: Partial<Record<ShipmentStatus, string>>;
}

const STATUSES = {
  pending: "Not shipped yet",
  preparing: "Preparing",
  shipped: "Shipped",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  cancelled: "Cancelled",
} satisfies Record<ShipmentStatus, string>;

const WORDS = {
  shipment: "Shipment {index} of {total}",
  single: "Shipment",
  from: "Ships from {origin}",
  free: "Free",
  window: "{from} to {to}",
  arrives: "Arrives {when}",
  arrived: "Arrived {when}",
  arrivesLater: "The delivery date is confirmed when it ships",
  cancelledNote: "Cancelled, nothing is on its way",
  preorder: "Pre-order",
  backorder: "Backorder",
  shipsOn: "Ships on {date}",
  backorderShipsOn: "Ships around {date}, once it is back in stock",
  change: "Change",
  changeName: "Change the delivery method of {shipment}",
};

const LOOK = {
  pending: { variant: "outline", icon: IconClock },
  preparing: { variant: "outline", icon: IconPackage },
  shipped: { variant: "default", icon: IconTruck },
  "out-for-delivery": { variant: "default", icon: IconTruck },
  delivered: { variant: "secondary", icon: IconCheck },
  delayed: { variant: "outline", icon: IconAlertCircle },
  cancelled: { variant: "muted", icon: IconXCircle },
} as const;

/** From these the delivery method can no longer change: the parcel is on its way, has arrived or is cancelled. */
const LOCKED: readonly ShipmentStatus[] = ["shipped", "out-for-delivery", "delivered", "cancelled"];

export interface ShipmentGroupProps extends Omit<ComponentProps<"section">, "children"> {
  /** The shipment: where it ships from, the delivery method with its window and cost, and whether it is a pre-order. */
  shipment: Shipment;
  /** Which shipment of the order this is, counting from 1. Together with `total` it writes the heading. */
  index?: number;
  /** How many shipments the order has. With one, the group drops its heading and shows only the delivery and the lines. */
  total?: number;
  /** Where the shipment is: it is written in the badge, and it decides what the card says. A delivered shipment says "Arrived" and a cancelled one says nothing is on its way and mutes its lines. */
  status?: ShipmentStatus;
  /** Called when Change is pressed. Without it, and without `changeHref`, there is no Change button. */
  onChangeMethod?: () => void;
  /** Where Change goes when that is a page: the button is then a link. */
  changeHref?: string;
  /** Whether the delivery method can still be changed, and so whether Change is offered. By default it can until the parcel has shipped: shipped, out for delivery, delivered and cancelled shipments leave Change out. Pass it to decide yourself. */
  canChange?: boolean;
  /** The lines in this parcel. Give each one its own vertical padding: the group draws the rules between them. */
  children?: ReactNode;
  /** ISO 4217 code of the delivery cost. */
  currency?: string;
  /** Always pass your application locale, so dates and costs are written the same on the server and in the browser. */
  locale?: string;
  /** The time zone date-times are written in. A bare date such as "2026-10-23" is a calendar day and ignores it. */
  timeZone?: string;
  /** The words, for another language. */
  labels?: ShipmentGroupLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * Items that travel together: a heading ("Shipment 1 of 2"), where the parcel ships from, the delivery method with its
 * arrival window and cost, a status badge that follows the shipment through its life, and the lines inside, which
 * you pass as children. What the card says follows the status: a delivered parcel says "Arrived", a cancelled one says
 * nothing is on its way and mutes its price and lines, and Change is only offered while the method can still change.
 * A pre-order or a backorder is labelled in words and, until it leaves, says the day it ships and that the arrival is
 * confirmed then. The group is a labelled region, so a screen reader announces which parcel it is in, and an order
 * with a single shipment drops the heading and shows only the delivery and the lines.
 */
export function ShipmentGroup({ shipment, index = 1, total = 1, status, onChangeMethod, changeHref, canChange, children, currency = "EUR", locale = "en-US", timeZone = "UTC", labels, className, ...props }: ShipmentGroupProps) {
  const words = { ...WORDS, ...labels };
  const statuses = { ...STATUSES, ...labels?.statuses };
  const id = useId();
  const many = total > 1;
  const kind = shipment.kind ?? "standard";
  const heading = fill(words.shipment, { index: String(index), total: String(total) });

  const when = writeWindow(shipment.method.from, shipment.method.to, locale, words.window, timeZone);
  const shipsOn = shipment.shipsOn === undefined ? undefined : writeDate(shipment.shipsOn, locale, { day: "numeric", month: "long", year: "numeric" }, timeZone);
  const delivered = status === "delivered";
  const cancelled = status === "cancelled";
  // A pre-order or a backorder says when it ships only while it is still waiting: once it has left, arrived or been cancelled, that day is behind it.
  const waiting = kind !== "standard" && status !== "shipped" && status !== "out-for-delivery" && !delivered && !cancelled;
  const cost = shipment.method.price > 0 ? formatMoney({ amount: shipment.method.price, currency }, locale) : words.free;

  const look = status ? LOOK[status] : undefined;
  const badge =
    status && look ? (
      <Badge variant={look.variant} className={cn("shrink-0 gap-1", status === "delayed" && "border-foreground/50 font-semibold")}>
        <look.icon />
        {statuses[status]}
      </Badge>
    ) : null;

  const changeName = fill(words.changeName, { shipment: many ? heading : words.single });
  // Its text lines up with the price above it, and it is no taller than the line of text it sits beside.
  const changeClass = "-my-1.5 -mr-3 ml-auto shrink-0";
  const offerChange = canChange ?? !(status !== undefined && LOCKED.includes(status));
  const change =
    offerChange && (onChangeMethod || changeHref) ? (
      changeHref ? (
        <Button asChild variant="ghost" size="sm" className={changeClass}>
          <a href={changeHref} aria-label={changeName} onClick={onChangeMethod}>
            {words.change}
          </a>
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="sm" className={changeClass} aria-label={changeName} onClick={onChangeMethod}>
          {words.change}
        </Button>
      )
    ) : null;

  const kindBadge =
    kind === "standard" ? null : (
      <Badge variant="outline" className="shrink-0 gap-1">
        <IconCalendar />
        {kind === "preorder" ? words.preorder : words.backorder}
      </Badge>
    );

  // What the second line says: nothing is coming once it is cancelled, the day it came once it is delivered, and otherwise when it ships and arrives.
  const arrival: ReactNode = cancelled ? (
    words.cancelledNote
  ) : waiting ? (
    <>
      {shipsOn ? fill(kind === "preorder" ? words.shipsOn : words.backorderShipsOn, { date: shipsOn }) : kind === "preorder" ? words.preorder : words.backorder}
      <span className="block text-muted-foreground">{when ? fill(words.arrives, { when }) : words.arrivesLater}</span>
    </>
  ) : when ? (
    fill(delivered ? words.arrived : words.arrives, { when })
  ) : delivered ? null : (
    words.arrivesLater
  );

  /** How it travels: the method and its price on one line, the arrival and the Change action on the next. Neither row wraps, so the price and Change keep the right edge. */
  const delivery = (inline: ReactNode) => (
    <div className="flex items-start gap-3.5 px-5 py-4">
      <span aria-hidden="true" className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background", cancelled ? "text-muted-foreground" : "text-foreground")}>
        {waiting ? <IconCalendar className="size-[1.125rem]" /> : <IconTruck className="size-[1.125rem]" />}
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <div className={cn("flex items-start justify-between gap-3", cancelled && "text-muted-foreground")}>
          <p className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[0.9375rem] leading-6 font-medium">
            {shipment.method.name}
            {inline}
          </p>
          <p className="shrink-0 text-[0.9375rem] leading-6 font-medium tabular-nums">{cost}</p>
        </div>
        {arrival || change ? (
          <div className="flex items-start justify-between gap-3">
            {arrival ? <p className={cn("min-w-0 flex-1 text-sm leading-snug text-pretty", cancelled && "text-muted-foreground")}>{arrival}</p> : null}
            {change}
          </div>
        ) : null}
      </div>
    </div>
  );

  // A cancelled parcel keeps its lines, so the customer can see what was cancelled, but quietly: grey words and a dimmed picture.
  const lines = children ? (
    <div data-slot="shipment-group-lines" className={cn("divide-y divide-border border-t border-border px-5", cancelled && "text-muted-foreground [&_img]:opacity-60 [&_img]:grayscale")}>
      {children}
    </div>
  ) : null;

  const surface = cn("overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className);

  if (!many) {
    return (
      <section data-slot="shipment-group" data-single="" data-status={status} aria-label={words.single} className={surface} {...props}>
        {delivery(
          <>
            {kindBadge}
            {badge}
          </>,
        )}
        {lines}
      </section>
    );
  }

  return (
    <section data-slot="shipment-group" data-status={status} data-kind={kind} aria-labelledby={`${id}-heading`} className={surface} {...props}>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 border-b border-border bg-muted/40 px-5 py-3.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h3 id={`${id}-heading`} className="text-sm leading-5 font-semibold tracking-[-0.01em]">
            {heading}
          </h3>
          {kindBadge}
        </div>
        {badge}
        <p className="col-span-2 flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
          <IconWarehouse aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span className="min-w-0">{fill(words.from, { origin: shipment.origin })}</span>
        </p>
      </header>
      {delivery(null)}
      {lines}
    </section>
  );
}
