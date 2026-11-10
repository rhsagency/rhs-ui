"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { PhotoMosaic, type MosaicPhoto } from "@rhs-ui/primitives/photo-mosaic";

/* The rooms are drawn as SVG at 4:3, with the furniture kept near the middle so a square crop still works. */
const PALETTES = {
  sand: ["#f4ece0", "#e6d8c3", "#cdb89c", "#a98f73", "#6f5a48", "#3a2f27"],
  slate: ["#eceff2", "#cfd6dd", "#a3afba", "#738290", "#445260", "#1f272f"],
  sage: ["#eef0e6", "#d6dccb", "#b0bb9a", "#83936d", "#566545", "#2b3421"],
  clay: ["#f5e8de", "#e9cdb9", "#d6aa8f", "#b97d60", "#80503a", "#43291f"],
  dusk: ["#d9d3cf", "#b9aeb0", "#8a7f8d", "#5d5668", "#37344a", "#1c1b2b"],
} as const;

type Room = "living" | "kitchen" | "bedroom" | "bathroom" | "terrace" | "dining" | "garden";

function room(kind: Room, palette: keyof typeof PALETTES, seed: number): string {
  const W = 1200;
  const H = 900;
  const p = PALETTES[palette];
  const c = (i: number) => p[Math.min(5, i)] ?? "#888";
  const f = (x: number) => Math.round(x * 10) / 10;
  const X = (v: number) => f(v * W);
  const Y = (v: number) => f(v * H);
  let uid = 0;
  const defs: string[] = [];
  const out: string[] = [];
  const lg = (a: string, b: string, dir: "v" | "h" = "v") => {
    const id = `g${uid++}`;
    defs.push(`<linearGradient id='${id}' x1='0' y1='0' x2='${dir === "h" ? 1 : 0}' y2='${dir === "h" ? 0 : 1}'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient>`);
    return `url(#${id})`;
  };
  const bl = (s: number) => {
    const id = `b${uid++}`;
    defs.push(`<filter id='${id}' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='${s}'/></filter>`);
    return `filter='url(#${id})'`;
  };
  const R = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = "") => out.push(`<rect x='${X(x)}' y='${Y(y)}' width='${X(w)}' height='${Y(h)}' rx='${X(rx)}' fill='${fill}' ${extra}/>`);
  const E = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = "") => out.push(`<ellipse cx='${X(cx)}' cy='${Y(cy)}' rx='${X(rx)}' ry='${Y(ry)}' fill='${fill}' ${extra}/>`);
  const P = (d: string, fill: string, extra = "") => out.push(`<path d='${d}' fill='${fill}' ${extra}/>`);
  const wall = (floor = 0.72) => {
    R(0, 0, 1, floor + 0.02, lg(c(1), c(2)));
    R(0, floor, 1, 1 - floor, lg(c(3), c(4)));
    R(0, floor - 0.006, 1, 0.012, c(2), 0, "opacity='.6'");
  };
  const win = (x: number, y: number, w: number, h: number, cols = 2) => {
    R(x - 0.012, y - 0.016, w + 0.024, h + 0.032, c(2));
    R(x, y, w, h, lg(c(0), "#ffffff"));
    for (let i = 1; i < cols; i++) R(x + (w / cols) * i - 0.004, y, 0.008, h, c(2));
    R(x, y + h / 2 - 0.004, w, 0.008, c(2));
    out.push(`<path d='M${X(x)},${Y(y + h)}L${X(x - 0.12)},${Y(0.95)}L${X(x + w * 0.9)},${Y(0.95)}L${X(x + w)},${Y(y + h)}Z' fill='${c(0)}' opacity='.3' ${bl(14)}/>`);
  };
  const lamp = (x: number, y: number, s = 1) => {
    R(x - 0.004 * s, y, 0.008 * s, 0.12 * s, c(4));
    P(`M${X(x - 0.04 * s)},${Y(y)}L${X(x - 0.025 * s)},${Y(y - 0.07 * s)}H${X(x + 0.025 * s)}L${X(x + 0.04 * s)},${Y(y)}Z`, c(0), "opacity='.95'");
  };
  const plant = (x: number, y: number, s = 1) => {
    R(x - 0.03 * s, y, 0.06 * s, 0.08 * s, c(4), 0.012);
    for (let i = 0; i < 7; i++) {
      const a = -0.9 + i * 0.3;
      const cx = X(x + Math.sin(a) * 0.05 * s);
      const cy = Y(y - 0.05 * s - Math.cos(a) * 0.05 * s);
      out.push(`<ellipse cx='${cx}' cy='${cy}' rx='${X(0.018 * s)}' ry='${Y(0.07 * s)}' transform='rotate(${f((a * 180) / Math.PI)} ${cx} ${cy})' fill='${c(i % 2 ? 3 : 4)}'/>`);
    }
  };
  if (kind === "living") {
    wall();
    win(0.6, 0.12, 0.24, 0.42);
    R(0.17, 0.13, 0.15, 0.2, c(0), 0.004);
    R(0.185, 0.15, 0.12, 0.16, c(3), 0.002, "opacity='.7'");
    E(0.245, 0.24, 0.035, 0.045, c(1));
    E(0.36, 0.86, 0.27, 0.05, c(5), `opacity='.22' ${bl(18)}`);
    R(0.14, 0.5, 0.44, 0.26, lg(c(4), c(5)), 0.03);
    R(0.12, 0.44, 0.48, 0.14, c(4), 0.045);
    R(0.18, 0.5, 0.18, 0.1, c(3), 0.03);
    R(0.38, 0.5, 0.18, 0.1, c(2), 0.03);
    R(0.15, 0.76, 0.02, 0.05, c(5));
    R(0.55, 0.76, 0.02, 0.05, c(5));
    R(0.65, 0.66, 0.1, 0.01, c(5));
    R(0.66, 0.67, 0.008, 0.12, c(5));
    R(0.742, 0.67, 0.008, 0.12, c(5));
    lamp(0.7, 0.5, 0.9);
    plant(0.84, 0.78, 1.1);
  } else if (kind === "kitchen") {
    wall(0.74);
    R(0, 0.3, 1, 0.22, c(0), 0, "opacity='.5'");
    for (let i = 0; i < 5; i++) {
      R(0.05 + i * 0.18, 0.08, 0.17, 0.22, lg(c(2), c(3)), 0.006);
      R(0.115 + i * 0.18, 0.28, 0.04, 0.008, c(5), 0.002, "opacity='.7'");
    }
    R(0.03, 0.54, 0.94, 0.03, c(0));
    R(0.03, 0.57, 0.94, 0.17, lg(c(3), c(4)));
    for (let i = 0; i < 5; i++) {
      R(0.04 + i * 0.188, 0.58, 0.175, 0.15, c(3), 0.004, "opacity='.65'");
      R(0.1 + i * 0.188, 0.59, 0.045, 0.008, c(0), 0.002);
    }
    E(0.5, 0.92, 0.36, 0.04, c(5), `opacity='.25' ${bl(14)}`);
    R(0.2, 0.68, 0.6, 0.025, c(0));
    R(0.21, 0.705, 0.58, 0.19, lg(c(4), c(5)), 0.004);
    for (const sx of [0.3, 0.5, 0.7]) {
      E(sx, 0.775, 0.032, 0.012, c(2));
      R(sx - 0.004, 0.785, 0.008, 0.1, c(5));
    }
    for (const px of [0.36, 0.64]) {
      R(px - 0.0015, 0, 0.003, 0.2, c(5));
      P(`M${X(px - 0.05)},${Y(0.27)}A${X(0.05)},${Y(0.07)} 0 0 1 ${X(px + 0.05)},${Y(0.27)}Z`, c(0));
    }
  } else if (kind === "bedroom") {
    wall(0.74);
    win(0.1, 0.14, 0.14, 0.4, 1);
    R(0.24, 0.2, 0.52, 0.36, lg(c(3), c(4)), 0.03);
    R(0.2, 0.52, 0.6, 0.24, c(4), 0.012);
    R(0.22, 0.46, 0.56, 0.2, c(0), 0.04);
    R(0.26, 0.4, 0.2, 0.12, c(1), 0.04);
    R(0.54, 0.4, 0.2, 0.12, c(0), 0.04, `stroke='${c(1)}'`);
    R(0.22, 0.58, 0.56, 0.15, lg(c(2), c(3)), 0.02);
    R(0.22, 0.58, 0.56, 0.025, c(1), 0.01, "opacity='.7'");
    E(0.5, 0.9, 0.36, 0.045, c(5), `opacity='.25' ${bl(14)}`);
    for (const nx of [0.09, 0.81]) {
      R(nx, 0.6, 0.1, 0.18, c(4), 0.006);
      R(nx + 0.01, 0.64, 0.08, 0.05, c(3), 0.004);
    }
    lamp(0.14, 0.44, 0.8);
    lamp(0.86, 0.44, 0.8);
    E(0.5, 0.86, 0.3, 0.06, c(2), "opacity='.55'");
  } else if (kind === "bathroom") {
    R(0, 0, 1, 0.78, lg(c(0), c(1)));
    for (let i = 1; i < 14; i++) R(i / 14, 0, 0.0012, 0.78, c(2), 0, "opacity='.5'");
    for (let j = 1; j < 9; j++) R(0, (j * 0.78) / 9, 1, 0.0016, c(2), 0, "opacity='.5'");
    R(0, 0.78, 1, 0.22, lg(c(3), c(4)));
    E(0.5, 0.3, 0.14, 0.18, c(2));
    E(0.5, 0.3, 0.125, 0.162, lg(c(0), "#ffffff"));
    E(0.5, 0.93, 0.32, 0.04, c(5), `opacity='.3' ${bl(14)}`);
    P(`M${X(0.2)},${Y(0.62)}H${X(0.8)}Q${X(0.8)},${Y(0.86)} ${X(0.68)},${Y(0.88)}H${X(0.32)}Q${X(0.2)},${Y(0.86)} ${X(0.2)},${Y(0.62)}Z`, c(0));
    E(0.5, 0.64, 0.3, 0.034, c(2));
    E(0.5, 0.645, 0.28, 0.028, c(1));
    R(0.82, 0.3, 0.012, 0.4, c(5));
    R(0.78, 0.3, 0.05, 0.012, c(5), 0.004);
    R(0.13, 0.2, 0.012, 0.56, c(2));
    R(0.105, 0.22, 0.06, 0.2, c(0), 0.004);
    plant(0.9, 0.9, 1);
  } else if (kind === "terrace") {
    R(0, 0, 1, 0.5, lg(c(1), c(0)));
    E(0.72, 0.28, 0.08, 0.1, "#ffffff", `opacity='.7' ${bl(16)}`);
    R(0, 0.46, 1, 0.14, lg(c(2), c(3)));
    P(`M0,${Y(0.5)}C${X(0.2)},${Y(0.42)} ${X(0.45)},${Y(0.54)} ${X(0.7)},${Y(0.46)}S${X(1)},${Y(0.5)} ${X(1)},${Y(0.5)}V${Y(0.6)}H0Z`, c(3), "opacity='.8'");
    R(0, 0.6, 1, 0.4, lg(c(4), c(5)));
    for (let i = 1; i < 10; i++) R(0, 0.6 + (i * 0.4) / 10, 1, 0.003, c(5), 0, "opacity='.5'");
    R(0, 0.56, 1, 0.014, c(0));
    R(0, 0.55, 1, 0.006, c(0), 0, "opacity='.6'");
    for (let i = 0; i < 30; i++) R(i / 30 + 0.006, 0.56, 0.006, 0.2, c(0), 0, "opacity='.92'");
    R(0, 0.76, 1, 0.014, c(0));
    E(0.7, 0.93, 0.2, 0.04, c(5), `opacity='.3' ${bl(14)}`);
    E(0.7, 0.8, 0.12, 0.03, c(0));
    R(0.695, 0.82, 0.01, 0.1, c(0));
    R(0.66, 0.9, 0.08, 0.012, c(0), 0.004);
    for (const cx of [0.55, 0.85]) {
      R(cx - 0.035, 0.84, 0.07, 0.012, c(1), 0.006);
      R(cx - 0.035, 0.74, 0.012, 0.1, c(1), 0.004);
      R(cx - 0.03, 0.88, 0.006, 0.07, c(1));
      R(cx + 0.024, 0.88, 0.006, 0.07, c(1));
    }
    plant(0.2, 0.9, 1.5);
  } else if (kind === "dining") {
    wall(0.74);
    win(0.1, 0.12, 0.3, 0.44, 3);
    win(0.6, 0.12, 0.3, 0.44, 3);
    E(0.5, 0.88, 0.36, 0.05, c(5), `opacity='.25' ${bl(14)}`);
    R(0.2, 0.62, 0.6, 0.03, c(0));
    R(0.22, 0.65, 0.012, 0.22, c(4));
    R(0.768, 0.65, 0.012, 0.22, c(4));
    for (const cx of [0.3, 0.43, 0.57, 0.7]) {
      R(cx - 0.04, 0.5, 0.08, 0.1, c(4), 0.012);
      R(cx - 0.04, 0.6, 0.08, 0.012, c(5), 0.004);
      R(cx - 0.032, 0.66, 0.006, 0.22, c(5));
      R(cx + 0.026, 0.66, 0.006, 0.22, c(5));
    }
    R(0.4985, 0, 0.003, 0.34, c(5));
    P(`M${X(0.41)},${Y(0.44)}A${X(0.09)},${Y(0.1)} 0 0 1 ${X(0.59)},${Y(0.44)}Z`, c(0));
    E(0.5, 0.58, 0.05, 0.012, c(0), `opacity='.8' ${bl(6)}`);
  } else {
    R(0, 0, 1, 0.55, lg(c(1), c(0)));
    R(0, 0.5, 1, 0.1, lg(c(3), c(4)));
    for (let i = 0; i < 14; i++) E(i / 13, 0.52, 0.06, 0.05, c(i % 2 ? 4 : 3), "opacity='.9'");
    R(0, 0.58, 1, 0.42, lg(c(3), c(4)));
    P(`M${X(0.4)},${Y(1)}C${X(0.45)},${Y(0.8)} ${X(0.5)},${Y(0.7)} ${X(0.52)},${Y(0.6)}H${X(0.58)}C${X(0.62)},${Y(0.7)} ${X(0.8)},${Y(0.84)} ${X(0.92)},${Y(1)}Z`, c(1), "opacity='.85'");
    R(0.26, 0.3, 0.025, 0.4, c(5));
    E(0.272, 0.26, 0.11, 0.17, c(3));
    E(0.23, 0.3, 0.07, 0.11, c(4), "opacity='.9'");
    E(0.31, 0.22, 0.07, 0.1, c(3));
    E(0.5, 0.97, 0.4, 0.03, c(5), `opacity='.3' ${bl(14)}`);
  }
  defs.push(`<filter id='gr' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .09'/></filter>`, `<radialGradient id='vg' cx='.5' cy='.5' r='.75'><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.2'/></radialGradient>`);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'><defs>${defs.join("")}</defs>${out.join("")}<rect width='${W}' height='${H}' fill='url(#vg)'/><rect width='${W}' height='${H}' filter='url(#gr)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SHOTS: { label: string; alt: string; kind: Room; palette: keyof typeof PALETTES }[] = [
  { label: "Living room", alt: "A low sofa under a tall window with a pale lamp beside it", kind: "living", palette: "sand" },
  { label: "Kitchen", alt: "A long kitchen with clay coloured cabinets and a bar for three", kind: "kitchen", palette: "clay" },
  { label: "Primary bedroom", alt: "A wide bed with a tall headboard and a lamp on each side", kind: "bedroom", palette: "slate" },
  { label: "Bathroom", alt: "A freestanding bath under a round mirror", kind: "bathroom", palette: "sage" },
  { label: "Terrace", alt: "A terrace with a bistro table above the rooftops", kind: "terrace", palette: "dusk" },
  { label: "Dining area", alt: "A long table with four chairs between two windows", kind: "dining", palette: "sand" },
  { label: "Garden", alt: "A gravel path through the garden to a single tree", kind: "garden", palette: "sage" },
  { label: "Second bedroom", alt: "A quiet bedroom in dusk grey", kind: "bedroom", palette: "dusk" },
  { label: "Reading room", alt: "A sofa and a lamp by the window in slate blue", kind: "living", palette: "slate" },
  { label: "Courtyard", alt: "The courtyard in the late afternoon", kind: "garden", palette: "clay" },
  { label: "Guest bathroom", alt: "A bath under a round mirror in warm sand", kind: "bathroom", palette: "sand" },
  { label: "Roof terrace", alt: "The roof terrace at sunset", kind: "terrace", palette: "clay" },
  { label: "Breakfast kitchen", alt: "The kitchen in sage green", kind: "kitchen", palette: "sage" },
  { label: "Entrance hall", alt: "The entrance hall in warm light", kind: "living", palette: "clay" },
  { label: "Study", alt: "A dining table used as a desk", kind: "dining", palette: "slate" },
  { label: "Guest bedroom", alt: "The guest bedroom in sand", kind: "bedroom", palette: "sand" },
  { label: "Garden path", alt: "The garden path in the morning", kind: "garden", palette: "sand" },
  { label: "Sun room", alt: "A bright sofa corner", kind: "living", palette: "sage" },
  { label: "Walk-in shower room", alt: "A bathroom in dusk grey", kind: "bathroom", palette: "dusk" },
  { label: "Balcony", alt: "The balcony railing against a pale sky", kind: "terrace", palette: "sand" },
  { label: "Cellar kitchen", alt: "A kitchen in slate", kind: "kitchen", palette: "slate" },
  { label: "Loft bedroom", alt: "A loft bedroom in sage", kind: "bedroom", palette: "sage" },
  { label: "Dining room, evening", alt: "The dining room at night", kind: "dining", palette: "dusk" },
  { label: "Street view", alt: "The street side of the house", kind: "terrace", palette: "slate" },
];

const PHOTOS: MosaicPhoto[] = SHOTS.map((shot, index) => ({ src: room(shot.kind, shot.palette, index + 1), alt: shot.alt, label: shot.label }));

function Lightbox({ index, onIndexChange, onClose, onReturnFocus }: { index: number | null; onIndexChange: (next: number) => void; onClose: () => void; onReturnFocus: () => void }): React.JSX.Element {
  const photo = index === null ? undefined : PHOTOS[index];
  const go = (delta: number) => index !== null && onIndexChange((index + delta + PHOTOS.length) % PHOTOS.length);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "ArrowRight") go(1);
  };
  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="gap-3 p-3 sm:max-w-3xl"
        showCloseButton={false}
        onKeyDown={onKeyDown}
        // This dialog has no trigger to give focus back to, so it goes back to the photo that opened it.
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        {photo && index !== null ? (
          <>
            <img src={photo.src} alt={photo.alt} className="aspect-[4/3] w-full rounded-lg object-cover" />
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <DialogTitle className="truncate">{photo.label}</DialogTitle>
                <DialogDescription className="tabular-nums">
                  Photo {index + 1} of {PHOTOS.length}
                </DialogDescription>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="icon" aria-label="Previous photo" onClick={() => go(-1)}>
                  <IconChevronLeft />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label="Next photo" onClick={() => go(1)}>
                  <IconChevronRight />
                </Button>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Where each small mosaic starts in the list, so they do not all open on the same room.
const START: Record<number, number> = { 1: 5, 2: 6, 3: 8, 4: 11 };

function Caption({ children }: { children: ReactNode }): React.JSX.Element {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const show = (index: number) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(index);
  };
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-8 sm:py-12">
      <section aria-labelledby="listing" className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2 id="listing" className="text-2xl font-medium tracking-[-0.03em] sm:text-3xl">
              Casa Halcyon, Alfama
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Lisbon, Portugal &middot; 3 bedrooms &middot; 2 bathrooms &middot; 142 m&sup2;</p>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-lg font-medium text-foreground tabular-nums">&euro;1,240</span> per night
          </p>
        </div>
        <PhotoMosaic photos={PHOTOS.slice(0, 5)} total={PHOTOS.length} onOpen={show} onShowAll={() => show(0)} />
        <Caption>Five of {PHOTOS.length} photos. Press a photo, or Show all, to open the gallery: the mosaic opens nothing itself.</Caption>
      </section>

      <section aria-label="In a narrow column" className="grid items-start gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,36rem)_minmax(0,22rem)]">
        <div className="grid min-w-0 max-w-xl gap-3">
          <PhotoMosaic photos={PHOTOS.slice(8, 13)} total={PHOTOS.length} onOpen={(i) => show(8 + i)} onShowAll={() => show(0)} />
          <Caption>Beside a booking card the gallery column is narrow, so Show all keeps its icon and the count, and its name stays whole.</Caption>
        </div>
        <aside aria-label="Your stay" className="grid max-w-[22rem] content-start gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
          <dl className="grid gap-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-medium">Fri 12 Jun to Mon 15 Jun</dt>
              <dd className="text-muted-foreground tabular-nums">3 nights</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
              <dt>3 &times; &euro;1,240</dt>
              <dd className="tabular-nums">&euro;3,720</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
              <dt>Cleaning</dt>
              <dd className="tabular-nums">&euro;85</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3 font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">&euro;3,805</dd>
            </div>
          </dl>
          <Button type="button" className="w-full">
            Reserve
          </Button>
        </aside>
      </section>

      <section aria-label="With fewer photos" className="grid gap-4">
        <Caption>With fewer than five photos it falls back to a layout of one, two, three or four.</Caption>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-2">
          {[1, 2, 3, 4].map((count) => (
            <div key={count} className="grid gap-2">
              <PhotoMosaic photos={PHOTOS.slice(START[count] ?? 5, (START[count] ?? 5) + count)} onOpen={(i) => show((START[count] ?? 5) + i)} />
              <Caption>{count === 1 ? "One photo" : `${count} photos`}</Caption>
            </div>
          ))}
        </div>
      </section>

      <Lightbox index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} onReturnFocus={() => opener.current?.focus()} />
    </div>
  );
}
