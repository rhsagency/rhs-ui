"use client";

import { useState, type ReactNode } from "react";

import { IconLeaf, IconMinus, IconPlus, IconCheck } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { BentoLayout, type BentoPattern } from "@rhs-ui/primitives/bento-layout";
import { Button } from "@rhs-ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

/* Pictures drawn as SVG at the shape asked for, so the demo needs no files. */
const PALETTES = {
  sand: ["#f4ece0", "#e6d8c3", "#cdb89c", "#a98f73", "#6f5a48", "#3a2f27"],
  slate: ["#eceff2", "#cfd6dd", "#a3afba", "#738290", "#445260", "#1f272f"],
  clay: ["#f5e8de", "#e9cdb9", "#d6aa8f", "#b97d60", "#80503a", "#43291f"],
  dusk: ["#d9d3cf", "#b9aeb0", "#8a7f8d", "#5d5668", "#37344a", "#1c1b2b"],
} as const;

function photo(kind: "dunes" | "arches" | "ridge" | "sea", palette: keyof typeof PALETTES, seed: number, w = 1200, h = 800): string {
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
    for (let i = 0; i < 14; i++) body.push(`<rect x='${f(w * 0.62 - w * 0.1 + (rnd() - 0.5) * m * 0.2)}' y='${f(hz + (h - hz) * (0.06 + (i / 14) * 0.9))}' width='${f(w * (0.04 + rnd() * 0.16) * (0.5 + i / 14))}' height='${f(1 + i * 0.35)}' rx='2' fill='#fff' opacity='${f(0.55 - i * 0.025)}'/>`);
    body.push(`<path d='M${f(w * 0.27 - m * 0.09)},${f(hz + m * 0.03)}h${f(m * 0.18)}l${f(-m * 0.03)},${f(m * 0.03)}h${f(-m * 0.12)}Z' fill='${c(5)}'/>`, `<path d='M${f(w * 0.27)},${f(hz - m * 0.1)}l${f(m * 0.063)},${f(m * 0.115)}h${f(-m * 0.063)}Z' fill='${c(5)}' opacity='.9'/>`);
  } else {
    body.push(`<rect width='${w}' height='${h}' fill='${grad("s", c(1), c(2))}'/>`);
    const n2 = Math.max(2, Math.round(w / (m * 0.55)));
    const cw = w / n2;
    for (let i = 0; i < n2; i++) {
      const x = i * cw + cw * 0.14;
      const aw = cw * 0.72;
      const top = h * 0.2;
      body.push(`<path d='M${f(x)},${h}V${f(top + aw / 2)}A${f(aw / 2)},${f(aw / 2)} 0 0 1 ${f(x + aw)},${f(top + aw / 2)}V${h}Z' fill='${grad("a" + i, c(4), c(5))}'/>`, `<path d='M${f(x + aw * 0.06)},${h}V${f(top + aw / 2)}A${f(aw * 0.44)},${f(aw * 0.44)} 0 0 1 ${f(x + aw * 0.94)},${f(top + aw / 2)}V${h}Z' fill='${c(0)}' opacity='.35'/>`);
    }
    body.push(`<rect y='${f(h * 0.86)}' width='${w}' height='${f(h * 0.14)}' fill='${c(3)}'/>`);
  }
  defs.push(`<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .1'/></filter>`, `<radialGradient id='v' cx='.5' cy='.5' r='.75'><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.22'/></radialGradient>`);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><defs>${defs.join("")}</defs>${body.join("")}<rect width='${w}' height='${h}' fill='url(#v)'/><rect width='${w}' height='${h}' filter='url(#g)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SRC = {
  dune: photo("dunes", "sand", 3),
  arches: photo("arches", "clay", 4),
  fjord: photo("ridge", "slate", 5),
  harbour: photo("sea", "dusk", 6),
};

function Photo({ src, alt, caption }: { src: string; alt: string; caption: string }): React.JSX.Element {
  return (
    <figure className="relative m-0 overflow-hidden bg-muted">
      <img src={src} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      <figcaption className="absolute bottom-3 left-3 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs">{caption}</figcaption>
    </figure>
  );
}

function Card({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="flex flex-col justify-between gap-5 border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6">{children}</div>;
}

function Stat({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <Card>
      <p className="max-w-[16rem] text-sm text-muted-foreground">{label}</p>
      <p className="text-5xl font-medium tracking-[-0.05em] tabular-nums">{value}</p>
    </Card>
  );
}

const TILES: ReactNode[] = [
  <Photo key="dune" src={SRC.dune} alt="Pale dunes under a low sun" caption="Dune House, Namibia" />,
  <Stat key="rating" value="4.9" label="Average rating across 2,184 stays in 31 places." />,
  <Card key="quiet">
    <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border">
      <IconLeaf className="size-[1.125rem]" />
    </span>
    <div>
      <p className="font-medium tracking-[-0.01em]">Quiet by design</p>
      <p className="mt-1 text-sm text-muted-foreground">No television in the rooms, no cars past the gate.</p>
    </div>
  </Card>,
  <Photo key="arches" src={SRC.arches} alt="Three tall arches in warm plaster" caption="Alfama Arches, Lisbon" />,
  <Card key="quote">
    <p className="text-lg leading-snug font-medium tracking-[-0.02em] text-balance">&ldquo;We slept eleven hours and woke up to bread at the door.&rdquo;</p>
    <p className="text-sm text-muted-foreground">Marta K., stayed in March</p>
  </Card>,
  <Stat key="cancel" value="48 h" label="Free cancellation on every booking, no questions asked." />,
  <Photo key="fjord" src={SRC.fjord} alt="Misty ridgelines in layers of slate" caption="Fjord Loft, Norway" />,
  <Card key="included">
    <p className="font-medium tracking-[-0.01em]">Every stay includes</p>
    <ul className="grid gap-2 text-sm text-muted-foreground">
      {["Breakfast baked on site", "Two bikes per room", "Late check-out until 14:00"].map((item) => (
        <li key={item} className="flex items-center gap-2">
          <IconCheck aria-hidden="true" className="size-4 shrink-0 text-foreground" />
          {item}
        </li>
      ))}
    </ul>
  </Card>,
  <Photo key="harbour" src={SRC.harbour} alt="A sailing boat on a quiet sea at dusk" caption="Harbour Rooms, Split" />,
];

const PATTERNS: { value: BentoPattern; label: string; size: number }[] = [
  { value: "feature-left", label: "Feature left", size: 5 },
  { value: "feature-top", label: "Feature top", size: 4 },
  { value: "mosaic", label: "Mosaic", size: 6 },
  { value: "split", label: "Split", size: 2 },
  { value: "quartet", label: "Quartet", size: 4 },
];

export default function Demo(): React.JSX.Element {
  const [pattern, setPattern] = useState<BentoPattern>("feature-left");
  const [count, setCount] = useState(7);
  const size = PATTERNS.find((item) => item.value === pattern)?.size ?? 5;
  const runs = Math.floor(count / size);
  const rest = count % size;
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        {/* Five segments do not fit a phone, so there the same choice is a select on a row of its own and no label is ever cut off. */}
        <SegmentedControl className="hidden sm:inline-flex" label="Pattern" options={PATTERNS} value={pattern} onValueChange={(next) => setPattern(next as BentoPattern)} />
        <Select value={pattern} onValueChange={(next) => setPattern(next as BentoPattern)}>
          <SelectTrigger aria-label="Pattern" className="sm:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PATTERNS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div role="group" aria-label="Number of tiles" className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon-sm" aria-label="Fewer tiles" disabled={count <= 1} onClick={() => setCount((n) => Math.max(1, n - 1))}>
            <IconMinus />
          </Button>
          <span className="min-w-16 text-center text-sm tabular-nums" aria-live="polite">
            {count} {count === 1 ? "tile" : "tiles"}
          </span>
          <Button type="button" variant="outline" size="icon-sm" aria-label="More tiles" disabled={count >= TILES.length} onClick={() => setCount((n) => Math.min(TILES.length, n + 1))}>
            <IconPlus />
          </Button>
        </div>
      </div>
      <BentoLayout pattern={pattern}>
        {TILES.slice(0, count)}
      </BentoLayout>
      <p className="text-xs text-muted-foreground">
        {runs ? `${runs} full ${runs === 1 ? "run" : "runs"} of ${size}` : "No full run yet"}
        {rest ? `${runs ? ", then" : ":"} the last ${rest === 1 ? "tile takes" : `${rest} tiles share`} a row` : ""}. Add or remove tiles and the spans follow.
      </p>
    </div>
  );
}
