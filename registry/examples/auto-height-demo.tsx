"use client";

import { useId, useState } from "react";

import { IconAlertCircle, IconCheckCircle, IconChevronDown } from "@rhs-ui/icons";
import { AutoHeight } from "@rhs-ui/motion/auto-height";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Prices in cents, so the summary, the gift line and the total are always the same arithmetic.
const LAMP = 8900;
const DELIVERY = 990;
const GIFT = 400;
const VAT_RATE = 0.21;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });
const euro = (cents: number): string => money.format(cents / 100);

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "invalid" | "valid">("idle");
  const [gift, setGift] = useState(false);
  const [details, setDetails] = useState(false);

  const net = LAMP + DELIVERY + (gift ? GIFT : 0);
  const vat = Math.round(net * VAT_RATE);
  const lines: readonly (readonly [string, number])[] = [
    ["Halcyon desk lamp", LAMP],
    ["Express delivery", DELIVERY],
    ...(gift ? ([["Gift wrapping", GIFT]] as const) : []),
    ["VAT (21%)", vat],
  ];

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="text-base font-medium tracking-[-0.02em]">Delivery</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Where should we send the tracking link for order #4822?</p>

      <form
        className="mt-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setState(EMAIL.test(email) ? "valid" : "invalid");
        }}
      >
        <Label htmlFor={`${id}-email`}>Email address</Label>
        <Input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          className="mt-2"
          value={email}
          aria-invalid={state === "invalid" || undefined}
          aria-describedby={`${id}-message`}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "idle") setState("idle");
          }}
        />
        <AutoHeight id={`${id}-message`} aria-live="polite">
          {state === "invalid" ? (
            <p className="flex items-start gap-1.5 pt-2 text-sm text-destructive">
              <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
              Enter an email address, like mara@northwind.nl.
            </p>
          ) : null}
          {state === "valid" ? (
            <p className="flex items-start gap-1.5 pt-2 text-sm text-muted-foreground">
              <IconCheckCircle className="mt-0.5 size-4 shrink-0 text-foreground" />
              Thanks. The tracking link goes to {email}.
            </p>
          ) : null}
        </AutoHeight>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-5">
          <div className="min-w-0">
            <Label htmlFor={`${id}-gift`} className="leading-snug">
              Gift wrapping and message
            </Label>
            <p id={`${id}-gift-note`} className="mt-1 text-xs text-muted-foreground">
              {euro(GIFT)}, with a printed card
            </p>
          </div>
          <Switch id={`${id}-gift`} checked={gift} onCheckedChange={setGift} aria-describedby={`${id}-gift-note`} />
        </div>
        <AutoHeight>
          {gift ? (
            <div className="pt-3">
              <Label htmlFor={`${id}-note`} className="sr-only">
                Gift message
              </Label>
              <Textarea id={`${id}-note`} rows={3} placeholder="Happy birthday, Joris. Enjoy the new lamp!" />
              <p className="mt-1.5 text-xs text-muted-foreground">Printed on a card and left out of the packing slip.</p>
            </div>
          ) : null}
        </AutoHeight>

        <div className="mt-5 border-t border-border pt-4">
          <button
            type="button"
            aria-expanded={details}
            aria-controls={`${id}-details`}
            onClick={() => setDetails((open) => !open)}
            className="flex w-full items-center justify-between gap-4 rounded-md text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <span className="flex items-center gap-1.5">
              Order summary
              <IconChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", details && "rotate-180")} />
            </span>
            <span className="text-muted-foreground tabular-nums">{euro(net + vat)}</span>
          </button>
          <AutoHeight id={`${id}-details`}>
            {details ? (
              <dl className="space-y-2 pt-3 text-sm">
                {lines.map(([label, cents]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="tabular-nums">{euro(cents)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </AutoHeight>
        </div>

        <Button type="submit" className="mt-5 w-full">
          Continue to payment
        </Button>
      </form>
    </div>
  );
}
