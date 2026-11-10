"use client";

import { useState, type ReactNode } from "react";

import { PhotoSelectGrid, type SelectablePhoto } from "@rhs-ui/application/photo-select-grid";
import { IconDownload, IconFolderPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<string[]>(["ridge-dusk", "harbour-sunrise", "skyline-night"]);
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="A library, here thirty-six photos. Point at a photo for its circle, or click anywhere once something is chosen. Shift-click chooses a range, Space and the arrow keys work from the keyboard, Control or Cmd with A chooses all. Before any selection a plain click opens the photo.">
          <div className="grid gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
            <PhotoSelectGrid
              photos={LIBRARY}
              selected={selected}
              onSelectedChange={setSelected}
              onOpen={(photo) => setOpened(photo.alt)}
              columns={6}
              actions={
                <>
                  <Button type="button" variant="outline" size="sm" disabled={selected.length === 0}>
                    <IconFolderPlus />
                    Add to album
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={selected.length === 0}>
                    <IconDownload />
                    Download
                  </Button>
                </>
              }
            />
            <p role="status" className="min-h-5 text-xs text-muted-foreground">
              {opened ? (
                <>
                  Opened <span className="font-medium text-foreground">{opened}</span>
                </>
              ) : (
                "No photo opened yet."
              )}
            </p>
          </div>
        </Case>

        <Case caption="With a limit: the six photos for a cover story. At six the others dim and the grid says why, and a chosen photo can be deselected to make room.">
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
            <PhotoSelectGrid photos={LIBRARY.slice(0, 12)} defaultSelected={LIBRARY.slice(1, 7).map((photo) => photo.id)} maxSelect={6} columns={4} ratio={4 / 3} />
          </div>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/* The pictures are drawn here, as small SVG scenes in data URIs, so the demo needs no files and no network. */

interface Light {
  name: string;
  slug: string;
  sky: readonly [string, string];
  far: string;
  mid: string;
  near: string;
  glow: string;
}

const LIGHTS: readonly Light[] = [
  { name: "at sunrise", slug: "sunrise", sky: ["#f4b996", "#fbe7cf"], far: "#d4a78f", mid: "#9a7f86", near: "#4e4c5c", glow: "#fff1d0" },
  { name: "at midday", slug: "midday", sky: ["#78b0e2", "#d9edfb"], far: "#a3bacb", mid: "#6e8aa1", near: "#38566a", glow: "#ffffff" },
  { name: "at dusk", slug: "dusk", sky: ["#d9835f", "#f3c48d"], far: "#a96f69", mid: "#6b505b", near: "#2c2837", glow: "#ffe0ae" },
  { name: "at night", slug: "night", sky: ["#0f1830", "#293862"], far: "#2d3c60", mid: "#1d2846", near: "#0c1325", glow: "#e8eefc" },
  { name: "in mist", slug: "mist", sky: ["#bfc8cd", "#e8ecee"], far: "#b5bec2", mid: "#98a4a9", near: "#6b797f", glow: "#f6f8f8" },
  { name: "after rain", slug: "rain", sky: ["#86a2a9", "#cfdbdb"], far: "#7c9498", mid: "#5c767c", near: "#33484e", glow: "#eef4f2" },
];

const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

/** A ridge line across the picture, as a closed shape: peaks and dips from a seed. */
function ridge(seed: number, base: number, amplitude: number, fill: string): string {
  const next = rng(seed);
  const points = Array.from({ length: 11 }, (_, index) => `${index * 40} ${(base - next() * amplitude).toFixed(0)}`);
  return `<path d="M0 300 L${points.join(" L")} L400 300 Z" fill="${fill}"/>`;
}

const SCENES: readonly { name: string; slug: string; draw: (light: Light, seed: number) => string }[] = [
  {
    name: "Mountain ridge",
    slug: "ridge",
    draw: (light, seed) => `<circle cx="${130 + (seed % 5) * 40}" cy="92" r="26" fill="${light.glow}" opacity="0.95"/>${ridge(seed, 190, 70, light.far)}${ridge(seed + 3, 230, 60, light.mid)}${ridge(seed + 7, 275, 40, light.near)}`,
  },
  {
    name: "Harbour",
    slug: "harbour",
    draw: (light, seed) =>
      `<circle cx="${250 - (seed % 4) * 30}" cy="110" r="22" fill="${light.glow}"/><rect y="170" width="400" height="130" fill="${light.mid}"/><rect y="186" width="400" height="5" fill="${light.glow}" opacity="0.35"/><rect y="214" width="400" height="4" fill="${light.glow}" opacity="0.22"/>` +
      `<path d="M96 196h120l-14 22H112z" fill="${light.near}"/><path d="M156 196V114l46 70z" fill="${light.glow}" opacity="0.92"/><rect x="154" y="112" width="3" height="84" fill="${light.near}"/>` +
      `<path d="M270 206h82l-9 16h-64z" fill="${light.near}"/><rect x="310" y="150" width="2.5" height="56" fill="${light.near}"/><path d="M312 154l30 46h-30z" fill="${light.far}"/><rect y="236" width="400" height="64" fill="${light.near}"/>`,
  },
  {
    name: "City skyline",
    slug: "skyline",
    draw: (light, seed) => {
      const next = rng(seed + 11);
      const towers = Array.from({ length: 9 }, (_, index) => {
        const height = 70 + next() * 130;
        const x = index * 46 - 6;
        const windows = Array.from({ length: Math.floor(height / 22) }, (__, row) => `<rect x="${x + 10}" y="${300 - height + 10 + row * 22}" width="5" height="7" fill="${light.glow}" opacity="${0.35 + next() * 0.4}"/><rect x="${x + 24}" y="${300 - height + 10 + row * 22}" width="5" height="7" fill="${light.glow}" opacity="${0.25 + next() * 0.4}"/>`).join("");
        return `<rect x="${x}" y="${300 - height}" width="40" height="${height}" fill="${index % 2 ? light.near : light.mid}"/>${windows}`;
      }).join("");
      return `<circle cx="${300 - (seed % 3) * 60}" cy="84" r="24" fill="${light.glow}"/>${towers}`;
    },
  },
  {
    name: "Pine forest",
    slug: "pines",
    draw: (light, seed) => {
      const layer = (count: number, base: number, size: number, fill: string, offset: number) => {
        const next = rng(seed + offset);
        return Array.from({ length: count }, (_, index) => {
          const x = (index + next() * 0.6) * (440 / count) - 20;
          const height = size * (0.8 + next() * 0.5);
          return `<path d="M${x.toFixed(0)} ${base - height}L${(x + height * 0.34).toFixed(0)} ${base}H${(x - height * 0.34).toFixed(0)}z" fill="${fill}"/>`;
        }).join("");
      };
      return `<circle cx="${110 + (seed % 5) * 50}" cy="96" r="22" fill="${light.glow}" opacity="0.9"/>${layer(12, 230, 110, light.far, 1)}${layer(9, 260, 130, light.mid, 5)}<rect y="250" width="400" height="50" fill="${light.near}"/>${layer(6, 290, 150, light.near, 9)}`;
    },
  },
  {
    name: "Dunes",
    slug: "dunes",
    draw: (light, seed) => `<circle cx="${280 - (seed % 4) * 40}" cy="100" r="30" fill="${light.glow}"/><path d="M0 220Q110 ${170 + (seed % 3) * 10} 220 215T400 200V300H0z" fill="${light.far}"/><path d="M0 250Q130 205 260 245T400 235V300H0z" fill="${light.mid}"/><path d="M0 285Q110 240 230 275T400 265V300H0z" fill="${light.near}"/>`,
  },
  {
    name: "Lighthouse",
    slug: "light",
    draw: (light, seed) =>
      `<circle cx="${90 + (seed % 3) * 30}" cy="84" r="20" fill="${light.glow}"/><rect y="200" width="400" height="100" fill="${light.mid}"/><rect y="214" width="400" height="4" fill="${light.glow}" opacity="0.3"/>` +
      `<path d="M178 88h44l12 120h-68z" fill="${light.glow}"/><path d="M186 132h28l2 18h-32zM182 172h36l3 18h-42z" fill="${light.near}"/><rect x="180" y="76" width="40" height="14" fill="${light.near}"/><path d="M174 76h52l-26-22z" fill="${light.near}"/>` +
      `<path d="M120 250q30-50 80-42 60-6 90 42z" fill="${light.near}"/><rect y="262" width="400" height="38" fill="${light.near}"/>`,
  },
];

const picture = (scene: (typeof SCENES)[number], light: Light, seed: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light.sky[0]}"/><stop offset="1" stop-color="${light.sky[1]}"/></linearGradient></defs><rect width="400" height="300" fill="url(#s)"/>${scene.draw(light, seed)}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/** Thirty-six photos: every scene in six lights, each named for what it shows, with the scenes taking turns so a row is never one place. */
const LIBRARY: readonly SelectablePhoto[] = LIGHTS.flatMap((light, lightIndex) =>
  SCENES.map((scene, sceneIndex) => ({ id: `${scene.slug}-${light.slug}`, alt: `${scene.name} ${light.name}`, src: picture(scene, light, sceneIndex * 7 + lightIndex * 3 + 1) })),
);
