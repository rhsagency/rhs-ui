"use client";

import { useState, type ReactNode } from "react";

import { HotspotImage, type Hotspot } from "@rhs-ui/primitives/hotspot-image";

/* Both pictures are drawn as SVG at the shape they are shown in, so the demo needs no files. */
const uri = (svg: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(svg);
const FONT = "font-family='Helvetica, Arial, sans-serif'";

/** A floor plan, 1200 by 800: walls, doors, windows, furniture and the room names. */
function plan(): string {
  const wall = "#2b2a27";
  const line = "#b9b2a3";
  const fur = "#d9d2c3";
  const label = (text: string, x: number, y: number) => `<text x='${x}' y='${y}' ${FONT} font-size='17' font-weight='700' letter-spacing='3' fill='#8d8678' text-anchor='middle'>${text}</text>`;
  const win = (x: number, y: number, w: number, h: number) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='#f6f3ec'/><path d='${w > h ? `M${x} ${y + h / 2}h${w}` : `M${x + w / 2} ${y}v${h}`}' stroke='#7d8a92' stroke-width='3'/><rect x='${x}' y='${y}' width='${w}' height='${h}' fill='none' stroke='${wall}' stroke-width='2'/>`;
  const door = (x: number, y: number, r: number, rotate = 0) => `<g transform='translate(${x} ${y}) rotate(${rotate})'><path d='M0 0h${r}' stroke='${wall}' stroke-width='4'/><path d='M0 0A${r} ${r} 0 0 1 ${r} ${r}' fill='none' stroke='${line}' stroke-width='2' stroke-dasharray='5 5'/></g>`;
  const chair = (x: number, y: number) => `<rect x='${x}' y='${y}' width='34' height='34' rx='9' fill='#fff' stroke='${line}' stroke-width='2'/>`;
  const parts = [
    `<rect width='1200' height='800' fill='#f4f1ea'/>`,
    // floors
    `<rect x='80' y='80' width='1040' height='560' fill='#ece7dc'/><rect x='400' y='80' width='460' height='560' fill='#f1ede3'/><rect x='80' y='330' width='320' height='310' fill='#e6e0d3'/><rect x='860' y='400' width='260' height='240' fill='#e3e8e9'/>`,
    // balcony
    `<rect x='430' y='640' width='400' height='116' fill='#e9e4d8' stroke='${wall}' stroke-width='5'/><path d='M430 652h400M430 744h400' stroke='${line}' stroke-width='2'/>${label("BALCONY", 590, 706)}<circle cx='700' cy='688' r='22' fill='#fff' stroke='${line}' stroke-width='2'/><circle cx='700' cy='688' r='6' fill='${fur}'/>${chair(640, 676)}${chair(740, 676)}<circle cx='470' cy='700' r='20' fill='#cdd5c3' stroke='#aeb99f' stroke-width='2'/><circle cx='790' cy='700' r='20' fill='#cdd5c3' stroke='#aeb99f' stroke-width='2'/>`,
    // kitchen
    `<path d='M90 90H400V135H135V330H90Z' fill='${fur}' stroke='${line}' stroke-width='2'/><rect x='196' y='92' width='86' height='40' rx='8' fill='#fff' stroke='${line}' stroke-width='2'/><circle cx='318' cy='112' r='13' fill='none' stroke='#8d8678' stroke-width='2'/><circle cx='358' cy='112' r='13' fill='none' stroke='#8d8678' stroke-width='2'/><rect x='200' y='210' width='140' height='64' rx='10' fill='#fff' stroke='${line}' stroke-width='2'/>${chair(212, 290)}${chair(266, 290)}${chair(320, 290)}${label("KITCHEN", 270, 180)}`,
    // entrance
    `<rect x='90' y='400' width='36' height='170' rx='6' fill='${fur}' stroke='${line}' stroke-width='2'/><rect x='260' y='584' width='120' height='46' rx='8' fill='#fff' stroke='${line}' stroke-width='2'/>${label("ENTRANCE", 250, 470)}`,
    // living room
    `<rect x='520' y='90' width='240' height='34' rx='6' fill='${fur}' stroke='${line}' stroke-width='2'/><rect x='500' y='250' width='280' height='140' rx='14' fill='none' stroke='${line}' stroke-width='2' stroke-dasharray='8 7'/><rect x='560' y='292' width='160' height='58' rx='10' fill='#fff' stroke='${line}' stroke-width='2'/><path d='M470 420H770V490H550V540H470Z' fill='#fff' stroke='${line}' stroke-width='2' stroke-linejoin='round'/><rect x='490' y='436' width='260' height='36' rx='12' fill='${fur}'/><rect x='690' y='540' width='150' height='70' rx='12' fill='#fff' stroke='${line}' stroke-width='2'/>${chair(704, 506)}${chair(750, 506)}${chair(796, 506)}${label("LIVING ROOM", 630, 215)}`,
    // bedroom
    `<rect x='930' y='110' width='150' height='190' rx='12' fill='#fff' stroke='${line}' stroke-width='2'/><rect x='944' y='122' width='54' height='34' rx='10' fill='${fur}'/><rect x='1012' y='122' width='54' height='34' rx='10' fill='${fur}'/><rect x='892' y='116' width='30' height='34' rx='6' fill='${fur}'/><rect x='1088' y='116' width='26' height='34' rx='6' fill='${fur}'/><rect x='1094' y='200' width='20' height='190' rx='4' fill='${fur}' stroke='${line}' stroke-width='2'/>${label("BEDROOM", 990, 350)}`,
    // bathroom
    `<rect x='892' y='566' width='214' height='62' rx='14' fill='#fff' stroke='${line}' stroke-width='2'/><rect x='1050' y='420' width='56' height='40' rx='14' fill='#fff' stroke='${line}' stroke-width='2'/><rect x='892' y='420' width='64' height='36' rx='10' fill='#fff' stroke='${line}' stroke-width='2'/><circle cx='924' cy='438' r='9' fill='${fur}'/>${label("BATH", 990, 510)}`,
    // walls
    `<g fill='none' stroke='${wall}' stroke-linecap='square' stroke-width='14'><rect x='80' y='80' width='1040' height='560'/></g>`,
    `<g stroke='${wall}' stroke-width='8' stroke-linecap='square'><path d='M400 80V250M400 330V330M80 330H400M400 330V640M860 80V400M860 400H1120M860 470V640'/></g>`,
    // openings
    `<rect x='394' y='250' width='12' height='80' fill='#ece7dc'/>${door(400, 250, 80, 0)}`,
    `<rect x='854' y='400' width='12' height='70' fill='#e3e8e9'/><g transform='translate(860 470) rotate(-90)'><path d='M0 0h70' stroke='${wall}' stroke-width='4'/><path d='M0 0A70 70 0 0 0 70 -70' fill='none' stroke='${line}' stroke-width='2' stroke-dasharray='5 5'/></g>`,
    `<rect x='160' y='634' width='86' height='12' fill='#e6e0d3'/>${door(160, 640, 86, 0).replace("rotate(0)", "rotate(-90)").replace("translate(160 640)", "translate(160 640)")}`,
    win(150, 74, 190, 12),
    win(460, 74, 330, 12),
    win(946, 74, 130, 12),
    win(1114, 410, 12, 150),
    win(1114, 140, 12, 120),
    win(500, 634, 250, 12),
    win(74, 160, 12, 120),
    `<g fill='#4d4a43' ${FONT} font-size='15' font-weight='600'><text x='1110' y='782' text-anchor='end' fill='#8d8678'>Apartment 4B · 74 m²</text></g>`,
  ];
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>${parts.join("")}</svg>`;
}

/** A pair of headphones on a dark ground, 1200 by 900: a band, two cups, two cushions and a few controls. */
function headphones(): string {
  const cup = (x: number, flip: boolean) =>
    `<rect x='${x}' y='430' width='150' height='330' rx='70' fill='url(#cup)'/><rect x='${flip ? x - 62 : x + 140}' y='462' width='72' height='266' rx='36' fill='#2a2d31'/><rect x='${flip ? x - 62 : x + 140}' y='462' width='72' height='266' rx='36' fill='none' stroke='#454a50' stroke-width='3'/>`;
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'><defs>` +
    `<linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a2d31'/><stop offset='1' stop-color='#15171a'/></linearGradient>` +
    `<linearGradient id='cup' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#eceef0'/><stop offset='1' stop-color='#b4b9bd'/></linearGradient>` +
    `<radialGradient id='glow' cx='.5' cy='.45' r='.55'><stop offset='0' stop-color='#4a4f55' stop-opacity='.55'/><stop offset='1' stop-color='#4a4f55' stop-opacity='0'/></radialGradient>` +
    `<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .08'/></filter></defs>` +
    `<rect width='1200' height='900' fill='url(#bg)'/><rect width='1200' height='900' fill='url(#glow)'/>` +
    `<ellipse cx='600' cy='790' rx='380' ry='34' fill='#000' opacity='.4'/>` +
    `<path d='M250 480C250 130 950 130 950 480' fill='none' stroke='#8d9296' stroke-width='62' stroke-linecap='round'/><path d='M250 470C250 120 950 120 950 470' fill='none' stroke='#d6d9dc' stroke-width='50' stroke-linecap='round'/><path d='M250 462C250 112 950 112 950 462' fill='none' stroke='#f1f2f3' stroke-width='12' stroke-linecap='round' opacity='.8'/>` +
    `<rect x='312' y='318' width='576' height='10' rx='5' fill='#3a3e43' opacity='.0'/>` +
    cup(170, false) +
    cup(880, true) +
    `<circle cx='955' cy='540' r='15' fill='#2a2d31'/><circle cx='955' cy='588' r='15' fill='#2a2d31'/><rect x='941' y='640' width='28' height='12' rx='6' fill='#2a2d31'/><rect x='241' y='440' width='8' height='300' rx='4' fill='#fff' opacity='.35'/>` +
    `<rect width='1200' height='900' filter='url(#g)'/></svg>`
  );
}

const PLAN = uri(plan());
const HEADPHONES = uri(headphones());

const ROOMS: Hotspot[] = [
  { id: "kitchen", x: 21, y: 29, title: "Kitchen", body: "Handleless oak cabinets, an induction hob and an island that seats three. Fully fitted, with room for a dishwasher." },
  { id: "living", x: 51, y: 52, title: "Living room", body: "Five metres of glass facing the quay, with south light from ten in the morning. The floor is oak throughout." },
  { id: "bedroom", x: 83, y: 26, title: "Main bedroom", body: "A built-in wardrobe along the east wall and a door through to the bathroom." },
  { id: "bath", x: 82, y: 76, title: "Bathroom", body: "A bath with a rain shower over it, underfloor heating and a window onto the courtyard." },
  { id: "balcony", x: 60, y: 88, title: "Balcony", body: "Seven square metres with a hose tap and a power point, and room for a table for four." },
];

const PARTS: Hotspot[] = [
  { id: "band", x: 50, y: 21, title: "Memory-foam headband", body: "Spreads the weight across the crown, so a long flight stays comfortable." },
  { id: "cup", x: 21, y: 65, title: "Vegan-leather cushions", body: "Replaceable in a minute. A spare pair ships in the box." },
  { id: "controls", x: 80, y: 62, title: "Touch controls", body: "Swipe for volume, press for pause, hold to switch off noise cancelling." },
  { id: "port", x: 80, y: 80, title: "USB-C and a 3.5 mm jack", body: "Charges to 100% in two hours, and plays wired when the battery is flat." },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [part, setPart] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-14">
      <Example caption="A floor plan with showList: the same notes as a list for screen readers and small screens. Tab walks the numbers, Escape closes a note.">
        <HotspotImage src={PLAN} alt="Floor plan of apartment 4B: a kitchen and a living room along the front, a bedroom and a bathroom to the right, an entrance hall and a balcony." hotspots={ROOMS} showList caption="Apartment 4B, Halcyon Quay · 74 m²" />
      </Example>

      <Example caption="An annotated product shot. A note flips and shifts to stay on screen, and below 30rem of picture width it opens under the picture.">
        <div className="grid gap-3 sm:max-w-lg">
          <HotspotImage src={HEADPHONES} alt="Kestrel Over-ear headphones in graphite, seen from the front." hotspots={PARTS} ratio={4 / 3} activeId={part} onActiveChange={setPart} />
          <p role="status" className="text-xs text-muted-foreground">
            {part ? `Open: ${PARTS.find((spot) => spot.id === part)?.title}.` : "No note open."}
          </p>
        </div>
      </Example>
    </div>
  );
}
