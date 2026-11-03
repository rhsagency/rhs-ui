"use client";

import { useState, type ReactNode } from "react";

import { FocalPointField, type FocalPoint } from "@rhs-ui/application/focal-point-field";

/** A picture drawn as a data URI, so the demo needs no files and no network. A lighthouse on the right of a wide shot: the part that must never be cropped. */
const LIGHTHOUSE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d2d9"/><stop offset="1" stop-color="#f1e7d4"/></linearGradient><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78a0ad"/><stop offset="1" stop-color="#2f4d59"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#sky)"/><circle cx="330" cy="300" r="120" fill="#f6e1b3"/><path d="M0 650 L170 530 L320 610 L520 470 L720 620 L910 540 L1120 650 L1600 650 L1600 1000 L0 1000Z" fill="#a1b4bc"/><rect y="650" width="1600" height="350" fill="url(#sea)"/><g fill="#fff" opacity=".2"><rect x="120" y="720" width="260" height="5"/><rect x="520" y="780" width="340" height="5"/><rect x="200" y="860" width="420" height="5"/><rect x="1180" y="830" width="300" height="5"/><rect x="700" y="920" width="360" height="5"/></g><path d="M900 790 Q990 650 1100 660 Q1240 650 1310 790 Z" fill="#2b3a40"/><path d="M1052 668 L1068 338 L1114 338 L1130 668 Z" fill="#f5f0e6"/><path d="M1057 580 L1061 510 L1121 510 L1125 580 Z" fill="#b4533f"/><rect x="1042" y="326" width="102" height="16" rx="3" fill="#2b3a40"/><rect x="1071" y="276" width="44" height="50" fill="#ecdca8"/><path d="M1063 276 L1093 240 L1123 276 Z" fill="#2b3a40"/><path d="M0 1000 L0 930 Q400 900 800 940 T1600 920 L1600 1000Z" fill="#26404b" opacity=".55"/></svg>`,
  );

/** A tall shot with a balloon high on the left. */
const BALLOON =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1400" viewBox="0 0 1000 1400"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd0dc"/><stop offset="1" stop-color="#f3e8d6"/></linearGradient></defs><rect width="1000" height="1400" fill="url(#sky)"/><g fill="#fff" opacity=".7"><ellipse cx="700" cy="260" rx="190" ry="46"/><ellipse cx="820" cy="300" rx="130" ry="36"/><ellipse cx="260" cy="760" rx="170" ry="40"/></g><path d="M0 980 Q300 900 560 960 T1000 930 L1000 1400 L0 1400Z" fill="#9db58a"/><path d="M0 1100 Q320 1030 620 1090 T1000 1060 L1000 1400 L0 1400Z" fill="#86a275"/><path d="M0 1240 Q300 1180 640 1230 T1000 1210 L1000 1400 L0 1400Z" fill="#6d8c61"/><g transform="translate(300 330)"><path d="M0 -190 C150 -190 190 -60 120 50 C90 100 40 130 0 150 C-40 130 -90 100 -120 50 C-190 -60 -150 -190 0 -190Z" fill="#c9674f"/><path d="M0 -190 C50 -190 70 -60 40 60 L0 150 L-40 60 C-70 -60 -50 -190 0 -190Z" fill="#f1e2c4"/><path d="M-60 140 L-34 218 M60 140 L34 218" stroke="#5a4636" stroke-width="5" fill="none"/><rect x="-42" y="216" width="84" height="46" rx="7" fill="#7a5a3f"/></g></svg>`,
  );

/** A caption above a case, in the quiet voice the rest of the demo uses. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** What the field reported last, as the CSS that receives it would read it. */
function Report({ point }: { point: FocalPoint }): React.JSX.Element {
  return <p className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-[0.6875rem] leading-5 text-muted-foreground">{`object-position: ${point.x}% ${point.y}%;`}</p>;
}

export default function Demo(): React.JSX.Element {
  const [lighthouse, setLighthouse] = useState<FocalPoint>({ x: 68, y: 45 });
  const [balloon, setBalloon] = useState<FocalPoint>({ x: 30, y: 25 });

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="Click or drag on the picture to put the point on the lighthouse, or focus the handle and use the arrow keys. The square, wide and tall crops follow it, so you see what will be cut before you save.">
          <div className="grid gap-3">
            <FocalPointField src={LIGHTHOUSE} alt="A white lighthouse with a red band on a rocky island, the sun low over the hills behind it" value={lighthouse} onValueChange={setLighthouse} />
            <Report point={lighthouse} />
          </div>
        </Case>

        <Case caption="A tall picture with your own crops, and a step of 5: the point snaps to multiples of five, and the arrow keys move it by five.">
          <div className="grid gap-3">
            <FocalPointField
              src={BALLOON}
              alt="A red and cream hot air balloon above green fields"
              value={balloon}
              onValueChange={setBalloon}
              step={5}
              previews={[
                { label: "Banner", ratio: 3 },
                { label: "Card", ratio: 4 / 3 },
                { label: "Story", ratio: 9 / 16 },
              ]}
            />
            <Report point={balloon} />
          </div>
        </Case>
      </div>
    </div>
  );
}
