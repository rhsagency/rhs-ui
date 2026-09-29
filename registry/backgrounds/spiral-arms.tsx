"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A three-armed galaxy of points turning slowly around its core. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const cx = width * 0.5, cy = height * 0.5, reach = Math.hypot(width, height) * 0.5;
  for (let i = 0; i < 760; i++) {
    const t = i / 760;
    const a = t * 9 + (i % 3) * ((Math.PI * 2) / 3) - time * 0.25 + Math.sin(i * 12.9898) * 0.35;
    ctx.globalAlpha = (1 - t) * 0.55 + 0.05;
    ctx.fillRect(cx + Math.cos(a) * t * reach * 0.95, cy + Math.sin(a) * t * reach * 0.6, 1.5, 1.5);
  }
};

export function SpiralArms(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
