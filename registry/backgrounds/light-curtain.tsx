"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Hanging threads of light swaying like an aurora curtain. */
const paint: Painter = ({ ctx, width, height, time }) => {
  for (let x = 0; x < width; x += 6) {
    const u = x / width;
    const top = height * (0.12 + 0.08 * Math.sin(u * 5 + time * 0.4));
    const length = height * (0.3 + 0.28 * (Math.sin(u * 9 - time * 0.6) + 1) / 2);
    const strength = (Math.sin(u * 14 + time) + 1) / 2;
    for (let s = 0; s < 3; s++) {
      ctx.globalAlpha = (0.08 + strength * 0.3) * (1 - s / 3);
      ctx.beginPath(); ctx.moveTo(x, top + (length * s) / 3); ctx.lineTo(x, top + (length * (s + 1)) / 3); ctx.stroke();
    }
  }
};

export function LightCurtain(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
