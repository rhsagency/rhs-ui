"use client";

import { useState, type ReactNode } from "react";

import { PhotoStack, type StackPhoto } from "@rhs-ui/primitives/photo-stack";

/* The photos are drawn as SVG from a seed, so the demo needs no files: a sky, a low sun and two or three ridges, with a little grain. */
const PALETTES = {
  sand: ["#f6ecdc", "#ead3b0", "#cfa573", "#a07a52", "#5e4633"],
  slate: ["#e7edf1", "#c6d3dc", "#93a9b8", "#617a8c", "#35495b"],
  sage: ["#eef0e6", "#d3d9c3", "#a4b08e", "#738262", "#41503a"],
  ink: ["#d9d9d6", "#aeb0ad", "#7c807e", "#4a4f4d", "#222625"],
} as const;

function photo(seed: number, tone: keyof typeof PALETTES, alt: string): StackPhoto {
  const c = PALETTES[tone];
  let n = seed * 7919 + 13;
  const rnd = () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f = (x: number) => Math.round(x * 10) / 10;
  const W = 600;
  const H = 600;
  const sunX = 120 + rnd() * 360;
  const sunY = 150 + rnd() * 130;
  const ridges = [0, 1, 2].map((i) => {
    const y = 330 + i * 96 + rnd() * 30;
    const a = 34 + rnd() * 46;
    return `<path d='M-20 ${f(y + a)}C${f(W * 0.2)} ${f(y - a * 1.5)} ${f(W * 0.42)} ${f(y + a)} ${f(W * 0.62)} ${f(y - a * 0.4)}S${f(W * 0.92)} ${f(y - a)} ${W + 20} ${f(y + a * 0.4)}V${H}H-20Z' fill='${c[Math.min(4, i + 2)]}'/>`;
  });
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${c[0]}'/><stop offset='1' stop-color='${c[1]}'/></linearGradient>` +
    `<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .1'/></filter></defs>` +
    `<rect width='${W}' height='${H}' fill='url(#s)'/><circle cx='${f(sunX)}' cy='${f(sunY)}' r='${f(46 + rnd() * 26)}' fill='#fff' opacity='.7'/>${ridges.join("")}<rect width='${W}' height='${H}' filter='url(#g)'/></svg>`;
  return { src: "data:image/svg+xml;utf8," + encodeURIComponent(svg), alt };
}

const SUMMER = [photo(1, "sand", "A low sun over dunes"), photo(2, "sand", "Ridges at dusk"), photo(3, "sage", "A green valley"), photo(4, "sand", "Warm hills"), photo(5, "slate", "A grey bay")];
const LISBON = [photo(11, "slate", "A river at dawn"), photo(12, "sand", "Rooftops in late light"), photo(13, "ink", "A tram in the evening"), photo(14, "slate", "The quay"), photo(15, "sage", "A hillside garden")];
const MOODBOARD = [photo(21, "ink", "A charcoal study"), photo(22, "sage", "A moss tone"), photo(23, "sand", "A clay tone"), photo(24, "slate", "A grey tone")];
const HIKE = [photo(31, "sage", "A forest ridge"), photo(32, "slate", "A mountain lake")];
const HARBOUR = [photo(41, "slate", "Boats in the harbour"), photo(42, "sand", "The old pier"), photo(43, "ink", "A lighthouse")];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-5">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState("Press the pile: with an onClick and no href it is a button.");
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-14">
      <Example caption="Three sizes. Hover or focus a pile and it opens a little; on a touch screen it stays shut, and so it does under reduced motion.">
        <div className="flex flex-wrap items-end gap-x-14 gap-y-10 px-1">
          <PhotoStack href="#summer" size="sm" photos={SUMMER} title="Summer 2025" count={24} />
          <PhotoStack href="#summer" size="md" photos={SUMMER} title="Summer 2025" count={24} />
          <PhotoStack href="#summer" size="lg" photos={SUMMER} title="Summer 2025" count={24} />
        </div>
      </Example>

      <Example caption="A shelf of albums. The chip counts the photos the pile does not show, and a small album shows them all.">
        <div className="flex flex-wrap items-start gap-x-14 gap-y-10 px-1">
          <PhotoStack href="#summer" photos={SUMMER} title="Summer 2025" count={24} />
          <PhotoStack href="#lisbon" photos={LISBON} title="Lisbon weekend" count={63} />
          <PhotoStack href="#moodboard" photos={MOODBOARD} title="Studio moodboard" />
          <PhotoStack href="#hike" photos={HIKE} title="Larch Valley hike" />
        </div>
      </Example>

      <Example caption="Pile only, as a button in a message. The name is still read: Harbour walk, 3 photos.">
        <div className="flex items-center gap-5 rounded-xl border border-border p-4 sm:max-w-md">
          <PhotoStack photos={HARBOUR} title="Harbour walk" size="sm" showCaption={false} onClick={() => setOpened("Opening the album Harbour walk.")} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-[-0.01em]">Maya shared 3 photos</p>
            <p role="status" className="text-xs text-muted-foreground">
              {opened}
            </p>
          </div>
        </div>
      </Example>
    </div>
  );
}
