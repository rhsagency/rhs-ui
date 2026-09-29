"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

const CELL = 48;
/** Which lines carry a beam, and how far along each one starts: fixed, so the rhythm is designed, not random. */
const BEAMS = [
  { axis: "x", line: 2, offset: 0, pace: 1 },
  { axis: "y", line: 3, offset: .35, pace: .8 },
  { axis: "x", line: 6, offset: .6, pace: 1.2 },
  { axis: "y", line: 9, offset: .15, pace: .95 },
  { axis: "x", line: 9, offset: .82, pace: .7 },
  { axis: "y", line: 14, offset: .5, pace: 1.1 },
  { axis: "y", line: 20, offset: .72, pace: .85 },
] as const;

/** A quiet square grid with light travelling along a few of its lines. */
const paint: Painter = ({ ctx, width, height, time }) => {
  ctx.globalAlpha = .1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += CELL) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, height); }
  for (let y = 0; y <= height; y += CELL) { ctx.moveTo(0, y + .5); ctx.lineTo(width, y + .5); }
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  for (const beam of BEAMS) {
    const span = beam.axis === "x" ? width : height;
    const at = beam.line * CELL + .5;
    if (at > (beam.axis === "x" ? height : width)) continue;
    const head = ((time * .12 * beam.pace + beam.offset) % 1) * (span + 240) - 120;
    const tail = head - 140;
    for (let s = 0; s < 14; s++) {
      const from = tail + (head - tail) * (s / 14), to = tail + (head - tail) * ((s + 1) / 14);
      ctx.globalAlpha = (s / 14) ** 2 * .85;
      ctx.beginPath();
      if (beam.axis === "x") { ctx.moveTo(from, at); ctx.lineTo(to, at); } else { ctx.moveTo(at, from); ctx.lineTo(at, to); }
      ctx.stroke();
    }
    ctx.globalAlpha = .9;
    ctx.beginPath();
    if (beam.axis === "x") ctx.arc(head, at, 2, 0, Math.PI * 2); else ctx.arc(at, head, 2, 0, Math.PI * 2);
    ctx.fill();
  }
};

export function BeamGrid(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
