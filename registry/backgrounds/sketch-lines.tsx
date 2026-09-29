"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Loose curves drawing themselves across the surface and fading, like a pen thinking. */
const paint: Painter = ({ ctx, width, height, time }) => {
  for (let k = 0; k < 6; k++) {
    const cycle = 7 + k, local = ((time + k * 1.9) % cycle) / cycle;
    const draw = Math.min(1, local / 0.6), fade = local > 0.75 ? 1 - (local - 0.75) / 0.25 : 1;
    const y0 = height * (0.15 + k * 0.14);
    ctx.globalAlpha = 0.45 * fade;
    ctx.beginPath();
    const steps = Math.floor(80 * draw);
    for (let i = 0; i <= steps; i++) {
      const u = i / 80;
      const x = width * (0.05 + u * 0.9), y = y0 + Math.sin(u * 6 + k * 2.1) * height * 0.06 + Math.sin(u * 17 + k) * 6;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
};

export function SketchLines(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
