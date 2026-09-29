"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A measuring grid with three waveforms tracing through it, one bright, two faint. */
const paint: Painter = ({ ctx, width, height, time }) => {
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  for (let i = 1; i < 10; i++) { const x = (width * i) / 10; ctx.moveTo(x, 0); ctx.lineTo(x, height); }
  for (let i = 1; i < 6; i++) { const y = (height * i) / 6; ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();
  ([[0.8, 1.5, 1], [0.45, 1, 1.7], [0.25, 1, 2.6]] as const).forEach(([alpha, line, ratio]) => {
    ctx.globalAlpha = alpha; ctx.lineWidth = line;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 3) {
      const u = x / width;
      const y = height * 0.5 + (Math.sin(u * 12 * ratio + time * 2) * 0.6 + Math.sin(u * 31 - time * 1.3) * 0.2) * height * 0.28;
      if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  });
};

export function Oscilloscope(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
