"use client";

import { useId, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { BasePrice, type BasePriceLabels, type BasePriceUnit } from "@rhs-ui/commerce/base-price";
import { formatMoney } from "@rhs-ui/commerce/money";

interface Line {
  name: string;
  /** What the shelf says about the pack. */
  pack: string;
  /** The price of one pack, in minor units. */
  price: number;
  amount: number;
  unit: BasePriceUnit;
  count?: number;
  showContent?: boolean;
}

const LINES: Line[] = [
  { name: "Dark chocolate 85%", pack: "100 g bar", price: 279, amount: 100, unit: "g" },
  { name: "Rolled oats", pack: "500 g bag", price: 249, amount: 500, unit: "g" },
  { name: "Extra virgin olive oil", pack: "750 ml bottle", price: 995, amount: 750, unit: "ml" },
  { name: "Ginger cola", pack: "6 cans", price: 449, amount: 330, unit: "ml", count: 6, showContent: true },
  { name: "Garden twine", pack: "20 m reel", price: 1350, amount: 20, unit: "m" },
  { name: "Sponge cloths", pack: "12 in a pack", price: 540, amount: 12, unit: "piece" },
];

const PACKS = [
  { value: "250", label: "250 g", amount: 250, price: 149 },
  { value: "500", label: "500 g", amount: 500, price: 249 },
  { value: "1000", label: "1 kg", amount: 1000, price: 399 },
];

function Example({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The product link is described by the base price: a screen reader hears "Rolled oats, link, 4.98 per kg". */
function Shelf({ line, locale = "en-GB", currency = "EUR", labels }: { line: Line; locale?: string; currency?: string; labels?: BasePriceLabels }): React.JSX.Element {
  const id = useId();
  return (
    <li className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <a href="#product" aria-describedby={id} className="text-sm font-medium outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/40">
          {line.name}
        </a>
        <p className="text-xs text-muted-foreground">{line.pack}</p>
      </div>
      <div className="grid shrink-0 justify-items-end gap-0.5 text-right">
        <p className="text-sm font-medium tabular-nums">{formatMoney({ amount: line.price, currency }, locale)}</p>
        <BasePrice id={id} price={line.price} amount={line.amount} unit={line.unit} count={line.count} showContent={line.showContent} currency={currency} locale={locale} labels={labels} />
      </div>
    </li>
  );
}

export default function Demo(): React.JSX.Element {
  const [size, setSize] = useState("500");
  const pack = PACKS.find((item) => item.value === size) ?? PACKS[1]!;
  const priceId = useId();
  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-12 gap-y-9 md:grid-cols-2">
      <Example caption="Choose a pack: the base price follows, per kg for every size so they compare">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="grid gap-0.5">
            <h2 className="text-sm font-medium">Rolled oats</h2>
            <p className="text-xs text-muted-foreground">Kestrel Mill, whole grain</p>
          </div>
          <SegmentedControl label="Pack size" value={size} onValueChange={setSize} options={PACKS.map(({ value, label }) => ({ value, label }))} className="w-full [&>button]:flex-1" />
          <div className="grid gap-0.5" aria-describedby={priceId}>
            <p className="text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums">{formatMoney({ amount: pack.price, currency: "EUR" }, "en-GB")}</p>
            <BasePrice id={priceId} price={pack.price} amount={pack.amount} unit="g" per={1000} locale="en-GB" />
          </div>
        </div>
      </Example>

      <Example caption="Worked out for you: per 100 up to 250, then per kg or litre; half cents round up" className="md:col-start-2 md:row-span-3 md:row-start-1">
        <ul className="divide-y divide-border border-y border-border">
          {LINES.map((line) => (
            <Shelf key={line.name} line={line} />
          ))}
        </ul>
      </Example>

      <Example caption="In your language: the figure follows the locale, the words follow labels">
        <ul className="divide-y divide-border border-y border-border">
          <Shelf line={LINES[2]!} locale="nl-NL" labels={{ litre: "liter" }} />
          <Shelf line={LINES[2]!} locale="de-DE" labels={{ per: "pro", litre: "Liter" }} />
        </ul>
      </Example>

      <Example caption="Not enough data: it renders nothing, never a guess">
        <div className="grid gap-0.5 rounded-xl border border-dashed border-border p-4">
          <p className="text-sm font-medium tabular-nums">€2.49</p>
          <BasePrice price={249} amount={0} unit="g" locale="en-GB" />
          <p className="text-xs text-muted-foreground">No pack size, so there is no base price line.</p>
        </div>
      </Example>
    </div>
  );
}
