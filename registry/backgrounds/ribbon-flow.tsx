"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Silk ribbons of fine threads sweeping across the surface, twisting as they turn. */
const paint: Painter = ({ ctx, width, height, time }) => {
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = 0.07 + (1 - Math.abs(i - 7) / 7) * 0.2;
      ctx.beginPath();
      for (let x = -10; x <= width + 10; x += 8) {
        const u = x / width;
        const center = height * (0.2 + k * 0.2) + Math.sin(u * 3 + time * 0.4 + k) * height * 0.12;
        const twist = 1 + Math.sin(u * 4 + time + k) * 0.8;
        const y = center + (i - 7) * 3 * twist;
        if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
};

export function RibbonFlow(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
