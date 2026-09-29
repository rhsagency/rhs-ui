"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** A fixed random walk, so the chart tells the same good story every time. */
const VALUES = (() => {
  let seed = 7, value = 0.35;
  return Array.from({ length: 60 }, () => {
    seed = (seed * 16807) % 2147483647;
    value = Math.min(0.92, Math.max(0.08, value + (seed / 2147483647 - 0.42) * 0.09));
    return value;
  });
})();
/** Graph paper with a line chart drawing itself, holding, then starting over. */
const paint: Painter = ({ ctx, width, height, time }) => {
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < width; x += 12) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
  for (let y = 0; y < height; y += 12) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
  ctx.globalAlpha = 0.06; ctx.stroke();
  ctx.beginPath();
  for (let x = 0; x < width; x += 60) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); }
  for (let y = 0; y < height; y += 60) { ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); }
  ctx.globalAlpha = 0.12; ctx.stroke();
  const cycle = (time * 0.16) % 1.3;
  const shown = Math.min(1, cycle) * (VALUES.length - 1);
  const fade = cycle > 1.15 ? 1 - (cycle - 1.15) / 0.15 : 1;
  ctx.globalAlpha = 0.9 * fade; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= shown; i++) {
    const x = width * 0.06 + (i / (VALUES.length - 1)) * width * 0.88, y = height * (1 - VALUES[i]!) ;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
};

export function LiveChart(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
