import type { ReactNode } from "react";

import { IconPlay, IconSkipBack, IconSkipForward } from "@rhs-ui/icons";
import { PhoneFrame } from "@rhs-ui/primitives/phone-frame";

/* The screenshot and the cover are drawn as SVG, so the demo needs no files. */
const FONT = "font-family='Helvetica, Arial, sans-serif'";
const SCREENSHOT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 390 844'><rect width='390' height='844' fill='#f4f3f0'/>` +
      `<text x='36' y='37' ${FONT} font-size='16' font-weight='700' fill='#1b1d1f'>9:41</text><rect x='322' y='24' width='26' height='13' rx='4' fill='none' stroke='#1b1d1f' stroke-width='1.5'/><rect x='325' y='27' width='16' height='7' rx='2' fill='#1b1d1f'/>` +
      `<text x='24' y='126' ${FONT} font-size='36' font-weight='700' fill='#1b1d1f'>Today</text><text x='24' y='154' ${FONT} font-size='15' fill='#7a7a74'>Wednesday, 4 November</text>` +
      `<rect x='20' y='182' width='350' height='156' rx='24' fill='#ffffff' stroke='#e6e5e0'/><text x='44' y='218' ${FONT} font-size='11' font-weight='700' letter-spacing='1.2' fill='#9a9a94'>NEXT UP</text><text x='44' y='250' ${FONT} font-size='22' font-weight='700' fill='#1b1d1f'>Design review</text><text x='44' y='274' ${FONT} font-size='14' fill='#7a7a74'>10:30 to 11:00 · Room 4</text>` +
      `<circle cx='58' cy='308' r='15' fill='#c99a7a' stroke='#fff' stroke-width='3'/><circle cx='84' cy='308' r='15' fill='#8d5e45' stroke='#fff' stroke-width='3'/><circle cx='110' cy='308' r='15' fill='#e2b99a' stroke='#fff' stroke-width='3'/><rect x='282' y='290' width='66' height='34' rx='17' fill='#1b1d1f'/><text x='315' y='312' text-anchor='middle' ${FONT} font-size='14' font-weight='700' fill='#fff'>Join</text>` +
      `<rect x='20' y='354' width='350' height='116' rx='24' fill='#ffffff' stroke='#e6e5e0'/><text x='44' y='392' ${FONT} font-size='18' font-weight='700' fill='#1b1d1f'>Ship v2.4</text><text x='346' y='392' text-anchor='end' ${FONT} font-size='14' fill='#7a7a74'>62%</text><rect x='44' y='414' width='302' height='8' rx='4' fill='#ecebe6'/><rect x='44' y='414' width='187' height='8' rx='4' fill='#1b1d1f'/><text x='44' y='450' ${FONT} font-size='13' fill='#7a7a74'>5 of 8 tasks done</text>` +
      `<text x='24' y='516' ${FONT} font-size='18' font-weight='700' fill='#1b1d1f'>Tasks</text>` +
      [0, 1, 2].map((i) => `<circle cx='38' cy='${556 + i * 52}' r='10' fill='none' stroke='#c9c8c2' stroke-width='2'/><rect x='62' y='${549 + i * 52}' width='${[210, 170, 236][i]}' height='12' rx='6' fill='#1b1d1f' opacity='${[1, 0.85, 0.7][i]}'/><rect x='62' y='${568 + i * 52}' width='${[110, 90, 130][i]}' height='8' rx='4' fill='#c9c8c2'/>`).join("") +
      `<rect y='752' width='390' height='92' fill='#ffffff'/><rect y='752' width='390' height='1' fill='#e6e5e0'/>` +
      [0, 1, 2, 3].map((i) => `<rect x='${48 + i * 90}' y='772' width='24' height='24' rx='7' fill='${i === 0 ? "#1b1d1f" : "#c9c8c2"}'/><rect x='${46 + i * 90}' y='806' width='28' height='6' rx='3' fill='${i === 0 ? "#1b1d1f" : "#c9c8c2"}'/>`).join("") +
      `</svg>`,
  );

const COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='#d9dee4'/><circle cx='64' cy='33' r='13' fill='#f4f6f8'/><path d='M0 62C16 52 30 52 46 60S78 70 96 58V96H0Z' fill='#9eabba'/><path d='M0 78C20 70 36 72 54 80S82 86 96 76V96H0Z' fill='#5f6e80'/></svg>",
  );

const TRAILS = [
  { name: "Ridge Loop", meta: "Moderate · 2 h 10", km: "8.4 km" },
  { name: "Larch Valley", meta: "Easy · 1 h 25", km: "4.9 km" },
  { name: "Kestrel Point", meta: "Hard · 3 h 40", km: "12.1 km" },
  { name: "Harbour Walk", meta: "Easy · 45 min", km: "2.6 km" },
  { name: "Saltmarsh Loop", meta: "Moderate · 1 h 50", km: "6.7 km" },
];

/** Live UI sized in the phone's own container units, so it scales with the device like a screenshot would. */
function TrailsApp(): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-col px-[5cqw]">
      <div className="pt-[1cqw]">
        <p className="text-[3.2cqw] text-muted-foreground">Good morning, Maya</p>
        <h3 className="text-[6.6cqw] leading-tight font-semibold tracking-[-0.03em]">Trails near you</h3>
      </div>
      <div className="mt-[3.5cqw] flex h-[10cqw] items-center rounded-[3cqw] bg-muted px-[3.5cqw] text-[3.4cqw] text-muted-foreground">Search routes</div>
      <div className="relative mt-[4cqw] h-[34cqw] shrink-0 overflow-hidden rounded-[4cqw] border border-border bg-muted">
        <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="size-full text-foreground">
          <path d="M-10 70C30 50 60 80 100 58S170 40 210 60M-10 40C40 20 70 50 110 30S180 10 210 30M-10 92C40 76 80 98 120 82S180 70 210 88" fill="none" stroke="currentColor" strokeWidth="1" opacity=".14" />
          <path d="M26 74C52 52 76 70 100 48S150 56 172 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="1 5" strokeLinecap="round" />
          <circle cx="26" cy="74" r="4" fill="currentColor" />
          <circle cx="172" cy="24" r="4" fill="currentColor" />
        </svg>
        <span className="absolute top-[2.4cqw] left-[2.8cqw] rounded-full bg-background px-[2.6cqw] py-[1cqw] text-[2.8cqw] font-medium shadow-xs">Today's pick · Ridge Loop</span>
      </div>
      <ul className="mt-[3cqw] grid gap-[2.4cqw]">
        {TRAILS.slice(1).map((trail) => (
          <li key={trail.name} className="flex items-center gap-[3cqw] rounded-[3.5cqw] border border-border p-[2.4cqw]">
            <span className="grid size-[13cqw] shrink-0 place-items-end overflow-hidden rounded-[2.4cqw] bg-muted">
              <svg viewBox="0 0 48 48" aria-hidden="true" className="size-full text-foreground">
                <path d="M0 40L15 18l9 12 6-8 18 18v8H0z" fill="currentColor" opacity=".3" />
                <path d="M0 44l12-10 10 6 12-9 14 13v4H0z" fill="currentColor" opacity=".55" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[3.6cqw] font-medium">{trail.name}</span>
              <span className="block truncate text-[3cqw] text-muted-foreground">{trail.meta}</span>
            </span>
            <span className="text-[3cqw] font-medium tabular-nums">{trail.km}</span>
          </li>
        ))}
      </ul>
      <nav aria-label="App sections" className="mt-auto grid grid-cols-4 border-t border-border pt-[2.5cqw] text-center text-[2.6cqw] text-muted-foreground">
        {["Explore", "Saved", "Record", "You"].map((label, index) => (
          <span key={label} className={index === 0 ? "font-medium text-foreground" : undefined}>
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}

function PlayerApp(): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-col items-center justify-between gap-[4cqw] px-[7cqw] text-center">
      <div className="flex w-full flex-col items-center">
        <p className="text-[2.8cqw] font-medium tracking-[0.12em] text-muted-foreground uppercase">Now playing</p>
        <div className="mt-[5cqw] aspect-square w-full overflow-hidden rounded-[5cqw] border border-border bg-muted">
          <img src={COVER} alt="" className="size-full object-cover" />
        </div>
        <h3 className="mt-[6cqw] text-[5.4cqw] font-semibold tracking-[-0.02em]">Low Tide</h3>
        <p className="text-[3.6cqw] text-muted-foreground">Halcyon Sessions</p>
      </div>
      <div className="w-full">
        <div className="h-[1.2cqw] rounded-full bg-foreground/10">
          <div className="h-full w-[38%] rounded-full bg-foreground" />
        </div>
        <div className="mt-[1.6cqw] flex justify-between text-[2.8cqw] text-muted-foreground tabular-nums">
          <span>1:25</span>
          <span>3:44</span>
        </div>
        <div className="mt-[3.5cqw] flex items-center justify-center gap-[7cqw]">
          <IconSkipBack className="size-[6cqw] fill-current" />
          <span className="grid size-[14cqw] place-items-center rounded-full bg-foreground text-background">
            <IconPlay className="size-[5.6cqw] translate-x-[0.4cqw] fill-current" />
          </span>
          <IconSkipForward className="size-[6cqw] fill-current" />
        </div>
      </div>
      <div className="flex w-full items-center gap-[3cqw] rounded-[3.5cqw] border border-border p-[2.4cqw] text-left">
        <span className="grid size-[11cqw] shrink-0 place-items-end overflow-hidden rounded-[2.2cqw] bg-muted">
          <svg viewBox="0 0 48 48" aria-hidden="true" className="size-full text-foreground">
            <path d="M0 36C10 28 20 28 30 33S42 38 48 32V48H0z" fill="currentColor" opacity=".3" />
            <path d="M0 42C12 36 22 38 32 42S44 44 48 40V48H0z" fill="currentColor" opacity=".55" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[2.6cqw] font-medium tracking-[0.1em] text-muted-foreground uppercase">Up next</span>
          <span className="block truncate text-[3.4cqw] font-medium">Harbour Lights</span>
        </span>
        <span className="text-[3cqw] text-muted-foreground tabular-nums">3:07</span>
      </div>
    </div>
  );
}

function Device({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="m-0 grid w-[14.5rem] max-w-full justify-items-center gap-4">
      {children}
      <figcaption className="max-w-[14rem] text-center text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-x-12 gap-y-12 py-2">
      <Device caption="A screenshot: pass src and alt. Dark body, with the island.">
        <PhoneFrame width={232} src={SCREENSHOT} alt="The Today screen of a planner app: a design review at 10:30, a release at 62 percent and three tasks." />
      </Device>
      <Device caption="Live UI in a light body. It is sized in the phone's own units, so it scales with the device.">
        <PhoneFrame width={232} tone="light" label="Trails app, home screen">
          <TrailsApp />
        </PhoneFrame>
      </Device>
      <Device caption='notch="none": a plain screen, the same live UI approach, clear of the home bar.'>
        <PhoneFrame width={232} notch="none" label="Music player, now playing">
          <PlayerApp />
        </PhoneFrame>
      </Device>
    </div>
  );
}
