"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Rings spreading from three points and fading as they cross, like rain on still water. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const sources = [[0.3, 0.4, 0], [0.72, 0.62, 2.1], [0.55, 0.2, 4.2]] as const;
  const reach = Math.hypot(width, height) * 0.45;
  for (const [sx, sy, offset] of sources) {
    for (let k = 0; k < 7; k++) {
      const r = (time * 38 + offset * 40 + k * (reach / 7)) % reach;
      ctx.globalAlpha = Math.max(0, 1 - r / reach) * 0.38;
      ctx.beginPath(); ctx.arc(sx * width, sy * height, r, 0, Math.PI * 2); ctx.stroke();
    }
  }
};

export function RippleRings(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
