import type { ReactNode } from "react";

import { ImageTile } from "@rhs-ui/primitives/image-tile";

/* The pictures are drawn as SVG, so the demo needs no files. Each one has a soft light, a little grain and, in the last
   two, an almost white sky: the scrim has to carry the text there. */
const SHADE = "<filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .09'/></filter>";
const art = (w: number, h: number, body: string): string =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><defs>${SHADE}</defs>${body}<rect width='${w}' height='${h}' filter='url(#g)'/></svg>`);
const stops = (id: string, a: string, b: string, vertical = true): string => `<linearGradient id='${id}' x1='0' y1='0' x2='${vertical ? 0 : 1}' y2='${vertical ? 1 : 0}'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient>`;

const LIGHTING = art(
  800,
  1000,
  `<defs>${stops("w", "#34302b", "#1d1a17")}<radialGradient id='l' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='#f7e7bf' stop-opacity='.85'/><stop offset='1' stop-color='#f7e7bf' stop-opacity='0'/></radialGradient></defs>` +
    "<rect width='800' height='1000' fill='url(#w)'/><circle cx='400' cy='520' r='330' fill='url(#l)'/>" +
    "<path d='M400 0V250' stroke='#8d8478' stroke-width='3'/><path d='M268 440C268 330 330 258 400 258S532 330 532 440Z' fill='#ebe3d3'/><path d='M268 440H532' stroke='#bdb3a1' stroke-width='6'/><ellipse cx='400' cy='446' rx='92' ry='14' fill='#fff4d6'/>" +
    "<rect y='820' width='800' height='180' fill='#14120f'/><ellipse cx='400' cy='830' rx='300' ry='26' fill='#f7e7bf' opacity='.16'/><rect x='260' y='736' width='280' height='16' rx='8' fill='#3d3731'/><rect x='300' y='752' width='10' height='70' fill='#3d3731'/><rect x='490' y='752' width='10' height='70' fill='#3d3731'/>",
);
const CERAMICS = art(
  800,
  1000,
  `<defs>${stops("w", "#f4eee4", "#e9e1d3")}</defs><rect width='800' height='1000' fill='url(#w)'/>` +
    "<rect y='700' width='800' height='300' fill='#e2d9c8'/><rect y='694' width='800' height='10' fill='#d3c8b3'/>" +
    "<ellipse cx='400' cy='700' rx='300' ry='16' fill='#b8ab94' opacity='.5'/>" +
    "<path d='M214 700C148 700 130 610 150 540C165 486 198 462 214 430V380H274V430C290 462 323 486 338 540C358 610 340 700 274 700Z' fill='#c9b9a0'/><path d='M214 700C148 700 130 610 150 540C158 512 170 494 182 478C170 540 176 640 214 700Z' fill='#b3a187' opacity='.6'/>" +
    "<path d='M396 700V300C396 270 410 250 440 250S484 270 484 300V700Z' fill='#a99478'/><rect x='396' y='250' width='88' height='12' rx='6' fill='#8f7b60'/><path d='M396 700V300C396 270 410 250 424 250C412 300 410 560 424 700Z' fill='#bfae93' opacity='.55'/>" +
    "<path d='M560 700C548 700 540 676 544 646H692C696 676 688 700 676 700Z' fill='#ece5d8'/><ellipse cx='618' cy='646' rx='74' ry='14' fill='#fbf8f1'/><ellipse cx='618' cy='648' rx='60' ry='9' fill='#d9cfbd'/>" +
    "<circle cx='610' cy='150' r='90' fill='#fffaf0' opacity='.7'/>",
);
const TEXTILES = art(
  800,
  1000,
  `<defs>${stops("a", "#d6cdbc", "#b3a893")}${stops("b", "#c2b8a3", "#968a74")}${stops("c", "#e5ded0", "#c9bfab")}</defs><rect width='800' height='1000' fill='url(#a)'/>` +
    [0, 1, 2, 3, 4, 5]
      .map((i) => {
        const x = -60 + i * 160;
        return `<path d='M${x} -20C${x + 90} 220 ${x - 60} 520 ${x + 70} 1020H${x + 210}C${x + 100} 520 ${x + 250} 240 ${x + 150} -20Z' fill='url(#${i % 3 === 0 ? "c" : i % 3 === 1 ? "b" : "a"})' opacity='${i % 2 ? 0.92 : 0.8}'/>`;
      })
      .join("") +
    "<path d='M0 860C160 820 300 880 460 850S700 820 800 860V1000H0Z' fill='#7e735f' opacity='.28'/>",
);
const FURNITURE = art(
  800,
  1000,
  `<defs>${stops("w", "#dedad2", "#cfcac0")}${stops("f", "#bdb7aa", "#a49d8f")}<linearGradient id='s' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#f8f4ea' stop-opacity='.9'/><stop offset='1' stop-color='#f8f4ea' stop-opacity='.2'/></linearGradient></defs>` +
    "<rect width='800' height='1000' fill='url(#w)'/><rect y='640' width='800' height='360' fill='url(#f)'/><rect x='470' y='110' width='250' height='360' rx='4' fill='#f3efe4'/><path d='M470 110H720V470H470Z' fill='url(#s)'/><path d='M595 110V470M470 290H720' stroke='#cfc9bb' stroke-width='6'/>" +
    "<path d='M470 640L420 1000H760L720 640Z' fill='#f3efe4' opacity='.22'/>" +
    "<ellipse cx='330' cy='820' rx='230' ry='22' fill='#3b342b' opacity='.28'/>" +
    "<rect x='190' y='560' width='42' height='240' rx='14' fill='#4a3b2d'/><rect x='428' y='560' width='42' height='240' rx='14' fill='#4a3b2d'/>" +
    "<rect x='170' y='470' width='320' height='56' rx='22' fill='#8c8576'/><rect x='150' y='400' width='70' height='150' rx='28' fill='#7b7465'/><rect x='146' y='520' width='350' height='54' rx='26' fill='#9b9484'/><rect x='170' y='574' width='300' height='14' rx='7' fill='#4a3b2d'/>",
);
const LISBON = art(
  1280,
  720,
  `<defs>${stops("s", "#f6efe3", "#e1c3a4")}${stops("r", "#c9b49d", "#9a8a79")}</defs><rect width='1280' height='720' fill='url(#s)'/><circle cx='900' cy='360' r='120' fill='#fff7e8' opacity='.85'/>` +
    "<path d='M0 520C140 470 260 480 380 450S640 430 760 460S1040 500 1280 440V720H0Z' fill='#cdb79c'/>" +
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      .map((i) => `<rect x='${40 + i * 104}' y='${470 - ((i * 53) % 90)}' width='${70 + ((i * 37) % 34)}' height='${200 + ((i * 53) % 90)}' fill='${i % 2 ? "#a8927a" : "#bba48b"}'/><rect x='${60 + i * 104}' y='${492 - ((i * 53) % 90)}' width='12' height='18' fill='#7d6c5a' opacity='.55'/>`)
      .join("") +
    "<rect y='610' width='1280' height='110' fill='url(#r)'/><path d='M0 640H1280M0 676H1280' stroke='#f4ead9' stroke-width='3' opacity='.5'/>",
);
const KYOTO = art(
  1280,
  720,
  `<defs>${stops("s", "#eef0ee", "#d3d9d6")}${stops("m1", "#a9b5b3", "#cfd6d3")}${stops("m2", "#8d9b99", "#b9c3c0")}${stops("m3", "#6c7c7b", "#8f9d9b")}</defs><rect width='1280' height='720' fill='url(#s)'/>` +
    "<path d='M0 430C140 340 230 360 330 300S520 250 640 330S880 380 1000 300S1180 320 1280 360V720H0Z' fill='url(#m1)'/>" +
    "<path d='M0 520C160 450 300 470 440 430S720 420 860 470S1140 480 1280 440V720H0Z' fill='url(#m2)'/>" +
    "<path d='M560 520L640 470L720 520ZM585 520H695V560H585ZM548 560H732L720 552H560Z' fill='#4f5f5e'/><path d='M610 470L640 430L670 470Z' fill='#4f5f5e'/><rect x='636' y='410' width='8' height='24' fill='#4f5f5e'/>" +
    "<path d='M0 600C200 560 380 590 560 580S980 570 1280 600V720H0Z' fill='url(#m3)'/><rect y='560' width='1280' height='60' fill='#eef0ee' opacity='.34'/>",
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
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-12">
      <Example caption="Four categories in one ratio: the text sits on a soft scrim at the bottom, the arrow nudges on hover.">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <ImageTile href="#lighting" src={LIGHTING} title="Lighting" meta="128 products" ratio={4 / 5} priority />
          <ImageTile href="#ceramics" src={CERAMICS} title="Ceramics, bright on purpose" meta="64 products" ratio={4 / 5} />
          <ImageTile href="#textiles" src={TEXTILES} title="Textiles" meta="212 products" ratio={4 / 5} />
          <ImageTile href="#furniture" src={FURNITURE} title="Furniture for slow evenings and long dinners at home" meta="39 products" ratio={4 / 5} />
        </div>
      </Example>

      <Example caption='align="center" on a wide ratio: a dim that is deepest behind the text, so even a pale sky stays readable.'>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <ImageTile href="#lisbon" src={LISBON} title="Lisbon" meta="Four nights from €480" ratio={16 / 9} align="center" />
          <ImageTile href="#kyoto" src={KYOTO} title="Kyoto" meta="Six nights from €920" ratio={16 / 9} align="center" />
        </div>
      </Example>
    </div>
  );
}
