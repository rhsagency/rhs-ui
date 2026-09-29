"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A living photographic grain that makes a flat surface feel printed. */
const paint: Painter = ({ ctx, width, height, time }) => {
  let seed = Math.floor(time * 24) * 9301 + 49297;
  const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const count = Math.round((width * height) / 110);
  for (let i = 0; i < count; i++) { ctx.globalAlpha = 0.08 + random() * 0.42; ctx.fillRect(random() * width, random() * height, 1.2, 1.2); }
};

export function FilmGrain(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
