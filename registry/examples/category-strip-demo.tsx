"use client";

import { useState, type ReactNode } from "react";

import {
  IconBall,
  IconBook,
  IconCabin,
  IconCastle,
  IconCpu,
  IconHanger,
  IconLighthouse,
  IconMountain,
  IconPalmTree,
  IconSnowflake,
  IconSofa,
  IconTent,
  IconTree,
  IconWaves,
  IconWindmill,
} from "@rhs-ui/icons";
import { CategoryStrip, type Category } from "@rhs-ui/primitives/category-strip";

const STAYS: readonly Category[] = [
  { id: "cabins", label: "Cabins", icon: <IconCabin />, count: 128 },
  { id: "beachfront", label: "Beachfront", icon: <IconPalmTree />, count: 96 },
  { id: "treehouses", label: "Treehouses", icon: <IconTree />, count: 24 },
  { id: "lakeside", label: "Lakeside", icon: <IconWaves />, count: 71 },
  { id: "castles", label: "Castles", icon: <IconCastle />, count: 9 },
  { id: "camping", label: "Camping", icon: <IconTent />, count: 63 },
  { id: "windmills", label: "Windmills", icon: <IconWindmill />, count: 12 },
  { id: "lighthouses", label: "Lighthouses", icon: <IconLighthouse />, count: 7 },
  { id: "mountain", label: "Mountain views", icon: <IconMountain />, count: 54 },
  { id: "ski", label: "Ski in, ski out", icon: <IconSnowflake />, count: 38 },
];

interface Stay {
  place: string;
  price: number;
}

/** Three stays for every kind of stay, in places that really have them. */
const LISTINGS: Record<string, readonly Stay[]> = {
  cabins: [{ place: "Hemsedal, Norway", price: 164 }, { place: "Black Forest, Germany", price: 138 }, { place: "Ardennes, Belgium", price: 112 }],
  beachfront: [{ place: "Domburg, Zeeland", price: 189 }, { place: "Lagos, Portugal", price: 146 }, { place: "Zadar, Croatia", price: 121 }],
  treehouses: [{ place: "Veluwe, Gelderland", price: 176 }, { place: "Dordogne, France", price: 152 }, { place: "Småland, Sweden", price: 134 }],
  lakeside: [{ place: "Lake Como, Italy", price: 228 }, { place: "Bled, Slovenia", price: 143 }, { place: "Loosdrecht, Utrecht", price: 127 }],
  castles: [{ place: "Loire Valley, France", price: 412 }, { place: "Highlands, Scotland", price: 365 }, { place: "Bavaria, Germany", price: 298 }],
  camping: [{ place: "Ardèche, France", price: 64 }, { place: "Texel, Noord-Holland", price: 78 }, { place: "Tuscany, Italy", price: 92 }],
  windmills: [{ place: "Kinderdijk, Zuid-Holland", price: 154 }, { place: "Zaanse Schans", price: 171 }, { place: "Schermerhorn", price: 139 }],
  lighthouses: [{ place: "Texel, Noord-Holland", price: 205 }, { place: "Terschelling", price: 188 }, { place: "Vlieland", price: 176 }],
  mountain: [{ place: "Chamonix, France", price: 232 }, { place: "Zell am See, Austria", price: 187 }, { place: "Zermatt, Switzerland", price: 274 }],
  ski: [{ place: "Val Thorens, France", price: 296 }, { place: "Sölden, Austria", price: 241 }, { place: "Cortina, Italy", price: 318 }],
};

interface Tone {
  bg: string;
  mid: string;
  dark: string;
  light: string;
}

/** Warm and cool greys, one set for each of the three cards. */
const TONES: readonly Tone[] = [
  { bg: "#e4e1da", mid: "#bdb8ad", dark: "#8d877c", light: "#f4f2ee" },
  { bg: "#d8d5ce", mid: "#aaa598", dark: "#6f6a61", light: "#ece9e4" },
  { bg: "#d3d6d6", mid: "#a5abab", dark: "#6a7071", light: "#e9ecec" },
];

/** A flat scene for each kind of stay, on a 640 by 440 canvas, so the demo needs no pictures. */
const SCENES: Record<string, (t: Tone) => string> = {
  cabins: (t) =>
    `<rect y='310' width='640' height='130' fill='${t.mid}'/><polygon points='60,320 110,205 160,320' fill='${t.dark}'/><polygon points='490,320 550,185 610,320' fill='${t.dark}'/><rect x='240' y='215' width='170' height='105' fill='${t.dark}'/><polygon points='220,224 325,138 430,224' fill='${t.light}'/><rect x='302' y='256' width='36' height='64' fill='${t.light}'/>`,
  beachfront: (t) =>
    `<circle cx='470' cy='120' r='46' fill='${t.light}'/><rect y='230' width='640' height='210' fill='${t.mid}'/><rect y='340' width='640' height='100' fill='${t.light}'/><path d='M0 270q40-14 80 0t80 0 80 0 80 0 80 0 80 0 80 0 80 0' fill='none' stroke='${t.light}' stroke-width='6'/><path d='M0 305q40-14 80 0t80 0 80 0 80 0 80 0 80 0 80 0 80 0' fill='none' stroke='${t.light}' stroke-width='6' opacity='.6'/><rect x='160' y='290' width='6' height='110' fill='${t.dark}'/><path d='M90 292q70-70 148 0z' fill='${t.dark}'/>`,
  treehouses: (t) =>
    `<rect y='370' width='640' height='70' fill='${t.mid}'/><rect x='300' y='210' width='40' height='170' fill='${t.dark}'/><circle cx='320' cy='170' r='118' fill='${t.mid}'/><circle cx='250' cy='215' r='70' fill='${t.mid}'/><circle cx='395' cy='210' r='72' fill='${t.mid}'/><rect x='272' y='148' width='96' height='62' fill='${t.light}'/><polygon points='262,150 320,108 378,150' fill='${t.dark}'/><rect x='308' y='170' width='24' height='40' fill='${t.dark}'/>`,
  lakeside: (t) =>
    `<polygon points='0,280 150,140 300,280' fill='${t.mid}'/><polygon points='200,280 400,110 600,280' fill='${t.dark}'/><polygon points='420,280 540,170 640,250 640,280' fill='${t.mid}'/><rect y='280' width='640' height='160' fill='${t.light}'/><path d='M80 330h160M260 360h200M120 395h140M380 320h180' stroke='${t.mid}' stroke-width='6' stroke-linecap='round'/>`,
  castles: (t) =>
    `<rect y='330' width='640' height='110' fill='${t.mid}'/><rect x='200' y='150' width='60' height='190' fill='${t.dark}'/><rect x='380' y='150' width='60' height='190' fill='${t.dark}'/><rect x='250' y='200' width='140' height='140' fill='${t.dark}'/><path d='M194 150h14v-22h14v22h14v-22h14v22h14v-22h14v22' fill='${t.dark}'/><path d='M374 150h14v-22h14v22h14v-22h14v22h14v-22h14v22' fill='${t.dark}'/><path d='M290 340v-60a30 30 0 0 1 60 0v60z' fill='${t.light}'/>`,
  camping: (t) =>
    `<rect y='320' width='640' height='120' fill='${t.mid}'/><polygon points='40,330 90,210 140,330' fill='${t.dark}'/><polygon points='520,330 580,190 640,330' fill='${t.dark}'/><polygon points='200,335 320,165 440,335' fill='${t.dark}'/><polygon points='320,165 372,335 268,335' fill='${t.light}' opacity='.9'/><polygon points='320,230 346,335 294,335' fill='${t.dark}'/><circle cx='480' cy='345' r='12' fill='${t.light}'/>`,
  windmills: (t) =>
    `<rect y='345' width='640' height='95' fill='${t.mid}'/><polygon points='276,352 364,352 344,208 296,208' fill='${t.dark}'/><polygon points='288,208 352,208 320,170' fill='${t.light}'/><rect x='306' y='290' width='28' height='62' fill='${t.light}'/><g transform='translate(320 196)' fill='${t.light}' stroke='${t.dark}' stroke-width='5' stroke-linejoin='round'><rect x='-9' y='-150' width='18' height='140'/><rect x='10' y='-9' width='140' height='18'/><rect x='-9' y='10' width='18' height='140'/><rect x='-150' y='-9' width='140' height='18'/></g><circle cx='320' cy='196' r='12' fill='${t.dark}'/>`,
  lighthouses: (t) =>
    `<rect y='300' width='640' height='140' fill='${t.mid}'/><path d='M0 332q40-12 80 0t80 0 80 0 80 0 80 0 80 0 80 0 80 0M0 372q40-12 80 0t80 0 80 0 80 0 80 0 80 0 80 0 80 0' fill='none' stroke='${t.light}' stroke-width='6' opacity='.6'/><polygon points='342,174 580,112 580,236' fill='${t.light}' opacity='.45'/><ellipse cx='320' cy='350' rx='86' ry='20' fill='${t.dark}'/><polygon points='290,352 350,352 338,185 302,185' fill='${t.light}'/><polygon points='298,288 342,288 339,256 301,256' fill='${t.dark}'/><polygon points='305,228 335,228 338,202 302,202' fill='${t.dark}'/><rect x='298' y='160' width='44' height='28' fill='${t.dark}'/><polygon points='290,162 350,162 320,130' fill='${t.dark}'/>`,
  mountain: (t) =>
    `<rect y='330' width='640' height='110' fill='${t.mid}'/><polygon points='90,335 290,105 490,335' fill='${t.mid}'/><polygon points='290,105 345,170 310,160 285,190 265,150' fill='${t.light}'/><polygon points='300,335 470,160 640,335' fill='${t.dark}'/><polygon points='470,160 512,208 482,200 466,222 440,196' fill='${t.light}'/>`,
  ski: (t) =>
    `<circle cx='520' cy='100' r='40' fill='${t.light}'/><polygon points='0,190 640,350 640,440 0,440' fill='${t.light}'/><polygon points='90,262 120,190 150,262' fill='${t.dark}'/><polygon points='64,282 120,160 176,282' fill='${t.dark}'/><rect x='116' y='282' width='8' height='30' fill='${t.dark}'/><polygon points='230,300 252,250 274,300' fill='${t.dark}'/><polygon points='210,314 252,226 294,314' fill='${t.dark}'/><path d='M0 120L640 70' stroke='${t.dark}' stroke-width='3'/><rect x='380' y='84' width='34' height='26' rx='4' fill='${t.dark}'/>`,
};

/** The scene of a kind of stay as a data URI, in the greys of card `slot`. */
function sceneOf(id: string, slot: number): string {
  const tone = TONES[slot % TONES.length]!;
  const art = (SCENES[id] ?? SCENES.mountain!)(tone);
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 440'><rect width='640' height='440' fill='${tone.bg}'/>${art}</svg>`);
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Stays(): React.JSX.Element {
  const [current, setCurrent] = useState("mountain");
  const category = STAYS.find((item) => item.id === current) ?? STAYS[0]!;
  return (
    <div className="grid gap-5">
      <CategoryStrip label="Stay types" categories={STAYS} current={current} onSelect={setCurrent} />
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold tracking-[-0.02em]">{category.label}</h2>
        <p className="text-xs text-muted-foreground tabular-nums">{category.count} stays</p>
      </div>
      {/* Cards do not stretch to the tallest one: a stretched tile would grow wider with its height and push past its column. */}
      <ul className="grid grid-cols-3 items-start gap-3 sm:gap-4">
        {(LISTINGS[category.id] ?? []).map((stay, slot) => (
          <li key={stay.place} className="grid min-w-0 content-start gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URI drawn above, nothing to optimise */}
            <img src={sceneOf(category.id, slot)} alt="" width={640} height={440} className="aspect-[16/11] w-full rounded-xl object-cover" />
            <div className="grid gap-0.5">
              <p className="text-xs font-medium sm:text-sm">{stay.place}</p>
              <p className="text-xs text-muted-foreground tabular-nums">€{stay.price} a night</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const MARKET: readonly Category[] = [
  { id: "home", label: "Home", icon: <IconSofa />, href: "#home", count: 1240 },
  { id: "tech", label: "Tech", icon: <IconCpu />, href: "#tech", count: 862 },
  { id: "fashion", label: "Fashion", icon: <IconHanger />, href: "#fashion", count: 2310 },
  { id: "sports", label: "Sports", icon: <IconBall />, href: "#sports", count: 540 },
  { id: "books", label: "Books", icon: <IconBook />, href: "#books", count: 4120 },
];

function Market(): React.JSX.Element {
  const [current, setCurrent] = useState("fashion");
  return (
    <div className="grid gap-3">
      <CategoryStrip size="sm" label="Departments" categories={MARKET} current={current} onSelect={setCurrent} />
      <p className="text-xs text-muted-foreground">
        Links, so the current one is aria-current: <span className="font-medium text-foreground">{MARKET.find((item) => item.id === current)?.label}</span>
      </p>
    </div>
  );
}

const SIMPLE: readonly Category[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New in" },
  { id: "sale", label: "Sale" },
  { id: "gifts", label: "Gifts" },
];

function Plain(): React.JSX.Element {
  const [current, setCurrent] = useState("new");
  return <CategoryStrip size="lg" label="Collections" categories={SIMPLE} current={current} onSelect={setCurrent} />;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-12">
      <Example caption="Drag it with a mouse, use the arrows or the arrow keys. The current one scrolls into view.">
        <Stays />
      </Example>
      <div className="grid gap-12 md:grid-cols-2 md:gap-x-10">
        <Example caption="Small, with links and counts.">
          <Market />
        </Example>
        <Example caption="Large, without icons.">
          <Plain />
        </Example>
      </div>
    </div>
  );
}
