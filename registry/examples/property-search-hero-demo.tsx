"use client";

import { useState } from "react";

import { PropertySearchHero, type PropertySearch } from "@rhs-ui/marketing/property-search-hero";

/* The photograph is drawn for the demo, so it needs no file: canal houses, with the roofline near the top so the band above the panel shows it on every screen. In your site: a real photograph. */
const canal = (() => {
  const colors = ["#a9674f", "#cdb48e", "#8e9aa3", "#b5614b", "#d9cdb0", "#7d8b86", "#a8765a", "#c9a27c", "#9a5a48", "#bfc7c6"];
  const gables = ["step", "bell", "neck", "spout", "step", "bell", "neck", "spout", "step", "bell"];
  const heights = [450, 480, 430, 490, 440, 470, 425, 485, 455, 475];
  const widths = [180, 150, 190, 160, 175, 150, 195, 165, 185, 155];
  const waterline = 560;
  let art = `<rect width='1600' height='700' fill='#d6e2e8'/>`;
  art += [[260, 70, 120, 22], [700, 40, 160, 26], [1180, 86, 140, 22], [1500, 50, 90, 18]].map(([x, y, rx, ry]) => `<ellipse cx='${x}' cy='${y}' rx='${rx}' ry='${ry}' fill='#fff' opacity='.7'/>`).join("");
  let x = -50;
  const reflections: string[] = [];
  widths.forEach((w, index) => {
    const h = heights[index] ?? 450;
    const color = colors[index] ?? "#a9674f";
    const top = waterline - h;
    const gable = gables[index];
    const t = top;
    // The gable on top: stepped, bell, neck or spout.
    const shape =
      gable === "step"
        ? `M${x} ${t + 70}V${t + 50}H${x + w * 0.15}V${t + 30}H${x + w * 0.3}V${t + 10}H${x + w * 0.7}V${t + 30}H${x + w * 0.85}V${t + 50}H${x + w}V${t + 70}Z`
        : gable === "bell"
          ? `M${x} ${t + 70}C${x} ${t + 40} ${x + w * 0.2} ${t + 40} ${x + w * 0.3} ${t + 20}C${x + w * 0.4} ${t} ${x + w * 0.6} ${t} ${x + w * 0.7} ${t + 20}C${x + w * 0.8} ${t + 40} ${x + w} ${t + 40} ${x + w} ${t + 70}Z`
          : gable === "neck"
            ? `M${x} ${t + 70}V${t + 45}H${x + w * 0.3}V${t}H${x + w * 0.7}V${t + 45}H${x + w}V${t + 70}Z`
            : `M${x} ${t + 70}L${x + w / 2} ${t}L${x + w} ${t + 70}Z`;
    art += `<path d='${shape}' fill='${color}'/><rect x='${x}' y='${t + 70}' width='${w}' height='${h - 70}' fill='${color}'/>`;
    art += `<rect x='${x}' y='${t + 70}' width='${w}' height='6' fill='#000' opacity='.08'/>`;
    // Windows in rows down the front, a door at the foot.
    const columns = w >= 170 ? 3 : 2;
    const gap = (w - columns * 30) / (columns + 1);
    for (let row = 0; t + 96 + row * 74 + 50 < waterline - 70; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const wx = x + gap + column * (30 + gap);
        const wy = t + 96 + row * 74;
        art += `<rect x='${wx}' y='${wy}' width='30' height='50' fill='#f4efe5'/><rect x='${wx + 4}' y='${wy + 4}' width='22' height='42' fill='#3d5160'/><rect x='${wx + 4}' y='${wy + 24}' width='22' height='3' fill='#f4efe5'/>`;
      }
    }
    art += `<rect x='${x + w / 2 - 20}' y='${waterline - 76}' width='40' height='76' fill='#f4efe5'/><rect x='${x + w / 2 - 16}' y='${waterline - 72}' width='32' height='72' fill='#2f3d45'/>`;
    reflections.push(`<rect x='${x}' y='${waterline}' width='${w}' height='140' fill='${color}' opacity='.3'/>`);
    x += w;
  });
  art += `<rect y='${waterline - 8}' width='1600' height='12' fill='#3b4a52'/>`;
  art += `<rect y='${waterline + 4}' width='1600' height='136' fill='#6f8896'/>${reflections.join("")}`;
  art += `<path d='M0 592H1600M0 626H1600M0 664H1600' stroke='#fff' stroke-opacity='.2' stroke-width='3'/>`;
  // Two trees on the quay.
  for (const tree of [330, 1240]) {
    art += `<rect x='${tree - 6}' y='${waterline - 110}' width='12' height='110' fill='#4a3b30'/><circle cx='${tree}' cy='${waterline - 150}' r='58' fill='#5f7a52'/><circle cx='${tree - 40}' cy='${waterline - 120}' r='42' fill='#6c8a5c'/><circle cx='${tree + 42}' cy='${waterline - 124}' r='44' fill='#587349'/>`;
  }
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 700' preserveAspectRatio='xMidYMin slice'>${art}</svg>`);
})();

const modes = [
  { value: "buy", label: "Buy", priceLabel: "Price" },
  { value: "rent", label: "Rent", priceLabel: "Rent per month" },
  { value: "sold", label: "Sold", priceLabel: "Sold price" },
];

const purchase = [100_000, 150_000, 200_000, 250_000, 300_000, 400_000, 500_000, 750_000, 1_000_000];
const priceSteps = { buy: purchase, rent: [500, 750, 1000, 1250, 1500, 2000, 2500, 3000], sold: purchase };

const places = [
  { value: "amsterdam", label: "Amsterdam", description: "North Holland", group: "Cities", keywords: ["1011"] },
  { value: "rotterdam", label: "Rotterdam", description: "South Holland", group: "Cities" },
  { value: "utrecht", label: "Utrecht", description: "Utrecht", group: "Cities" },
  { value: "the-hague", label: "The Hague", description: "South Holland", group: "Cities", keywords: ["den haag"] },
  { value: "eindhoven", label: "Eindhoven", description: "North Brabant", group: "Cities" },
  { value: "groningen", label: "Groningen", description: "Groningen", group: "Cities" },
  { value: "haarlem", label: "Haarlem", description: "North Holland", group: "Cities" },
  { value: "leiden", label: "Leiden", description: "South Holland", group: "Cities" },
  { value: "jordaan", label: "Jordaan", description: "Amsterdam", group: "Neighbourhoods" },
  { value: "de-pijp", label: "De Pijp", description: "Amsterdam", group: "Neighbourhoods" },
  { value: "kralingen", label: "Kralingen", description: "Rotterdam", group: "Neighbourhoods" },
  { value: "wittevrouwen", label: "Wittevrouwen", description: "Utrecht", group: "Neighbourhoods" },
];

const popular = {
  buy: [
    { label: "Amsterdam", href: "#buy-amsterdam", count: 2314 },
    { label: "Rotterdam", href: "#buy-rotterdam", count: 1208 },
    { label: "Utrecht", href: "#buy-utrecht", count: 986 },
    { label: "The Hague", href: "#buy-the-hague", count: 874 },
    { label: "Haarlem", href: "#buy-haarlem", count: 412 },
  ],
  rent: [
    { label: "Amsterdam", href: "#rent-amsterdam", count: 1186 },
    { label: "Rotterdam", href: "#rent-rotterdam", count: 640 },
    { label: "Utrecht", href: "#rent-utrecht", count: 512 },
    { label: "Eindhoven", href: "#rent-eindhoven", count: 298 },
    { label: "Leiden", href: "#rent-leiden", count: 163 },
  ],
  sold: [
    { label: "Amsterdam", href: "#sold-amsterdam", count: 5421 },
    { label: "Rotterdam", href: "#sold-rotterdam", count: 3880 },
    { label: "The Hague", href: "#sold-the-hague", count: 3106 },
    { label: "Utrecht", href: "#sold-utrecht", count: 2940 },
    { label: "Haarlem", href: "#sold-haarlem", count: 1274 },
  ],
};

export default function Demo(): React.JSX.Element {
  const [first, setFirst] = useState<PropertySearch | null>(null);
  const [second, setSecond] = useState<PropertySearch | null>(null);
  // onSearch hands the choice to your app. Here it only says what it received, so the press can be seen.
  const said = (search: PropertySearch | null) => (search ? `Handed to your app: ${JSON.stringify(search)}. This is where your results page opens.` : "");

  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">With a photograph behind the panel. Switch to Rent: the price steps become monthly rent and the popular places get their own counts.</p>
      <PropertySearchHero
        className="py-8 sm:py-10"
        title="Find a home you will love living in"
        description="12,480 homes across the Netherlands, updated every hour."
        modes={modes}
        places={places}
        priceSteps={priceSteps}
        popular={popular}
        background={<img src={canal} alt="" width={1600} height={700} className="size-full object-cover object-top" />}
        onSearch={setFirst}
      />
      <p role="status" className="min-h-4 text-xs text-foreground">
        {said(first)}
      </p>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Without a photograph, starting on Rent.</p>
      <PropertySearchHero
        className="py-8 sm:py-10"
        title="Rent your next place"
        description="Apartments and houses from private landlords and agents, with the rent shown per month."
        modes={modes}
        defaultMode="rent"
        places={places}
        priceSteps={priceSteps}
        bedrooms={[1, 2, 3, 4]}
        popular={popular}
        onSearch={setSecond}
      />
      <p role="status" className="min-h-4 text-xs text-foreground">
        {said(second)}
      </p>
    </div>
  );
}
