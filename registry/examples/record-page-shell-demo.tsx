"use client";

import { useState, type ReactNode } from "react";

import { RecordPageShell } from "@rhs-ui/application/record-page-shell";
import { IconBag, IconHanger, IconMail, IconPackage, IconPhone, IconPrinter } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { StatusBadge } from "@rhs-ui/primitives/status-badge";

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

const ITEMS: { name: string; variant: string; quantity: number; price: number; icon: ReactNode }[] = [
  { name: "Merino crew sweater", variant: "Slate · Medium", quantity: 1, price: 129, icon: <IconHanger /> },
  { name: "Waxed canvas tote", variant: "Olive", quantity: 2, price: 64, icon: <IconBag /> },
  { name: "Wool socks, 3-pack", variant: "Charcoal · 41 to 45", quantity: 1, price: 28, icon: <IconPackage /> },
];
const SUBTOTAL = ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
const SHIPPING = 6.5;

const EVENTS = [
  { title: "Order placed", detail: "By Sanne de Vries on the online store", time: "24 Oct, 14:32" },
  { title: "Payment captured", detail: `${EURO.format(SUBTOTAL + SHIPPING)} with Visa ending 4242`, time: "24 Oct, 14:32" },
  { title: "Confirmation email sent", detail: "To sanne.devries@example.nl", time: "24 Oct, 14:33" },
  { title: "Fraud check passed", detail: "Low risk. Address and card country match.", time: "24 Oct, 14:33" },
  { title: "Packed", detail: "Hana Sato · Shelf B4, 3 parcels merged into 1", time: "25 Oct, 09:12" },
];

const PAYMENTS = [
  { id: "capture", title: "Visa ending 4242", detail: "Charged in full · 24 Oct, 14:32", amount: SUBTOTAL + SHIPPING, status: "paid", label: "Captured" },
  { id: "authorisation", title: "Visa ending 4242", detail: "Funds held on the card · 24 Oct, 14:32", amount: SUBTOTAL + SHIPPING, status: "pending", label: "Authorised" },
];

const NOTES = [
  { author: "Customer", text: "Please gift wrap the tote and leave the parcel with the neighbours at number 410 if I am out.", time: "24 Oct, 14:31" },
  { author: "Hana Sato", text: "Wrapped the tote in the brown paper. Slip is tucked inside.", time: "25 Oct, 09:15" },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline", count: EVENTS.length },
  { id: "payments", label: "Payments", count: PAYMENTS.length },
  { id: "notes", label: "Notes", count: NOTES.length },
];

function Panel({ title, aside, children }: { title: string; aside?: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside ? <p className="text-xs text-muted-foreground">{aside}</p> : null}
      </header>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [tab, setTab] = useState("overview");

  return (
    <RecordPageShell
      backHref="#orders"
      backLabel="Orders"
      title="Order NW-10482"
      titleAs="h2"
      status={
        <>
          <StatusBadge status="paid" size="lg" />
          <StatusBadge status="pending" label="Ready to ship" size="lg" />
        </>
      }
      meta={["Placed 24 Oct 2026 at 14:32", "Northwind Outfitters", "Online store"]}
      actions={
        <>
          <Button variant="outline">Refund</Button>
          <Button variant="outline">
            <IconPrinter />
            Packing slip
          </Button>
          <Button>Fulfil items</Button>
        </>
      }
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      railTitle="Details"
      rail={
        <DescriptionList
          layout="stacked"
          items={[
            {
              term: "Customer",
              value: (
                <>
                  Sanne de Vries
                  <span className="block text-xs font-normal text-muted-foreground">3 orders · {EURO.format(842)} spent</span>
                </>
              ),
            },
            {
              term: "Contact",
              value: (
                <span className="grid gap-1.5 font-normal">
                  <span className="flex items-center gap-2">
                    <IconMail className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 break-words">sanne.devries@example.nl</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <IconPhone className="size-4 shrink-0 text-muted-foreground" />
                    +31 6 1234 5678
                  </span>
                </span>
              ),
            },
            {
              term: "Shipping address",
              value: (
                <address className="font-normal not-italic">
                  Prinsengracht 412-2
                  <br />
                  1016 HK Amsterdam
                  <br />
                  Netherlands
                </address>
              ),
            },
            { term: "Billing address", value: <span className="font-normal">Same as shipping</span> },
            { term: "Delivery", value: <span className="font-normal">DHL Express · by Tue 28 Oct</span> },
            {
              term: "Tags",
              value: (
                <span className="flex flex-wrap gap-1.5">
                  <Badge variant="muted">Gift</Badge>
                  <Badge variant="muted">Returning customer</Badge>
                </span>
              ),
            },
          ]}
          className="[&_dt]:text-xs"
        />
      }
      main={
        <>
          {tab === "overview" ? (
            <div className="grid gap-6">
              <Panel title="Items" aside={`${ITEMS.reduce((sum, item) => sum + item.quantity, 0)} units`}>
                <ul className="divide-y divide-border">
                  {ITEMS.map((item) => (
                    <li key={item.name} className="flex items-center gap-4 px-5 py-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-6">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.variant}</p>
                      </div>
                      <p className="hidden shrink-0 text-sm text-muted-foreground tabular-nums sm:block">
                        {item.quantity} × {EURO.format(item.price)}
                      </p>
                      <p className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">{EURO.format(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border bg-muted/40 px-5 py-4">
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd className="tabular-nums">{EURO.format(SUBTOTAL)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Shipping, DHL Express</dt>
                      <dd className="tabular-nums">{EURO.format(SHIPPING)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold">
                      <dt>Total</dt>
                      <dd className="tabular-nums">{EURO.format(SUBTOTAL + SHIPPING)}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-muted-foreground">Includes {EURO.format(50.59)} VAT at 21%.</p>
                </div>
              </Panel>
            </div>
          ) : null}

          {tab === "timeline" ? (
            <Panel title="Timeline">
              <ol className="m-5 grid gap-5 pl-6">
                {EVENTS.map((event) => (
                  // The line runs from this dot to the next (the dot's ring cuts it short on both ends) and the last event draws none.
                  <li key={event.title} className="relative before:absolute before:top-[11px] before:-bottom-[31px] before:-left-6 before:w-px before:bg-border last:before:hidden">
                    <span aria-hidden="true" className="absolute top-1.5 -left-[calc(1.5rem+4.5px)] size-2.5 rounded-full bg-foreground ring-4 ring-card" />
                    <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{event.time}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{event.detail}</p>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}

          {tab === "payments" ? (
            <Panel title="Payments">
              <ul className="divide-y divide-border">
                {PAYMENTS.map((payment) => (
                  <li key={payment.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{payment.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{payment.detail}</p>
                      {/* On a phone the state sits under the details, because the column at the right has no room for it. */}
                      <StatusBadge status={payment.status} label={payment.label} size="sm" className="mt-2 sm:hidden" />
                    </div>
                    <StatusBadge status={payment.status} label={payment.label} size="sm" className="max-sm:hidden" />
                    <p className="text-sm font-medium tabular-nums">{EURO.format(payment.amount)}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {tab === "notes" ? (
            <Panel title="Notes" aside={`${NOTES.length} notes`}>
              <ul className="divide-y divide-border">
                {NOTES.map((note) => (
                  <li key={note.time} className="px-5 py-4">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{note.time}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{note.text}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      }
    />
  );
}
