"use client";

import { useState } from "react";

import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { ZoomableImage } from "@rhs-ui/primitives/zoomable-image";

/**
 * A site plan drawn as SVG, so the demo needs no files. The overview has the blocks, the river and the bridges; the
 * detailed version adds every building, the trees, the street names and a scale, which is what highResSrc is for.
 */
function plan(detail: boolean): string {
  const W = 1500;
  const H = 1000;
  const xs = [0, 190, 400, 600, 830, 1040, 1230, 1380, 1500];
  const ys = [0, 210, 430, 650, 830, 1000];
  const street = 28;
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const ry = (x: number) => 470 + 85 * Math.sin(x / 230 + 0.6);
  const river = (dy = 0) => `M${Array.from({ length: 76 }, (_, k) => `${(-30 + k * 20.8).toFixed(1)},${(ry(-30 + k * 20.8) + dy).toFixed(1)}`).join("L")}`;
  const parts: string[] = [`<rect width='${W}' height='${H}' fill='#f4f2ed'/>`];
  const tones = ["#d9d3c6", "#dfdacf", "#cfc8ba"];
  for (let j = 0; j < ys.length - 1; j++) {
    for (let i = 0; i < xs.length - 1; i++) {
      const x = (xs[i] ?? 0) + street / 2;
      const y = (ys[j] ?? 0) + street / 2;
      const w = (xs[i + 1] ?? 0) - (xs[i] ?? 0) - street;
      const h = (ys[j + 1] ?? 0) - (ys[j] ?? 0) - street;
      const park = i === 5 && j === 1;
      parts.push(`<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='5' fill='${park ? "#dde3d3" : ["#e7e3da", "#e0dbce", "#ece9e1"][(i * 5 + j * 3) % 3]}' stroke='#d2ccbf' stroke-width='1.5'/>`);
      if (!detail) continue;
      if (park) {
        for (let t = 0; t < 46; t++) parts.push(`<circle cx='${(x + 14 + rnd() * (w - 28)).toFixed(0)}' cy='${(y + 14 + rnd() * (h - 28)).toFixed(0)}' r='${(6 + rnd() * 9).toFixed(0)}' fill='#c4cfb6' stroke='#adb99f'/>`);
        continue;
      }
      const cols = w > 190 ? 4 : 3;
      const rows = h > 190 ? 3 : 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rnd() < 0.14) continue;
          const lw = w / cols;
          const lh = h / rows;
          parts.push(`<rect x='${(x + c * lw + 7).toFixed(0)}' y='${(y + r * lh + 7).toFixed(0)}' width='${(lw - 14).toFixed(0)}' height='${(lh - 14).toFixed(0)}' rx='2' fill='${tones[Math.floor(rnd() * 3)]}' stroke='#c3bcae'/>`);
        }
      }
    }
  }
  // The river, with its banks, and two bridges across it.
  parts.push(`<path d='${river()}' fill='none' stroke='#bccad1' stroke-width='142' stroke-linejoin='round'/>`, `<path d='${river()}' fill='none' stroke='#d3dde2' stroke-width='128' stroke-linejoin='round'/>`);
  if (detail) for (let k = 0; k < 7; k++) parts.push(`<path d='${river((k - 3) * 15)}' fill='none' stroke='#e4ecef' stroke-width='1.6' stroke-dasharray='${40 + k * 9} ${70 + k * 13}' stroke-dashoffset='${k * 31}'/>`);
  for (const bx of [600, 1040]) parts.push(`<rect x='${bx - 15}' y='${(ry(bx) - 82).toFixed(0)}' width='30' height='164' fill='#f4f2ed' stroke='#b9b2a3' stroke-width='1.5'/>`, `<path d='M${bx} ${(ry(bx) - 82).toFixed(0)}v164' stroke='#d2ccbf' stroke-width='1.5' stroke-dasharray='8 8'/>`);
  // The market hall: a dark footprint around a courtyard, named only in the detailed plan.
  const hallX = 715;
  const hallY = 540;
  parts.push(`<rect x='${hallX - 62}' y='${hallY - 40}' width='124' height='80' rx='6' fill='#2b2a27'/>`, `<rect x='${hallX - 34}' y='${hallY - 16}' width='68' height='32' rx='3' fill='#f4f2ed'/>`);
  if (detail) {
    const label = (text: string, x: number, y: number, size = 13, weight = 500, fill = "#7f796b", spacing = 2.4) => `<text x='${x}' y='${y}' text-anchor='middle' font-family='Helvetica,Arial,sans-serif' font-size='${size}' font-weight='${weight}' letter-spacing='${spacing}' fill='${fill}'>${text}</text>`;
    parts.push(label("Market Hall", hallX, hallY + 72, 20, 600, "#2b2a27", 0), label("Old Mill Park", (xs[5] ?? 0) + 95, 328, 17, 600, "#6d775f", 0));
    for (const [text, x, y] of [["QUAY STREET", 300, 210], ["MILL LANE", 900, 210], ["ALDER ROW", 1330, 650], ["TANNERY WALK", 250, 650], ["KESTREL AVENUE", 780, 830], ["NORTH PIER", 1220, 830], ["WEAVER STREET", 330, 830]] as const) {
      if (Math.abs(y - ry(x)) > 95) parts.push(label(text, x, y + 5));
    }
    parts.push(`<g transform='translate(1418 86)'><circle r='38' fill='#f4f2ed' stroke='#c9c3b6' stroke-width='1.5'/><path d='M0 -30L9 4L0 -3L-9 4Z' fill='#2b2a27'/><text y='24' text-anchor='middle' font-family='Helvetica,Arial,sans-serif' font-size='13' font-weight='600' fill='#7f796b'>N</text></g>`);
    parts.push(`<g transform='translate(560 952)' font-family='Helvetica,Arial,sans-serif' font-size='13' fill='#7f796b'><path d='M0 0h200' stroke='#2b2a27' stroke-width='3'/><path d='M0 -7v14M100 -5v10M200 -7v14' stroke='#2b2a27' stroke-width='2'/><text x='0' y='24'>0</text><text x='200' y='24' text-anchor='end'>100 m</text></g>`);
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'>${parts.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const OVERVIEW = plan(false);
const DETAIL = plan(true);

const TIPS: { keys: React.ReactNode; text: string }[] = [
  { keys: <Kbd>Click</Kbd>, text: "Zoom to 2x around the point, and back" },
  { keys: <KbdGroup><Kbd>Ctrl</Kbd><Kbd>wheel</Kbd></KbdGroup>, text: "Zoom continuously, or pinch on a phone" },
  { keys: <Kbd>Drag</Kbd>, text: "Move around without losing the edge" },
  { keys: <KbdGroup><Kbd>+</Kbd><Kbd>-</Kbd><Kbd>0</Kbd></KbdGroup>, text: "Zoom in, out and reset, with the picture focused" },
];

export default function Demo(): React.JSX.Element {
  const [zoom, setZoom] = useState(1);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-5">
      <ZoomableImage src={OVERVIEW} highResSrc={DETAIL} alt="Site plan of Halcyon Quay: city blocks on both banks of a river, two bridges and a market hall" ratio={3 / 2} maxZoom={4} onZoomChange={setZoom} />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <p>
          Zoom <span className="font-medium text-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
        </p>
        <p>{zoom > 1.5 ? "Past 150% the detailed plan loads: buildings, trees and street names." : "The overview: past 150% a detailed plan loads."}</p>
      </div>
      <ul className="grid gap-x-8 gap-y-3 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-2">
        {TIPS.map((tip, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className="flex min-w-[5.5rem] shrink-0">{tip.keys}</span>
            {tip.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
