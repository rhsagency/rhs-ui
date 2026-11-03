"use client";

import { useState } from "react";

import { DonationHero, type DonationFrequency, type DonationGift } from "@rhs-ui/marketing/donation-hero";

/* The pictures are drawn for the demo, so they need no files. In your site: a photograph of the people or place the gift reaches. */

const lamp = (x: number, drop: number) =>
  `<path d='M${x - 34} ${drop + 52}L${x - 120} ${drop + 340}H${x + 120}L${x + 34} ${drop + 52}Z' fill='#fff3d1' opacity='.2'/>` +
  `<path d='M${x} 0V${drop}' stroke='#2f3338' stroke-width='3'/>` +
  `<path d='M${x - 42} ${drop + 44}a42 42 0 0 1 84 0z' fill='#2f3338'/>` +
  `<ellipse cx='${x}' cy='${drop + 47}' rx='24' ry='7' fill='#ffe9a8'/>`;

const bowl = (x: number) =>
  `<path d='M${x - 36} 438h72c0 22-14 32-36 32s-36-10-36-32z' fill='#f6f1e7'/>` +
  `<ellipse cx='${x}' cy='438' rx='36' ry='7' fill='#d8a23f' stroke='#e6dcc8' stroke-width='3'/>` +
  `<path d='M${x - 7} 424c-9-9 9-16 0-27' stroke='#fffaf0' stroke-width='5' stroke-linecap='round' fill='none' opacity='.8'/>`;

const person = (x: number, head: number, skin: string, hair: string, top: string, s = 1) =>
  `<path d='M${x - 74 * s} 470V${head + 82 * s}Q${x - 74 * s} ${head + 52 * s} ${x - 30 * s} ${head + 48 * s}H${x + 30 * s}Q${x + 74 * s} ${head + 52 * s} ${x + 74 * s} ${head + 82 * s}V470Z' fill='${top}'/>` +
  `<rect x='${x - 13 * s}' y='${head + 28 * s}' width='${26 * s}' height='${28 * s}' rx='8' fill='${skin}'/>` +
  `<circle cx='${x}' cy='${head}' r='${41 * s}' fill='${skin}'/>` +
  `<path d='M${x - 42 * s} ${head + 2 * s}a${42 * s} ${42 * s} 0 0 1 ${84 * s} 0c-${15 * s}-${20 * s}-${30 * s}-${27 * s}-${42 * s}-${27 * s}s-${27 * s} 7-${42 * s} ${27 * s}z' fill='${hair}'/>`;

const flake = (x: number, y: number, r = 3) => `<circle cx='${x}' cy='${y}' r='${r}' fill='#fff' opacity='.85'/>`;

const meal = (() => {
  const art = [
    `<rect width='800' height='800' fill='#e7dfcf'/>`,
    // The window: a winter night outside, the kitchen warm in front of it.
    `<path d='M330 330V190a70 70 0 0 1 140 0V330Z' fill='#2b4655'/>`,
    [flake(352, 160), flake(388, 140, 2.5), flake(430, 176), flake(452, 150, 2.5), flake(365, 236), flake(410, 214, 2.5), flake(446, 258), flake(350, 296, 2.5), flake(398, 280), flake(440, 310, 2.5)].join(""),
    `<path d='M400 120V330M330 218H470' stroke='#e7dfcf' stroke-width='7'/>`,
    `<path d='M330 330V190a70 70 0 0 1 140 0V330Z' fill='none' stroke='#cdc1a9' stroke-width='10'/>`,
    `<rect x='316' y='330' width='168' height='13' rx='4' fill='#cdc1a9'/>`,
    lamp(190, 60),
    lamp(590, 36),
    // Everyone sits between x=100 and x=700: a card crops the picture to its sides (an 800 wide picture loses about 80 on each at 4:5), and a child at the edge would be cut in half.
    person(205, 335, "#c98f6b", "#2b2320", "#7a8a6a"),
    person(540, 328, "#e3b896", "#7a5a3a", "#b5614b"),
    person(640, 380, "#d7a37e", "#1f1a18", "#d9b45a", 0.78),
    // The pot, with its steam rising over the window.
    `<path d='M393 346c-14-20 14-34 0-56M419 344c-14-20 14-34 0-56M367 350c-10-14 10-26 0-42' stroke='#fffaf0' stroke-width='9' stroke-linecap='round' fill='none' opacity='.92'/>`,
    `<rect x='299' y='398' width='30' height='12' rx='6' fill='#23272b'/><rect x='471' y='398' width='30' height='12' rx='6' fill='#23272b'/>`,
    `<path d='M325 384h150v56a30 30 0 0 1-30 30h-90a30 30 0 0 1-30-30z' fill='#30353a'/>`,
    `<rect x='336' y='398' width='10' height='56' rx='5' fill='#fff' opacity='.12'/>`,
    `<rect x='317' y='370' width='166' height='17' rx='8.5' fill='#444a51'/><rect x='388' y='356' width='24' height='16' rx='6' fill='#444a51'/>`,
    bowl(250),
    bowl(520),
    bowl(140),
    // A loaf and a glass.
    `<rect x='566' y='462' width='96' height='8' rx='3' fill='#8a5f3a'/><ellipse cx='614' cy='452' rx='44' ry='17' fill='#cf9a5c'/><path d='M592 440l8 24M614 436l8 26M636 440l8 24' stroke='#b57a3c' stroke-width='4' stroke-linecap='round'/>`,
    `<path d='M670 428h30l-4 42h-22z' fill='#dce8ea' opacity='.85'/><path d='M672 446h26l-2 24h-22z' fill='#bcd3d8' opacity='.8'/>`,
    // The table.
    `<rect y='470' width='800' height='30' fill='#a77449'/><rect y='470' width='800' height='5' fill='#c28f61'/>`,
    `<rect y='500' width='800' height='300' fill='#7f5535'/><path d='M200 500V800M400 500V800M600 500V800' stroke='#70492d' stroke-width='4'/>`,
  ].join("");
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'>${art}</svg>`);
})();

const books = (() => {
  const palette = ["#b5523b", "#345c61", "#d6a84a", "#4f6d9a", "#8a6a4a", "#5f8a4a", "#a8473f", "#2f3f55", "#c98f3a", "#6d8f8a"];
  let art = `<rect width='800' height='800' fill='#e9e5dc'/>`;
  art += `<rect x='96' y='72' width='608' height='664' rx='10' fill='#a7805a'/><rect x='116' y='92' width='568' height='624' rx='4' fill='#d9cdb8'/>`;
  for (let row = 0; row < 4; row += 1) {
    const base = 224 + row * 156;
    let x = 128;
    for (let index = 0; x < 640; index += 1) {
      const width = 22 + ((index * 7 + row * 5) % 5) * 5;
      const height = 84 + ((index * 11 + row * 3) % 6) * 11;
      // A gap now and then, and one book leaning on its neighbours.
      if ((index + row * 2) % 9 === 8) {
        art += `<path d='M${x} ${base}l${width * 0.4} -${height}l${width} 6l-${width * 0.4} ${height - 6}z' fill='${palette[(index + row) % palette.length]}'/>`;
        x += width + 18;
        continue;
      }
      art += `<rect x='${x}' y='${base - height}' width='${width}' height='${height}' rx='2' fill='${palette[(index * 3 + row) % palette.length]}'/>`;
      art += `<rect x='${x + 4}' y='${base - height + 12}' width='${width - 8}' height='4' rx='2' fill='#fff' opacity='.5'/>`;
      x += width + 2;
    }
    art += `<rect x='116' y='${base}' width='568' height='14' fill='#a7805a'/>`;
  }
  // A globe on the top shelf and a plant on the shelf under it.
  art += `<circle cx='620' cy='150' r='46' fill='#4f6d9a'/><path d='M590 130c14-12 30-4 36 8-10 10-6 24-22 28-10-8-22-20-14-36zM634 168c10-6 22 0 22 12-8 6-18 4-22-12z' fill='#8aa66f'/><rect x='612' y='194' width='16' height='20' fill='#2f3338'/><rect x='596' y='210' width='48' height='8' rx='3' fill='#2f3338'/>`;
  art += `<path d='M600 380c-18-26-8-44 6-54 4 22 8 34-6 54zM612 380c-6-30 12-44 30-48-2 24-10 38-30 48zM596 380c-24-12-30-30-24-46 20 8 28 22 24 46z' fill='#5f8a4a'/><path d='M584 380h56l-6 34h-44z' fill='#c4704f'/>`;
  art += `<rect x='96' y='736' width='608' height='64' fill='#b69a77'/>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'>${art}</svg>`);
})();

/** What a gift buys at Open Table, as the end of a sentence: ten meals feed a family for a week and one costs 2.50. */
function mealsFor(amount: number, frequency: DonationFrequency): string {
  const every = frequency === "monthly" ? ", every month" : "";
  if (amount < 2500) return `pays for ${Math.max(1, Math.round(amount / 250))} hot meals${every}`;
  if (amount >= 10000) return `pays for a month of meals for a family${every}`;
  const weeks = Math.floor(amount / 2500);
  return weeks === 1 ? `pays for a week of meals for a family${every}` : `pays for ${weeks} weeks of meals for a family${every}`;
}

function booksFor(amount: number, frequency: DonationFrequency): string {
  const count = Math.max(1, Math.floor(amount / 500));
  return `buys ${count} ${count === 1 ? "book" : "books"} for a classroom${frequency === "monthly" ? ", every month" : ""}`;
}

export default function Demo(): React.JSX.Element {
  const [first, setFirst] = useState<DonationGift | null>(null);
  const [second, setSecond] = useState<DonationGift | null>(null);
  // onDonate hands the choice to your app. Here it only says what it received, so the press can be seen.
  const said = (gift: DonationGift | null) =>
    gift ? `Handed to your app: ${gift.amount / 100} ${gift.currency}, ${gift.frequency}. This is where your checkout starts.` : "";

  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Monthly by default, with a campaign meter. The picture changes with every choice.</p>
      <DonationHero
        className="py-8 sm:py-10"
        eyebrow="Winter appeal 2026"
        title="Warm meals for every winter night"
        description="Open Table serves 1,400 hot meals a week across the city. Your gift keeps the kitchens open until spring."
        currency="EUR"
        minimum={500}
        defaultFrequency="monthly"
        impactFor={mealsFor}
        campaign={{ raised: 4_120_000, goal: 6_000_000, donors: 1284 }}
        image={{ src: meal, alt: "", width: 800, height: 800 }}
        note="Secure payment. Cancel a monthly gift at any time. Open Table is a registered charity, so gifts are tax-deductible."
        onDonate={setFirst}
      />
      <p role="status" className="min-h-4 text-xs text-foreground">
        {said(first)}
      </p>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">In dollars, with no campaign. An own amount under the minimum says so in words and the button waits.</p>
      <DonationHero
        className="py-8 sm:py-10"
        title="Books for every classroom"
        description="Choose a gift and the Kestrel Reading Fund sends books to a school that has none."
        amounts={[1500, 3000, 6000, 12000]}
        defaultAmount={300}
        currency="USD"
        minimum={500}
        impactFor={booksFor}
        image={{ src: books, alt: "", width: 800, height: 800 }}
        note="Gifts of any size are matched until the end of the year."
        onDonate={setSecond}
      />
      <p role="status" className="min-h-4 text-xs text-foreground">
        {said(second)}
      </p>
    </div>
  );
}
