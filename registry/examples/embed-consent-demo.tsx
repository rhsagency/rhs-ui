"use client";

import { useState, type ReactNode } from "react";

import { IconCalendar, IconMap, IconVideo } from "@rhs-ui/icons";
import { EmbedConsent } from "@rhs-ui/primitives/embed-consent";

/*
 * The embeds are small documents drawn in the demo, so this preview loads no other site: the page that shows it allows no
 * outside frames. In your app the child is the provider's own iframe: <iframe src="https://..." title="..." />.
 */
const PAGE = "*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden}body{font:12px/1.4 Helvetica,Arial,sans-serif;color:#2b2f33}svg{display:block;width:100%;height:100%}";
const doc = (css: string, body: string): string => `<!doctype html><html><head><meta charset="utf-8"><style>${PAGE}${css}</style></head><body>${body}</body></html>`;

const MAP = doc(
  ".z{position:absolute;right:12px;top:12px;display:grid;border:1px solid #cfd3cd;border-radius:8px;background:#fff;overflow:hidden}.z b{display:grid;place-items:center;width:30px;height:30px;font-weight:600;font-size:16px}.z b+b{border-top:1px solid #e3e6e1}.q{position:absolute;left:12px;top:12px;padding:8px 12px;border:1px solid #cfd3cd;border-radius:8px;background:#fff;font-weight:600}",
  `<svg viewBox='0 0 800 450' preserveAspectRatio='xMidYMid slice'><rect width='800' height='450' fill='#e9ece6'/>` +
    `<path d='M-20 300C140 250 240 330 400 290S660 200 820 250V340C660 290 540 380 400 360S140 320 -20 380Z' fill='#bccbd4'/>` +
    [[40, 40, 150, 90], [210, 40, 120, 90], [350, 50, 170, 80], [540, 40, 110, 100], [670, 50, 110, 80], [40, 150, 100, 80], [160, 160, 130, 60], [560, 160, 90, 70], [680, 150, 100, 70], [60, 400, 140, 40], [240, 400, 200, 40], [470, 410, 160, 30], [660, 400, 120, 40]]
      .map(([x, y, w, h]) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='6' fill='#dde1d9'/>`)
      .join("") +
    `<rect x='350' y='150' width='180' height='80' rx='10' fill='#d0dac4'/>` +
    `<path d='M0 140H800M0 238H800M0 392H800M200 0V450M340 0V450M540 0V450M660 0V450' stroke='#fff' stroke-width='12'/><path d='M0 140H800M0 238H800M200 0V450M540 0V450' stroke='#d6d9d2' stroke-width='1' opacity='.0'/>` +
    `<g transform='translate(468 226)'><path d='M0 0C-20 -26 -22 -46 -22 -56A22 22 0 1 1 22 -56C22 -46 20 -26 0 0Z' fill='#2b2f33'/><circle cx='0' cy='-56' r='8' fill='#fff'/></g>` +
    `<text x='436' y='262' font-family='Helvetica,Arial,sans-serif' font-size='15' font-weight='700' fill='#2b2f33'>Halcyon Quay</text></svg>` +
    `<div class='q'>Halcyon Quay, Studio 4</div><div class='z'><b>+</b><b>−</b></div>`,
);

const CALENDAR = doc(
  "body{background:#fff;display:grid;grid-template-rows:auto minmax(0,1fr);padding:16px 20px 18px}h1{margin:0 0 10px;font-size:18px;letter-spacing:-.02em}.g{display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:auto repeat(6,minmax(0,1fr));gap:4px;min-height:0;font-size:11px}.g span{padding:2px 5px;color:#8a8e93}.d{border:1px solid #e6e8e5;border-radius:7px;padding:2px 6px;min-height:0;display:flex;flex-direction:column;gap:2px;line-height:1.25}.d i{display:block;height:4px;border-radius:2px;background:#2b2f33}.d i.m{background:#b9bdc1;width:60%}.t{background:#2b2f33;color:#fff;border-color:#2b2f33}@media(max-height:240px){body{padding:12px 14px}h1{margin-bottom:6px;font-size:15px}.g{gap:3px}.d{padding:0 4px}.d i{display:none}}",
  `<h1>November 2026</h1><div class='g'>` +
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span>${d}</span>`).join("") +
    // 1 November 2026 is a Sunday: a Monday-first month opens with six empty cells, runs 30 days, and the 10th is a Tuesday.
    Array.from({ length: 6 }, () => "<div></div>").join("") +
    Array.from({ length: 30 }, (_, i) => `<div class='d${i === 9 ? " t" : ""}'>${i + 1}${[2, 9, 16, 21].includes(i) ? "<i></i>" : ""}${[4, 16, 24].includes(i) ? "<i class='m'></i>" : ""}</div>`).join("") +
    `</div>`,
);

const VIDEO = doc(
  "body{background:#17191c;display:grid;place-items:center}.p{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#fff}.p b{width:0;height:0;border-left:20px solid #17191c;border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:6px}.c{position:absolute;left:16px;bottom:14px;color:#f1f2f3;font-weight:600;font-size:14px}.k{position:absolute;left:16px;right:16px;bottom:44px;height:3px;border-radius:2px;background:#3a3d42}.k i{display:block;width:22%;height:100%;border-radius:2px;background:#fff}",
  `<div class='p'><b></b></div><div class='k'><i></i></div><div class='c'>Inside the Dune House · 4:12</div>`,
);

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // The third example is driven from outside, as a cookie banner would: the answer is this state and nothing is stored.
  const [agreed, setAgreed] = useState(true);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12">
      <Example caption="The gate: the provider is named, what it receives is listed, and nothing is requested until Load content. Tick the box and the answer sticks for every Kestrel Maps embed.">
        <EmbedConsent provider="Kestrel Maps" privacyHref="#privacy" icon={<IconMap className="size-5" />} receives={["Your IP address", "Browser and device details", "A cookie from kestrel.example"]}>
          <iframe title="Kestrel Maps: Halcyon Quay, Studio 4" srcDoc={MAP} loading="lazy" />
        </EmbedConsent>
      </Example>

      <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
        <Example caption='remember="once": no checkbox and nothing stored, so it asks again next visit.'>
          <EmbedConsent provider="Northwind Video" privacyHref="#privacy" remember="once" aspect={4 / 3} icon={<IconVideo className="size-5" />} receives={["Your IP address", "Your viewing history"]}>
            <iframe title="Northwind Video: Inside the Dune House" srcDoc={VIDEO} loading="lazy" />
          </EmbedConsent>
        </Example>

        <Example caption="consented, driven by your own consent manager: after loading, a line says so and offers Revoke consent.">
          <EmbedConsent provider="Halcyon Calendar" privacyHref="#privacy" aspect={4 / 3} icon={<IconCalendar className="size-5" />} consented={agreed} onConsent={() => setAgreed(true)} onRevoke={() => setAgreed(false)} receives={["Your IP address", "Your time zone"]}>
            <iframe title="Halcyon Calendar: November 2026" srcDoc={CALENDAR} loading="lazy" />
          </EmbedConsent>
        </Example>
      </div>
    </div>
  );
}
