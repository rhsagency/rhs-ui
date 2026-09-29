"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A honeycomb that lights up in rings spreading from the centre. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const size = 18, w = Math.sqrt(3) * size, h = size * 1.5;
  for (let row = -1; row * h < height + size; row++) {
    for (let col = -1; col * w < width + w; col++) {
      const x = col * w + (row % 2 ? w / 2 : 0), y = row * h;
      const pulse = Math.max(0, Math.sin(Math.hypot(x - width * 0.5, y - height * 0.5) * 0.02 - time * 1.6));
      ctx.globalAlpha = 0.07 + pulse * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + Math.cos(a) * (size - 2), py = y + Math.sin(a) * (size - 2);
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
  }
};

export function HexPulse(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
