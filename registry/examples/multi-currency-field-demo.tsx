"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { MultiCurrencyField, type MultiCurrencyFieldProps, type MultiCurrencyValue } from "@rhs-ui/primitives/multi-currency-field";

/** What the field reported, on one line that breaks at its spaces and never in the middle of a word. The readout is for the reader of the demo, so it is hidden from a screen reader. */
const show = (value: unknown): string => JSON.stringify(value, null, 1).replace(/\n\s*/g, " ");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A field that has been left once already, so the preview shows what it says afterwards. */
function Left({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only when nothing has focus: a preview must never take it from a page the reader is already using.
    if (document.activeElement && document.activeElement !== document.body) return;
    const input = box.current?.querySelector("input");
    input?.focus({ preventScroll: true });
    input?.blur();
    // The focus and blur leave the browser's starting point for the Tab key in the field; give it back to the page.
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute("tabindex");
  }, []);
  return <div ref={box}>{children}</div>;
}

function Field({ label, leave, ...props }: Omit<MultiCurrencyFieldProps, "id" | "value"> & { label: string; leave?: boolean }): React.JSX.Element {
  const id = useId();
  const field = (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <MultiCurrencyField id={id} {...props} />
    </div>
  );
  return leave ? <Left>{field}</Left> : field;
}

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "KWD"];

function SetPrice(): React.JSX.Element {
  const id = useId();
  const [price, setPrice] = useState<MultiCurrencyValue>({ minor: 12900, currency: "EUR" });
  const [valid, setValid] = useState(true);
  const [saved, setSaved] = useState<MultiCurrencyValue | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (valid && price.minor !== null) setSaved(price);
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Price the Halcyon desk lamp</h2>
        <p className="text-xs text-muted-foreground">Pick a currency and type the price. Yen have no decimals; Kuwaiti dinars have three.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Retail price</Label>
        <MultiCurrencyField
          id={id}
          name="price"
          currencies={CURRENCIES}
          value={price}
          min={{ EUR: 500, USD: 500, GBP: 500, JPY: 500, KWD: 500 }}
          onValueChange={(next, state) => {
            setPrice(next);
            setValid(state.valid);
            setSaved(null);
          }}
        />
      </div>
      <Button type="submit" disabled={!valid || price.minor === null}>
        Save price
      </Button>
      <div className="grid border-t border-border pt-4 text-xs text-muted-foreground">
        <p role="status">{saved ? `Saved ${saved.minor} in ${saved.currency}` : null}</p>
        {saved ? null : (
          <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(price)}</code>
          </p>
        )}
      </div>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: open the menu and search for yen, then type 12,5 or 12.5. The amount is reported in minor units">
          <SetPrice />
        </Example>
        <Example caption="The decimals come from the currency: euros have two, yen none, Kuwaiti dinars three">
          <div className="grid gap-5">
            <Field label="Halcyon lamp, Europe" currencies={CURRENCIES} defaultValue={{ minor: 125000, currency: "EUR" }} />
            <Field label="Halcyon lamp, Japan" currencies={CURRENCIES} defaultValue={{ minor: 18500, currency: "JPY" }} />
            <Field label="Halcyon lamp, Kuwait" currencies={CURRENCIES} defaultValue={{ minor: 38250, currency: "KWD" }} />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="An amount outside min and max is explained with the limit in the chosen currency">
          <Field
            label="Gift card"
            leave
            currencies={CURRENCIES}
            defaultValue={{ minor: 300, currency: "EUR" }}
            min={{ EUR: 500, USD: 500, GBP: 500, JPY: 500, KWD: 500 }}
            max={{ EUR: 50000, USD: 50000, GBP: 50000, JPY: 100000, KWD: 50000 }}
          />
        </Example>
        <Example caption="The locale writes the amount: nl-NL has a decimal comma, and either sign is understood when typing">
          <Field label="Orderbedrag" locale="nl-NL" currencies={["EUR", "USD", "GBP"]} defaultValue={{ minor: 125050, currency: "EUR" }} />
        </Example>
        <Example caption="allowNegative accepts a minus, for a refund or a credit">
          <Field label="Adjustment" allowNegative currencies={["EUR", "USD"]} defaultValue={{ minor: -4500, currency: "USD" }} />
        </Example>
        <Example caption="With one currency there is no menu, only the code">
          <Field label="Deposit" currencies={["CHF"]} defaultValue={{ minor: 25000, currency: "CHF" }} />
        </Example>
        <Example caption="Disabled">
          <Field label="Retail price" disabled currencies={CURRENCIES} defaultValue={{ minor: 12900, currency: "EUR" }} />
        </Example>
      </div>
    </div>
  );
}
