"use client";

import { useState, type ReactNode } from "react";

import { AccordionSteps, type AccordionStep } from "@rhs-ui/application/accordion-steps";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [current, setCurrent] = useState<string | null>("delivery");
  const [done, setDone] = useState<Record<string, boolean>>({ contact: true });
  const [placed, setPlaced] = useState(false);
  const [email, setEmail] = useState("mara@halcyon.studio");
  const [name, setName] = useState("Mara Visser");
  const [street, setStreet] = useState("Halden Street 14");
  const [postcode, setPostcode] = useState("3511 AB");
  const [city, setCity] = useState("Utrecht");
  const [speed, setSpeed] = useState("standard");
  const [payment, setPayment] = useState("ideal");
  // The field a check complained about, so it can be marked invalid until it is changed.
  const [invalid, setInvalid] = useState<string | null>(null);

  const shipping = SPEEDS.find((option) => option.value === speed);
  const way = PAYMENTS.find((option) => option.value === payment);

  /** What a real checkout does between the steps: look at the data, ask a server, say no with a reason or let the person on. */
  async function onContinue(id: string): Promise<string | void> {
    await wait(700);
    setInvalid(null);
    if (id === "contact" && !EMAIL.test(email.trim())) {
      setInvalid("email");
      throw new Error("Enter an email address like mara@halcyon.studio.");
    }
    if (id === "delivery") {
      if (!name.trim() || !street.trim() || !city.trim()) {
        setInvalid(!name.trim() ? "name" : !street.trim() ? "street" : "city");
        throw new Error("Fill in your name, street and city.");
      }
      if (!POSTCODE.test(postcode.trim())) {
        setInvalid("postcode");
        throw new Error("Enter a postcode like 3511 AB.");
      }
      if (postcode.trim().startsWith("99")) {
        setInvalid("postcode");
        return "We cannot deliver to that postcode yet. Try another address.";
      }
    }
    if (id === "review") {
      await wait(500);
      setPlaced(true);
    }
    setDone((all) => ({ ...all, [id]: true }));
  }

  const steps: AccordionStep[] = [
    {
      id: "contact",
      title: "Contact",
      state: done.contact ? "complete" : "incomplete",
      summary: email.trim(),
      content: (
        <Field id="as-email" label="Email address" hint="We send the order confirmation here.">
          <Input id="as-email" type="email" autoComplete="email" aria-invalid={invalid === "email" || undefined} value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
      ),
    },
    {
      id: "delivery",
      title: "Delivery",
      state: done.delivery ? "complete" : "incomplete",
      summary: `${name.trim()}, ${street.trim()}, ${postcode.trim()} ${city.trim()}`,
      continueLabel: "Continue to payment",
      content: (
        <div className="grid gap-4">
          <Field id="as-name" label="Full name">
            <Input id="as-name" autoComplete="name" aria-invalid={invalid === "name" || undefined} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field id="as-street" label="Street and number">
            <Input id="as-street" autoComplete="street-address" aria-invalid={invalid === "street" || undefined} value={street} onChange={(event) => setStreet(event.target.value)} />
          </Field>
          <div className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-3">
            <Field id="as-postcode" label="Postcode">
              <Input id="as-postcode" autoComplete="postal-code" aria-invalid={invalid === "postcode" || undefined} value={postcode} onChange={(event) => setPostcode(event.target.value)} />
            </Field>
            <Field id="as-city" label="City">
              <Input id="as-city" autoComplete="address-level2" aria-invalid={invalid === "city" || undefined} value={city} onChange={(event) => setCity(event.target.value)} />
            </Field>
          </div>
          <RadioCards label="Delivery speed" options={SPEEDS} value={speed} onValueChange={setSpeed} />
        </div>
      ),
    },
    {
      id: "payment",
      title: "Payment",
      state: done.payment ? "complete" : "incomplete",
      summary: way?.title,
      continueLabel: "Review order",
      content: <RadioCards label="Payment method" options={PAYMENTS} value={payment} onValueChange={setPayment} />,
    },
    {
      id: "review",
      title: "Review and pay",
      state: done.review ? "complete" : "incomplete",
      summary: "Order placed",
      continueLabel: "Place order",
      content: (
        <dl className="grid gap-2 text-sm">
          <Line term="Halcyon desk lamp" detail="€89.00" />
          <Line term={`Delivery, ${shipping?.title.toLowerCase()}`} detail={shipping?.aside ?? ""} />
          <Line term={`Pay with ${way?.title}`} detail="" />
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{speed === "express" ? "€95.90" : "€89.00"}</dd>
          </div>
        </dl>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-2xl gap-12">
        <Case caption="Try it: Continue checks for a second. Clear the postcode to get an error that keeps the step open, or type 9911 AA for a refusal. Edit a finished step and the ones after it stay as they are.">
          <div className="grid gap-4">
            <AccordionSteps steps={steps} current={current} onStepChange={setCurrent} onContinue={onContinue} editable={!placed} />
            {placed ? (
              <p role="status" className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Thank you, <span className="font-medium text-foreground">{name.trim().split(" ")[0]}</span>. Your order is on its way to {city.trim()}.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPlaced(false);
                    setDone({ contact: true });
                    setCurrent("delivery");
                  }}
                >
                  Start over
                </Button>
              </p>
            ) : null}
          </div>
        </Case>

        <Case caption="When the flow is over: every step complete, none open and Edit off, so the list reads as a receipt.">
          <AccordionSteps steps={RECEIPT} current={null} editable={false} headingLevel={4} />
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Line({ term, detail }: { term: string; detail: string }): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="tabular-nums">{detail}</dd>
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTCODE = /^\d{4}\s?[A-Za-z]{2}$/;

const SPEEDS = [
  { value: "standard", title: "Standard", description: "Delivered Thursday 29 October.", aside: "Free" },
  { value: "express", title: "Express", description: "Delivered tomorrow, before 12:00.", aside: "€6.90" },
];

const PAYMENTS = [
  { value: "ideal", title: "iDEAL", description: "Pay in your own banking app." },
  { value: "card", title: "Credit card", description: "Visa, Mastercard and American Express." },
];

const RECEIPT: AccordionStep[] = [
  { id: "contact", title: "Contact", state: "complete", summary: "mara@halcyon.studio", content: null },
  { id: "delivery", title: "Delivery", state: "complete", summary: "Mara Visser, Halden Street 14, 3511 AB Utrecht", content: null },
  { id: "payment", title: "Payment", state: "complete", summary: "iDEAL, paid 22 October", content: null },
];
