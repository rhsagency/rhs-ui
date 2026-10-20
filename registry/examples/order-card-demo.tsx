"use client";

import { useState, type ReactNode } from "react";

import { OrderCard, OrderCardSkeleton, type OrderAction, type OrderCardItem, type OrderCardOrder } from "@rhs-ui/commerce/order-card";

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

const SHIRT: OrderCardItem = {
  id: "shirt",
  name: "Linen shirt",
  image: pic("#e9e5dc", "<path d='M42 26l-22 12 8 18 12-6v46h48V50l12 6 8-18-22-12c-4 8-10 12-18 12s-14-4-18-12z' fill='#9a8f7a'/>"),
};
const SCARF: OrderCardItem = {
  id: "scarf",
  name: "Merino scarf",
  image: pic("#dde1e7", "<rect x='36' y='18' width='26' height='84' rx='9' fill='#3f4859'/><rect x='58' y='30' width='26' height='72' rx='9' fill='#566074'/>"),
};
const MUG: OrderCardItem = {
  id: "mug",
  name: "Stoneware mug",
  image: pic("#efe8df", "<path d='M32 42h46v34a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16z' fill='#c4694a'/><path d='M78 50h6a11 11 0 0 1 0 22h-6' fill='none' stroke='#c4694a' stroke-width='6'/>"),
};
const TOTE: OrderCardItem = {
  id: "tote",
  name: "Waxed canvas tote",
  image: pic("#e3e6dc", "<path d='M38 48h44l6 52H32z' fill='#6c7a55'/><path d='M46 48c0-22 28-22 28 0' fill='none' stroke='#55613f' stroke-width='5'/>"),
};
const CANDLE: OrderCardItem = {
  id: "candle",
  name: "Beeswax candle",
  image: pic("#efe9dc", "<rect x='40' y='44' width='14' height='56' rx='3' fill='#d9b45f'/><rect x='64' y='56' width='14' height='44' rx='3' fill='#c9a24b'/><path d='M47 33c-3 3-3 6 0 8 3-2 3-5 0-8zM71 45c-3 3-3 6 0 8 3-2 3-5 0-8z' fill='#e08a3c'/>"),
};
const NOTEBOOK: OrderCardItem = {
  id: "notebook",
  name: "Sewn notebook",
  image: pic("#e6e3ee", "<rect x='34' y='24' width='52' height='72' rx='5' fill='#4b4f6b'/><rect x='40' y='24' width='5' height='72' fill='#3a3d55'/>"),
};

const SHIPPED: OrderCardOrder = { id: "20431", number: "NW-20431", placedAt: "2026-10-18T14:20:00Z", status: "shipped", items: [SHIRT, SCARF, MUG], total: 15560, deliveryDate: "2026-10-22" };
const DELIVERED: OrderCardOrder = {
  id: "20418",
  number: "NW-20418",
  placedAt: "2026-10-12T09:41:00Z",
  status: "delivered",
  items: [SHIRT, SCARF, MUG, TOTE, CANDLE, NOTEBOOK],
  total: 18450,
  deliveryDate: "2026-10-14",
  actions: ["reorder", "return"],
};
const CANCELLED: OrderCardOrder = { id: "20397", number: "NW-20397", placedAt: "2026-10-03T19:12:00Z", status: "cancelled", items: [CANDLE, NOTEBOOK], total: 4000 };
const PROCESSING: OrderCardOrder = { id: "20440", number: "NW-20440", placedAt: "2026-10-20T08:05:00Z", status: "processing", items: [TOTE, NOTEBOOK], total: 5600, deliveryDate: "2026-10-23" };
const RECENT: OrderCardOrder = { id: "20426", number: "NW-20426", placedAt: "2026-10-16T11:30:00Z", status: "delivered", items: [MUG, CANDLE, SCARF], total: 9400, deliveryDate: "2026-10-19" };
const ALL_ACTIONS: OrderCardOrder = {
  id: "20411",
  number: "NW-20411",
  placedAt: "2026-10-09T16:48:00Z",
  status: "delivered",
  items: [SHIRT, NOTEBOOK, TOTE, CANDLE],
  total: 18450,
  deliveryDate: "2026-10-12",
  actions: ["track", "return", "reorder"],
};

function Group({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("Press a button on a card: the card itself links to the order.");
  const act = (action: OrderAction, order: OrderCardOrder) => setLast(`${action === "track" ? "Track" : action === "return" ? "Return" : "Reorder"} pressed on ${order.number}.`);
  const shared = { href: "#", onAction: act, currency: "EUR", locale: "en-GB" } as const;

  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-10">
      <Group caption="My orders: the action that fits each status (Track is a link, the rest are buttons)">
        <OrderCard order={SHIPPED} {...shared} actionHrefs={{ track: "#carrier" }} />
        <OrderCard order={DELIVERED} {...shared} />
        <OrderCard order={CANCELLED} {...shared} />
        <p role="status" className="text-xs text-muted-foreground">
          {last}
        </p>
      </Group>
      <Group caption="Compact, for a dashboard: with three actions, the last one wraps when the row is narrow">
        <OrderCard compact order={PROCESSING} {...shared} />
        <OrderCard compact order={RECENT} {...shared} />
        <OrderCard compact order={ALL_ACTIONS} {...shared} />
      </Group>
      <Group caption="While the list loads">
        <OrderCardSkeleton />
      </Group>
    </div>
  );
}
