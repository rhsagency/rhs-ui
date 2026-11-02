import type { ReactNode } from "react";

import { MatchScoreCard } from "@rhs-ui/application/match-score-card";

/** Crests drawn in flat shapes for clubs that do not exist, so the demo needs no files. Use your own crests in an app. */
const SHIELD = "M32 3L58 12V36C58 54 46 64 32 69C18 64 6 54 6 36V12Z";

const crest = (base: string, body: string, edge: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 72'><defs><clipPath id='s'><path d='${SHIELD}'/></clipPath></defs><path d='${SHIELD}' fill='${base}'/><g clip-path='url(#s)'>${body}</g><path d='${SHIELD}' fill='none' stroke='${edge}' stroke-width='3' stroke-linejoin='round'/></svg>`,
  );

const HALCYON = crest("#27364a", `<path d='M6 30L32 14L58 30V42L32 26L6 42Z' fill='#efe8d8'/><circle cx='32' cy='52' r='6' fill='#efe8d8'/>`, "#16202e");
const KESTREL = crest("#b4634a", `<rect x='18' width='9' height='72' fill='#efe8d8'/><rect x='37' width='9' height='72' fill='#efe8d8'/>`, "#7e3f2c");
const NORTHWIND = crest("#3e5b46", `<path d='M-4 54L52 -4L66 10L10 70Z' fill='#efe8d8'/><circle cx='47' cy='50' r='7' fill='#efe8d8'/>`, "#29402f");
const FERNLEAF = crest("#2c2e33", `<rect y='22' width='64' height='10' fill='#efe8d8'/><rect y='42' width='64' height='10' fill='#efe8d8'/>`, "#17181b");
const LARKSPUR = crest("#6a7c93", `<circle cx='32' cy='34' r='15' fill='#efe8d8'/><circle cx='32' cy='34' r='7.5' fill='#6a7c93'/>`, "#46566b");
const BRIGHTWATER = crest("#c19a3f", `<path d='M0 34q8-8 16 0t16 0t16 0t16 0V72H0z' fill='#2c2e33'/><path d='M0 20q8-8 16 0t16 0t16 0t16 0' fill='none' stroke='#2c2e33' stroke-width='4'/>`, "#8a6b24");
const GREYSTONE = crest("#7c6a58", `<path d='M32 12L40 30L58 32L44 44L48 62L32 52L16 62L20 44L6 32L24 30Z' fill='#efe8d8'/>`, "#52463a");
const ALDRIC = crest("#8c3a3a", `<rect x='28' width='8' height='72' fill='#efe8d8'/><rect y='30' width='64' height='8' fill='#efe8d8'/>`, "#5e2323");

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const ZONE = { locale: "en-GB", timeZone: "Europe/Amsterdam" } as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl items-start gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Live: a pulsing dot (still under reduced motion) and the minute.">
        <MatchScoreCard
          competition="Harbour League · Matchday 12"
          status="live"
          minute={67}
          home={{ name: "Halcyon FC", logo: HALCYON, score: 2 }}
          away={{ name: "Kestrel United", logo: KESTREL, score: 1 }}
          href="#halcyon-kestrel"
          kickoff="2026-11-01T16:00:00+01:00"
          {...ZONE}
        />
      </Case>

      <Case caption="Full time: the winner in heavier type, and said in words.">
        <MatchScoreCard
          competition="Harbour League · Matchday 11"
          status="finished"
          kickoff="2026-10-25T14:30:00+01:00"
          home={{ name: "Northwind Rovers", logo: NORTHWIND, score: 3 }}
          away={{ name: "Fernleaf Athletic", logo: FERNLEAF, score: 0 }}
          href="#northwind-fernleaf"
          {...ZONE}
        />
      </Case>

      <Case caption="To come: the kickoff, in the time zone you name.">
        <MatchScoreCard
          competition="Harbour League · Matchday 13"
          status="scheduled"
          kickoff="2026-11-09T14:30:00+01:00"
          home={{ name: "Larkspur Town", logo: LARKSPUR }}
          away={{ name: "Brightwater City", logo: BRIGHTWATER }}
          href="#larkspur-brightwater"
          {...ZONE}
        />
      </Case>

      <Case caption="A draw, and a long name cut short: its full name is the title.">
        <MatchScoreCard
          competition="Harbour Cup · Round of 16"
          status="finished"
          kickoff="2026-10-29T20:00:00+01:00"
          home={{ name: "Greystone Wanderers Athletic Club", logo: GREYSTONE, score: 1 }}
          away={{ name: "Saint Aldric Rovers", logo: ALDRIC, score: 1 }}
          {...ZONE}
        />
      </Case>

      <Case caption="Without a crest the initials stand in. Nothing here is a link.">
        <MatchScoreCard competition="Friendly" status="finished" home={{ name: "Marlowe Rangers", score: 0 }} away={{ name: "Ashby Albion", score: 2 }} {...ZONE} />
      </Case>

      <Case caption="Live in added time: the minute can be words.">
        <MatchScoreCard
          competition="Harbour League · Matchday 12"
          status="live"
          minute="45+2"
          home={{ name: "Brightwater City", logo: BRIGHTWATER, score: 0 }}
          away={{ name: "Larkspur Town", logo: LARKSPUR, score: 0 }}
          href="#brightwater-larkspur"
          {...ZONE}
        />
      </Case>
    </div>
  );
}
