"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Two sets of fine circles sliding past each other, making slow interference patterns. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const offset = Math.sin(time * 0.3) * width * 0.06;
  const reach = Math.hypot(width, height) * 0.6;
  ctx.globalAlpha = 0.22;
  for (const cx of [width * 0.45 + offset, width * 0.55 - offset]) {
    for (let r = 6; r < reach; r += 7) { ctx.beginPath(); ctx.arc(cx, height * 0.5, r, 0, Math.PI * 2); ctx.stroke(); }
  }
};

export function MoireRings(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
