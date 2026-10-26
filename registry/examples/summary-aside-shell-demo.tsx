"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { SummaryAsideShell } from "@rhs-ui/application/summary-aside-shell";
import { IconHanger, IconLock, IconPackage } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

const ITEMS: { name: string; variant: string; quantity: number; price: number; icon: ReactNode }[] = [
  { name: "Merino crew sweater", variant: "Slate · Medium", quantity: 1, price: 129, icon: <IconHanger /> },
  { name: "Wool socks, 3-pack", variant: "Charcoal · 41 to 45", quantity: 2, price: 28, icon: <IconPackage /> },
];

const DELIVERY = {
  standard: { title: "Standard", description: "3 to 5 working days", cost: 4.5 },
  express: { title: "Express", description: "Next working day, ordered before 17:00", cost: 9.9 },
  pickup: { title: "Pickup point", description: "Ready in 2 working days, 1,400 locations", cost: 0 },
} as const;
type Delivery = keyof typeof DELIVERY;

const PROMO = { code: "NORTHWIND10", percent: 10 };

function Field({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <FormField className="gap-1.5">
      <FormLabel>{label}</FormLabel>
      <FormControl>{children}</FormControl>
    </FormField>
  );
}

function Step({ title, hint, children }: { title: string; hint?: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [delivery, setDelivery] = useState<Delivery>("standard");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [codeError, setCodeError] = useState("");

  const subtotal = ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = applied ? Math.round(subtotal * PROMO.percent) / 100 : 0;
  const shipping = DELIVERY[delivery].cost;
  const total = subtotal - discount + shipping;
  const vat = (total * 21) / 121;

  function applyCode(event: FormEvent) {
    event.preventDefault();
    if (code.trim().toUpperCase() === PROMO.code) {
      setApplied(true);
      setCodeError("");
    } else {
      setApplied(false);
      setCodeError("That code is not valid. Try NORTHWIND10.");
    }
  }

  return (
    // A phone scrolls inside this box, so the bar that is fixed to the bottom of the screen shows where it belongs in a preview; from lg the page scrolls itself.
    <div className="relative max-lg:h-[calc(100dvh-3rem)] max-lg:overflow-y-auto">
      <SummaryAsideShell
        mainId="summary-main"
        total={EURO.format(total)}
        totalNote={`Includes ${EURO.format(vat)} VAT`}
        action={
          <Button type="submit" form="checkout-form" size="lg">
            Pay {EURO.format(total)}
          </Button>
        }
        header={
          <>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid size-6 place-items-center rounded-lg bg-foreground text-background">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="currentColor">
                  <path d="M2 13 8 3l6 10h-3.2L8 8.4 5.2 13z" />
                </svg>
              </span>
              Northwind
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconLock className="size-3.5" />
              Secure checkout
            </span>
          </>
        }
        summary={
          <div className="grid gap-5">
            <ul className="grid gap-4">
              {ITEMS.map((item) => (
                <li key={item.name} className="flex items-center gap-3">
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-6">
                    {item.icon}
                    <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-foreground text-[0.6875rem] font-medium text-background tabular-nums">
                      {item.quantity}
                      <span className="sr-only"> in the basket</span>
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.variant}</p>
                  </div>
                  <p className="text-sm tabular-nums">{EURO.format(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>

            <form onSubmit={applyCode} noValidate className="grid gap-1.5">
              <Label htmlFor="promo-code" className="sr-only">
                Discount code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promo-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Discount code"
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={codeError ? "promo-error" : undefined}
                />
                <Button type="submit" variant="outline">
                  Apply
                </Button>
              </div>
              <p id="promo-error" role="status" className="text-xs font-medium text-destructive empty:hidden">
                {codeError}
              </p>
            </form>

            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{EURO.format(subtotal)}</dd>
              </div>
              {applied ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Discount ({PROMO.code})</dt>
                  <dd className="tabular-nums">−{EURO.format(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Shipping, {DELIVERY[delivery].title}</dt>
                <dd className="tabular-nums">{shipping === 0 ? "Free" : EURO.format(shipping)}</dd>
              </div>
            </dl>
          </div>
        }
      >
        <form id="checkout-form" onSubmit={(event) => event.preventDefault()} noValidate className="grid max-w-xl gap-10">
          <Step title="Contact" hint="We send the order confirmation here.">
            <Field label="Email">
              <Input type="email" autoComplete="email" defaultValue="sanne.devries@example.nl" />
            </Field>
            <div className="flex items-center gap-2.5">
              <Checkbox id="news" defaultChecked />
              <Label htmlFor="news" className="font-normal">
                Email me about new arrivals
              </Label>
            </div>
          </Step>

          <Step title="Delivery address">
            <FormField className="gap-1.5">
              <FormLabel>Country</FormLabel>
              <Select defaultValue="nl">
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="nl">Netherlands</SelectItem>
                  <SelectItem value="be">Belgium</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name">
                <Input autoComplete="given-name" defaultValue="Sanne" />
              </Field>
              <Field label="Last name">
                <Input autoComplete="family-name" defaultValue="de Vries" />
              </Field>
            </div>
            <Field label="Address">
              <Input autoComplete="address-line1" defaultValue="Prinsengracht 412-2" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
              <Field label="Postcode">
                <Input autoComplete="postal-code" defaultValue="1016 HK" />
              </Field>
              <Field label="City">
                <Input autoComplete="address-level2" defaultValue="Amsterdam" />
              </Field>
            </div>
          </Step>

          <Step title="Delivery method">
            <RadioCards
              label="Delivery method"
              value={delivery}
              onValueChange={(value) => setDelivery(value as Delivery)}
              options={(Object.keys(DELIVERY) as Delivery[]).map((key) => ({
                value: key,
                title: DELIVERY[key].title,
                description: DELIVERY[key].description,
                aside: <span className="font-medium tabular-nums">{DELIVERY[key].cost === 0 ? "Free" : EURO.format(DELIVERY[key].cost)}</span>,
              }))}
            />
          </Step>

          <Step title="Payment" hint="Your card is charged when you press Pay.">
            <Field label="Card number">
              <Input inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Expiry date">
                <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" />
              </Field>
              <Field label="Security code">
                <Input inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
              </Field>
            </div>
            <Field label="Name on card">
              <Input autoComplete="cc-name" defaultValue="Sanne de Vries" />
            </Field>
          </Step>
        </form>
      </SummaryAsideShell>
    </div>
  );
}
