"use client";

import { useId, useState, type ReactNode } from "react";

import { PaymentCardPreview } from "@rhs-ui/commerce/payment-card-preview";
import { DEFAULT_GROUPS, brandInfo, detectBrand, formatExpiry, formatNumber } from "@rhs-ui/commerce/payment-card-preview/card";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      {/* Two lines tall in a row of columns, so a short caption does not lift its card above the ones beside it. */}
      <p className="text-xs text-muted-foreground sm:min-h-8">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [number, setNumber] = useState("4242 4242 4242 4242");
  const [name, setName] = useState("Ada Lovelace");
  const [expiry, setExpiry] = useState("09/28");
  const [cvc, setCvc] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [masked, setMasked] = useState(false);
  const info = brandInfo(detectBrand(number));

  return (
    <div className="@container w-full max-w-4xl min-w-0">
      <div className="grid gap-14">
        <div className="grid min-w-0 items-start gap-8 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] @2xl:gap-12">
          <form aria-label="Card details" className="grid gap-4 @max-2xl:order-last" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-number`}>Card number</Label>
              <Input
                id={`${id}-number`}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 1234 1234 1234"
                value={number}
                onChange={(event) => setNumber(formatNumber(event.target.value, brandInfo(detectBrand(event.target.value))?.groups ?? DEFAULT_GROUPS))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-name`}>Name on card</Label>
              <Input id={`${id}-name`} autoComplete="cc-name" placeholder="As printed on the card" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`${id}-expiry`}>Expiry</Label>
                <Input id={`${id}-expiry`} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={expiry} onChange={(event) => setExpiry(formatExpiry(event.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-cvc`}>Security code</Label>
                <Input
                  id={`${id}-cvc`}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder={info?.cvc === 4 ? "1234" : "123"}
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, info?.cvc ?? 4))}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch id={`${id}-mask`} checked={masked} onCheckedChange={setMasked} />
              <Label htmlFor={`${id}-mask`} className="font-normal">
                Hide all but the last four digits
              </Label>
            </div>
          </form>

          <div className="grid gap-3 @max-2xl:order-first">
            <PaymentCardPreview number={number} name={name} expiry={expiry} cvc={cvc} flipped={flipped} masked={masked} className="mx-auto @2xl:mx-0" />
            <p className="text-center text-xs text-muted-foreground @2xl:text-left">The card turns over while you are in the security code. Nothing typed here is stored or sent.</p>
          </div>
        </div>

        <div className="grid min-w-0 gap-x-6 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr))]">
          <Example caption="American Express groups its digits 4-6-5, and soft bullets mark what is still to come">
            <PaymentCardPreview number="3782 822463" name="Mei Tanaka" expiry="1" />
          </Example>
          <Example caption="Masked: every digit but the last four is hidden">
            <PaymentCardPreview number="5555 5555 5555 4444" name="Jonas Kessler" expiry="03/29" masked />
          </Example>
          <Example caption="The back, with the security code area">
            <PaymentCardPreview number="4929 0183 7421 5564" name="Aisha Rahman" expiry="11/27" cvc="12" flipped />
          </Example>
        </div>
      </div>
    </div>
  );
}
