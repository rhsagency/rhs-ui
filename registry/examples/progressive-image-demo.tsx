"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ProgressiveImage } from "@rhs-ui/primitives/progressive-image";
import { cn } from "@/lib/utils";

/* Pictures drawn as SVG at the shape asked for, so the demo needs no files. */
const SAND = ["#f4ece0", "#e6d8c3", "#cdb89c", "#a98f73", "#6f5a48", "#3a2f27"];

function dunes(seed: number, tag = ""): string {
  const p = SAND;
  const w = 1200;
  const h = 800;
  const c = (i: number) => p[Math.min(5, i)] ?? "#888";
  let n = seed * 7919 + 13;
  const rnd = () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f = (x: number) => Math.round(x * 10) / 10;
  const defs: string[] = [];
  const body: string[] = [];
  const grad = (id: string, a: string, b: string) => {
    defs.push(`<linearGradient id='${id}' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient>`);
    return `url(#${id})`;
  };
  const blur = (id: string, s: number) => {
    defs.push(`<filter id='${id}' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='${f(s)}'/></filter>`);
    return `filter='url(#${id})'`;
  };
  body.push(`<rect width='${w}' height='${h}' fill='${grad("s", c(0), c(1))}'/>`);
  body.push(`<circle cx='${f(w * (0.3 + rnd() * 0.4))}' cy='${f(h * 0.3)}' r='${f(h * 0.11)}' fill='${c(0)}' ${blur("b", h * 0.02)}/>`);
  for (let i = 0; i < 4; i++) {
    const y = h * (0.5 + i * 0.12);
    const a = h * (0.05 + rnd() * 0.06);
    body.push(`<path d='M${f(-w * 0.1)},${f(y + a)}C${f(w * 0.25)},${f(y - a * 1.6)} ${f(w * 0.45)},${f(y + a * 1.2)} ${f(w * 0.65)},${f(y - a * 0.4)}S${f(w * 0.95)},${f(y - a)} ${f(w * 1.1)},${f(y + a * 0.5)}V${h}H${f(-w * 0.1)}Z' fill='${grad("d" + i, c(i + 1), c(i + 2))}'/>`);
  }
  defs.push(`<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .1'/></filter>`, `<radialGradient id='v' cx='.5' cy='.5' r='.75'><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.22'/></radialGradient>`);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'><defs>${defs.join("")}</defs>${body.join("")}<rect width='${w}' height='${h}' fill='url(#v)'/><rect width='${w}' height='${h}' filter='url(#g)'/><!--${tag}--></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** What a build step would send ahead of the real file: a few dozen bytes, a colour for each of twelve blocks. */
function blurOf(colors: readonly string[]): string {
  const cells = colors.map((color, i) => `<rect x='${i % 4}' y='${Math.floor(i / 4)}' width='1' height='1' fill='${color}'/>`).join("");
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3' preserveAspectRatio='none' shape-rendering='crispEdges'>${cells}</svg>`)}`;
}

const DUNE_BLUR = blurOf(["#efe5d6", "#eadfcf", "#efe3d3", "#f1e8da", "#d9c8b0", "#dccbb3", "#d6c3a8", "#d8c6ac", "#a38a70", "#9a8068", "#8a7059", "#7c624d"]);
const RIDGE_BLUR = blurOf(["#dde2e7", "#d3dae1", "#d8dee4", "#e0e5ea", "#a9b4be", "#9eaab6", "#a6b1bc", "#b1bbc5", "#5d6d7c", "#566676", "#4c5c6b", "#3e4c5a"]);
const DUNE = dunes(3);
const DUNE_FIXED = dunes(9);
const BAD_FILE = "data:image/png;base64,AAAA";

function Example({ caption, children, action }: { caption: ReactNode; children: ReactNode; action?: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      {children}
      {/* Captions share their first line; only the row with a button is as tall as the button and centres the caption on it. */}
      <div className={cn("flex justify-between gap-3", action ? "min-h-8 items-center" : "items-start")}>
        <p className="text-xs text-muted-foreground">{caption}</p>
        {action}
      </div>
    </div>
  );
}

/** The sharp picture arrives a second and a half after the blur: press Replay to watch it again. */
function Arriving(): React.JSX.Element {
  const [run, setRun] = useState(0);
  const [src, setSrc] = useState<string | undefined>(DUNE);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const replay = () => {
    const next = run + 1;
    setRun(next);
    setSrc(undefined);
    window.clearTimeout(timer.current);
    // A new address each time, so the browser really loads it and does not take it from its cache.
    timer.current = window.setTimeout(() => setSrc(dunes(3, `run-${next}`)), 1500);
  };
  return (
    <Example
      caption={src ? "Loaded: blur first, a fade to sharp." : "Arriving: the placeholder holds the shape."}
      action={
        <Button type="button" variant="outline" size="sm" onClick={replay}>
          <IconRefresh aria-hidden="true" />
          Replay
        </Button>
      }
    >
      <ProgressiveImage src={src} alt="Pale dunes under a low sun" ratio={2} blurDataURL={DUNE_BLUR} />
    </Example>
  );
}

/** The first try fails; Retry swaps in a working address, as a fallback host would. */
function Failing(): React.JSX.Element {
  const [fixed, setFixed] = useState(false);
  return (
    <Example caption="Broken: a quiet placeholder with the alt text and Retry.">
      <ProgressiveImage src={fixed ? DUNE_FIXED : BAD_FILE} alt="Dune House at dawn, from the terrace" ratio={4 / 3} blurDataURL={DUNE_BLUR} onRetry={() => setFixed(true)} />
    </Example>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-3">
      <div className="min-w-0 sm:col-span-3">
        <Arriving />
      </div>
      <Example caption="Waiting for a src: the blur of a tiny file holds the shape.">
        <ProgressiveImage alt="Misty ridgelines in layers of slate" ratio={4 / 3} blurDataURL={RIDGE_BLUR} />
      </Example>
      <Example caption="No blur data: one flat colour in the same shape.">
        <ProgressiveImage alt="Misty ridgelines in layers of slate" ratio={4 / 3} placeholderColor="#c6cdd4" />
      </Example>
      <Failing />
    </div>
  );
}
