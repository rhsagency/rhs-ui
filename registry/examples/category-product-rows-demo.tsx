"use client";

import { useState } from "react";

import { CategoryProductRows, type CategoryRow, type ProductCardProduct } from "@rhs-ui/commerce/category-product-rows";

const art = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><rect width='400' height='500' fill='${bg}'/><ellipse cx='200' cy='410' rx='130' ry='11' fill='#000' opacity='.07'/>${body}</svg>`);

/** A knife lying at an angle: handle, bolster and a blade of the given length. */
const knife = (bg: string, handle: string, length: number, blade = "#cdd2d8") => {
  const x0 = -(length + 78) / 2;
  const bx = x0 + 78;
  return art(
    bg,
    `<g transform='translate(200 255) rotate(-34)'><rect x='${x0}' y='-17' width='80' height='36' rx='13' fill='${handle}'/><circle cx='${x0 + 20}' cy='1' r='3.2' fill='#d7b97a'/><circle cx='${x0 + 42}' cy='1' r='3.2' fill='#d7b97a'/><rect x='${x0 + 74}' y='-20' width='9' height='42' rx='2' fill='#9aa1a8'/><path d='M${bx} -20 H${bx + length} C${bx + length - 26} 14 ${bx + length - 110} 26 ${bx} 26 Z' fill='${blade}'/><path d='M${bx + 6} -14 H${bx + length - 14}' stroke='#fff' stroke-opacity='.55' stroke-width='3' stroke-linecap='round'/></g>`,
  );
};

const pan = art("#e4e3df", "<circle cx='178' cy='250' r='116' fill='#3b3e43'/><circle cx='178' cy='250' r='96' fill='#2b2d31'/><circle cx='178' cy='250' r='96' fill='none' stroke='#4b4f55' stroke-width='3'/><rect x='282' y='240' width='104' height='22' rx='11' fill='#7a6650'/>");
const casserole = (color: string, inner: string) =>
  art("#ebe8e2", `<rect x='60' y='236' width='42' height='20' rx='10' fill='${inner}'/><rect x='298' y='236' width='42' height='20' rx='10' fill='${inner}'/><circle cx='200' cy='246' r='124' fill='${color}'/><circle cx='200' cy='246' r='100' fill='${inner}' opacity='.35'/><circle cx='200' cy='246' r='22' fill='${inner}'/><circle cx='200' cy='246' r='22' fill='none' stroke='#fff' stroke-opacity='.25' stroke-width='3'/>`);
const saucepan = art("#e9e4dd", "<circle cx='170' cy='250' r='104' fill='#b87450'/><circle cx='170' cy='250' r='84' fill='#d19470'/><circle cx='170' cy='250' r='84' fill='none' stroke='#a2603c' stroke-width='3'/><rect x='268' y='238' width='112' height='24' rx='12' fill='#2f2b28'/><circle cx='372' cy='250' r='4' fill='#9a948c'/>");
const tin = art("#e6e8ea", "<rect x='52' y='168' width='296' height='176' rx='26' fill='#f4f5f6' stroke='#8d97a3' stroke-width='12'/><rect x='84' y='198' width='232' height='116' rx='14' fill='#dfe2e6'/><path d='M120 232h160M120 262h120' stroke='#c3c8ce' stroke-width='6' stroke-linecap='round'/>");
const apron = (cloth: string, stitch: string) =>
  art("#ebe7e0", `<path d='M150 128c0-52 100-52 100 0' fill='none' stroke='${stitch}' stroke-width='10' stroke-linecap='round'/><path d='M130 126h140l30 28-10 232H110L100 154z' fill='${cloth}'/><path d='M130 126l-30 28M270 126l30 28' stroke='${stitch}' stroke-opacity='.5' stroke-width='3'/><rect x='146' y='286' width='108' height='64' rx='8' fill='none' stroke='${stitch}' stroke-opacity='.55' stroke-width='4' stroke-dasharray='9 7'/>`);
const towels = art(
  "#e6e9e3",
  "<rect x='96' y='300' width='208' height='76' rx='6' fill='#cfd6c9'/><rect x='88' y='236' width='224' height='76' rx='6' fill='#dde2d7'/><rect x='80' y='170' width='240' height='76' rx='6' fill='#eceee8'/><path d='M80 196h240M80 220h240' stroke='#8d9a87' stroke-width='5'/><path d='M88 262h224M88 286h224' stroke='#8d9a87' stroke-width='5' opacity='.8'/>",
);
const runner = art(
  "#ede9e1",
  "<path d='M40 210h320v90H40z' fill='#d8cfbf'/><path d='M40 232h320M40 278h320' stroke='#a99a80' stroke-width='5'/><path d='M40 210v90M360 210v90' stroke='#a99a80' stroke-width='3' stroke-dasharray='3 4'/><path d='M40 300v26M52 300v20M64 300v28M76 300v22M88 300v26M100 300v20M112 300v28M124 300v22M136 300v26M148 300v20M160 300v28M172 300v22M184 300v26M196 300v20M208 300v28M220 300v22M232 300v26M244 300v20M256 300v28M268 300v22M280 300v26M292 300v20M304 300v28M316 300v22M328 300v26M340 300v20M352 300v28' stroke='#c2b59d' stroke-width='3' stroke-linecap='round'/>",
);

const CHEF: ProductCardProduct = {
  id: "kestrel-chef",
  title: "Kestrel chef's knife",
  subtitle: "Forged steel, 20 cm",
  href: "#chef-knife",
  image: { src: knife("#e7e5df", "#2c2724", 210), alt: "Chef's knife with a dark handle and a long forged blade", width: 400, height: 500 },
  price: 129,
  currency: "EUR",
  locale: "en-GB",
  badge: "New",
  variants: [
    { id: "18", label: "18 cm" },
    { id: "20", label: "20 cm" },
    { id: "24", label: "24 cm" },
  ],
};

const PARING: ProductCardProduct = {
  id: "halcyon-paring",
  title: "Halcyon paring knife",
  subtitle: "Olive wood, 9 cm",
  href: "#paring-knife",
  image: { src: knife("#e5e6e1", "#8a6a43", 118), alt: "Small paring knife with an olive wood handle", width: 400, height: 500 },
  price: 59,
  currency: "EUR",
  locale: "en-GB",
};

const BREAD: ProductCardProduct = {
  id: "bread-knife",
  title: "Serrated bread knife",
  subtitle: "Steel and walnut, 24 cm",
  href: "#bread-knife",
  image: { src: knife("#e8e4de", "#4a3a2e", 240), alt: "Long bread knife with a walnut handle", width: 400, height: 500 },
  price: 89,
  compareAtPrice: "€109.00",
  currency: "EUR",
  locale: "en-GB",
  badge: "-20%",
};

const SANTOKU: ProductCardProduct = {
  id: "santoku",
  title: "Santoku",
  subtitle: "Hammered steel, 17 cm",
  href: "#santoku",
  image: { src: knife("#e4e4e2", "#1f2328", 168, "#bfc5cc"), alt: "Santoku knife with a black handle", width: 400, height: 500 },
  price: 119,
  currency: "EUR",
  locale: "en-GB",
  available: false,
};

const CARBON: ProductCardProduct = {
  id: "carbon-pan",
  title: "Carbon steel pan",
  subtitle: "28 cm, pre-seasoned",
  href: "#carbon-pan",
  image: { src: pan, alt: "Dark carbon steel frying pan with a wooden handle", width: 400, height: 500 },
  price: 74,
  currency: "EUR",
  locale: "en-GB",
  badge: "Bestseller",
};

const CAST: ProductCardProduct = {
  id: "cast-casserole",
  title: "Cast iron casserole",
  subtitle: "Enamelled, 4 L",
  href: "#casserole",
  image: { src: casserole("#4d5b52", "#33403a"), alt: "Round cast iron casserole in sage green", width: 400, height: 500 },
  price: 159,
  currency: "EUR",
  locale: "en-GB",
  variants: [
    { id: "sage", label: "Sage", swatch: "#4d5b52" },
    { id: "ink", label: "Ink", swatch: "#26282c" },
    { id: "clay", label: "Clay", swatch: "#a8654a" },
  ],
};

const COPPER: ProductCardProduct = {
  id: "copper-saucepan",
  title: "Copper saucepan",
  subtitle: "Tin lined, 16 cm",
  href: "#saucepan",
  image: { src: saucepan, alt: "Copper saucepan with a black handle", width: 400, height: 500 },
  price: 189,
  currency: "EUR",
  locale: "en-GB",
};

const TIN: ProductCardProduct = {
  id: "roasting-tin",
  title: "Enamel roasting tin",
  subtitle: "Steel, 35 x 25 cm",
  href: "#roasting-tin",
  image: { src: tin, alt: "Enamel roasting tin with a grey rim", width: 400, height: 500 },
  price: 48,
  currency: "EUR",
  locale: "en-GB",
};

const APRON: ProductCardProduct = {
  id: "linen-apron",
  title: "Linen bib apron",
  subtitle: "Stonewashed linen",
  href: "#apron",
  image: { src: apron("#b9b09f", "#7a7060"), alt: "Linen bib apron in stone with a front pocket", width: 400, height: 500 },
  price: 39,
  currency: "EUR",
  locale: "en-GB",
  variants: [
    { id: "stone", label: "Stone", swatch: "#b9b09f" },
    { id: "ink", label: "Ink", swatch: "#2b2d36" },
    { id: "sage", label: "Sage", swatch: "#8aa38b" },
  ],
};

const TOWELS: ProductCardProduct = {
  id: "tea-towels",
  title: "Tea towels, set of 3",
  subtitle: "Linen and cotton",
  href: "#tea-towels",
  image: { src: towels, alt: "Three folded striped tea towels in green-grey", width: 400, height: 500 },
  price: 24,
  currency: "EUR",
  locale: "en-GB",
};

const RUNNER: ProductCardProduct = {
  id: "table-runner",
  title: "Table runner",
  subtitle: "Fringed linen, 140 cm",
  href: "#runner",
  image: { src: runner, alt: "Linen table runner in sand with a fringe", width: 400, height: 500 },
  price: 42,
  currency: "EUR",
  locale: "en-GB",
};

const CATEGORIES: readonly CategoryRow[] = [
  {
    name: "Kitchen knives",
    href: "#knives",
    description: "Forged in small batches in Solingen and balanced for a pinch grip.",
    total: 48,
    products: [CHEF, PARING, BREAD, SANTOKU],
  },
  {
    name: "Cookware",
    href: "#cookware",
    description: "Carbon steel, cast iron and copper that get better the more you cook.",
    total: 126,
    products: [CARBON, CAST, COPPER, TIN],
  },
  {
    name: "Linen and textiles",
    href: "#linen",
    description: "Aprons, tea towels and table linen, stonewashed in Portugal.",
    total: 3,
    products: [APRON, TOWELS, RUNNER],
  },
];

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-10 sm:px-6 sm:py-14">
      <CategoryProductRows
        categories={CATEGORIES}
        locale="en-GB"
        onAddToCart={async (product, variantId) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setLast(`${product.title}${variantId ? ` (${variantId})` : ""}`);
        }}
      />
      <p role="status" className="mt-8 text-xs text-muted-foreground">
        {last ? `Added to the cart: ${last}` : "Each card adds to the cart on its own, and the last category has fewer products than a row."}
      </p>
    </div>
  );
}
