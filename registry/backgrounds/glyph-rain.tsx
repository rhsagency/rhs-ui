"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Columns of code characters falling at their own pace, bright at the head. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const size = 14, cols = Math.ceil(width / size), rows = height / size;
  const chars = "01<>/{}[]=+*";
  ctx.font = (size - 2) + "px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  for (let c = 0; c < cols; c++) {
    const speed = 4 + ((c * 7) % 5), length = 8 + ((c * 13) % 10);
    const head = Math.floor((time * speed + c * 3.7) % (rows + length));
    for (let k = 0; k < length; k++) {
      const row = head - k;
      if (row < 0 || row > rows) continue;
      ctx.globalAlpha = k === 0 ? 0.9 : (1 - k / length) * 0.35;
      ctx.fillText(chars.charAt((c * 31 + row * 17 + Math.floor(time * 3)) % chars.length), c * size, row * size);
    }
  }
};

export function GlyphRain(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
