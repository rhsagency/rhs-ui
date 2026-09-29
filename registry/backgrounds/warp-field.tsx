"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

const STARS = Array.from({ length: 180 }, (_, i) => ({ angle: (i * 2.39996) % (Math.PI * 2), lane: ((i * 0.618034) % 1) * .9 + .1, start: (i * 0.7548776) % 1 }));

/** Stars streaming out of a vanishing point, with trails that stretch as they speed up. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const cx = width * .5, cy = height * .5;
  const reach = Math.hypot(cx, cy);
  ctx.lineCap = "round";
  for (const star of STARS) {
    const progress = (star.start + time * .09 * (.6 + star.lane)) % 1;
    const eased = progress ** 2.2;
    const radius = eased * reach * 1.05;
    const trail = Math.max(1, eased * 46 * star.lane);
    const dx = Math.cos(star.angle), dy = Math.sin(star.angle);
    ctx.globalAlpha = Math.min(.85, progress * 1.4) * (.35 + star.lane * .55);
    ctx.lineWidth = .6 + eased * 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + dx * Math.max(0, radius - trail), cy + dy * Math.max(0, radius - trail));
    ctx.lineTo(cx + dx * radius, cy + dy * radius);
    ctx.stroke();
  }
};

export function WarpField(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
