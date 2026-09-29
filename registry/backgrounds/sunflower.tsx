"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A golden-angle spiral of points turning slowly, a wave of growth running out from the centre. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const count = 540, c = Math.min(width, height) / (2.1 * Math.sqrt(count));
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const r = c * Math.sqrt(i), a = i * golden + time * 0.1;
    const swell = (Math.sin(Math.sqrt(i) * 0.9 - time * 2) + 1) / 2;
    ctx.globalAlpha = 0.25 + swell * 0.55;
    ctx.beginPath(); ctx.arc(width * 0.5 + Math.cos(a) * r, height * 0.5 + Math.sin(a) * r, 0.8 + swell * 1.6, 0, Math.PI * 2); ctx.fill();
  }
};

export function Sunflower(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
