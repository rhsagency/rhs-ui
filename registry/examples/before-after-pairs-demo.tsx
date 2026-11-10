import { BeforeAfterPairs } from "@rhs-ui/marketing/before-after-pairs";

/** Pictures drawn for the demo, 4:3. In your page: photographs taken from the same spot before and after the work. */
const scene = (body: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 480'>${body}</svg>`);

/** Rows of tile lines: a path of horizontal and vertical hairlines over a rectangle. */
const grid = (x: number, y: number, w: number, h: number, step: number, stroke: string): string => {
  const lines: string[] = [];
  for (let i = step; i < h; i += step) lines.push(`M${x} ${y + i}H${x + w}`);
  for (let i = step; i < w; i += step) lines.push(`M${x + i} ${y}V${y + h}`);
  return `<path d='${lines.join("")}' stroke='${stroke}' stroke-width='2' fill='none'/>`;
};

/** Horizontal lines only, for tiles laid in a stack. */
const rows = (y: number, h: number, step: number, stroke: string): string => {
  const lines: string[] = [];
  for (let i = step; i < h; i += step) lines.push(`M0 ${y + i}H640`);
  return `<path d='${lines.join("")}' stroke='${stroke}' stroke-width='2' fill='none'/>`;
};

function kitchen(after: boolean): string {
  if (!after) {
    const doors = [30, 176, 324, 470].map((x) => `<rect x='${x}' y='60' width='140' height='130' rx='3' fill='#6a4a33'/><rect x='${x + 14}' y='74' width='112' height='102' fill='none' stroke='#82603f' stroke-width='4'/><circle cx='${x + 124}' cy='170' r='5' fill='#d3c08f'/>`).join("");
    const base = [0, 160, 320, 480].map((x) => `<rect x='${x + 6}' y='326' width='148' height='58' fill='none' stroke='#82603f' stroke-width='4'/><circle cx='${x + 140}' cy='338' r='5' fill='#d3c08f'/>`).join("");
    return scene(
      `<rect width='640' height='480' fill='#cdbf9b'/><rect y='388' width='640' height='92' fill='#8b7f66'/><path d='M0 388H640M0 432H640M96 388L56 480M224 388L206 480M352 388V480M480 388L498 480M608 388L648 480' stroke='#6f6550' stroke-width='3'/>` +
        `${doors}<rect y='190' width='640' height='102' fill='#b8ac88'/>${grid(0, 190, 640, 102, 34, "#a4986f")}<rect y='292' width='640' height='22' fill='#7d7358'/><rect y='314' width='640' height='74' fill='#6a4a33'/>${base}` +
        `<circle cx='320' cy='34' r='5' fill='#3d3a31'/><path d='M320 0V34' stroke='#3d3a31' stroke-width='3'/><path d='M300 54a20 20 0 0 1 40 0z' fill='#e6dcb5'/>`,
    );
  }
  const slabs = [30, 440].map((x) => `<rect x='${x}' y='58' width='170' height='138' rx='4' fill='#f8f6f1'/><path d='M${x} 196H${x + 170}' stroke='#d4cfc2' stroke-width='3'/>`).join("");
  const bases = [0, 1, 2, 3].map((i) => `<rect x='${i * 160 + 148}' y='330' width='4' height='30' rx='2' fill='#e4dfd2'/><path d='M${(i + 1) * 160} 315V392' stroke='#6c7b69' stroke-width='3'/>`).join("");
  return scene(
    `<rect width='640' height='480' fill='#eeeae2'/><rect y='392' width='640' height='88' fill='#c9a47a'/><path d='M0 422H640M0 452H640M110 392V422M300 422V452M420 392V422M210 452V480M520 422V452' stroke='#b58f63' stroke-width='3'/>` +
      `<rect x='220' y='58' width='200' height='138' fill='#2b2b2b'/><rect x='229' y='67' width='182' height='120' fill='#d9e6ec'/><circle cx='282' cy='158' r='34' fill='#b9cdb5'/><circle cx='352' cy='170' r='26' fill='#a7c0a5'/><path d='M320 67V187M229 127H411' stroke='#2b2b2b' stroke-width='5'/>` +
      `${slabs}<rect y='196' width='640' height='98' fill='#f4f1ea'/>${rows(196, 98, 24, "#e2ddd1")}<rect y='294' width='640' height='18' fill='#d8d3c8'/><rect y='312' width='640' height='3' fill='#bdb6a7'/><rect y='315' width='640' height='77' fill='#7f8f7c'/>${bases}` +
      `<rect x='64' y='262' width='34' height='32' rx='4' fill='#c4714b'/><ellipse cx='81' cy='248' rx='24' ry='18' fill='#6f8265'/><ellipse cx='94' cy='240' rx='14' ry='20' fill='#8a9a7b'/><path d='M500 294a30 30 0 0 1 60 0z' fill='#efe9dd'/><path d='M360 0V40' stroke='#2b2b2b' stroke-width='3'/><path d='M336 62a24 24 0 0 1 48 0z' fill='#2b2b2b'/>`,
  );
}

function garden(after: boolean): string {
  if (!after) {
    const boards = Array.from({ length: 14 }, (_, i) => `<rect x='${i * 48 - 6}' y='${150 + (i % 3) * 5}' width='40' height='${120 - (i % 4) * 6}' fill='${i % 2 ? "#9a8967" : "#8c7c5c"}' transform='rotate(${(i % 5) - 2} ${i * 48 + 14} 270)'/>`).join("");
    const weeds = [90, 200, 310, 430, 540].map((x, i) => `<path d='M${x} ${360 + i * 12}l6-26 6 26 7-20 5 20z' fill='#5f6e3c'/>`).join("");
    return scene(
      `<rect width='640' height='480' fill='#d9e2e4'/>${boards}<rect y='262' width='640' height='218' fill='#8a8a5a'/><ellipse cx='150' cy='380' rx='110' ry='28' fill='#a8956a'/><ellipse cx='470' cy='350' rx='90' ry='22' fill='#a8956a'/><ellipse cx='330' cy='440' rx='150' ry='26' fill='#9b8a60'/>` +
        `${weeds}<rect x='250' y='316' width='140' height='24' fill='#b4aa98'/><path d='M290 316l12 24M340 316l-8 24' stroke='#8b8272' stroke-width='3'/><circle cx='560' cy='300' r='26' fill='#6b7451'/>`,
    );
  }
  const slats = Array.from({ length: 22 }, (_, i) => `<rect x='${i * 30}' y='150' width='24' height='125' fill='#4a4f4c'/>`).join("");
  const stripes = Array.from({ length: 6 }, (_, i) => `<rect y='${280 + i * 34}' width='640' height='17' fill='#86a871' opacity='.6'/>`).join("");
  const shrubs = [40, 120, 210, 430, 520, 600].map((x, i) => `<circle cx='${x}' cy='${272 - (i % 2) * 6}' r='${30 + (i % 3) * 5}' fill='${i % 2 ? "#5d7d55" : "#7a9a68"}'/>`).join("");
  const flowers = [60, 150, 450, 540, 590].map((x, i) => `<circle cx='${x}' cy='${284 + (i % 2) * 8}' r='5' fill='#ece0b8'/>`).join("");
  return scene(
    `<rect width='640' height='480' fill='#dfeaed'/>${slats}<rect y='272' width='640' height='208' fill='#7fa06a'/>${stripes}<path d='M250 480L290 285h60l40 195z' fill='#d8d1c4'/><path d='M270 400h100M280 352h80M288 316h64' stroke='#c2baa9' stroke-width='3'/>` +
      `${shrubs}${flowers}<rect x='456' y='368' width='110' height='14' rx='3' fill='#b48a62'/><path d='M468 382v32M554 382v32' stroke='#8d6b49' stroke-width='6'/><rect x='456' y='344' width='110' height='10' rx='3' fill='#b48a62'/>`,
  );
}

function livingRoom(after: boolean): string {
  if (!after) {
    return scene(
      `<rect width='640' height='480' fill='#c8c5be'/><rect y='372' width='640' height='108' fill='#a99f90'/><path d='M0 372H640' stroke='#8d8576' stroke-width='4'/><path d='M0 410H640M0 450H640' stroke='#978e7e' stroke-width='2'/>` +
        `<rect x='400' y='70' width='170' height='170' fill='#e0ddd5' stroke='#a8a398' stroke-width='6'/><path d='M400 100H570M400 130H570M400 160H570M400 190H570M400 220H570' stroke='#c4c0b6' stroke-width='5'/>` +
        `<path d='M180 0V120' stroke='#4a4740' stroke-width='3'/><circle cx='180' cy='128' r='11' fill='#efe3b4'/><path d='M60 250c20 30 40 18 50 52 8 24-4 40 6 60l-34 6z' fill='#b6b2a8'/>` +
        `<rect x='70' y='284' width='240' height='92' rx='10' fill='#7a7467'/><rect x='56' y='268' width='60' height='108' rx='10' fill='#6c665a'/><rect x='264' y='268' width='60' height='108' rx='10' fill='#6c665a'/><rect x='60' y='376' width='8' height='14' fill='#3f3b33'/><rect x='312' y='376' width='8' height='14' fill='#3f3b33'/>`,
    );
  }
  return scene(
    `<rect width='640' height='480' fill='#e7ddcc'/><rect y='372' width='640' height='108' fill='#c9a47a'/><path d='M0 372H640' stroke='#b58f63' stroke-width='4'/><path d='M0 410H640M0 450H640M120 372V410M340 410V450M520 372V410M220 450V480' stroke='#b58f63' stroke-width='2'/>` +
      `<rect x='380' y='62' width='200' height='190' fill='#d9e6ec'/><path d='M480 62V252M380 157H580' stroke='#2b2b2b' stroke-width='6'/><rect x='374' y='56' width='212' height='202' fill='none' stroke='#2b2b2b' stroke-width='8'/>` +
      `<path d='M350 50h50v230h-50zM560 50h50v230h-50z' fill='#f4efe6' opacity='.9'/>` +
      `<rect x='120' y='94' width='140' height='100' fill='#3b3b39'/><rect x='130' y='104' width='120' height='80' fill='#e9e1d1'/><circle cx='190' cy='144' r='26' fill='#c4714b'/><path d='M130 184l44-28 36 20 40-30v38z' fill='#8a9a7b'/>` +
      `<ellipse cx='260' cy='418' rx='210' ry='34' fill='#d9cfbe'/><path d='M80 418h360' stroke='#c9bda6' stroke-width='4'/>` +
      `<rect x='64' y='280' width='252' height='98' rx='14' fill='#6e7a74'/><rect x='50' y='262' width='64' height='116' rx='14' fill='#5f6a65'/><rect x='266' y='262' width='64' height='116' rx='14' fill='#5f6a65'/><rect x='130' y='258' width='70' height='62' rx='10' fill='#efe8da'/><rect x='214' y='262' width='62' height='58' rx='10' fill='#c9ad8f'/>` +
      `<path d='M560 372V210' stroke='#2b2b2b' stroke-width='5'/><path d='M532 214a28 28 0 0 1 56 0z' fill='#2b2b2b'/><rect x='538' y='368' width='44' height='8' rx='3' fill='#2b2b2b'/>`,
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <BeforeAfterPairs
        title="Results you can see"
        description="Three recent projects, photographed from the same spot before the work began and after the last day."
        pairs={[
          {
            id: "kitchen",
            before: { src: kitchen(false), alt: "The kitchen before: dark wood cabinets, beige tiles and a worn vinyl floor." },
            after: { src: kitchen(true), alt: "The kitchen after: white and sage cabinets, a stone worktop, a large window and an oak floor." },
            caption: "Kitchen, Utrecht",
            timeframe: "6 weeks",
            details: ["Oak floor with under-floor heating", "Handleless cabinets in sage and white", "Stone worktop and stacked tile backsplash", "A larger window and new lighting"],
          },
          {
            id: "garden",
            before: { src: garden(false), alt: "The garden before: patchy lawn, bare earth, weeds and a leaning wooden fence." },
            after: { src: garden(true), alt: "The garden after: even lawn, a paved path, planted borders and a charcoal fence." },
            caption: "Back garden, Haarlem",
            timeframe: "3 weeks",
            details: ["New turf, levelled and drained", "A path in reclaimed pavers", "Planted borders along the fence", "Charcoal fence panels and a bench"],
          },
          {
            id: "living-room",
            before: { src: livingRoom(false), alt: "The living room before: grey walls, a bare bulb, venetian blinds and a worn sofa." },
            after: { src: livingRoom(true), alt: "The living room after: warm plaster walls, an oak floor, a rug, tall curtains and a floor lamp." },
            caption: "Living room, Leiden",
            timeframe: "2 weeks",
            details: ["Walls replastered and painted", "Oak flooring throughout", "Lighting on three circuits"],
          },
        ]}
      />
    </div>
  );
}
