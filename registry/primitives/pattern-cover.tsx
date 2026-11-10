import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PatternCoverShape = "square" | "round";

export interface PatternCoverProps extends Omit<ComponentProps<"svg">, "children" | "width" | "height" | "viewBox" | "role"> {
  /** Any string: a playlist name, a project id, a workspace slug. The same seed always draws the same cover, on the server and in the browser. */
  seed: string;
  /** A rounded square (the default) or a circle, for avatars. */
  shape?: PatternCoverShape;
  /** Width and height: a number of px, or any CSS length such as "100%". Default 96. */
  size?: number | string;
  /** Names the cover for assistive technology. Without it the cover is decoration and hidden from it. */
  label?: string;
}

type Tone = "hi" | "mid" | "lo";

interface Palette {
  /** The surface of the cover. */
  bg: string;
  fill: Record<Tone, string>;
  stroke: Record<Tone, string>;
}

/**
 * Two palettes, both made of theme tokens only: a light cover with dark shapes and a dark one with light shapes, so a
 * grid of covers has a rhythm. The class names are written out whole so Tailwind finds them.
 */
const LIGHT: Palette = {
  bg: "bg-muted",
  fill: { hi: "fill-foreground", mid: "fill-[color-mix(in_oklch,var(--foreground)_42%,var(--background))]", lo: "fill-background" },
  stroke: { hi: "stroke-foreground", mid: "stroke-[color-mix(in_oklch,var(--foreground)_42%,var(--background))]", lo: "stroke-background" },
};
const DARK: Palette = {
  bg: "bg-foreground",
  fill: { hi: "fill-background", mid: "fill-[color-mix(in_oklch,var(--background)_45%,var(--foreground))]", lo: "fill-[color-mix(in_oklch,var(--background)_14%,var(--foreground))]" },
  stroke: { hi: "stroke-background", mid: "stroke-[color-mix(in_oklch,var(--background)_45%,var(--foreground))]", lo: "stroke-[color-mix(in_oklch,var(--background)_14%,var(--foreground))]" },
};

/**
 * A seeded random stream. The hash and the generator use integer maths only (no sin, no cos), so every JavaScript
 * engine draws the same numbers and the server's markup is the browser's.
 */
function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  let state = (h ^ (h >>> 16)) >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    int: (n: number): number => Math.floor(next() * n),
    range: (low: number, high: number): number => low + next() * (high - low),
    chance: (p: number): boolean => next() < p,
    pick: <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)] as T,
  };
}
type Rng = ReturnType<typeof seeded>;

/** Coordinates are rounded so the markup stays short and identical everywhere. */
const q = (value: number): number => Math.round(value * 100) / 100;

/**
 * Concentric rings (a target, sometimes off centre like a ripple), rings swept from a corner, or a solid disc inside
 * thin lines. Choices are made in a few clear steps rather than a smooth range, so two covers differ visibly or not at all.
 */
function rings(r: Rng, p: Palette): ReactNode[] {
  const out: ReactNode[] = [];
  const variant = r.int(3);
  if (variant === 0) {
    const count = 4 + r.int(5);
    const lead: Tone = r.pick(["hi", "mid"] as const);
    // Evenly spaced, or each ring a fixed share of the one outside it: thick rings at the rim, thin ones inside. Multiplication only, so every engine draws the same radii.
    const shrink = r.pick([0, 0.78, 0.86] as const);
    const bare = r.chance(0.3);
    const cx = r.pick([50, 50, 38, 62] as const);
    const cy = r.pick([50, 50, 38, 62] as const);
    let radius = 50;
    for (let i = 0; i < count; i++) {
      const tone: Tone = i === count - 1 ? (bare ? "lo" : "hi") : i % 2 === 0 ? lead : "lo";
      out.push(<circle key={i} cx={cx} cy={cy} r={q(radius)} className={p.fill[tone]} />);
      radius = shrink ? radius * shrink : radius - 50 / count;
    }
  } else if (variant === 1) {
    const cx = q(r.pick([r.range(2, 26), r.range(74, 98)]));
    const cy = q(r.pick([r.range(2, 26), r.range(74, 98)]));
    const step = r.range(11, 16);
    const weight = q(step * r.range(0.4, 0.56));
    for (let i = 0; (i + 1) * step < 150; i++) {
      out.push(<circle key={i} cx={cx} cy={cy} r={q((i + 1) * step)} fill="none" strokeWidth={weight} className={p.stroke[i % 3 === 2 ? "mid" : "hi"]} />);
    }
    out.push(<circle key="core" cx={cx} cy={cy} r={q(step * 0.5)} className={p.fill.hi} />);
  } else {
    const cx = r.pick([34, 50, 66] as const);
    const cy = r.pick([34, 50, 66] as const);
    const disc = r.pick([14, 18, 22, 26] as const);
    const count = 2 + r.int(3);
    const gap = r.pick([7, 9.5, 12] as const);
    for (let i = count; i >= 1; i--) out.push(<circle key={i} cx={cx} cy={cy} r={q(disc + i * gap)} fill="none" strokeWidth={1.6} className={p.stroke.mid} />);
    out.push(<circle key="disc" cx={cx} cy={cy} r={disc} className={p.fill.hi} />);
  }
  return out;
}

/** Bands at a slant or square on, evenly or growing, or a row of rounded bars like a level meter. */
function stripes(r: Rng, p: Palette): ReactNode[] {
  if (r.int(3) === 2) {
    const count = 7 + r.int(5);
    const pitch = 100 / count;
    const width = q(pitch * 0.56);
    const out: ReactNode[] = [];
    let height = r.range(30, 70);
    for (let i = 0; i < count; i++) {
      height = Math.min(88, Math.max(18, height + r.range(-30, 30)));
      out.push(<rect key={i} x={q(i * pitch + (pitch - width) / 2)} y={q((100 - height) / 2)} width={width} height={q(height)} rx={q(width / 2)} className={p.fill[i % 4 === 1 ? "mid" : "hi"]} />);
    }
    return out;
  }
  const angle = r.pick([0, 45, 90, 135] as const);
  const count = 6 + r.int(7);
  // Even bands, bands that widen, or bands that narrow; and which of the two tones comes first.
  const growth = r.pick([0, 0.45, -0.45] as const);
  const phase = r.int(2);
  const weights = Array.from({ length: count }, (_, i) => 1 + (growth < 0 ? count - 1 - i : growth > 0 ? i : 0) * Math.abs(growth));
  const unit = 150 / weights.reduce((sum, w) => sum + w, 0);
  const accent = r.int(count);
  let x = -25;
  const bands = weights.map((w, i) => {
    const width = w * unit;
    const tone: Tone = i === accent ? "mid" : (i + phase) % 2 === 0 ? "hi" : "lo";
    const band = <rect key={i} x={q(x)} y={-30} width={q(width + (i < count - 1 ? 0.4 : 0))} height={160} className={p.fill[tone]} />;
    x += width;
    return band;
  });
  return [
    <g key="bands" transform={`rotate(${angle} 50 50)`}>
      {bands}
    </g>,
  ];
}

/**
 * A Bauhaus board: each tile is a quarter disc, a circle, a square, a leaf or nothing, some on a tile of their own.
 * Every tile is drawn a hair larger than its cell so neighbours overlap and no anti-aliased seam shows between them.
 */
function grid(r: Rng, p: Palette): ReactNode[] {
  const n = r.pick([3, 3, 4, 4, 5] as const);
  const s = 100 / n;
  const h = s / 2;
  const out: ReactNode[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const under: Tone | null = r.chance(0.42) ? r.pick(["lo", "lo", "mid"] as const) : null;
      let tone: Tone = r.pick(["hi", "hi", "mid", "lo"] as const);
      if (tone === under) tone = "hi";
      const shape = r.pick(["quarter", "quarter", "quarter", "circle", "square", "leaf", "none"] as const);
      const turn = r.int(4) * 90;
      const fill = p.fill[tone];
      out.push(
        <g key={`${i}-${j}`} transform={`translate(${q(i * s + h)} ${q(j * s + h)}) scale(1.02)`}>
          {under ? <rect x={q(-h)} y={q(-h)} width={q(s)} height={q(s)} className={p.fill[under]} /> : null}
          {shape === "quarter" ? <path d={`M${q(-h)} ${q(-h)}H${q(h)}A${q(s)} ${q(s)} 0 0 1 ${q(-h)} ${q(h)}Z`} transform={`rotate(${turn})`} className={fill} /> : null}
          {shape === "leaf" ? <path d={`M${q(-h)} ${q(h)}A${q(s)} ${q(s)} 0 0 1 ${q(h)} ${q(-h)}A${q(s)} ${q(s)} 0 0 1 ${q(-h)} ${q(h)}Z`} transform={`rotate(${turn % 180})`} className={fill} /> : null}
          {shape === "circle" ? <circle r={q(s * 0.38)} className={fill} /> : null}
          {shape === "square" ? <rect x={q(-s * 0.3)} y={q(-s * 0.3)} width={q(s * 0.6)} height={q(s * 0.6)} className={fill} /> : null}
        </g>,
      );
    }
  }
  return out;
}

/** Truchet tiles: quarter arcs that join across tile edges into one flowing line, or the same arcs as solid petals. */
function arcs(r: Rng, p: Palette): ReactNode[] {
  const n = r.pick([3, 4, 4, 5, 6] as const);
  const s = 100 / n;
  const h = s / 2;
  const solid = r.chance(0.4);
  const weight = q(s * 0.26);
  const out: ReactNode[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const turn = r.int(2) * 90;
      out.push(
        <g key={`${i}-${j}`} transform={`translate(${q(i * s + h)} ${q(j * s + h)}) rotate(${turn}) scale(1.02)`}>
          {solid ? (
            <>
              <path d={`M${q(-h)} ${q(-h)}H0A${q(h)} ${q(h)} 0 0 1 ${q(-h)} 0Z`} className={p.fill.hi} />
              <path d={`M${q(h)} ${q(h)}H0A${q(h)} ${q(h)} 0 0 1 ${q(h)} 0Z`} className={p.fill.hi} />
            </>
          ) : (
            <>
              <path d={`M${q(-h)} 0A${q(h)} ${q(h)} 0 0 0 0 ${q(-h)}`} fill="none" strokeWidth={weight} strokeLinecap="square" className={p.stroke.hi} />
              <path d={`M${q(h)} 0A${q(h)} ${q(h)} 0 0 0 0 ${q(h)}`} fill="none" strokeWidth={weight} strokeLinecap="square" className={p.stroke.hi} />
            </>
          )}
        </g>,
      );
    }
  }
  return out;
}

/** Unit vectors for the direction a halftone grows along, written out so no cosine is needed (see seeded()). */
const SLOPES = [
  [1, 0],
  [0.87, 0.5],
  [0.5, 0.87],
  [0, 1],
  [-0.5, 0.87],
  [-0.87, 0.5],
] as const;

/**
 * A halftone: dots on a square or a staggered lattice whose size follows a point of focus, a slope across the cover
 * or the distance from the middle, with a soft or a hard curve and a small or a nil smallest dot.
 */
function dots(r: Rng, p: Palette): ReactNode[] {
  const n = 5 + r.int(4);
  const pitch = 100 / n;
  const staggered = r.chance(0.4);
  const mode = r.int(3);
  // How the size follows its value: quickly at first, evenly, or slowly at first.
  const curve = r.int(3);
  const floor = r.pick([0.06, 0.2] as const);
  const flip = r.chance(0.5);
  const fx = r.pick([14, 32, 50, 68, 86] as const);
  const fy = r.pick([14, 32, 50, 68, 86] as const);
  const [dx, dy] = r.pick(SLOPES);
  const reach = 50 * (Math.abs(dx) + Math.abs(dy));
  const out: ReactNode[] = [];
  for (let j = 0; j < n; j++) {
    // A staggered lattice has one dot fewer in every second row, centred between the dots of its neighbours.
    const inRow = staggered && j % 2 === 1 ? n - 1 : n;
    for (let i = 0; i < inRow; i++) {
      const cx = (staggered && j % 2 === 1 ? i + 1 : i + 0.5) * pitch;
      const cy = (j + 0.5) * pitch;
      let t: number;
      if (mode === 0) t = 1 - Math.min(1, Math.sqrt((cx - fx) ** 2 + (cy - fy) ** 2) / 90);
      else if (mode === 1) t = ((cx - 50) * dx + (cy - 50) * dy + reach) / (2 * reach);
      else t = 1 - Math.max(Math.abs(cx - 50), Math.abs(cy - 50)) / 50;
      if (flip && mode !== 0) t = 1 - t;
      t = Math.min(1, Math.max(0, t));
      t = curve === 0 ? Math.sqrt(t) : curve === 2 ? t * t : t;
      out.push(<circle key={`${i}-${j}`} cx={q(cx)} cy={q(cy)} r={q(pitch * 0.47 * (floor + (1 - floor) * t))} className={p.fill[t < 0.3 ? "mid" : "hi"]} />);
    }
  }
  return out;
}

const FAMILIES = [
  ["rings", rings],
  ["stripes", stripes],
  ["grid", grid],
  ["arcs", arcs],
  ["dots", dots],
] as const;

/**
 * A designed placeholder for artwork that does not exist yet: a monochrome geometric cover drawn from a string. The
 * seed (a playlist name, a project id) decides the family (rings, stripes, a Bauhaus grid, Truchet arcs or a halftone),
 * the layout and whether the cover is light or dark, so every item has its own cover and the same seed always gets the
 * same one. It is SVG in theme tokens, so it scales without blurring and follows light and dark; it uses no random
 * numbers, no images and no network, and it renders the same on the server and in the browser. Square or round, any
 * size. It is decoration (hidden from assistive technology) unless you pass a `label`.
 */
export function PatternCover({ seed, shape = "square", size = 96, label, className, style, ...props }: PatternCoverProps) {
  const r = seeded(seed);
  const [family, draw] = FAMILIES[r.int(FAMILIES.length)] as (typeof FAMILIES)[number];
  const palette = r.chance(0.36) ? DARK : LIGHT;
  return (
    <svg
      data-slot="pattern-cover"
      data-pattern={family}
      data-shape={shape}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{ width: size, height: size, ...style }}
      className={cn("block aspect-square shrink-0 overflow-hidden border border-foreground/10", palette.bg, shape === "round" ? "rounded-full" : "rounded-[14%]", className)}
      {...props}
    >
      {draw(r, palette)}
    </svg>
  );
}
