"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Short strokes that follow a slowly turning current, like wind over a map. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const step = 22;
  ctx.lineCap = "round";
  for (let x = step / 2; x < width; x += step) {
    for (let y = step / 2; y < height; y += step) {
      const nx = x / width, ny = y / height;
      const angle = Math.sin(nx * 3.1 + time * .35) * 1.4 + Math.cos(ny * 4.3 - time * .28) * 1.1 + Math.sin((nx + ny) * 2.2 + time * .18);
      const strength = (Math.sin(nx * 5 - ny * 3 + time * .5) + 1) * .5;
      const length = 5 + strength * 9;
      ctx.globalAlpha = .12 + strength * .42;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * length * .5, y - Math.sin(angle) * length * .5);
      ctx.lineTo(x + Math.cos(angle) * length * .5, y + Math.sin(angle) * length * .5);
      ctx.stroke();
    }
  }
};

export function FlowField(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
