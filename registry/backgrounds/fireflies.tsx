"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Soft points of light wandering in loose loops and blinking on and off. */
const paint: Painter = ({ ctx, width, height, time }) => {
  for (let i = 0; i < 34; i++) {
    const h = Math.abs(Math.sin(i * 91.7) * 1000) % 1;
    const x = width * (0.5 + 0.42 * Math.sin(time * (0.1 + h * 0.12) + i * 2.3));
    const y = height * (0.5 + 0.4 * Math.sin(time * (0.13 + h * 0.1) + i * 1.1) * Math.cos(time * 0.07 + i));
    const glow = Math.max(0, Math.sin(time * (1 + h) + i * 3));
    for (const [r, a] of [[10, 0.06], [5, 0.15], [1.8, 0.9]] as const) {
      ctx.globalAlpha = a * glow;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
};

export function Fireflies(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
