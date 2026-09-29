"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** An isometric field of tiles lifting and settling in slow waves. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const s = 22, rise = s * 0.58;
  for (let gy = -2; gy < height / rise + 3; gy++) {
    for (let gx = -2; gx < width / (s * 2) + 2; gx++) {
      const x = gx * s * 2 + (gy % 2 ? s : 0), y = gy * rise;
      const lift = (Math.sin(gx * 0.6 + time) + Math.cos(gy * 0.4 - time * 0.7)) * 6;
      ctx.globalAlpha = 0.1 + (lift + 12) / 24 * 0.35;
      ctx.beginPath();
      ctx.moveTo(x, y - lift - rise); ctx.lineTo(x + s, y - lift); ctx.lineTo(x, y - lift + rise); ctx.lineTo(x - s, y - lift);
      ctx.closePath(); ctx.stroke();
    }
  }
};

export function IsometricBlocks(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
