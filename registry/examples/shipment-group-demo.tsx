"use client";

import { useState, type ReactNode } from "react";

import { ShipmentGroup } from "@rhs-ui/commerce/shipment-group";

const pic = (bg: string, body: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

const JUMPER = pic("#e9e5dc", "<path d='M42 26l-22 12 8 18 12-6v46h48V50l12 6 8-18-22-12c-4 8-10 12-18 12s-14-4-18-12z' fill='#9a8f7a'/>");
const TOTE = pic("#e3e6dc", "<path d='M38 48h44l6 52H32z' fill='#6c7a55'/><path d='M46 48c0-22 28-22 28 0' fill='none' stroke='#55613f' stroke-width='5'/>");
const SPEAKER = pic("#dde1e7", "<rect x='36' y='24' width='48' height='72' rx='10' fill='#3f4859'/><circle cx='60' cy='70' r='15' fill='#566074'/><circle cx='60' cy='42' r='6' fill='#566074'/>");
const MUG = pic("#efe8df", "<path d='M32 42h46v34a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16z' fill='#c4694a'/><path d='M78 50h6a11 11 0 0 1 0 22h-6' fill='none' stroke='#c4694a' stroke-width='6'/>");
const NOTEBOOK = pic("#e6e3ee", "<rect x='34' y='24' width='52' height='72' rx='5' fill='#4b4f6b'/><rect x='40' y='24' width='5' height='72' fill='#3a3d55'/>");
const CANDLE = pic("#efe9dc", "<rect x='40' y='44' width='14' height='56' rx='3' fill='#d9b45f'/><rect x='64' y='56' width='14' height='44' rx='3' fill='#c9a24b'/>");
const STAND = pic("#ebe4d8", "<rect x='38' y='22' width='44' height='7' rx='2' fill='#a67c4c'/><rect x='56.5' y='29' width='7' height='62' fill='#c09a68'/><rect x='32' y='91' width='56' height='7' rx='2' fill='#a67c4c'/>");

/** One line in a parcel. The price sits beside the name, and under it on the narrowest screens. */
function Line({ name, detail, quantity, price, image }: { name: string; detail: string; quantity: number; price: string; image: string }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 py-3.5 max-[22rem]:grid-cols-[auto_minmax(0,1fr)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- a drawn data URI */}
      <img src={image} alt="" className="size-14 shrink-0 rounded-lg border border-border object-cover max-[22rem]:row-span-2" />
      <div className="min-w-0">
        <p className="text-sm leading-snug font-medium text-pretty">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      <p className="shrink-0 text-right text-sm font-medium tabular-nums max-[22rem]:text-left">
        <span className="text-xs font-normal text-muted-foreground">{quantity} × </span>
        {price}
      </p>
    </div>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [said, setSaid] = useState("Shipment 2 is delayed, so it still offers Change. Shipment 1 has shipped: its method can no longer change, so the button is gone.");
  const shared = { currency: "EUR", locale: "en-GB" } as const;

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,23rem),1fr))]">
      <Example caption="One order, three parcels: each says where it ships from, how it travels and where it is. Change is only there while the method can still change">
        <div className="grid gap-5">
          <ShipmentGroup index={1} total={3} status="shipped" shipment={{ id: "s1", origin: "Kestrel Outdoor, Rotterdam", method: { name: "Standard delivery", price: 0, from: "2026-10-23", to: "2026-10-25" } }} {...shared}>
            <Line name="Merino crew jumper" detail="Oat, size M" quantity={1} price="€89.00" image={JUMPER} />
            <Line name="Waxed canvas tote" detail="Moss green" quantity={1} price="€59.00" image={TOTE} />
          </ShipmentGroup>

          <ShipmentGroup index={2} total={3} status="delayed" shipment={{ id: "s2", origin: "Halcyon Audio, Eindhoven", method: { name: "Next-day delivery", price: 695, from: "2026-10-27", to: "2026-10-29" } }} onChangeMethod={() => setSaid("Change pressed on shipment 2: your app opens the delivery options.")} {...shared}>
            <Line name="Halcyon portable speaker" detail="Graphite" quantity={1} price="€149.00" image={SPEAKER} />
          </ShipmentGroup>

          <ShipmentGroup index={3} total={3} status="pending" shipment={{ id: "s3", origin: "Northwind Surplus, Antwerp", kind: "preorder", shipsOn: "2026-11-03", method: { name: "Standard delivery", price: 495 } }} {...shared}>
            <Line name="Stoneware mug set" detail="Terracotta, set of two" quantity={2} price="€32.00" image={MUG} />
          </ShipmentGroup>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {said}
        </p>
      </Example>

      <div className="grid content-start gap-10">
        <Example caption="A single shipment drops the heading. Delivered, it says when it arrived and offers no Change">
          <ShipmentGroup total={1} status="delivered" shipment={{ id: "s4", origin: "Kestrel Outdoor, Rotterdam", method: { name: "Standard delivery", price: 0, from: "2026-10-14" } }} {...shared}>
            <Line name="Sewn notebook" detail="A5, dotted, indigo" quantity={1} price="€18.00" image={NOTEBOOK} />
          </ShipmentGroup>
        </Example>

        <Example caption="A backorder says it is waiting for stock, and when it ships">
          <ShipmentGroup index={2} total={2} status="pending" shipment={{ id: "s5", origin: "Northwind Surplus, Antwerp", kind: "backorder", shipsOn: "2026-11-12", method: { name: "Pick-up point", price: 295, from: "2026-11-14", to: "2026-11-17" } }} changeHref="#delivery-options" {...shared}>
            <Line name="Beeswax candle pair" detail="Honey" quantity={3} price="€14.00" image={CANDLE} />
          </ShipmentGroup>
        </Example>

        <Example caption="Cancelled: the arrival gives way to a plain note, and the price and the lines go quiet">
          <ShipmentGroup index={1} total={2} status="cancelled" shipment={{ id: "s6", origin: "Halcyon Audio, Eindhoven", method: { name: "Standard delivery", price: 495, from: "2026-10-22", to: "2026-10-24" } }} {...shared}>
            <Line name="Halcyon speaker stand" detail="Oak" quantity={1} price="€39.00" image={STAND} />
          </ShipmentGroup>
        </Example>
      </div>
    </div>
  );
}
