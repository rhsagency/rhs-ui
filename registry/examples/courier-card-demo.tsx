"use client";

import { useEffect, useState, type ReactNode } from "react";

import { CourierCard, type Courier } from "@rhs-ui/commerce/courier-card";
import { Button } from "@rhs-ui/primitives/button";

/** A flat portrait: a jacket, a head, dark hair and a beard, drawn as a data URI so the demo needs no picture. */
const PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='#d6dde6'/><path d='M12 122c4-28 22-38 48-38s44 10 48 38z' fill='#3b4859'/><rect x='51' y='66' width='18' height='20' rx='6' fill='#c99a7c'/><circle cx='60' cy='50' r='22' fill='#d8a98a'/><path d='M37 49c-3-21 11-30 23-30s26 9 23 30c-5-9-11-13-23-13s-18 4-23 13z' fill='#2a2321'/><path d='M41 58c2 17 10 24 19 24s17-7 19-24c-5 8-11 11-19 11s-14-3-19-11z' fill='#2a2321'/><circle cx='51' cy='52' r='2' fill='#2a2321'/><circle cx='69' cy='52' r='2' fill='#2a2321'/></svg>",
  );

const MEHMET: Courier = { name: "Mehmet", photo: PORTRAIT, vehicle: "bike", vehicleLabel: "Cargo bike", plate: "12-KZB-4", rating: 4.9, deliveries: 1284 };
const SOFIE: Courier = { name: "Sofie de Wit", vehicle: "van", vehicleLabel: "Grey van", plate: "TR-482-K", rating: 4.8, deliveries: 342 };
const DAAN: Courier = { name: "Daan", vehicle: "car", vehicleLabel: "Blue hatchback", plate: "H-208-PL", rating: 5, deliveries: 1 };

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // A delivery that arrives while you watch: the arrival time drops a minute every few seconds, and at zero the card says so.
  const [eta, setEta] = useState(6);
  const [said, setSaid] = useState("Call and Message hand control back to you; no number is ever printed.");
  useEffect(() => {
    if (eta <= 0) return;
    const timer = window.setTimeout(() => setEta((current) => current - 1), 4000);
    return () => window.clearTimeout(timer);
  }, [eta]);
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,21rem),1fr))]">
      <Example caption="Live: the arrival time moves, and is said out loud only when it matters">
        <CourierCard
          courier={MEHMET}
          eta={eta}
          status={eta <= 0 ? "arrived" : "on-the-way"}
          locale="en-GB"
          onCall={() => setSaid("Call pressed: your app starts a masked call to Mehmet.")}
          onMessage={() => setSaid("Message pressed: your app opens the chat with Mehmet.")}
        />
      </Example>
      <Example caption="No photo: the first initial, and a first name even when a full name is passed">
        <CourierCard courier={SOFIE} eta={14} locale="en-GB" onCall={() => undefined} onMessage={() => undefined} />
      </Example>
      {/* The controls of the live card sit under both cards in a row of their own, so the two columns above stay level. */}
      <div className="col-span-full -mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setEta(6)}>
          Restart the delivery
        </Button>
        <p role="status" className="min-w-0 text-xs text-muted-foreground">
          {said}
        </p>
      </div>
      <Example caption="Nobody has accepted yet: the same footprint">
        <CourierCard locale="en-GB" onCall={() => undefined} onMessage={() => undefined} />
      </Example>
      <Example caption="Arrived">
        <CourierCard courier={DAAN} status="arrived" locale="en-GB" callHref="#relay-call" messageHref="#relay-sms" />
      </Example>
    </div>
  );
}
