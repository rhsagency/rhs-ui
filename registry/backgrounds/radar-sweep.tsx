"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A radar scope with a sweeping beam that lights up targets as it passes. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const cx = width * 0.5, cy = height * 0.5, R = Math.min(width, height) * 0.46;
  ctx.globalAlpha = 0.18;
  for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, (R * k) / 4, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
  const angle = (time * 1.1) % (Math.PI * 2);
  for (let k = 0; k < 40; k++) {
    const b = angle - k * 0.02;
    ctx.globalAlpha = (1 - k / 40) * 0.35;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.stroke();
  }
  for (const [bx, by] of [[0.3, 0.62], [0.71, 0.28], [0.55, 0.8], [0.18, 0.35], [0.85, 0.55]] as const) {
    const x = cx + (bx - 0.5) * 1.6 * R, y = cy + (by - 0.5) * 1.6 * R;
    let since = (angle - Math.atan2(y - cy, x - cx)) % (Math.PI * 2);
    if (since < 0) since += Math.PI * 2;
    ctx.globalAlpha = Math.max(0, 1 - since / 2.5) * 0.9;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
};

export function RadarSweep(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
