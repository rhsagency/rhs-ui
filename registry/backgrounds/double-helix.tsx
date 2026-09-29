"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Two strands winding around each other with rungs between them, turning in depth. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const mid = height * 0.5, amp = height * 0.22;
  for (let x = 0; x < width; x += 24) {
    const a = x * 0.018 + time;
    ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.moveTo(x, mid + Math.sin(a) * amp); ctx.lineTo(x, mid + Math.sin(a + Math.PI) * amp); ctx.stroke();
  }
  for (const strand of [0, Math.PI]) {
    for (let x = 0; x < width; x += 6) {
      const a = x * 0.018 + time + strand;
      const depth = (Math.cos(a) + 1) / 2;
      ctx.globalAlpha = 0.2 + depth * 0.7;
      ctx.beginPath(); ctx.arc(x, mid + Math.sin(a) * amp, 0.8 + depth * 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
};

export function DoubleHelix(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
