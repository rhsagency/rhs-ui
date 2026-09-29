"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A grid of crosses that turn and swell in waves, like a blueprint breathing. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const step = 28;
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      const wave = Math.sin(x * 0.015 - time * 1.1) * Math.cos(y * 0.02 + time * 0.6);
      const size = 3 + (wave + 1) * 2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(wave * Math.PI * 0.25);
      ctx.globalAlpha = 0.15 + (wave + 1) * 0.2;
      ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.moveTo(0, -size); ctx.lineTo(0, size); ctx.stroke();
      ctx.restore();
    }
  }
};

export function PlusGrid(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
