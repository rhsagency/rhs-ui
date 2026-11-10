"use client";

import { useState, type ReactNode } from "react";

import { ImageSequence } from "@rhs-ui/primitives/image-sequence";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";

/*
 * The frames are drawn as SVG, so the demo needs no files. The speaker is a perforated cylinder turned ten degrees a frame,
 * the way a product photographed on a turntable would be; the sunrise is one frame for every ten minutes of the morning.
 */
const SPIN_FRAMES = 36;
const uri = (svg: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(svg);
const f1 = (n: number): string => n.toFixed(1);

function speaker(i: number): string {
  const theta = (i / SPIN_FRAMES) * 360;
  const rad = (d: number) => (d * Math.PI) / 180;
  const cx = 400;
  const R = 128;
  const top = 150;
  const bottom = 474;
  const ry = 34;
  const tones: string[][] = [[], [], [], []];
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 28; col++) {
      const phi = ((col + (row % 2 ? 0.5 : 0)) * 360) / 28 + theta;
      const c = Math.cos(rad(phi));
      if (c < 0.06) continue;
      const x = cx + R * Math.sin(rad(phi));
      const y = top + 56 + row * 19 + ry * c;
      const rx = 4.4 * c + 0.4;
      tones[c > 0.8 ? 3 : c > 0.55 ? 2 : c > 0.3 ? 1 : 0]?.push(`M${f1(x - rx)} ${f1(y)}a${f1(rx)} 4.4 0 1 0 ${f1(2 * rx)} 0a${f1(rx)} 4.4 0 1 0 ${f1(-2 * rx)} 0`);
    }
  }
  const dots = tones.map((d, k) => `<path d='${d.join("")}' fill='#3c4043' opacity='${[0.28, 0.5, 0.75, 0.92][k]}'/>`).join("");
  const hp = rad(theta - 52);
  const hc = Math.cos(hp);
  const handle = hc > 0.05 ? `<rect x='${f1(cx + R * Math.sin(hp) - 8 * hc)}' y='${f1(176 + ry * hc)}' width='${f1(16 * hc)}' height='252' rx='${f1(Math.max(1, 8 * hc))}' fill='#25282a' opacity='${f1(0.55 + 0.45 * hc)}'/>` : "";
  const psi = rad(theta + 24);
  return uri(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs>` +
      `<linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f2ee'/><stop offset='1' stop-color='#e0ddd7'/></linearGradient>` +
      `<linearGradient id='body' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#9ea3a6'/><stop offset='.2' stop-color='#d3d6d8'/><stop offset='.46' stop-color='#eceeef'/><stop offset='.78' stop-color='#c8cbcd'/><stop offset='1' stop-color='#868b8e'/></linearGradient>` +
      `<filter id='b' x='-20%' y='-100%' width='140%' height='300%'><feGaussianBlur stdDeviation='10'/></filter></defs>` +
      `<rect width='800' height='600' fill='url(#bg)'/><ellipse cx='${cx}' cy='${bottom + 6}' rx='178' ry='26' fill='#000' opacity='.16' filter='url(#b)'/>` +
      `<path d='M${cx - R} ${top}V${bottom}A${R} ${ry} 0 0 0 ${cx + R} ${bottom}V${top}Z' fill='url(#body)'/>${dots}${handle}` +
      `<ellipse cx='${cx}' cy='${top}' rx='${R}' ry='${ry}' fill='#f4f5f6' stroke='#c4c7c9'/><ellipse cx='${cx}' cy='${top}' rx='98' ry='24' fill='none' stroke='#d6d9da'/>` +
      `<ellipse cx='${cx}' cy='${top}' rx='24' ry='6.5' fill='#dcdfe0'/><ellipse cx='${f1(cx + 98 * Math.sin(psi))}' cy='${f1(top + 24 * Math.cos(psi))}' rx='5' ry='2.4' fill='#25282a'/></svg>`,
  );
}

const SPIN = Array.from({ length: SPIN_FRAMES }, (_, i) => speaker(i));

const SUN_FRAMES = 24;
const mix = (a: number[], b: number[], t: number): string => `rgb(${a.map((v, k) => Math.round(v + ((b[k] ?? v) - v) * t)).join(",")})`;

function sunrise(i: number): string {
  const t = i / (SUN_FRAMES - 1);
  const skyTop = t < 0.5 ? mix([30, 36, 46], [112, 118, 130], t * 2) : mix([112, 118, 130], [205, 196, 184], (t - 0.5) * 2);
  const skyLow = t < 0.5 ? mix([52, 58, 68], [190, 164, 150], t * 2) : mix([190, 164, 150], [244, 226, 200], (t - 0.5) * 2);
  const sx = 60 + 280 * t;
  const sy = 214 - 150 * Math.sin(Math.PI * t);
  const minutes = 310 + Math.round(t * 270);
  const clock = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const stars = [[40, 30], [92, 62], [150, 24], [220, 52], [290, 28], [340, 70], [250, 90], [120, 100]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='1.4' fill='#fff' opacity='${f1(Math.max(0, 0.9 - t * 2.2))}'/>`).join("");
  return uri(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${skyTop}'/><stop offset='1' stop-color='${skyLow}'/></linearGradient>` +
      `<radialGradient id='g'><stop offset='0' stop-color='#fff4de' stop-opacity='${f1(0.35 + 0.4 * Math.sin(Math.PI * t))}'/><stop offset='1' stop-color='#fff4de' stop-opacity='0'/></radialGradient></defs>` +
      `<rect width='400' height='300' fill='url(#s)'/>${stars}<circle cx='${f1(sx)}' cy='${f1(sy)}' r='70' fill='url(#g)'/><circle cx='${f1(sx)}' cy='${f1(sy)}' r='20' fill='${mix([240, 200, 160], [255, 248, 232], Math.min(1, t * 1.6))}'/>` +
      `<path d='M0 220C60 200 120 214 190 206S330 196 400 214V300H0Z' fill='#3d4248'/><path d='M0 252C90 236 170 256 260 244S350 238 400 248V300H0Z' fill='#292c30'/>` +
      `<text x='18' y='34' font-family='Helvetica, Arial, sans-serif' font-size='15' font-weight='700' fill='#fff' opacity='.92'>${clock}</text></svg>`,
  );
}

const SUNRISE = Array.from({ length: SUN_FRAMES }, (_, i) => sunrise(i));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [spin, setSpin] = useState(3);
  const [morning, setMorning] = useState(0);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-14">
      <Example caption="A 360-degree spin: drag across the picture, or focus it and use the arrow keys. It turns once by itself the first time you see it.">
        <div className="grid gap-5">
          <ImageSequence frames={SPIN} alt="Kestrel portable speaker in light grey, turning through 360 degrees" defaultFrame={3} autoRotate onFrameChange={setSpin} className="max-w-xl" />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-muted-foreground sm:max-w-xl">
            <p aria-hidden="true">
              Frame <span className="font-medium text-foreground tabular-nums">{spin + 1}</span> of {SPIN_FRAMES}
            </p>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <li className="flex items-center gap-2">
                <Kbd>Drag</Kbd> rotate
              </li>
              <li className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>←</Kbd>
                  <Kbd>→</Kbd>
                </KbdGroup>
                one frame
              </li>
              <li className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>Home</Kbd>
                  <Kbd>End</Kbd>
                </KbdGroup>
                the ends
              </li>
            </ul>
          </div>
        </div>
      </Example>

      <Example caption='mode="hover": the place of the pointer along the picture is the frame, so it scrubs like a video preview. It rests on the first frame when you leave.'>
        <div className="grid gap-3 sm:max-w-md">
          <ImageSequence frames={SUNRISE} alt="Sunrise over Halcyon Quay, from first light to full morning" mode="hover" aspect={4 / 3} fit="cover" onFrameChange={setMorning} />
          <p aria-hidden="true" className="text-xs text-muted-foreground">
            Frame <span className="font-medium text-foreground tabular-nums">{morning + 1}</span> of {SUN_FRAMES}
          </p>
        </div>
      </Example>
    </div>
  );
}
