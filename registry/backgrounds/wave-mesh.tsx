"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A wireframe landscape rolling toward you, ridges rising and settling as it comes. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const rows = 26, cols = 36, horizon = height * 0.28;
  const travel = time * 0.6, shift = Math.floor(travel), fraction = travel - shift;
  const grid: { x: number; y: number; depth: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    const depth = ((r + fraction) / rows) ** 2;
    const row = r - shift;
    const base = horizon + depth * (height - horizon) * 1.05;
    const spread = 0.35 + depth * 1.1;
    grid.push(Array.from({ length: cols + 1 }, (_, c) => {
      const u = c / cols - 0.5;
      const lift = (Math.sin(u * 9 + time * 0.8 + row * 0.35) + Math.cos(u * 4 - time * 0.5 + row * 0.2)) * 18 * depth;
      return { x: width * 0.5 + u * width * spread, y: base - lift, depth };
    }));
  }
  for (const line of grid) {
    ctx.globalAlpha = 0.05 + line[0]!.depth * 0.42;
    ctx.beginPath();
    line.forEach((point, c) => (c ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    for (let r = 1; r < rows; r++) {
      const a = grid[r - 1]![c]!, b = grid[r]![c]!;
      ctx.globalAlpha = 0.04 + b.depth * 0.3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
};

export function WaveMesh(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
