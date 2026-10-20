"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { formatMoney, multiplyMoney } from "@rhs-ui/commerce/money";
import { QuantityStepper } from "@rhs-ui/commerce/quantity-stepper";

type Tone = { bg: string; floor: string; light: string; mid: string; dark: string };

const STONE: Tone = { bg: "#e6e1d8", floor: "#d9d3c8", light: "#cfc6b6", mid: "#a89d89", dark: "#7d735f" };
const VASE = "M180 96H220V148C220 176 276 196 278 280C280 340 262 380 250 412H150C138 380 120 340 122 280C124 196 180 176 180 148Z";

/** A small studio shot of the vase, drawn as an SVG data URI. */
const vase = (t: Tone) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><filter id='b' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='7'/></filter><linearGradient id='g'><stop offset='0' stop-color='${t.light}'/><stop offset='.55' stop-color='${t.mid}'/><stop offset='1' stop-color='${t.dark}'/></linearGradient></defs><rect width='400' height='500' fill='${t.bg}'/><rect y='372' width='400' height='128' fill='${t.floor}'/><g transform='translate(200 398) scale(1) translate(-200 -398)'><ellipse cx='204' cy='416' rx='92' ry='11' fill='#000' opacity='.2' filter='url(#b)'/><path d='${VASE}' fill='url(#g)'/><ellipse cx='200' cy='96' rx='20' ry='4.5' fill='${t.dark}' opacity='.85'/><path d='M143 292C142 250 156 218 180 196' fill='none' stroke='#fff' stroke-opacity='.4' stroke-width='6' stroke-linecap='round'/></g></svg>`,
  );

const PRICE = { amount: 5400, currency: "EUR" };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A cart line: one is the lowest, so the minus turns into a trash button, and five is all there is in stock. */
function CartLine(): React.JSX.Element {
  const [quantity, setQuantity] = useState(1);
  const [removed, setRemoved] = useState(false);
  if (removed) {
    return (
      <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm" role="status">
        <span className="text-muted-foreground">Ridge vase removed from your cart.</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setQuantity(1);
            setRemoved(false);
          }}
        >
          Undo
        </Button>
      </div>
    );
  }
  return (
    <div className="flex w-full gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
      {/* eslint-disable-next-line @next/next/no-img-element -- a demo picture drawn as a data URI */}
      <img src={vase(STONE)} alt="" width={64} height={80} className="size-16 shrink-0 rounded-lg object-cover" />
      <div className="grid min-w-0 flex-1 gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Ridge vase</p>
            <p className="text-xs text-muted-foreground tabular-nums">Warm stone · {formatMoney(PRICE, "en-GB")} each</p>
          </div>
          <p className="text-sm font-medium tabular-nums">{formatMoney(multiplyMoney(PRICE, quantity), "en-GB")}</p>
        </div>
        <QuantityStepper size="sm" label="Quantity of Ridge vase" value={quantity} onChange={setQuantity} stockLimit={5} removeAtMin onRemove={() => setRemoved(true)} />
      </div>
    </div>
  );
}

/** A cart that takes a moment to answer: the stepper covers the number with a spinner and ignores presses until it does. */
function SlowCart(): React.JSX.Element {
  const [quantity, setQuantity] = useState(2);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <QuantityStepper
        label="Quantity of Arc table lamp"
        value={quantity}
        busy={busy}
        max={10}
        onChange={(next) => {
          setBusy(true);
          timer.current = window.setTimeout(() => {
            setQuantity(next);
            setBusy(false);
          }, 900);
        }}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {busy ? "Updating your cart…" : `${quantity} in your cart. The size and the focus never move.`}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [bottles, setBottles] = useState(12);
  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
      <Example caption="A cart line: at one the minus is a trash button; hold plus to count up">
        <CartLine />
      </Example>

      <Example caption="Packs of six: every press moves by a pack, typing snaps to one">
        <QuantityStepper label="Quantity of Ginger cola" value={bottles} onChange={setBottles} min={6} step={6} max={60} />
        <p className="text-xs text-muted-foreground tabular-nums">
          {bottles} bottles, {bottles / 6} packs
        </p>
      </Example>

      <Example caption="Busy: the cart is updating">
        <SlowCart />
      </Example>

      <Example caption="At the stock limit: plus is disabled and the note says why">
        <QuantityStepper label="Quantity of Hearth candle" defaultValue={3} stockLimit={3} />
      </Example>

      <Example caption="Sizes: small and medium">
        <div className="flex items-center gap-4">
          <QuantityStepper size="sm" label="Quantity, small" defaultValue={1} max={9} />
          <QuantityStepper size="md" label="Quantity, medium" defaultValue={1} max={9} />
        </div>
      </Example>

      <Example caption="Disabled">
        <QuantityStepper label="Quantity, disabled" defaultValue={2} disabled />
      </Example>
    </div>
  );
}
