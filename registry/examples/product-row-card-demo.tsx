"use client";

import { useState } from "react";

import { IconHeart } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ProductRowCard, ProductRowCardSkeleton, type ProductRowCardProduct } from "@rhs-ui/commerce/product-row-card";

type Tone = { bg: string; floor: string; light: string; mid: string; dark: string };

const STONE: Tone = { bg: "#e6e1d8", floor: "#d9d3c8", light: "#cfc6b6", mid: "#a89d89", dark: "#7d735f" };
const INK: Tone = { bg: "#d9dce0", floor: "#c9cdd2", light: "#6b7280", mid: "#3d4350", dark: "#232831" };
const SAGE: Tone = { bg: "#dfe3d8", floor: "#d0d6c6", light: "#b6c2a4", mid: "#8b9d78", dark: "#5f7050" };

/** A small studio shot drawn as an SVG data URI: a wall, a floor and one object standing on it. */
const shot = (t: Tone, scene: string, scale: number, shift = 0) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><filter id='b' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='7'/></filter><linearGradient id='g'><stop offset='0' stop-color='${t.light}'/><stop offset='.55' stop-color='${t.mid}'/><stop offset='1' stop-color='${t.dark}'/></linearGradient></defs><rect width='400' height='500' fill='${t.bg}'/><rect y='372' width='400' height='128' fill='${t.floor}'/><g transform='translate(${200 + shift} 398) scale(${scale}) translate(-200 -398)'>${scene}</g></svg>`,
  );

const shadow = (cx: number, cy: number, rx: number) => `<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='11' fill='#000' opacity='.2' filter='url(#b)'/>`;
const VASE = "M180 96H220V148C220 176 276 196 278 280C280 340 262 380 250 412H150C138 380 120 340 122 280C124 196 180 176 180 148Z";

const vase = (t: Tone) =>
  shot(
    t,
    `${shadow(204, 416, 92)}<path d='${VASE}' fill='url(#g)'/><clipPath id='c'><path d='${VASE}'/></clipPath>
     <g clip-path='url(#c)' fill='none' stroke='${t.dark}' stroke-opacity='.22' stroke-width='3'><path d='M100 226Q200 244 300 226'/><path d='M100 258Q200 276 300 258'/><path d='M100 290Q200 308 300 290'/><path d='M100 322Q200 340 300 322'/><path d='M100 354Q200 372 300 354'/></g>
     <ellipse cx='200' cy='96' rx='20' ry='4.5' fill='${t.dark}' opacity='.85'/><path d='M143 292C142 250 156 218 180 196' fill='none' stroke='#fff' stroke-opacity='.4' stroke-width='6' stroke-linecap='round'/>`,
    1,
  );

const lamp = (t: Tone) =>
  shot(
    t,
    `${shadow(176, 392, 84)}<ellipse cx='176' cy='384' rx='56' ry='11' fill='${t.dark}'/><ellipse cx='176' cy='380' rx='56' ry='10' fill='${t.mid}'/>
     <path d='M176 380V240C176 156 262 126 290 176' fill='none' stroke='${t.dark}' stroke-width='9' stroke-linecap='round'/>
     <path d='M226 180a64 64 0 0 1 128 0z' fill='url(#g)'/><ellipse cx='290' cy='180' rx='64' ry='8' fill='${t.dark}' opacity='.55'/><ellipse cx='290' cy='184' rx='46' ry='5' fill='#fff' opacity='.5'/>`,
    1,
    -22,
  );

const throwBlanket = (t: Tone) =>
  shot(
    t,
    `${shadow(200, 398, 140)}<rect x='70' y='300' width='260' height='92' rx='10' fill='${t.dark}'/><rect x='62' y='238' width='276' height='72' rx='10' fill='${t.mid}'/><rect x='76' y='178' width='248' height='68' rx='10' fill='${t.light}'/>
     <g stroke='#fff' stroke-opacity='.45' stroke-width='3'><path d='M62 262H338'/><path d='M62 272H338'/><path d='M76 202H324'/></g>
     <g stroke='${t.dark}' stroke-opacity='.5' stroke-width='2' stroke-linecap='round'>${Array.from({ length: 21 }, (_, i) => `<path d='M${74 + i * 12.5} 392v10'/>`).join("")}</g>`,
    1,
  );

const EUR = (amount: number) => ({ amount, currency: "EUR" });

const PRODUCTS: ProductRowCardProduct[] = [
  {
    id: "ridge-vase",
    title: "Ridge vase, hand-thrown stoneware",
    image: { src: vase(STONE), alt: "Ridge vase in warm stone" },
    rating: { value: 4.8, count: 212 },
    description: "Thrown on a wheel in small batches and finished with a matte glaze, so no two ridges are quite the same. Holds a bunch of stems or stands alone.",
    attributes: ["Stoneware", "28 cm tall", "Dishwasher safe"],
    price: EUR(5400),
    compareAtPrice: EUR(6800),
    stock: { status: "in-stock" },
  },
  {
    id: "arc-lamp",
    title: "Arc table lamp",
    image: { src: lamp(INK), alt: "Arc table lamp in ink black" },
    rating: { value: 4.6, count: 86 },
    description: "A slim steel arm that reaches over a desk or a bedside table, with a dimmer on the cord and a shade that keeps the light on the page.",
    attributes: ["Powder-coated steel", "E27 bulb", "Dimmable"],
    price: EUR(12900),
    stock: { status: "low-stock", left: 3 },
  },
  {
    id: "linen-throw",
    title: "Linen throw, sage",
    image: { src: throwBlanket(SAGE), alt: "Folded linen throw in sage green" },
    rating: { value: 4.9, count: 41 },
    description: "Stonewashed European linen that gets softer with every wash, finished with a hand-knotted fringe.",
    attributes: ["100% linen", "130 × 180 cm"],
    price: EUR(8900),
    stock: { status: "sold-out" },
  },
];

function Save({ name }: { name: string }): React.JSX.Element {
  const [saved, setSaved] = useState(false);
  return (
    <Button type="button" variant="outline" size="icon-sm" aria-label={`Save ${name} to your wishlist`} aria-pressed={saved} onClick={() => setSaved((value) => !value)} className="max-sm:size-10">
      <IconHeart fill={saved ? "currentColor" : "none"} />
    </Button>
  );
}

export default function Demo(): React.JSX.Element {
  const [added, setAdded] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-3xl min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      {PRODUCTS.map((product, index) => (
        <ProductRowCard
          key={product.id}
          product={product}
          href={`#${product.id}`}
          locale="en-GB"
          badge={index === 0 ? "Bestseller" : undefined}
          wishlist={<Save name={product.title} />}
          onAddToCart={async (item) => {
            await new Promise((resolve) => setTimeout(resolve, 700));
            setAdded(item.title);
          }}
        />
      ))}
      <ProductRowCardSkeleton />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {added ? `Added to your cart: ${added}.` : "The title is the link; Add to cart and the heart are their own controls. The last card is the skeleton."}
      </p>
    </div>
  );
}
