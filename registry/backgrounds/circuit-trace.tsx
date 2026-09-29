"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

function seeded(seed: number): () => number {
  return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
}
const random = seeded(11);
/** Fourteen traces in grid units: a start point and five turns each. */
const TRACES = Array.from({ length: 14 }, () => {
  let x = Math.floor(random() * 40), y = Math.floor(random() * 24);
  const points: [number, number][] = [[x, y]];
  let horizontal = random() > 0.5;
  for (let s = 0; s < 5; s++) {
    const step = Math.floor(random() * 6) + 2;
    if (horizontal) x += random() > 0.5 ? step : -step; else y += random() > 0.5 ? step : -step;
    points.push([x, y]);
    horizontal = !horizontal;
  }
  return points;
});
/** Board traces with right-angle turns and signals racing along them to their pads. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const cell = 24;
  for (const [index, trace] of TRACES.entries()) {
    const points = trace.map(([gx, gy]) => [gx * cell, gy * cell] as const);
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    for (const [x, y] of [points[0]!, points[points.length - 1]!]) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.stroke(); }
    const lengths = points.slice(1).map(([x, y], i) => Math.abs(x - points[i]![0]) + Math.abs(y - points[i]![1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    let along = ((time * 90 + index * 57) % (total + 160)) - 40;
    for (let i = 0; i < lengths.length && along >= 0; i++) {
      if (along <= lengths[i]!) {
        const [x0, y0] = points[i]!, [x1, y1] = points[i + 1]!, f = along / lengths[i]!;
        ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 2.2, 0, Math.PI * 2); ctx.fill();
        break;
      }
      along -= lengths[i]!;
    }
  }
};

export function CircuitTrace(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
