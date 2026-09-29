"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Bubbles drifting upward and swaying, fading as they reach the surface. */
const paint: Painter = ({ ctx, width, height, time }) => {
  for (let i = 0; i < 44; i++) {
    const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, h2 = Math.abs(Math.sin(i * 78.233) * 12543.891) % 1;
    const speed = 18 + h2 * 30, radius = 3 + h1 * 9;
    const y = height + 30 - ((time * speed + h2 * height * 1.3) % (height + 60));
    const x = h1 * width + Math.sin(time + i) * 12;
    ctx.globalAlpha = Math.min(1, y / (height * 0.5)) * 0.4;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  }
};

export function RisingBubbles(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
