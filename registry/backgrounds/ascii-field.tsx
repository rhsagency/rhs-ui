"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A field of characters whose density follows a drifting pattern, like a terminal dreaming. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const cw = 16, ch = 22, ramp = " .:-=+*#%@";
  ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";
  ctx.globalAlpha = 0.5;
  for (let y = 0; y < height; y += ch) {
    for (let x = 0; x < width; x += cw) {
      const v = (Math.sin(x * 0.011 + time * 0.7) + Math.sin(y * 0.017 - time * 0.5) + Math.sin((x + y) * 0.007 + time * 0.3) + 3) / 6;
      const glyph = ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))]!;
      if (glyph !== " ") ctx.fillText(glyph, x, y);
    }
  }
};

export function AsciiField(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
