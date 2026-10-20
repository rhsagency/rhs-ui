import type { ReactNode } from "react";

import { OrderLine, type OrderLineItem } from "@rhs-ui/commerce/order-line";

const pic = (bg: string, body: string) => ({
  src: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`),
});

const SHIRT: OrderLineItem = {
  id: "shirt",
  name: "Linen shirt",
  href: "#",
  variant: "Size M · Stone",
  image: pic("#e9e5dc", "<path d='M42 26l-22 12 8 18 12-6v46h48V50l12 6 8-18-22-12c-4 8-10 12-18 12s-14-4-18-12z' fill='#9a8f7a'/><path d='M60 38v68' stroke='#867b66' stroke-width='2'/>"),
  quantity: 2,
  unitAmount: 2400,
};

const SCARF: OrderLineItem = {
  id: "scarf",
  name: "Merino scarf",
  href: "#",
  variant: "Ink",
  image: pic("#dde1e7", "<rect x='36' y='18' width='26' height='84' rx='9' fill='#3f4859'/><rect x='58' y='30' width='26' height='72' rx='9' fill='#566074'/><path d='M40 96v10M47 96v10M54 96v10M62 96v10M69 96v10M76 96v10' stroke='#3f4859' stroke-width='2.5' stroke-linecap='round'/>"),
  quantity: 1,
  unitAmount: 5900,
  compareAtAmount: 7900,
};

const MUG: OrderLineItem = {
  id: "mug",
  name: "Stoneware mug",
  href: "#",
  variant: "Set of 2 · Clay",
  image: pic("#efe8df", "<path d='M32 42h46v34a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16z' fill='#c4694a'/><path d='M78 50h6a11 11 0 0 1 0 22h-6' fill='none' stroke='#c4694a' stroke-width='6'/><ellipse cx='55' cy='42' rx='23' ry='5' fill='#a5533a'/>"),
  quantity: 3,
  unitAmount: 1800,
  discount: { label: "Autumn offer, 10% off", amount: 540 },
};

const TOTE: OrderLineItem = {
  id: "tote",
  name: "Waxed canvas tote",
  href: "#",
  variant: "Olive",
  image: pic("#e3e6dc", "<path d='M38 48h44l6 52H32z' fill='#6c7a55'/><path d='M46 48c0-22 28-22 28 0' fill='none' stroke='#55613f' stroke-width='5'/>"),
  quantity: 1,
  unitAmount: 4200,
};

const CANDLE: OrderLineItem = {
  id: "candle",
  name: "Beeswax candle",
  href: "#",
  variant: "Pair, 24 cm",
  image: pic("#efe9dc", "<rect x='40' y='44' width='14' height='56' rx='3' fill='#d9b45f'/><rect x='64' y='56' width='14' height='44' rx='3' fill='#c9a24b'/><path d='M47 44v-8M71 56v-8' stroke='#5b4a2a' stroke-width='2' stroke-linecap='round'/><path d='M47 33c-3 3-3 6 0 8 3-2 3-5 0-8zM71 45c-3 3-3 6 0 8 3-2 3-5 0-8z' fill='#e08a3c'/>"),
  quantity: 1,
  unitAmount: 2600,
};

const NOTEBOOK: OrderLineItem = {
  id: "notebook",
  name: "Sewn notebook",
  variant: "A5, dotted",
  image: pic("#e6e3ee", "<rect x='34' y='24' width='52' height='72' rx='5' fill='#4b4f6b'/><rect x='40' y='24' width='5' height='72' fill='#3a3d55'/><rect x='52' y='38' width='24' height='4' rx='2' fill='#c9cce0'/>"),
  quantity: 1,
  unitAmount: 1400,
};

function Panel({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card px-4 shadow-xs sm:px-5">{children}</ul>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-xl grid-cols-[minmax(0,1fr)] gap-9">
      <Panel caption="An order that went out in parts: a markdown, a line discount, a return and a cancellation">
        <OrderLine line={SHIRT} status="shipped" currency="EUR" locale="en-GB" />
        <OrderLine line={SCARF} status="shipped" currency="EUR" locale="en-GB" />
        <OrderLine line={MUG} status="processing" currency="EUR" locale="en-GB" />
        <OrderLine line={TOTE} status="returned" currency="EUR" locale="en-GB" />
        <OrderLine line={CANDLE} status="cancelled" currency="EUR" locale="en-GB" />
      </Panel>
      <Panel caption="Compact, for dense lists and emails">
        <OrderLine compact line={NOTEBOOK} status="refunded" currency="EUR" locale="en-GB" />
        <OrderLine compact line={SHIRT} currency="EUR" locale="en-GB" />
        <OrderLine compact line={MUG} currency="EUR" locale="en-GB" />
      </Panel>
    </div>
  );
}
