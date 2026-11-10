"use client";

import { useState } from "react";

import { GalleryHero, type GalleryPhoto } from "@rhs-ui/marketing/gallery-hero";

/* The photographs are drawn for the demo, so they need no files. In your site: the pictures themselves, at least 2000 pixels wide, with the subject near the middle so a phone crop keeps it. */

const picture = (art: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'>${art}</svg>`);
const ramp = (id: string, stops: [number, string][]) => `<linearGradient id='${id}' x1='0' y1='0' x2='0' y2='1'>${stops.map(([at, colour]) => `<stop offset='${at}' stop-color='${colour}'/>`).join("")}</linearGradient>`;
const random = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

// Dawn on the river: a skyline against a low sun, a bridge, and the sun in the water.
const dawn = (() => {
  const next = random(7);
  let skyline = "";
  for (let x = -20; x < 1640; ) {
    const width = 36 + next() * 90;
    const height = 40 + next() * next() * 280;
    skyline += `<rect x='${x}' y='${560 - height}' width='${width}' height='${height + 2}' fill='#1a2632'/>`;
    x += width + 3 + next() * 12;
  }
  const glints = Array.from({ length: 11 }, (_, i) => `<rect x='${960 + i * 4}' y='${574 + i * 24}' width='${170 - i * 9}' height='5' rx='2.5' fill='#fbe1b0' opacity='${0.6 - i * 0.04}'/>`).join("");
  const cables = Array.from({ length: 9 }, (_, i) => `<path d='M600 250L${600 - 70 - i * 58} 548M600 250L${600 + 70 + i * 58} 548' stroke='#0f1720' stroke-width='3'/>`).join("");
  return picture(
    `<defs>${ramp("sky", [[0, "#232f3c"], [0.5, "#a98788"], [0.8, "#f0b786"], [1, "#f8d8a4"]])}${ramp("water", [[0, "#d99d72"], [0.35, "#4a5a69"], [1, "#1c2833"]])}</defs>` +
      `<rect width='1600' height='560' fill='url(#sky)'/><circle cx='1030' cy='532' r='78' fill='#fff1cf'/><circle cx='1030' cy='532' r='140' fill='#fff1cf' opacity='.16'/>` +
      skyline +
      `<rect y='560' width='1600' height='340' fill='url(#water)'/>` +
      glints +
      `<rect x='592' y='240' width='16' height='318' fill='#0f1720'/>${cables}<rect y='542' width='1600' height='12' fill='#0f1720'/>`,
  );
})();

// A stair: light from a high window, a dark flight, a long shadow across the wall.
const stair = (() => {
  let flight = "M560 900";
  let edges = "";
  for (let step = 0; step < 13; step += 1) {
    const x = 560 + step * 82;
    const y = 880 - step * 58;
    flight += `V${y - 58}H${x + 82}`;
    edges += `<rect x='${x}' y='${y - 62}' width='82' height='7' fill='#f2ede2'/>`;
  }
  flight += "V900Z";
  return picture(
    `<rect width='1600' height='900' fill='#cbc6bb'/><rect x='80' y='90' width='300' height='400' fill='#f7f3e9'/><path d='M80 490L380 490L1010 900L710 900Z' fill='#9d988d' opacity='.55'/><path d='M0 640L1600 40V160L0 840Z' fill='#7e796f' opacity='.18'/>` +
      `<path d='${flight}' fill='#2a2926'/>${edges}<rect x='1010' y='60' width='10' height='520' fill='#2a2926' opacity='.0'/>`,
  );
})();

// An arcade: five arches, and the light of the courtyard behind them.
const arcade = (() => {
  const arches = Array.from({ length: 5 }, (_, i) => {
    const x = 120 + i * 300;
    return `<path d='M${x} 760V420a110 110 0 0 1 220 0V760Z' fill='#2c2722'/><path d='M${x + 34} 760V430a76 76 0 0 1 152 0V760Z' fill='#eddcbc'/><rect x='${x + 34}' y='640' width='152' height='120' fill='#cdb98f'/>`;
  }).join("");
  return picture(`<rect width='1600' height='900' fill='#d6caae'/><rect y='760' width='1600' height='140' fill='#b7a784'/><rect y='120' width='1600' height='40' fill='#bfb191'/>${arches}<path d='M0 760H1600' stroke='#8f8264' stroke-width='6'/><path d='M120 780H1480L1600 900H0Z' fill='#a39372' opacity='.55'/>`);
})();

// A facade: a grid of deep windows and a shadow that cuts across it.
const facade = (() => {
  const windows = [];
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      const lit = row === 1 && column === 5;
      windows.push(`<rect x='${150 + column * 150}' y='${110 + row * 190}' width='96' height='132' fill='${lit ? "#f1c673" : "#31373b"}'/><rect x='${150 + column * 150}' y='${104 + row * 190}' width='96' height='8' fill='#e4e0d6'/>`);
    }
  }
  return picture(`<rect width='1600' height='900' fill='#b6b3ac'/>${windows.join("")}<path d='M0 900L0 360L900 900Z' fill='#000' opacity='.2'/><path d='M0 0H1600V60H0Z' fill='#d7d4cc'/>`);
})();

// A hall in one-point perspective, with light falling on the floor from the side.
const hall = picture(
  `<defs>${ramp("end", [[0, "#fffaf0"], [1, "#f3e6c8"]])}</defs>` +
    `<rect width='1600' height='900' fill='#bdb6a8'/><path d='M0 0L640 300H960L1600 0Z' fill='#e7e2d6'/><path d='M0 900L640 600H960L1600 900Z' fill='#cdc5b6'/><path d='M0 0L640 300V600L0 900Z' fill='#aaa396'/><path d='M1600 0L960 300V600L1600 900Z' fill='#b6afa1'/>` +
    `<rect x='640' y='300' width='320' height='300' fill='url(#end)'/>` +
    [0, 1, 2].map((i) => `<path d='M${70 + i * 150} ${130 + i * 70}L${190 + i * 150} ${130 + i * 70}L${700 + i * 40} ${900 - i * 60}L${460 + i * 40} ${900 - i * 60}Z' fill='#fff3cc' opacity='.38'/>`).join("") +
    [0, 1, 2].map((i) => `<rect x='${40 + i * 140}' y='${120 + i * 70}' width='96' height='${300 - i * 60}' fill='#fff8e4' opacity='.9'/>`).join(""),
);

// A pier at low tide: planks running out to a flat horizon.
const pier = (() => {
  const planks = Array.from({ length: 14 }, (_, i) => {
    const y = 560 + Math.pow(i / 13, 2) * 340;
    const half = 12 + Math.pow(i / 13, 2) * 150;
    return `<path d='M${800 - half} ${y}H${800 + half}' stroke='#3a2f26' stroke-width='${2 + i * 0.7}'/>`;
  }).join("");
  const ripples = Array.from({ length: 16 }, (_, i) => `<rect x='${(i * 211) % 1500}' y='${590 + ((i * 97) % 290)}' width='${60 + ((i * 53) % 120)}' height='3' rx='1.5' fill='#dfe9e8' opacity='.35'/>`).join("");
  return picture(
    `<defs>${ramp("sky", [[0, "#8fa9b6"], [0.7, "#d9d9cf"], [1, "#efe3cc"]])}${ramp("sea", [[0, "#7f9ea3"], [1, "#3d5a64"]])}</defs>` +
      `<rect width='1600' height='560' fill='url(#sky)'/><rect y='560' width='1600' height='340' fill='url(#sea)'/>${ripples}` +
      `<path d='M744 560H856L1010 900H590Z' fill='#6a5a4a'/>${planks}` +
      [0, 1, 2, 3, 4].map((i) => `<rect x='${730 - i * 22 - i * i * 4}' y='${520 + i * 46}' width='${6 + i * 3}' height='${50 + i * 24}' fill='#2f261f'/><rect x='${864 + i * 22 + i * i * 4}' y='${520 + i * 46}' width='${6 + i * 3}' height='${50 + i * 24}' fill='#2f261f'/>`).join(""),
  );
})();

// Cube houses against a clear sky.
const cubes = (() => {
  const cube = (x: number, y: number, size: number) => {
    const h = size / 2;
    return (
      `<rect x='${x - 6}' y='${y + size * 1.1}' width='12' height='${860 - y - size * 1.1}' fill='#6e5a44'/>` +
      `<path d='M${x} ${y - size}L${x + size} ${y - h}V${y + h}L${x} ${y + size}L${x - size} ${y + h}V${y - h}Z' fill='#d7ab49'/>` +
      `<path d='M${x} ${y - size}L${x + size} ${y - h}L${x} ${y}L${x - size} ${y - h}Z' fill='#f0cf7b'/><path d='M${x} ${y}L${x + size} ${y - h}V${y + h}L${x} ${y + size}Z' fill='#b4872e'/>`
    );
  };
  return picture(`<defs>${ramp("sky", [[0, "#8ebad2"], [1, "#e4eef0"]])}</defs><rect width='1600' height='900' fill='url(#sky)'/><rect y='860' width='1600' height='40' fill='#7d8a6c'/>${cube(430, 360, 150)}${cube(800, 300, 190)}${cube(1190, 400, 140)}`);
})();

// A tower at dusk, lit window by lit window.
const tower = (() => {
  const next = random(23);
  let lights = "";
  for (let row = 0; row < 26; row += 1) {
    const half = 70 - row * 1.1;
    for (let column = 0; column < 6; column += 1) {
      if (next() > 0.55) lights += `<rect x='${800 - half + 12 + column * ((half * 2 - 24) / 6)}' y='${180 + row * 24}' width='10' height='12' fill='#f4c871' opacity='${0.55 + next() * 0.45}'/>`;
    }
  }
  const low = Array.from({ length: 12 }, (_, i) => `<rect x='${i * 140 - 30}' y='${640 - ((i * 53) % 130)}' width='120' height='${300 + ((i * 53) % 130)}' fill='#0f1522'/>`).join("");
  return picture(
    `<defs>${ramp("sky", [[0, "#17213a"], [0.55, "#6b4f6a"], [0.85, "#e29a6b"], [1, "#f1c08a"]])}</defs><rect width='1600' height='900' fill='url(#sky)'/><circle cx='1230' cy='190' r='34' fill='#f6e6c6'/><circle cx='1246' cy='180' r='30' fill='#17213a' opacity='.0'/>` +
      low +
      `<path d='M742 120L858 120L880 700H720Z' fill='#10172a'/><path d='M796 40H804V120H796Z' fill='#10172a'/>${lights}<rect y='820' width='1600' height='80' fill='#0b101c'/>`,
  );
})();

const series: GalleryPhoto[] = [
  { src: dawn, alt: "A river at dawn: a dark skyline and a bridge against a low sun, its light laid out across the water", title: "First light on the Maas", place: "Rotterdam", year: 2026, credit: "Eva Lind" },
  { src: stair, alt: "A flight of dark concrete steps rising into a wall of light from a high window", title: "Stair, Kunsthal", place: "Rotterdam", year: 2026, credit: "Eva Lind" },
  { src: arcade, alt: "A row of five arches, their openings dark, with the pale light of a courtyard beyond", title: "The long arcade", place: "Delft", year: 2025, credit: "Eva Lind" },
  { src: facade, alt: "A concrete facade of deep square windows, one of them lit, cut by a diagonal shadow", title: "North facade", place: "Utrecht", year: 2025, credit: "Eva Lind" },
  { src: hall, alt: "A long hall in perspective, with squares of sunlight on the floor and a bright door at the far end", title: "The hall at noon", place: "Amsterdam", year: 2026, credit: "Eva Lind" },
  { src: pier, alt: "A wooden pier running out over still, grey water to a flat horizon", title: "Pier at low tide", place: "Scheveningen", year: 2024, credit: "Eva Lind" },
  { src: cubes, alt: "Three yellow cube houses on slim poles against a clear blue sky", title: "Cube houses, midday", place: "Rotterdam", year: 2025, credit: "Eva Lind" },
  { src: tower, alt: "A tall tower at dusk with its windows lit one by one, above a low dark city", title: "Tower, blue hour", place: "The Hague", year: 2026, credit: "Eva Lind" },
];

export default function Demo(): React.JSX.Element {
  const [shown, setShown] = useState(0);

  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">
        A series of eight: arrow keys switch the picture while focus is inside, the thumbnails jump to one, and nothing moves by itself. Showing {shown + 1} of {series.length}.
      </p>
      <GalleryHero className="py-8 sm:py-10 lg:py-12" title="Concrete and light" photos={series} cta={{ label: "View the series", href: "#series" }} onIndexChange={setShown} />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A short series from an architecture studio, opened on its third picture, with no credit and no link.</p>
      <GalleryHero
        className="py-8 sm:py-10 lg:py-12"
        title="Kade 14, built 2026"
        initial={2}
        photos={[
          { src: facade, alt: "The facade of Kade 14, a grid of deep square windows", title: "Street facade", place: "Rotterdam", year: 2026 },
          { src: hall, alt: "The entrance hall of Kade 14 with sun on the floor", title: "Entrance hall", year: 2026 },
          { src: stair, alt: "The main stair of Kade 14, rising to a window", title: "The main stair", place: "Rotterdam", year: 2026 },
        ]}
      />
    </div>
  );
}
