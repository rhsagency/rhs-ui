import type { ReactNode } from "react";

import { StandingsTable, type StandingsRow, type StandingsZone } from "@rhs-ui/application/standings-table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 p-2 sm:p-6">
      <Example caption="League table with zones and a club to follow">
        <StandingsTable rows={LEAGUE} zones={ZONES} highlightTeam="Northwind FC" caption="Northern Championship, after matchday 14" />
      </Example>

      <Example caption="The same table in a narrow box">
        <div className="max-w-sm">
          <StandingsTable rows={LEAGUE.slice(0, 7)} zones={ZONES.slice(0, 2)} highlightTeam="Halcyon Town" caption="Top of the table" />
        </div>
      </Example>
    </div>
  );
}

/**
 * A crest, drawn: a shape and two letters in greys. The picture has room around it, so the avatar's round crop never cuts a corner.
 */
function crest(letters: string, shape: number): string {
  const shapes = [
    "M16 2l12 4v10c0 7-5 12-12 14C9 28 4 23 4 16V6z",
    "M16 2a14 14 0 1 0 0 28 14 14 0 0 0 0-28z",
    "M16 2l13 7.5v13L16 30 3 22.5v-13z",
    "M16 2l14 14-14 14L2 16z",
  ];
  const tones = ["#3a3a3a", "#4f4f4f", "#444444", "#626262"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 42 42"><path d="${shapes[shape % 4]}" fill="${tones[shape % 4]}" stroke="#ffffff" stroke-opacity=".35" stroke-width="1"/><text x="16" y="20.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="700" fill="#ffffff">${letters}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const LEAGUE: readonly StandingsRow[] = [
  { team: "Fjord United", logo: crest("FU", 0), played: 14, won: 10, drawn: 2, lost: 2, for: 27, against: 13, points: 32, form: "WWDWW" },
  { team: "Kestrel Athletic", logo: crest("KA", 1), played: 14, won: 9, drawn: 3, lost: 2, for: 25, against: 14, points: 30, form: "WDWWL" },
  { team: "Northwind FC", logo: crest("NF", 2), played: 14, won: 8, drawn: 4, lost: 2, for: 22, against: 15, points: 28, form: "WLWDW" },
  { team: "Halcyon Town", logo: crest("HT", 3), played: 14, won: 8, drawn: 2, lost: 4, for: 23, against: 20, points: 26, form: "LWWLW" },
  { team: "Oak Lane Rovers", logo: crest("OL", 1), played: 14, won: 7, drawn: 4, lost: 3, for: 20, against: 18, points: 25, form: "DWDLW" },
  { team: "Polder SC", logo: crest("PS", 0), played: 14, won: 7, drawn: 3, lost: 4, for: 19, against: 19, points: 24, form: "WDLLD" },
  { team: "Atlas Wanderers", logo: crest("AW", 3), played: 14, won: 6, drawn: 4, lost: 4, for: 18, against: 18, points: 22, form: "LDWDL" },
  { team: "Mirror City", logo: crest("MC", 2), played: 13, won: 6, drawn: 3, lost: 4, for: 17, against: 17, points: 21, form: "DLWLD" },
  { team: "Harbour Park", logo: crest("HP", 1), played: 14, won: 5, drawn: 4, lost: 5, for: 16, against: 19, points: 19, form: "LLDWD" },
  { team: "Juniper FC", logo: crest("JF", 0), played: 14, won: 4, drawn: 3, lost: 7, for: 14, against: 22, points: 15, form: "WLLDL" },
  { team: "Lumen Albion", logo: crest("LA", 3), played: 14, won: 3, drawn: 4, lost: 7, for: 12, against: 22, points: 13, form: "DLLLD" },
  { team: "Quill Rangers", logo: crest("QR", 2), played: 14, won: 2, drawn: 3, lost: 9, for: 10, against: 26, points: 9, form: "LLDLL" },
];

const ZONES: readonly StandingsZone[] = [
  { from: 1, to: 2, label: "Promotion", tone: "positive" },
  { from: 3, to: 6, label: "Play-offs", tone: "neutral" },
  { from: 11, to: 12, label: "Relegation", tone: "negative" },
];
