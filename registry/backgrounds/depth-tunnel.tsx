"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Rounded frames rushing toward you out of a vanishing point, twisting as they come. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const cx = width * 0.5, cy = height * 0.5, reach = Math.hypot(width, height) * 0.62;
  for (let k = 0; k < 18; k++) {
    const z = (k / 18 + time * 0.12) % 1;
    const size = z ** 2.2 * reach;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(z * 0.6 + time * 0.05);
    ctx.globalAlpha = z * 0.6;
    ctx.beginPath(); ctx.roundRect(-size, -size * 0.62, size * 2, size * 1.24, size * 0.08); ctx.stroke();
    ctx.restore();
  }
};

export function DepthTunnel(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
