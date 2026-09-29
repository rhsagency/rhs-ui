"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Fine diagonal stripes with a bright band sweeping across them. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const spacing = 12, span = width + height;
  const band = ((time * 0.18) % 1.4) - 0.2;
  for (let d = -height; d < width; d += spacing) {
    const position = (d + height) / span;
    ctx.globalAlpha = 0.07 + Math.exp(-((position - band) ** 2) / 0.004) * 0.6;
    ctx.beginPath(); ctx.moveTo(d, height); ctx.lineTo(d + height, 0); ctx.stroke();
  }
};

export function DiagonalScan(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
