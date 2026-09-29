"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Three layers of stars drifting past at different depths, twinkling as they go. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const layers = [[90, 6, 1.2, 0.5], [55, 14, 1.7, 0.7], [26, 30, 2.4, 0.95]] as const;
  layers.forEach(([count, speed, size, strength], layer) => {
    for (let i = 0; i < count; i++) {
      const hx = (Math.sin(i * 12.9898 + layer * 7.1) * 43758.5453) % 1, hy = (Math.sin(i * 78.233 + layer * 3.7) * 12543.891) % 1;
      const x = ((Math.abs(hx) * (width + 20) + time * speed) % (width + 20)) - 10;
      ctx.globalAlpha = strength * (0.35 + 0.65 * (Math.sin(time * 2 + i * 1.7) + 1) / 2);
      ctx.fillRect(x, Math.abs(hy) * height, size, size);
    }
  });
};

export function StarfieldDrift(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
