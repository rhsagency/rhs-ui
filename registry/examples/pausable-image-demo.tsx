"use client";

import { useState, type ReactNode } from "react";

import { PausableImage } from "@rhs-ui/primitives/pausable-image";

/*
 * The animation is an animated SVG, drawn here so the demo needs no files; your own is a GIF, an animated WebP or APNG. The
 * pipeline moves along its track and ticks off each step, then starts again. `done` is the same picture finished, for the poster.
 */
const FONT = "font-family='Helvetica, Arial, sans-serif'";
const LOOP = 6;
const STEPS = [
  { label: "Build", x: 130, at: 0.7 },
  { label: "Test", x: 310, at: 1.7 },
  { label: "Stage", x: 490, at: 2.7 },
  { label: "Ship", x: 670, at: 3.7 },
] as const;

function pipeline(done: boolean): string {
  /** One property changing at a moment of the loop: it holds `before`, moves to `after` over a quarter second, and holds that to the end. */
  const change = (attribute: string, before: string, after: string, at: number) => (done ? "" : `<animate attributeName='${attribute}' values='${before};${before};${after};${after}' keyTimes='0;${(at / LOOP).toFixed(3)};${((at + 0.25) / LOOP).toFixed(3)};1' dur='${LOOP}s' repeatCount='indefinite'/>`);
  const steps = STEPS.map(
    (step) =>
      `<circle cx='${step.x}' cy='235' r='26' fill='${done ? "#17181a" : "#e4e4df"}'>${change("fill", "#e4e4df", "#17181a", step.at)}</circle>` +
      `<path d='M${step.x - 9} 236l6 6l12 -13' fill='none' stroke='#fff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' opacity='${done ? 1 : 0}'>${change("opacity", "0", "1", step.at)}</path>` +
      `<text x='${step.x}' y='298' text-anchor='middle' ${FONT} font-size='16' font-weight='600' fill='#17181a'>${step.label}</text>`,
  ).join("");
  // Two lines, high enough to clear the "Animated" tag in the bottom left corner of the still at any width.
  const logs = [220, 150]
    .map((width, i) => `<rect x='60' y='${342 + i * 17}' width='${width}' height='8' rx='4' fill='#e4e4df' opacity='${done ? 1 : 0}'>${done ? "" : `<animate attributeName='opacity' values='0;0;1;1' keyTimes='0;${((1 + i) / LOOP).toFixed(3)};${((1.25 + i) / LOOP).toFixed(3)};1' dur='${LOOP}s' repeatCount='indefinite'/>`}</rect>`)
    .join("");
  const state = (text: string, from: number, to: number, shown: boolean) =>
    `<text x='684' y='97' text-anchor='middle' ${FONT} font-size='15' font-weight='700' fill='#17181a' opacity='${shown ? 1 : 0}'>${text}${done ? "" : `<animate attributeName='opacity' values='${from};${from};${to};${to}' keyTimes='0;0.6;0.63;1' dur='${LOOP}s' repeatCount='indefinite'/>`}</text>`;
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'><rect width='800' height='450' fill='#f2f2ef'/><rect x='20' y='20' width='760' height='410' rx='18' fill='#fff' stroke='#e3e3de'/>` +
        `<text x='60' y='96' ${FONT} font-size='26' font-weight='700' fill='#17181a'>Deploy to production</text><text x='60' y='124' ${FONT} font-size='15' fill='#8a8a84'>northwind/web · main · 3f9c2e1</text>` +
        `<rect x='628' y='74' width='112' height='34' rx='17' fill='#f2f2ef'/>${state("Running", 1, 0, !done)}${state("Live", 0, 1, done)}` +
        `<rect x='130' y='232' width='540' height='6' rx='3' fill='#e4e4df'/><rect x='130' y='232' width='${done ? 540 : 0}' height='6' rx='3' fill='#17181a'>${done ? "" : `<animate attributeName='width' values='0;0;540;540' keyTimes='0;0.04;0.62;1' dur='${LOOP}s' repeatCount='indefinite'/>`}</rect>` +
        `${steps}<path d='M60 330H740' stroke='#ecece8'/>${logs}</svg>`,
    )
  );
}

const MOVING = pipeline(false);
const FINISHED = pipeline(true);
const ALT = "The Northwind deploy pipeline moving through four steps, build, test, stage and ship, each ticked off in turn.";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [running, setRunning] = useState(false);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12">
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
        <Example caption="No poster: the first frame of the animation is drawn as the still. Press play to run it.">
          <PausableImage src={MOVING} alt={ALT} />
        </Example>
        <Example caption="With a poster, here the finished pipeline, the animated file is not requested until you press play.">
          <PausableImage src={MOVING} poster={FINISHED} alt={ALT} />
        </Example>
      </div>

      <Example caption="autoPlay starts it at once, unless the visitor prefers reduced motion. Pause is one press away, in the corner.">
        <div className="grid gap-3 sm:max-w-md">
          <PausableImage src={MOVING} alt={ALT} autoPlay onPlayingChange={setRunning} />
          <p role="status" className="text-xs text-muted-foreground">
            {running ? "Playing." : "Paused: the still is showing."}
          </p>
        </div>
      </Example>
    </div>
  );
}
