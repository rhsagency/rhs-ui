"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Four harmonic curves slowly changing phase, like an oscilloscope drawing music. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const curves = [[3, 2], [5, 4], [3, 4], [5, 6]] as const;
  curves.forEach(([a, b], index) => {
    const scale = 0.18 + index * 0.07;
    ctx.globalAlpha = 0.18 + index * 0.08;
    ctx.beginPath();
    for (let i = 0; i <= 320; i++) {
      const t = (i / 320) * Math.PI * 2;
      const x = width * 0.5 + Math.sin(a * t + time * 0.3 + index) * width * scale;
      const y = height * 0.5 + Math.sin(b * t) * height * scale * 1.2;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  });
};

export function Lissajous(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
