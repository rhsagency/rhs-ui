"use client";

import { useState, type ReactNode } from "react";

import { SwapButton } from "@rhs-ui/primitives/swap-button";
import { swapValues } from "@rhs-ui/primitives/swap-button/swap-values";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A field with its label inside the box, so the seam between two of them is the middle of their parent. */
function Pane({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }): React.JSX.Element {
  return (
    <label className="grid min-w-0 gap-0.5 rounded-xl border border-border bg-card px-4 py-3 shadow-xs transition-[border-color,box-shadow] duration-150 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
      />
    </label>
  );
}

export default function Demo(): React.JSX.Element {
  const [trip, setTrip] = useState({ from: "Paris", to: "Berlin" });
  const [blank, setBlank] = useState({ from: "", to: "" });
  const [money, setMoney] = useState({ send: "1,000.00 EUR", receive: "1,084.20 USD" });

  return (
    <div className="grid w-full max-w-xl gap-9">
      <Example caption="Side by side: press it and both fields trade places. It sits on the seam without covering a word.">
        <div className="relative grid w-full grid-cols-2 gap-5">
          <Pane label="From" value={trip.from} onChange={(from) => setTrip((state) => ({ ...state, from }))} />
          <Pane label="To" value={trip.to} onChange={(to) => setTrip((state) => ({ ...state, to }))} />
          <SwapButton seam labelA="From" labelB="To" valueA={trip.from} valueB={trip.to} onSwap={() => setTrip((state) => swapValues(state, "from", "to"))} />
        </div>
      </Example>

      <Example caption="Stacked: the arrows turn to point up and down">
        <div className="relative grid w-full gap-7">
          <Pane label="You send" value={money.send} onChange={(send) => setMoney((state) => ({ ...state, send }))} />
          <Pane label="They receive" value={money.receive} onChange={(receive) => setMoney((state) => ({ ...state, receive }))} />
          <SwapButton seam orientation="vertical" labelA="You send" labelB="They receive" valueA={money.send} valueB={money.receive} onSwap={() => setMoney((state) => swapValues(state, "send", "receive"))} />
        </div>
      </Example>

      <Example caption="With both fields empty it disables itself and says why: hover or focus it, or type in a field">
        <div className="relative grid w-full grid-cols-2 gap-5">
          <Pane label="Origin" value={blank.from} placeholder="Add a city" onChange={(from) => setBlank((state) => ({ ...state, from }))} />
          <Pane label="Destination" value={blank.to} placeholder="Add a city" onChange={(to) => setBlank((state) => ({ ...state, to }))} />
          <SwapButton seam labelA="Origin" labelB="Destination" valueA={blank.from} valueB={blank.to} onSwap={() => setBlank((state) => swapValues(state, "from", "to"))} />
        </div>
      </Example>

      <Example caption="Three sizes, and a vertical one, on their own too">
        <div className="flex items-center gap-3">
          <SwapButton size="sm" labelA="Left" labelB="Right" onSwap={() => undefined} />
          <SwapButton labelA="Left" labelB="Right" onSwap={() => undefined} />
          <SwapButton size="lg" labelA="Left" labelB="Right" onSwap={() => undefined} />
          <SwapButton orientation="vertical" labelA="Top" labelB="Bottom" onSwap={() => undefined} />
        </div>
      </Example>
    </div>
  );
}
