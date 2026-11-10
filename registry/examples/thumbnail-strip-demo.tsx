"use client";

import { useState } from "react";

import { IconPlay } from "@rhs-ui/icons";
import { ThumbnailStrip, type ThumbnailItem } from "@rhs-ui/primitives/thumbnail-strip";
import { cn } from "@/lib/utils";

/* Pictures drawn as SVG at the shape asked for, so the demo needs no files. */
const PALETTES = {
  sand: ["#f4ece0", "#e6d8c3", "#cdb89c", "#a98f73", "#6f5a48", "#3a2f27"],
  slate: ["#eceff2", "#cfd6dd", "#a3afba", "#738290", "#445260", "#1f272f"],
  sage: ["#eef0e6", "#d6dccb", "#b0bb9a", "#83936d", "#566545", "#2b3421"],
  clay: ["#f5e8de", "#e9cdb9", "#d6aa8f", "#b97d60", "#80503a", "#43291f"],
  dusk: ["#d9d3cf", "#b9aeb0", "#8a7f8d", "#5d5668", "#37344a", "#1c1b2b"],
} as const;

type Kind = "dunes" | "ridge" | "sea" | "arches" | "still";

function photo(kind: Kind, palette: keyof typeof PALETTES, seed: number, w = 1200, h = 900): string {
  const p = PALETTES[palette];
  const c = (i: number) => p[Math.min(5, i)] ?? "#888";
  let n = seed * 7919 + 13;
  const rnd = () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f = (x: number) => Math.round(x * 10) / 10;
  const m = Math.min(w, h);
  const defs: string[] = [];
  const body: string[] = [];
  const grad = (id: string, a: string, b: string, horizontal = false) => {
    defs.push(`<linearGradient id='${id}' x1='0' y1='0' x2='${horizontal ? 1 : 0}' y2='${horizontal ? 0 : 1}'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient>`);
    return `url(#${id})`;
  };
  const blur = (id: string, s: number) => {
    defs.push(`<filter id='${id}' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='${f(s)}'/></filter>`);
    return `filter='url(#${id})'`;
  };
  if (kind === "dunes") {
    body.push(`<rect width='${w}' height='${h}' fill='${grad("s", c(0), c(1))}'/>`, `<circle cx='${f(w * (0.3 + rnd() * 0.4))}' cy='${f(h * 0.3)}' r='${f(m * 0.11)}' fill='${c(0)}' ${blur("b", m * 0.02)}/>`);
    for (let i = 0; i < 4; i++) {
      const y = h * (0.5 + i * 0.12);
      const a = h * (0.05 + rnd() * 0.06);
      body.push(`<path d='M${f(-w * 0.1)},${f(y + a)}C${f(w * 0.25)},${f(y - a * 1.6)} ${f(w * 0.45)},${f(y + a * 1.2)} ${f(w * 0.65)},${f(y - a * 0.4)}S${f(w * 0.95)},${f(y - a)} ${f(w * 1.1)},${f(y + a * 0.5)}V${h}H${f(-w * 0.1)}Z' fill='${grad("d" + i, c(i + 1), c(i + 2))}'/>`);
    }
  } else if (kind === "ridge") {
    body.push(`<rect width='${w}' height='${h}' fill='${grad("s", c(0), c(1))}'/>`);
    for (let i = 0; i < 5; i++) {
      const base = h * (0.38 + i * 0.12);
      let d = `M0,${h}V${f(base)}`;
      const steps = 9 + i * 2;
      for (let k = 1; k <= steps; k++) d += `L${f((w / steps) * k)},${f(base - (rnd() * 0.5 + 0.1) * h * (0.28 - i * 0.03))}`;
      body.push(`<path d='${d}V${h}Z' fill='${c(i + 1)}'/>`);
      if (i < 4) body.push(`<rect x='-5%' y='${f(base - h * 0.02)}' width='110%' height='${f(h * 0.1)}' fill='${c(0)}' opacity='.55' ${blur("f" + i, m * 0.04)}/>`);
    }
  } else if (kind === "sea") {
    const hz = h * 0.56;
    body.push(`<rect width='${w}' height='${f(hz)}' fill='${grad("s", c(1), c(0))}'/>`, `<rect y='${f(hz)}' width='${w}' height='${f(h - hz)}' fill='${grad("w", c(2), c(4))}'/>`, `<circle cx='${f(w * 0.62)}' cy='${f(hz - m * 0.05)}' r='${f(m * 0.09)}' fill='#fff' opacity='.8' ${blur("b", m * 0.015)}/>`);
    for (let i = 0; i < 14; i++) body.push(`<rect x='${f(w * 0.52 + (rnd() - 0.5) * m * 0.2)}' y='${f(hz + (h - hz) * (0.06 + (i / 14) * 0.9))}' width='${f(w * (0.04 + rnd() * 0.16) * (0.5 + i / 14))}' height='${f(1 + i * 0.35)}' rx='2' fill='#fff' opacity='${f(0.55 - i * 0.025)}'/>`);
    body.push(`<path d='M${f(w * 0.27 - m * 0.09)},${f(hz + m * 0.03)}h${f(m * 0.18)}l${f(-m * 0.03)},${f(m * 0.03)}h${f(-m * 0.12)}Z' fill='${c(5)}'/>`, `<path d='M${f(w * 0.27)},${f(hz - m * 0.1)}l${f(m * 0.063)},${f(m * 0.115)}h${f(-m * 0.063)}Z' fill='${c(5)}' opacity='.9'/>`);
  } else if (kind === "arches") {
    body.push(`<rect width='${w}' height='${h}' fill='${grad("s", c(1), c(2))}'/>`);
    const count = Math.max(2, Math.round(w / (m * 0.55)));
    const cw = w / count;
    for (let i = 0; i < count; i++) {
      const x = i * cw + cw * 0.14;
      const aw = cw * 0.72;
      const top = h * 0.2;
      body.push(`<path d='M${f(x)},${h}V${f(top + aw / 2)}A${f(aw / 2)},${f(aw / 2)} 0 0 1 ${f(x + aw)},${f(top + aw / 2)}V${h}Z' fill='${grad("a" + i, c(4), c(5))}'/>`, `<path d='M${f(x + aw * 0.06)},${h}V${f(top + aw / 2)}A${f(aw * 0.44)},${f(aw * 0.44)} 0 0 1 ${f(x + aw * 0.94)},${f(top + aw / 2)}V${h}Z' fill='${c(0)}' opacity='.35'/>`);
    }
    body.push(`<rect y='${f(h * 0.86)}' width='${w}' height='${f(h * 0.14)}' fill='${c(3)}'/>`);
  } else {
    body.push(`<rect width='${w}' height='${h}' fill='${grad("s", c(1), c(2))}'/>`, `<path d='M${f(w * 0.1)},0H${f(w * 0.46)}L${f(w * 0.74)},${f(h * 0.78)}H${f(w * 0.3)}Z' fill='${c(0)}' opacity='.5' ${blur("l", m * 0.02)}/>`, `<rect y='${f(h * 0.7)}' width='${w}' height='${f(h * 0.3)}' fill='${grad("t", c(3), c(4))}'/>`);
    [[0.3, 0.24, 0.34], [0.5, 0.16, 0.22], [0.68, 0.12, 0.16]].forEach(([cx = 0.5, rw = 0.2, rh = 0.2], i) => {
      const x = w * cx;
      const base = h * 0.74;
      const bh = m * rh * 1.4;
      const bw = m * rw * 0.55;
      body.push(`<ellipse cx='${f(x + bw * 0.35)}' cy='${f(base + m * 0.015)}' rx='${f(bw * 1.2)}' ry='${f(m * 0.02)}' fill='${c(5)}' opacity='.45' ${blur("sh" + i, m * 0.012)}/>`, `<path d='M${f(x - bw * 0.35)},${f(base - bh)}H${f(x + bw * 0.35)}C${f(x + bw * 0.4)},${f(base - bh * 0.78)} ${f(x + bw)},${f(base - bh * 0.5)} ${f(x + bw)},${f(base - bh * 0.18)}Q${f(x + bw)},${f(base)} ${f(x + bw * 0.6)},${f(base)}H${f(x - bw * 0.6)}Q${f(x - bw)},${f(base)} ${f(x - bw)},${f(base - bh * 0.18)}C${f(x - bw)},${f(base - bh * 0.5)} ${f(x - bw * 0.4)},${f(base - bh * 0.78)} ${f(x - bw * 0.35)},${f(base - bh)}Z' fill='${grad("v" + i, c(0), c(i === 1 ? 2 : 3), true)}'/>`);
    });
  }
  defs.push(`<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .1'/></filter>`, `<radialGradient id='v' cx='.5' cy='.5' r='.75'><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.22'/></radialGradient>`);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'><defs>${defs.join("")}</defs>${body.join("")}<rect width='${w}' height='${h}' fill='url(#v)'/><rect width='${w}' height='${h}' filter='url(#g)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface Shot extends ThumbnailItem {
  title: string;
}

const SHOTS: Shot[] = [
  { id: "dunes", title: "Dunes at first light", alt: "Pale dunes at first light", src: photo("dunes", "sand", 3) },
  { id: "ridge", title: "Ridgelines in mist", alt: "Layered ridgelines in mist", src: photo("ridge", "slate", 5) },
  { id: "harbour", title: "Harbour film", alt: "Harbour film, a boat leaving at dusk", src: photo("sea", "dusk", 6), kind: "video", duration: 42 },
  { id: "arches", title: "Arches in warm plaster", alt: "Three arches in warm plaster", src: photo("arches", "clay", 4) },
  { id: "vessels", title: "Vessels on a table", alt: "Ceramic vessels on a table", src: photo("still", "sand", 8) },
  { id: "fern", title: "Terrace in the fog", alt: "A sage green ridge in the fog", src: photo("ridge", "sage", 9) },
  { id: "sea", title: "The tour, start to finish", alt: "The tour, start to finish", src: photo("sea", "sage", 2), kind: "video", duration: 134 },
  { id: "window", title: "Window light", alt: "Vessels in window light", src: photo("still", "slate", 7) },
  { id: "crest", title: "Dune crest at noon", alt: "A dune crest at noon", src: photo("dunes", "clay", 11) },
];

function Viewer({ shot, position, className }: { shot: Shot; position: string; className?: string }): React.JSX.Element {
  const video = shot.kind === "video";
  return (
    <figure className={cn("relative m-0 overflow-hidden rounded-xl border border-border bg-muted", className)}>
      <img src={shot.src} alt={video ? "" : shot.alt} className="size-full object-cover" />
      {video ? (
        <span className="absolute inset-0 grid place-items-center">
          <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-background text-foreground shadow-sm">
            <IconPlay className="size-6 translate-x-0.5 fill-current" />
          </span>
        </span>
      ) : null}
      <figcaption className="absolute bottom-3 left-3 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs tabular-nums">
        {position} &middot; {shot.title}
      </figcaption>
    </figure>
  );
}

function Horizontal(): React.JSX.Element {
  const [id, setId] = useState("dunes");
  const index = Math.max(0, SHOTS.findIndex((shot) => shot.id === id));
  const shot = SHOTS[index] ?? SHOTS[0];
  if (!shot) return <></>;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-1">
      <Viewer shot={shot} position={`${index + 1} / ${SHOTS.length}`} className="aspect-[3/2]" />
      <ThumbnailStrip items={SHOTS} value={id} onChange={setId} label="Photos and films" size="lg" className="-mx-2" />
    </div>
  );
}

function Vertical(): React.JSX.Element {
  const [id, setId] = useState("arches");
  const index = Math.max(0, SHOTS.findIndex((shot) => shot.id === id));
  const shot = SHOTS[index] ?? SHOTS[0];
  if (!shot) return <></>;
  return (
    <div className="grid min-w-0 grid-cols-[auto_1fr] gap-2">
      <ThumbnailStrip items={SHOTS} value={id} onChange={setId} orientation="vertical" label="Photos and films, vertical" className="-my-2 h-0 min-h-[calc(100%+1rem)]" />
      <Viewer shot={shot} position={`${index + 1} / ${SHOTS.length}`} className="aspect-[4/3] min-h-56 w-full min-w-0 self-start" />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12">
      <div className="grid gap-3">
        <p className="text-xs text-muted-foreground">Click, or use the arrow keys: Home and End jump. The strip scrolls with the chosen one, and the edge with more beyond it fades.</p>
        <Horizontal />
      </div>
      <div className="grid gap-3">
        <p className="text-xs text-muted-foreground">The same strip as a column. Videos show a play badge and their length.</p>
        <Vertical />
      </div>
    </div>
  );
}
