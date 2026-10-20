import type { ReactNode } from "react";

import { ProductTile, ProductTileSkeleton, type ProductTileProduct } from "@rhs-ui/commerce/product-tile";

type Tone = { bg: string; floor: string; light: string; mid: string; dark: string };

const STONE: Tone = { bg: "#e6e1d8", floor: "#d9d3c8", light: "#cfc6b6", mid: "#a89d89", dark: "#7d735f" };
const CLAY: Tone = { bg: "#ead9cb", floor: "#dfc9b8", light: "#d49b7c", mid: "#b8704f", dark: "#8a4a31" };
const INK: Tone = { bg: "#d9dce0", floor: "#c9cdd2", light: "#6b7280", mid: "#3d4350", dark: "#232831" };
const SAGE: Tone = { bg: "#dfe3d8", floor: "#d0d6c6", light: "#b6c2a4", mid: "#8b9d78", dark: "#5f7050" };
const OAT: Tone = { bg: "#efe9dd", floor: "#e4dccb", light: "#e8dcc3", mid: "#c9b998", dark: "#9f8e69" };

/** A small studio shot drawn as an SVG data URI: a wall, a floor and one object standing on it. */
const shot = (t: Tone, scene: string, { scale = 1.2, shift = 0, back = "", defs = "" } = {}) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><filter id='b' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='7'/></filter><linearGradient id='g'><stop offset='0' stop-color='${t.light}'/><stop offset='.55' stop-color='${t.mid}'/><stop offset='1' stop-color='${t.dark}'/></linearGradient>${defs}</defs><rect width='400' height='500' fill='${t.bg}'/><rect y='372' width='400' height='128' fill='${t.floor}'/>${back}<g transform='translate(${200 + shift} 398) scale(${scale}) translate(-200 -398)'>${scene}</g></svg>`,
  );

const shadow = (cx: number, cy: number, rx: number) => `<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='11' fill='#000' opacity='.2' filter='url(#b)'/>`;
const VASE = "M180 96H220V148C220 176 276 196 278 280C280 340 262 380 250 412H150C138 380 120 340 122 280C124 196 180 176 180 148Z";

const vase = (t: Tone, stems = false) =>
  shot(
    t,
    `${shadow(204, 416, 92)}
     ${stems ? `<g fill='none' stroke='${t.dark}' stroke-linecap='round' stroke-width='2.5'><path d='M200 96C196 60 178 34 160 12'/><path d='M200 96C204 58 226 36 250 20'/><path d='M200 96C200 64 206 34 204 4'/></g><g fill='${t.mid}'><ellipse cx='160' cy='14' rx='5' ry='10' transform='rotate(-30 160 14)'/><ellipse cx='250' cy='22' rx='5' ry='10' transform='rotate(32 250 22)'/><ellipse cx='204' cy='6' rx='5' ry='10'/><ellipse cx='176' cy='38' rx='4' ry='8' transform='rotate(-34 176 38)'/><ellipse cx='228' cy='44' rx='4' ry='8' transform='rotate(30 228 44)'/></g>` : ""}
     <path d='${VASE}' fill='url(#g)'/><clipPath id='c'><path d='${VASE}'/></clipPath>
     <g clip-path='url(#c)' fill='none' stroke='${t.dark}' stroke-opacity='.22' stroke-width='3'><path d='M100 226Q200 244 300 226'/><path d='M100 258Q200 276 300 258'/><path d='M100 290Q200 308 300 290'/><path d='M100 322Q200 340 300 322'/><path d='M100 354Q200 372 300 354'/></g>
     <ellipse cx='200' cy='96' rx='20' ry='4.5' fill='${t.dark}' opacity='.85'/>
     <path d='M143 292C142 250 156 218 180 196' fill='none' stroke='#fff' stroke-opacity='.4' stroke-width='6' stroke-linecap='round'/>`,
    { scale: stems ? 0.95 : 1.2 },
  );

const lamp = (t: Tone, lit = false) =>
  shot(
    t,
    `${shadow(176, 392, 84)}
     <ellipse cx='176' cy='384' rx='56' ry='11' fill='${t.dark}'/><ellipse cx='176' cy='380' rx='56' ry='10' fill='${t.mid}'/>
     <path d='M176 380V240C176 156 262 126 290 176' fill='none' stroke='${t.dark}' stroke-width='9' stroke-linecap='round'/>
     <path d='M226 180a64 64 0 0 1 128 0z' fill='url(#g)'/><ellipse cx='290' cy='180' rx='64' ry='8' fill='${t.dark}' opacity='.55'/><ellipse cx='290' cy='184' rx='46' ry='5' fill='#fff' opacity='.5'/>`,
    {
      scale: 1.1,
      shift: -26,
      defs: "<radialGradient id='w' cx='.5' cy='.2' r='.5'><stop offset='0' stop-color='#fff3c9' stop-opacity='.95'/><stop offset='1' stop-color='#fff3c9' stop-opacity='0'/></radialGradient>",
      back: lit ? "<ellipse cx='262' cy='330' rx='230' ry='260' fill='url(#w)' opacity='.7'/>" : "",
    },
  );

const bowl = (t: Tone, lemons = false) =>
  shot(
    t,
    `${shadow(204, 392, 120)}
     <path d='M82 236H318C318 326 268 382 200 382C132 382 82 326 82 236Z' fill='url(#g)'/>
     <ellipse cx='200' cy='236' rx='118' ry='24' fill='${t.dark}'/><ellipse cx='200' cy='240' rx='106' ry='18' fill='${t.mid}' opacity='.9'/>
     ${lemons ? `<circle cx='164' cy='226' r='30' fill='#e9c64f'/><circle cx='222' cy='222' r='32' fill='#e2b93f'/><circle cx='194' cy='200' r='30' fill='#f0d45f'/><path d='M180 188q8-10 20-6' stroke='#6f7d3b' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M92 236C94 262 104 286 120 304H280C296 286 306 262 308 236C270 262 130 262 92 236Z' fill='url(#g)'/>` : ""}
     <rect x='160' y='378' width='80' height='10' rx='4' fill='${t.dark}'/>
     <path d='M110 270C118 306 138 332 166 350' fill='none' stroke='#fff' stroke-opacity='.4' stroke-width='6' stroke-linecap='round'/>`,
    { scale: 1.12 },
  );

const throwBlanket = (t: Tone) =>
  shot(
    t,
    `${shadow(200, 398, 140)}
     <rect x='70' y='300' width='260' height='92' rx='10' fill='${t.dark}'/><rect x='62' y='238' width='276' height='72' rx='10' fill='${t.mid}'/><rect x='76' y='178' width='248' height='68' rx='10' fill='${t.light}'/>
     <g stroke='#fff' stroke-opacity='.45' stroke-width='3'><path d='M62 262H338'/><path d='M62 272H338'/><path d='M76 202H324'/></g>
     <g stroke='${t.dark}' stroke-opacity='.5' stroke-width='2' stroke-linecap='round'>${Array.from({ length: 21 }, (_, i) => `<path d='M${74 + i * 12.5} 392v10'/>`).join("")}</g>`,
    { scale: 1.05 },
  );

const EUR = (amount: number) => ({ amount, currency: "EUR" });

const RIDGE: ProductTileProduct = {
  title: "Ridge vase, hand-thrown stoneware",
  href: "#ridge-vase",
  image: { src: vase(STONE), alt: "Ridge vase in warm stone" },
  hoverImage: { src: vase(STONE, true), alt: "" },
  price: EUR(5400),
  compareAtPrice: EUR(6800),
};
const ARC: ProductTileProduct = {
  title: "Arc table lamp",
  href: "#arc-lamp",
  image: { src: lamp(INK), alt: "Arc table lamp in ink black" },
  hoverImage: { src: lamp(INK, true), alt: "" },
  price: EUR(12900),
};
const TERRA: ProductTileProduct = {
  title: "Terra serving bowl",
  href: "#terra-bowl",
  image: { src: bowl(CLAY), alt: "Terracotta serving bowl" },
  hoverImage: { src: bowl(CLAY, true), alt: "" },
  price: EUR(4600),
};
const THROW: ProductTileProduct = {
  title: "Linen throw, sage",
  href: "#linen-throw",
  image: { src: throwBlanket(SAGE), alt: "Folded linen throw in sage green" },
  price: EUR(8900),
  soldOut: true,
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl min-w-0 grid-cols-[minmax(0,1fr)] gap-y-10">
      <Example caption="Hover a tile, or Tab to it, for the second picture. A sold-out tile says so.">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
          <li>
            <ProductTile product={RIDGE} badge="-20%" locale="en-GB" priority />
          </li>
          <li>
            <ProductTile product={ARC} badge="New" locale="en-GB" priority />
          </li>
          <li>
            <ProductTile product={TERRA} locale="en-GB" priority />
          </li>
          <li>
            <ProductTile product={THROW} locale="en-GB" priority />
          </li>
        </ul>
      </Example>

      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
        <Example caption="Any ratio: here a square">
          <ul className="grid grid-cols-2 gap-x-5">
            <li>
              <ProductTile product={{ title: "Alder serving bowl", href: "#alder-bowl", image: { src: bowl(OAT), alt: "Serving bowl in oat" }, price: EUR(3800) }} ratio={1} locale="en-GB" />
            </li>
            <li>
              <ProductTile product={{ title: "Halcyon desk lamp", href: "#halcyon", image: { src: lamp(STONE), alt: "Desk lamp in stone" }, price: EUR(9400), compareAtPrice: EUR(11900) }} ratio={1} locale="en-GB" />
            </li>
          </ul>
        </Example>
        <Example caption="Loading: the same space, so the grid never shifts">
          <div aria-hidden="true" className="grid grid-cols-2 gap-x-5">
            <ProductTileSkeleton ratio={1} />
            <ProductTileSkeleton ratio={1} />
          </div>
        </Example>
      </div>
    </div>
  );
}
