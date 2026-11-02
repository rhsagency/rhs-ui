"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { CurrencyExchangeField, type CurrencyExchangeFieldProps, type ExchangeValue, type RateTable } from "@rhs-ui/primitives/currency-exchange-field";

// What one euro buys. Any pair is worked out from these, so every currency in the menus has a rate to every other.
const PER_EURO: Record<string, number> = { EUR: 1, USD: 1.0842, GBP: 0.8613, CHF: 0.9412, JPY: 163.27, CAD: 1.4936, AUD: 1.6521, KWD: 0.3345 };
const cross = (from: string, to: string): number | null => {
  const a = PER_EURO[from];
  const b = PER_EURO[to];
  return a && b ? b / a : null;
};

// A table with a few pairs: the others are taken from the other way round, so USD to EUR works without being listed.
const TABLE: RateTable = { EUR: { USD: 1.0842, GBP: 0.8613 }, GBP: { USD: 1.2587 } };

// Limits and the fixed part of a fee are minor units of the currency that is sent, so a bare 1000 would be 10.00 euros but 1,000 yen. One figure per code keeps each
// worth about the same whichever currency is chosen: at least about 10 euros, at most about 25,000, and a fixed fee of about a euro.
const MIN: Record<string, number> = { EUR: 1000, USD: 1100, GBP: 900, CHF: 950, JPY: 1600, CAD: 1500, AUD: 1650 };
const MAX: Record<string, number> = { EUR: 2500000, USD: 2700000, GBP: 2150000, CHF: 2350000, JPY: 4000000, CAD: 3700000, AUD: 4100000 };
const FLAT: Record<string, number> = { EUR: 99, USD: 99, GBP: 85, CHF: 90, JPY: 150, CAD: 135, AUD: 150 };

const UPDATED = "2026-10-21T10:42:00Z";

/** What the field reported, on one line that breaks at its spaces and never in the middle of a word. The readout is for the reader of the demo, so it is hidden from a screen reader. */
const show = (value: unknown): string => JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");

function Example({ caption, wide = false, children }: { caption: string; wide?: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <div className={wide ? "grid min-w-0 grid-cols-1 content-start gap-3 md:col-span-2" : "grid min-w-0 grid-cols-1 content-start gap-3"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Types into one input of what it wraps, and then leaves the field, so the preview shows what it says afterwards. The focus is never touched: a preview must not take it from a page the reader is already using. */
function Typed({ text, input: which = 0, children }: { text: string; input?: number; children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const input = box.current?.querySelectorAll("input")[which];
    if (!input) return;
    done.current = true;
    // React listens for the input event, and only sees a value that was set through the native setter.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // Leaving is a separate moment, as it is for a person: the field has drawn what was typed by then.
    window.setTimeout(() => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })), 60);
  }, [text, which]);
  return <div ref={box}>{children}</div>;
}

function Field({ typed, input, ...props }: CurrencyExchangeFieldProps & { typed?: string; input?: number }): React.JSX.Element {
  const field = <CurrencyExchangeField {...props} />;
  return typed === undefined ? (
    field
  ) : (
    <Typed text={typed} input={input}>
      {field}
    </Typed>
  );
}

function Transfer(): React.JSX.Element {
  const id = useId();
  const [transfer, setTransfer] = useState<ExchangeValue>({ send: { minor: 100000, currency: "EUR" }, receive: { minor: 107771, currency: "USD" }, fixed: "send" });
  const [valid, setValid] = useState(true);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 id={id} className="text-sm font-medium tracking-[-0.01em]">
          Send money to Kestrel Studio in Lisbon
        </h2>
        <p className="text-xs text-muted-foreground">Type either amount: the other follows the rate. The fee is taken off before the rate is applied.</p>
      </div>
      <CurrencyExchangeField
        aria-labelledby={id}
        name="transfer"
        rates={cross}
        fee={{ percent: 0.5, flat: FLAT }}
        updatedAt={UPDATED}
        min={MIN}
        max={MAX}
        value={transfer}
        onValueChange={(next, state) => {
          setTransfer(next);
          setValid(state.valid);
        }}
      />
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show({ ...transfer, valid })}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example wide caption="Try it: type in either amount, swap the currencies, or search the menu for yen. In a wide space the two amounts sit side by side">
        <Transfer />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Typed in the amount that is received: that one is fixed, and what has to be sent is rounded up so nobody is short">
          <Field typed="500" input={1} rates={cross} fee={{ percent: 0.5 }} updatedAt={UPDATED} defaultValue={{ send: { minor: null, currency: "EUR" }, receive: { minor: null, currency: "GBP" }, fixed: "send" }} />
        </Example>
        <Example caption="Yen have no decimals and Kuwaiti dinars have three: each amount is written in its own currency's decimals">
          <Field rates={cross} currencies={["JPY", "KWD", "EUR", "USD"]} defaultValue={{ send: { minor: 25000, currency: "JPY" }, receive: { minor: null, currency: "KWD" }, fixed: "send" }} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Rates as a table with a few pairs: the ones that are not listed are taken from the other way round">
          <Field rates={TABLE} currencies={["EUR", "USD", "GBP"]} updatedAt={UPDATED} defaultValue={{ send: { minor: 25000, currency: "USD" }, receive: { minor: null, currency: "EUR" }, fixed: "send" }} />
        </Example>
        <Example caption="Typed 30,000 and left the field: above the limit, said in the currency sent">
          <Field typed="30000" rates={cross} max={MAX} min={MIN} defaultValue={{ send: { minor: null, currency: "EUR" }, receive: { minor: null, currency: "USD" }, fixed: "send" }} />
        </Example>
        <Example caption="No rate for the pair: the field says so and works out nothing">
          <Field rates={TABLE} currencies={["EUR", "USD", "CHF"]} defaultValue={{ send: { minor: 10000, currency: "EUR" }, receive: { minor: null, currency: "CHF" }, fixed: "send" }} />
        </Example>
        <Example caption="Disabled">
          <Field disabled rates={cross} updatedAt={UPDATED} defaultValue={{ send: { minor: 50000, currency: "EUR" }, receive: { minor: null, currency: "USD" }, fixed: "send" }} />
        </Example>
      </div>
    </div>
  );
}
