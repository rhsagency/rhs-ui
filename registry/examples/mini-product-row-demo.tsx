"use client";

import { useState, type ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { formatMoney, sumMoney } from "@rhs-ui/commerce/money";
import { MiniProductRow, type MiniProductRowProduct } from "@rhs-ui/commerce/mini-product-row";

type Tone = { bg: string; floor: string; light: string; mid: string; dark: string; wax?: string };

const STONE: Tone = { bg: "#e6e1d8", floor: "#d9d3c8", light: "#cfc6b6", mid: "#a89d89", dark: "#7d735f" };
const CLAY: Tone = { bg: "#ead9cb", floor: "#dfc9b8", light: "#d49b7c", mid: "#b8704f", dark: "#8a4a31" };
const INK: Tone = { bg: "#d9dce0", floor: "#c9cdd2", light: "#6b7280", mid: "#3d4350", dark: "#232831" };
const SAND: Tone = { bg: "#ece3d4", floor: "#e0d4bf", light: "#e4cfa9", mid: "#c7a876", dark: "#8f7449", wax: "#f3e7cf" };

/** A small studio shot drawn as an SVG data URI: a wall, a floor and one object standing on it. */
const shot = (t: Tone, scene: string, scale: number, shift = 0) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><filter id='b' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='7'/></filter><linearGradient id='g'><stop offset='0' stop-color='${t.light}'/><stop offset='.55' stop-color='${t.mid}'/><stop offset='1' stop-color='${t.dark}'/></linearGradient></defs><rect width='400' height='500' fill='${t.bg}'/><rect y='372' width='400' height='128' fill='${t.floor}'/><g transform='translate(${200 + shift} 398) scale(${scale}) translate(-200 -398)'>${scene}</g></svg>`,
  );

const shadow = (cx: number, cy: number, rx: number) => `<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='11' fill='#000' opacity='.2' filter='url(#b)'/>`;
const VASE = "M180 96H220V148C220 176 276 196 278 280C280 340 262 380 250 412H150C138 380 120 340 122 280C124 196 180 176 180 148Z";

const vase = (t: Tone) =>
  shot(t, `${shadow(204, 416, 92)}<path d='${VASE}' fill='url(#g)'/><ellipse cx='200' cy='96' rx='20' ry='4.5' fill='${t.dark}' opacity='.85'/><path d='M143 292C142 250 156 218 180 196' fill='none' stroke='#fff' stroke-opacity='.4' stroke-width='6' stroke-linecap='round'/>`, 1);

const lamp = (t: Tone) =>
  shot(
    t,
    `${shadow(176, 392, 84)}<ellipse cx='176' cy='384' rx='56' ry='11' fill='${t.dark}'/><path d='M176 380V240C176 156 262 126 290 176' fill='none' stroke='${t.dark}' stroke-width='9' stroke-linecap='round'/><path d='M226 180a64 64 0 0 1 128 0z' fill='url(#g)'/>`,
    1,
    -22,
  );

const bowl = (t: Tone) =>
  shot(
    t,
    `${shadow(204, 392, 120)}<path d='M82 236H318C318 326 268 382 200 382C132 382 82 326 82 236Z' fill='url(#g)'/><ellipse cx='200' cy='236' rx='118' ry='24' fill='${t.dark}'/><ellipse cx='200' cy='240' rx='106' ry='18' fill='${t.mid}' opacity='.9'/><rect x='160' y='378' width='80' height='10' rx='4' fill='${t.dark}'/>`,
    1,
  );

const candle = (t: Tone) =>
  shot(
    t,
    `${shadow(202, 386, 88)}<rect x='130' y='216' width='140' height='168' rx='26' fill='url(#g)'/><rect x='140' y='252' width='120' height='124' rx='18' fill='${t.wax}'/><ellipse cx='200' cy='254' rx='60' ry='9' fill='#fff' opacity='.35'/>
     <path d='M200 252V236' stroke='${t.dark}' stroke-width='3' stroke-linecap='round'/><path d='M200 190C188 206 189 226 200 233C211 226 212 206 200 190Z' fill='#e9b665'/><rect x='166' y='306' width='68' height='44' rx='3' fill='#fbf8f2'/><rect x='176' y='318' width='48' height='4' rx='2' fill='${t.dark}' opacity='.75'/>`,
    1.2,
  );

const EUR = (amount: number) => ({ amount, currency: "EUR" });

const RIDGE: MiniProductRowProduct = { title: "Ridge vase", image: { src: vase(STONE), alt: "" }, subtitle: "Warm stone · 28 cm", price: EUR(5400), compareAtPrice: EUR(6800), badge: "-20%" };
const ARC: MiniProductRowProduct = { title: "Arc table lamp", image: { src: lamp(INK), alt: "" }, subtitle: "Ink black · E27, dimmable", price: EUR(12900) };
const TERRA: MiniProductRowProduct = { title: "Terra serving bowl", image: { src: bowl(CLAY), alt: "" }, subtitle: "Terracotta · 24 cm", price: EUR(4600) };
const HEARTH: MiniProductRowProduct = { title: "Hearth candle, cedar and amber", image: { src: candle(SAND), alt: "" }, subtitle: "Only 4 left · 220 g", price: EUR(3400) };
const THROW: MiniProductRowProduct = { title: "Linen throw, sage", subtitle: "130 × 180 cm", price: EUR(8900), soldOut: true };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const panel = "rounded-xl border border-border bg-card p-1.5 shadow-xs";

export default function Demo(): React.JSX.Element {
  const bundle = [RIDGE, TERRA, HEARTH];
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set(["Ridge vase", "Hearth candle, cedar and amber"]));
  const [wishlist, setWishlist] = useState<MiniProductRowProduct[]>([ARC, THROW, TERRA]);
  const total = sumMoney(
    bundle.filter((product) => picked.has(product.title)).flatMap((product) => (product.price ? [product.price] : [])),
    "EUR",
  );

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="Search suggestions: each row is a link">
        <div className={panel}>
          <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">Popular right now</p>
          <ul>
            {[RIDGE, ARC, TERRA, HEARTH].map((product) => (
              <li key={product.title}>
                <MiniProductRow product={product} href="#product" locale="en-GB" />
              </li>
            ))}
          </ul>
        </div>
      </Example>

      <Example caption="A picker: each row is a button you can choose">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <div role="group" aria-label="Bundle" className={panel}>
            {bundle.map((product) => (
              <MiniProductRow
                key={product.title}
                product={product}
                locale="en-GB"
                selected={picked.has(product.title)}
                onClick={() =>
                  setPicked((current) => {
                    const next = new Set(current);
                    if (!next.delete(product.title)) next.add(product.title);
                    return next;
                  })
                }
              />
            ))}
          </div>
          <p className="flex items-baseline justify-between px-1 text-sm" aria-live="polite">
            <span className="text-muted-foreground">{picked.size} chosen</span>
            <span className="font-medium tabular-nums">{formatMoney(total, "en-GB")}</span>
          </p>
        </div>
      </Example>

      <Example caption="A wishlist: a link row with its own remove button, a placeholder, a sold-out row, size sm">
        <div className={panel}>
          {wishlist.length ? (
            <ul>
              {wishlist.map((product) => (
                <li key={product.title}>
                  <MiniProductRow
                    product={product}
                    href="#product"
                    size="sm"
                    locale="en-GB"
                    trailing={
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${product.title} from your wishlist`} onClick={() => setWishlist((items) => items.filter((item) => item !== product))}>
                        <IconClose />
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-center gap-3 px-3 py-6 text-center text-sm text-muted-foreground">
              <p>Your wishlist is empty.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setWishlist([ARC, THROW, TERRA])}>
                Restore the list
              </Button>
            </div>
          )}
        </div>
      </Example>
    </div>
  );
}
