"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Nested polygons from triangle to octagon, each turning its own way. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const cx = width * 0.5, cy = height * 0.5, reach = Math.min(width, height) * 0.46;
  for (let k = 0; k < 12; k++) {
    const sides = 3 + (k % 6), radius = reach * ((k + 1) / 12);
    const spin = time * 0.15 * (k % 2 ? 1 : -1) * (1 + k * 0.08);
    ctx.globalAlpha = 0.12 + (k / 12) * 0.3;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = spin + (i / sides) * Math.PI * 2;
      const x = cx + Math.cos(a) * radius, y = cy + Math.sin(a) * radius;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
};

export function PolygonBloom(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
