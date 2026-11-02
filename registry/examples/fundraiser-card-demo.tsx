"use client";

import { useState, type ReactNode } from "react";

import { FundraiserCard } from "@rhs-ui/application/fundraiser-card";

// A fixed "now" keeps the days left the same on every load. In an app, leave `now` out and the card reads the browser's clock.
const NOW = Date.parse("2026-11-02T09:30:00+01:00");

/** Pictures drawn in flat shapes, so the demo needs no files. Use real photographs in an app. */
const scene = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'>${body}</svg>`);

const PLAYGROUND = scene(
  `<rect width='800' height='450' fill='#dfe5e2'/><circle cx='648' cy='92' r='44' fill='#f2eddd'/>` +
    `<rect y='326' width='800' height='124' fill='#b7c4a8'/><path d='M0 326q200-34 400 0t400 0v18H0z' fill='#a6b696'/>` +
    `<g stroke='#4a4e55' stroke-width='13' stroke-linecap='round' fill='none'><path d='M168 142H492M168 142l-44 206M168 142l50 206M492 142l-44 206M492 142l50 206'/></g>` +
    `<g stroke='#6b7078' stroke-width='4'><path d='M262 142v128M300 142v128M392 142v128M430 142v128'/></g>` +
    `<rect x='254' y='268' width='54' height='11' rx='4' fill='#b4634a'/><rect x='384' y='268' width='54' height='11' rx='4' fill='#b4634a'/>` +
    `<rect x='596' y='196' width='76' height='150' fill='#8c8473'/><rect x='588' y='188' width='92' height='12' fill='#6f6a5d'/>` +
    `<path d='M672 212l92 128h-40l-76-100z' fill='#ece6d6'/><path d='M596 196v-48l38 20z' fill='#b4634a'/>`,
);

const COATS = scene(
  `<rect width='800' height='450' fill='#e6e0d4'/><rect y='392' width='800' height='58' fill='#d4ccbc'/>` +
    `<rect x='70' y='104' width='660' height='12' rx='6' fill='#4a4e55'/><rect x='70' y='104' width='12' height='300' rx='4' fill='#4a4e55'/><rect x='718' y='104' width='12' height='300' rx='4' fill='#4a4e55'/>` +
    ["#2f3a46", "#8a6f5a", "#5d7260", "#b4a590", "#3d3d3d", "#7a8793"]
      .map((ink, i) => {
        const x = 150 + i * 100;
        return `<path d='M${x} 116v22' stroke='#4a4e55' stroke-width='5'/><path d='M${x - 38} 144q38 -16 76 0l22 214h-120z' fill='${ink}'/><path d='M${x - 10} 148l10 26 10 -26z' fill='#e6e0d4' opacity='.6'/><path d='M${x} 174v184' stroke='#000' stroke-opacity='.18' stroke-width='3'/>`;
      })
      .join(""),
);

const CHURCH = scene(
  `<rect width='800' height='450' fill='#d6dde2'/><rect y='352' width='800' height='98' fill='#aab39f'/>` +
    `<rect x='214' y='226' width='372' height='132' fill='#cbc1af'/><path d='M190 236L400 124l210 112z' fill='#7a5f52'/>` +
    `<g fill='#8e7365'><rect x='260' y='196' width='36' height='22'/><rect x='470' y='210' width='36' height='22'/><rect x='330' y='160' width='36' height='22'/></g>` +
    `<rect x='356' y='96' width='88' height='134' fill='#d8cfbd'/><path d='M346 100L400 22l54 78z' fill='#6b4f43'/><path d='M400 6v26M388 16h24' stroke='#3a3a3a' stroke-width='4'/>` +
    `<path d='M376 358v-52a24 24 0 0 1 48 0v52z' fill='#4a4e55'/><rect x='252' y='270' width='34' height='54' rx='17' fill='#aebcc6'/><rect x='514' y='270' width='34' height='54' rx='17' fill='#aebcc6'/>`,
);

/** A head and shoulders, drawn in flat shapes. Use real photos in an app. */
const portrait = (ground: string, ink: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'><rect width='72' height='72' fill='${ground}'/><circle cx='36' cy='28' r='12' fill='${ink}'/><path d='M12 72c1-15 11-24 24-24s23 9 24 24z' fill='${ink}'/></svg>`);

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const ZONE = { now: NOW, locale: "en-GB", timeZone: "Europe/Amsterdam" } as const;

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  const donate = (name: string) => () => setNote(`Opening the donation form for ${name}.`);

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="In progress: the money in text, then the bar.">
        <FundraiserCard
          title="Rebuild the Maple Street playground"
          image={PLAYGROUND}
          summary="The storm took the swings and the old slide. We are raising the money to put in safe, new equipment before winter."
          raised={4820}
          goal={10000}
          donors={112}
          endsAt="2026-11-14T23:59:00+01:00"
          organiser={{ name: "Amira Haddad", image: portrait("#e5e2dc", "#a39d91") }}
          onDonate={donate("the Maple Street playground")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Goal reached: it says so and keeps accepting gifts.">
        <FundraiserCard
          title="Winter coats for the Brookside food bank"
          image={COATS}
          summary="Two hundred families queue outside in January. Every coat we can buy is one less cold morning."
          raised={6520}
          goal={6000}
          donors={286}
          endsAt="2026-11-20T23:59:00+01:00"
          organiser={{ name: "Tom Calder" }}
          onDonate={donate("the Brookside food bank")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Ended: it says when, hides the button, mutes the picture.">
        <FundraiserCard
          title="Repair the village church roof"
          image={CHURCH}
          summary="Forty missing tiles and a leak above the organ. The roof is done, and the choir is back in tune."
          raised={8950}
          goal={12000}
          donors={204}
          endsAt="2026-10-03T23:59:00+02:00"
          organiser={{ name: "Priya Nair", image: portrait("#2f3236", "#6b7078") }}
          onDonate={donate("the church roof")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Ends today, with no picture: still complete.">
        <FundraiserCard
          title="Vet fund for the Harbour Road dog shelter"
          summary="Twelve dogs need checks and shots before they can go to their new homes this weekend."
          raised={2310}
          goal={3000}
          donors={58}
          endsAt="2026-11-02T23:59:00+01:00"
          organiser={{ name: "Lena Fischer" }}
          onDonate={donate("the dog shelter")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <p role="status" className="min-h-4 text-xs text-muted-foreground md:col-span-2">
        {note}
      </p>
    </div>
  );
}
