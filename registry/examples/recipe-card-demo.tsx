"use client";

import { useState, type ReactNode } from "react";

import { RecipeCard } from "@rhs-ui/application/recipe-card";

/** A small deterministic random: the pictures below are drawn from it, so they are the same on the server and in the browser. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Pictures drawn in flat shapes, so the demo needs no files. Use real photographs in an app. */
const scene = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>${body}</svg>`);

const leaf = (x: number, y: number, turn: number, size: number, fill: string, vein: string) =>
  `<g transform='translate(${x} ${y}) rotate(${turn}) scale(${size})'><path d='M0 -26C15 -19 15 14 0 28C-15 14 -15 -19 0 -26Z' fill='${fill}'/><path d='M0 -22V24' stroke='${vein}' stroke-width='1.6' fill='none'/></g>`;

const PASTA = (() => {
  const random = seeded(11);
  const strands = Array.from({ length: 46 }, (_, i) => {
    const colour = ["#e9c978", "#f0d68a", "#dcb461", "#efd491", "#e4bd68"][i % 5];
    const rx = 88 + random() * 66;
    const ry = 50 + random() * 62;
    return `<ellipse cx='${400 + (random() - 0.5) * 24}' cy='${302 + (random() - 0.5) * 20}' rx='${rx}' ry='${ry}' fill='none' stroke='${colour}' stroke-width='10' stroke-linecap='round' transform='rotate(${Math.round(random() * 180)} 400 302)' opacity='.97'/>`;
  }).join("");
  const zest = Array.from({ length: 16 }, () => {
    const angle = random() * Math.PI * 2;
    const radius = 30 + random() * 120;
    const x = 400 + Math.cos(angle) * radius;
    const y = 302 + Math.sin(angle) * radius * 0.8;
    return `<path d='M${x} ${y}q9 -7 15 1' fill='none' stroke='#f2d444' stroke-width='3.5' stroke-linecap='round'/>`;
  }).join("");
  const pepper = Array.from({ length: 30 }, () => `<circle cx='${290 + random() * 220}' cy='${200 + random() * 200}' r='${1.4 + random() * 1.8}' fill='#2a2a2a'/>`).join("");
  const dollops = [
    [352, 270, 27],
    [447, 292, 31],
    [396, 346, 25],
    [300, 330, 19],
  ]
    .map(([x, y, r]) => `<circle cx='${x! + 4}' cy='${y! + 5}' r='${r}' fill='#8a7a55' opacity='.3'/><circle cx='${x}' cy='${y}' r='${r}' fill='#fffdf6'/><circle cx='${x! - r! * 0.3}' cy='${y! - r! * 0.32}' r='${r! * 0.3}' fill='#ffffff'/>`)
    .join("");
  const wedge = Array.from({ length: 8 }, (_, i) => `<path d='M0 0L${Math.cos((i * Math.PI) / 4) * 40} ${Math.sin((i * Math.PI) / 4) * 40}' stroke='#f5e9a2' stroke-width='3'/>`).join("");
  const tines = [-20, -8, 4, 16].map((x) => `<rect x='${x}' y='-176' width='6' height='84' rx='3' fill='#cfd3d7'/>`).join("");
  return scene(
    `<rect width='800' height='600' fill='#e6dece'/>` +
      Array.from({ length: 16 }, (_, i) => `<rect x='${i * 52}' y='0' width='26' height='600' fill='#dcd2bf' opacity='.35'/>`).join("") +
      `<ellipse cx='410' cy='322' rx='244' ry='230' fill='#4a3f2c' opacity='.14'/>` +
      `<circle cx='400' cy='300' r='236' fill='#f6f2e8'/><circle cx='400' cy='300' r='236' fill='none' stroke='#e0d7c4' stroke-width='3'/>` +
      `<circle cx='400' cy='300' r='198' fill='#fbf9f2' stroke='#ebe3d2' stroke-width='3'/>` +
      strands +
      zest +
      dollops +
      leaf(322, 322, -35, 1.1, "#4f7b46", "#38592f") +
      leaf(492, 246, 48, 1, "#5a8750", "#38592f") +
      leaf(416, 232, 8, 0.85, "#4f7b46", "#38592f") +
      leaf(468, 368, 128, 0.95, "#5a8750", "#38592f") +
      pepper +
      `<g transform='translate(668 112)'><circle r='70' fill='#d9b92f' opacity='.22' cx='6' cy='8'/><circle r='66' fill='#f1cf3b'/><circle r='55' fill='#f9ec9a'/>${wedge}<circle r='6' fill='#f1d86e'/></g>` +
      `<g transform='translate(104 330) rotate(-7)'>${tines}<path d='M-22 -98h46q0 22 -18 30v8h-10v-8q-18 -8 -18 -30z' fill='#cfd3d7'/><rect x='-7' y='-66' width='14' height='236' rx='7' fill='#c4c8cc'/></g>`,
  );
})();

const STEW = (() => {
  const random = seeded(23);
  const chickpeas = Array.from({ length: 64 }, (_, i) => {
    const angle = i * 2.39996;
    const radius = 14 + 158 * Math.sqrt(i / 64);
    const x = 400 + Math.cos(angle) * radius;
    const y = 300 + Math.sin(angle) * radius;
    const fill = i % 3 === 0 ? "#dcb677" : "#e6c88f";
    return `<circle cx='${x}' cy='${y}' r='14' fill='${fill}'/><circle cx='${x - 4}' cy='${y - 4}' r='4.5' fill='#f3dfb4' opacity='.8'/>`;
  }).join("");
  const greens = Array.from({ length: 11 }, () => {
    const angle = random() * Math.PI * 2;
    const radius = 40 + random() * 120;
    return leaf(400 + Math.cos(angle) * radius, 300 + Math.sin(angle) * radius, Math.round(random() * 360), 0.75 + random() * 0.4, "#4f6e3f", "#334b28");
  }).join("");
  const paprika = Array.from({ length: 50 }, () => {
    const angle = random() * Math.PI * 2;
    const radius = random() * 175;
    return `<circle cx='${400 + Math.cos(angle) * radius}' cy='${300 + Math.sin(angle) * radius}' r='${1 + random() * 2}' fill='#7f2a19' opacity='.8'/>`;
  }).join("");
  return scene(
    `<rect width='800' height='600' fill='#cdd1d4'/>` +
      `<g transform='rotate(-6 640 160)'><rect x='540' y='20' width='300' height='260' rx='6' fill='#f0ece2'/>${Array.from({ length: 9 }, (_, i) => `<rect x='540' y='${34 + i * 28}' width='300' height='9' fill='#e2ddd0'/>`).join("")}</g>` +
      `<ellipse cx='412' cy='320' rx='250' ry='236' fill='#2c2f33' opacity='.2'/>` +
      `<circle cx='400' cy='300' r='244' fill='#b0614a'/><circle cx='400' cy='300' r='244' fill='none' stroke='#9a503b' stroke-width='4'/>` +
      `<circle cx='400' cy='300' r='214' fill='#c8795f'/><circle cx='400' cy='300' r='196' fill='#9b4128'/>` +
      `<circle cx='400' cy='300' r='186' fill='#a8472d'/>` +
      chickpeas +
      greens +
      paprika +
      `<g><circle cx='400' cy='300' r='46' fill='#fbf7ec'/><path d='M400 300m0 0a8 8 0 0 1 16 0a18 18 0 0 1 -36 0a28 28 0 0 1 56 0a38 38 0 0 1 -76 0' fill='none' stroke='#e5dcc6' stroke-width='5' stroke-linecap='round'/></g>` +
      `<g transform='translate(690 470) rotate(32)'><ellipse rx='46' ry='64' fill='#cfd3d6'/><ellipse rx='36' ry='54' fill='#e3e6e8'/><rect x='-9' y='60' width='18' height='140' rx='9' fill='#cfd3d6'/></g>`,
  );
})();

const TART = (() => {
  const random = seeded(5);
  const grain = Array.from({ length: 26 }, (_, i) => `<path d='M${60} ${80 + i * 18}h${680 - (i % 3) * 40}' stroke='#b48f5b' stroke-width='${1 + (i % 3)}' opacity='.35'/>`).join("");
  const tomatoes = [
    [250, 230],
    [400, 215],
    [550, 235],
    [240, 375],
    [392, 385],
    [548, 372],
  ]
    .map(([x, y], i) => {
      const seeds = Array.from({ length: 6 }, (_, k) => `<ellipse cx='${Math.cos(k * 1.05) * 15}' cy='${Math.sin(k * 1.05) * 15}' rx='3.4' ry='5' fill='#f6cdb6' transform='rotate(${k * 60})'/>`).join("");
      return `<g transform='translate(${x} ${y}) rotate(${i * 31})'><circle r='50' fill='#b83a25'/><circle r='43' fill='#cf5a3f'/><circle r='29' fill='#d9715a'/>${seeds}<path d='M-34 -14q10 -14 28 -16' stroke='#e89a86' stroke-width='3' fill='none' stroke-linecap='round'/></g>`;
    })
    .join("");
  const herbs = [
    [330, 300, 20],
    [470, 300, -60],
    [320, 160, 70],
    [470, 450, 150],
    [600, 305, 10],
    [200, 305, -30],
  ]
    .map(([x, y, turn]) => leaf(x!, y!, turn!, 0.9, "#4e7a43", "#365a2d"))
    .join("");
  const thyme = Array.from({ length: 34 }, () => `<circle cx='${170 + random() * 460}' cy='${150 + random() * 300}' r='${1.6 + random() * 1.4}' fill='#3f6a37'/>`).join("");
  return scene(
    `<rect width='800' height='600' fill='#d6d1c6'/>` +
      `<rect x='46' y='58' width='708' height='484' rx='26' fill='#c4a06c'/>${grain}<rect x='46' y='58' width='708' height='484' rx='26' fill='none' stroke='#a9854f' stroke-width='3'/>` +
      `<rect x='122' y='108' width='556' height='392' rx='38' fill='#4a3b24' opacity='.18' transform='translate(6 8)'/>` +
      `<rect x='122' y='108' width='556' height='392' rx='38' fill='#d9a65a'/><rect x='140' y='126' width='520' height='356' rx='28' fill='#e8bd75'/>` +
      `<rect x='158' y='144' width='484' height='320' rx='20' fill='#f1e2bd'/>` +
      thyme +
      tomatoes +
      herbs +
      `<g transform='translate(660 520) rotate(-24)'><rect x='-6' y='-10' width='150' height='16' rx='6' fill='#5b4a34'/><path d='M-6 -12h-170q-30 4 -40 26h210z' fill='#d4d8dc'/></g>`,
  );
})();

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      <div className="flex-1 [&>article]:h-full">{children}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set(["pasta"]));
  const toggle = (id: string) => (next: boolean) =>
    setSaved((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  return (
    <div className="grid w-full max-w-3xl items-stretch gap-x-6 gap-y-8 sm:grid-cols-2">
      <Case caption="Hover, focus or tap the time: prep and cook in a tooltip.">
        <RecipeCard
          title="Lemon ricotta pasta"
          image={{ src: PASTA, alt: "A nest of fresh pasta with ricotta, lemon zest and basil on a white plate" }}
          time={{ prep: 15, cook: 20 }}
          difficulty="easy"
          servings={4}
          dietary={["Vegetarian"]}
          rating={4.7}
          ratingCount={312}
          href="#lemon-ricotta-pasta"
          saved={saved.has("pasta")}
          onSave={toggle("pasta")}
        />
      </Case>

      <Case caption="Every dietary mark is a word, and every one is shown.">
        <RecipeCard
          title="Smoky chickpea stew"
          image={{ src: STEW, alt: "A terracotta bowl of chickpea stew with spinach and a swirl of yogurt" }}
          time={{ prep: 15, cook: 45 }}
          difficulty="medium"
          servings={6}
          dietary={["Vegan", "Gluten-free", "Dairy-free", "Nut-free"]}
          rating={4.5}
          ratingCount={1284}
          href="#smoky-chickpea-stew"
          saved={saved.has("stew")}
          onSave={toggle("stew")}
        />
      </Case>

      <Case caption="A harder one, with a total only: no tooltip to open.">
        <RecipeCard
          title="Roasted tomato and ricotta tart"
          image={{ src: TART, alt: "A golden tart topped with roasted tomatoes, basil and thyme on a wooden board" }}
          time={90}
          difficulty="hard"
          servings={8}
          dietary={["Vegetarian", "Contains gluten"]}
          rating={4.9}
          ratingCount={58}
          href="#roasted-tomato-tart"
          saved={saved.has("tart")}
          onSave={toggle("tart")}
        />
      </Case>

      <Case caption="No photo and no reviews yet: the card says so.">
        <RecipeCard
          title="Brown butter banana bread"
          time={{ prep: 10, cook: 55 }}
          difficulty="easy"
          servings={10}
          dietary={["Vegetarian", "Contains nuts"]}
          rating={0}
          ratingCount={0}
          href="#brown-butter-banana-bread"
          saved={saved.has("bread")}
          onSave={toggle("bread")}
        />
      </Case>
    </div>
  );
}
