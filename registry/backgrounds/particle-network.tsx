"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A fixed seed, so the constellation is the same on every visit and on the server screenshot. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seeded(7);
const NODES = Array.from({ length: 72 }, () => ({ x: random(), y: random(), dx: random() * 2 - 1, dy: random() * 2 - 1, phase: random() * Math.PI * 2 }));

/** Points that drift in slow loops and link up whenever two come close. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const reach = Math.min(150, Math.max(90, Math.min(width, height) * .22));
  const points = NODES.map((node) => ({
    x: (node.x + Math.sin(time * .22 + node.phase) * .035 * node.dx) * width,
    y: (node.y + Math.cos(time * .19 + node.phase) * .045 * node.dy) * height,
  }));
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!;
    for (let j = i + 1; j < points.length; j++) {
      const b = points[j]!;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance > reach) continue;
      ctx.globalAlpha = (1 - distance / reach) * .38;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  ctx.globalAlpha = .75;
  for (const point of points) { ctx.beginPath(); ctx.arc(point.x, point.y, 1.6, 0, Math.PI * 2); ctx.fill(); }
};

export function ParticleNetwork(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
