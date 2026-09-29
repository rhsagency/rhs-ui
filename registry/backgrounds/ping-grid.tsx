"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A quiet dot grid where signals ping at random points and ripple outward. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const step = 20;
  const pings = Array.from({ length: 6 }, (_, i) => {
    const cycle = 4 + (i % 3);
    const round = Math.floor((time + i * 1.3) / cycle);
    const age = ((time + i * 1.3) % cycle) / cycle;
    const hx = Math.abs(Math.sin(round * 12.9898 + i * 4.1) * 43758.5453) % 1, hy = Math.abs(Math.sin(round * 78.233 + i * 2.7) * 12543.891) % 1;
    return { x: hx * width, y: hy * height, radius: age * 160, strength: 1 - age };
  });
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      let light = 0;
      for (const ping of pings) light = Math.max(light, Math.exp(-((Math.hypot(x - ping.x, y - ping.y) - ping.radius) ** 2) / 120) * ping.strength);
      ctx.globalAlpha = 0.12 + light * 0.8;
      ctx.beginPath(); ctx.arc(x, y, 1 + light * 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
};

export function PingGrid(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
