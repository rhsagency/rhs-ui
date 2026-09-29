"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Print-style halftone dots swelling and shrinking with a slow crossing wave. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const step = 16;
  for (let row = 0, y = step / 2; y < height + step; row++, y += step * 0.87) {
    for (let x = (row % 2) * (step / 2); x < width + step; x += step) {
      const v = (Math.sin(x * 0.012 + y * 0.008 - time * 0.9) + Math.sin(x * 0.004 - y * 0.011 + time * 0.5) + 2) / 4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(x, y, 0.4 + v * v * step * 0.46, 0, Math.PI * 2); ctx.fill();
    }
  }
};

export function HalftoneWave(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
