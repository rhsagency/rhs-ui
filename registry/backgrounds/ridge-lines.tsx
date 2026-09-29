"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Stacked signal lines that hide one another, like a pulsar plot drawn live. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const lines = 24, top = height * 0.16, gap = (height * 0.72) / lines;
  for (let l = 0; l < lines; l++) {
    const base = top + l * gap;
    const points: [number, number][] = [];
    for (let x = 0; x <= width; x += 5) {
      const u = x / width;
      const envelope = Math.exp(-((u - 0.5) ** 2) / 0.018);
      const noise = Math.sin(u * 40 + l * 1.7 + time * 1.2) * 0.5 + Math.sin(u * 17 - l * 0.9 + time * 0.7) * 0.5;
      points.push([x, base - envelope * (18 + noise * 22) * (0.6 + Math.sin(l * 0.7 + time * 0.3) * 0.4)]);
    }
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
};

export function RidgeLines(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
