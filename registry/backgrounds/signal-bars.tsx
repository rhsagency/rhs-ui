"use client";
import { BackgroundCanvas, type BackgroundCanvasProps, type Painter } from "@rhs-ui/backgrounds/background-canvas";

/** Rounded bars rising from the baseline like a live equaliser, strongest in the middle. */
const paint: Painter = ({ ctx, width, height, time }) => {
  const gap = 10, bar = 5;
  const count = Math.floor(width / gap);
  const baseline = height * .78;
  for (let i = 0; i < count; i++) {
    const x = i * gap + (width - count * gap) / 2 + gap / 2;
    const center = 1 - Math.abs(x / width - .5) * 1.5;
    const level = (Math.sin(i * .37 + time * 1.4) + Math.sin(i * .11 - time * .9) * .7 + Math.sin(i * .9 + time * 2.3) * .3 + 2) / 4;
    const tall = Math.max(4, level * Math.max(.15, center) * height * .62);
    ctx.globalAlpha = .18 + level * .5 * Math.max(.3, center);
    ctx.beginPath();
    ctx.roundRect(x - bar / 2, baseline - tall, bar, tall, bar / 2);
    ctx.fill();
    ctx.globalAlpha *= .25;
    ctx.beginPath();
    ctx.roundRect(x - bar / 2, baseline + 6, bar, tall * .28, bar / 2);
    ctx.fill();
  }
};

export function SignalBars(props: Omit<BackgroundCanvasProps, "pattern" | "paint">): React.JSX.Element {
  return <BackgroundCanvas paint={paint} {...props} />;
}
