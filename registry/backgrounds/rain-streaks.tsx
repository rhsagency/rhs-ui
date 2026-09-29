"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Slanted rain falling at different depths, light and steady. */
const paint: Painter = ({ ctx, width, height, time }) => {
  for (let i = 0; i < 130; i++) {
    const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, h2 = Math.abs(Math.sin(i * 78.233) * 12543.891) % 1;
    const speed = 220 + h2 * 260, length = 10 + h2 * 22;
    const y = ((time * speed + h1 * height * 3) % (height + 60)) - 30;
    const x = ((h1 * (width + 100) - y * 0.2) % (width + 100) + width + 100) % (width + 100) - 50;
    ctx.globalAlpha = 0.12 + h2 * 0.25;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - length * 0.2, y + length); ctx.stroke();
  }
};

export function RainStreaks(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
