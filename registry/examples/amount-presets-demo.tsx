"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { AmountPresets, type AmountPreset } from "@rhs-ui/primitives/amount-presets";
import { Button } from "@rhs-ui/primitives/button";

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
    const input = box.current?.querySelector<HTMLInputElement>("input[type=text]");
    input?.focus({ preventScroll: true });
    input?.blur();
    // The focus and blur leave the browser's starting point for the Tab key in the field; give it back to the page.
    document.body.tabIndex = -1;
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute("tabindex");
  }, []);
  return <div ref={box}>{children}</div>;
}

const DONATIONS: AmountPreset[] = [
  { amount: 1000, impact: "Feeds a family for a day" },
  { amount: 2500, impact: "Feeds a family for a week" },
  { amount: 5000, impact: "Feeds a family for two weeks" },
  { amount: 10000, impact: "Stocks a community pantry for a month" },
];

const TOP_UPS: AmountPreset[] = [{ amount: 1000 }, { amount: 2500 }, { amount: 5000 }, { amount: 10000 }];

const YEN: AmountPreset[] = [{ amount: 1000 }, { amount: 3000 }, { amount: 5000 }, { amount: 10000 }];

function Donate(): React.JSX.Element {
  const [amount, setAmount] = useState<number | null>(2500);
  const [thanks, setThanks] = useState<number | null>(null);
  const shown = amount === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", minimumFractionDigits: amount % 100 === 0 ? 0 : 2 }).format(amount / 100);
  // The confirmation says the amount the way a person would, not in minor units.
  const received = thanks === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(thanks / 100);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (amount !== null) setThanks(amount);
      }}
      className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Support the Kestrel Food Bank</h2>
        <p className="text-xs text-muted-foreground">Choose an amount, or type your own between 5 and 500 EUR.</p>
      </div>
      <AmountPresets
        label="Donation amount"
        name="donation"
        presets={DONATIONS}
        suggested={2500}
        currency="EUR"
        min={500}
        max={50000}
        value={amount}
        onValueChange={(next) => {
          setAmount(next);
          setThanks(null);
        }}
      />
      <Button type="submit" disabled={amount === null}>
        {shown ? `Donate ${shown}` : "Choose an amount"}
      </Button>
      <div className="grid border-t border-border pt-4 text-xs text-muted-foreground">
        <p role="status">{received ? `Thank you. ${received} received.` : null}</p>
        {thanks !== null ? null : (
          <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{show(amount)}</code>
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
        <Example caption="Try it: pick a preset, then Other. Arrow keys move between the chips, and each amount says what it does">
          <Donate />
        </Example>
        <Example caption="An amount outside the limits is explained with both of them in words, and is never reported">
          <Left>
            <AmountPresets label="Donation amount" presets={DONATIONS} suggested={2500} min={500} max={50000} defaultValue={300} />
          </Left>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Nothing chosen yet, in dollars, with one preset marked in words">
          <AmountPresets label="Top-up amount" presets={TOP_UPS} suggested={2500} currency="USD" min={500} max={100000} />
        </Example>
        <Example caption="The currency decides the decimals: yen have none, so the field takes whole yen">
          <AmountPresets label="Top-up amount" presets={YEN} currency="JPY" locale="ja-JP" min={500} max={200000} defaultValue={3000} />
        </Example>
        <Example caption="Disabled">
          <AmountPresets label="Top-up amount" presets={TOP_UPS} currency="USD" disabled defaultValue={5000} />
        </Example>
      </div>
    </div>
  );
}
