import type { ReactNode } from "react";

import { ReviewScore } from "@rhs-ui/primitives/review-score";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const art = (fill: string, shape: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 180'><rect width='240' height='180' fill='${fill}'/>${shape}</svg>`);

const STAYS = [
  { name: "Hotel Halcyon", place: "Rotterdam · 400 m from the centre", score: 9.3, count: 1204, price: "€189", image: art("#d9d6cf", "<rect x='60' y='70' width='120' height='90' fill='#8d877c'/><rect x='80' y='88' width='20' height='22' fill='#d9d6cf'/><rect x='110' y='88' width='20' height='22' fill='#d9d6cf'/><rect x='140' y='88' width='20' height='22' fill='#d9d6cf'/>") },
  { name: "The Kestrel Rooms", place: "Utrecht · Canal district", score: 8.9, count: 862, price: "€142", image: art("#2f3236", "<path d='M30 160 L120 60 L210 160Z' fill='#6b7078'/><circle cx='190' cy='44' r='16' fill='#9aa0a8'/>") },
  { name: "Brightwater Lodge", place: "Texel · Dunes and beach", score: 7.6, count: 318, price: "€118", image: art("#e9e7e2", "<path d='M0 120 Q60 90 120 120 T240 120 V180 H0Z' fill='#a39d91'/><circle cx='80' cy='60' r='20' fill='#c9c3b6'/>") },
  { name: "Harbour Annex", place: "Den Helder · Near the ferry", score: 6.4, count: 57, price: "€96", image: art("#c9ccd1", "<rect x='40' y='90' width='160' height='20' fill='#6b7078'/><rect x='80' y='50' width='60' height='40' fill='#8d9199'/>") },
  { name: "Studio Noord", place: "Amsterdam · Opened this month", score: null, count: 0, price: "€131", image: art("#dcdad4", "<rect x='70' y='60' width='100' height='80' rx='10' fill='#a39d91'/>") },
] as const;

const BANDS = [9.7, 9.2, 8.4, 7.3, 6.5, 5.4, 3.8] as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-10">
      <Example caption="A listing: a box and a word where five stars would take too much room">
        <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {STAYS.map((stay) => (
            <li key={stay.name} className="flex items-center gap-4 p-3 sm:gap-5 sm:p-4">
              <img src={stay.image} alt="" width={240} height={180} className="hidden h-[4.5rem] w-24 shrink-0 rounded-lg border border-border object-cover min-[420px]:block" />
              <div className="grid min-w-0 flex-1 gap-1">
                <h2 className="truncate text-sm font-medium">{stay.name}</h2>
                <p className="truncate text-xs text-muted-foreground">{stay.place}</p>
                <p className="text-xs text-muted-foreground">
                  from <span className="text-sm font-medium text-foreground tabular-nums">{stay.price}</span> a night
                </p>
              </div>
              <ReviewScore score={stay.score} count={stay.count} size="sm" className="shrink-0" />
            </li>
          ))}
        </ul>
      </Example>

      <div className="grid gap-10 sm:grid-cols-2">
        <Example caption="Three sizes">
          <div className="grid justify-items-start gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
            <ReviewScore score={8.9} count={1204} size="sm" />
            <ReviewScore score={8.9} count={1204} size="md" />
            <ReviewScore score={8.9} count={1204} size="lg" />
          </div>
        </Example>

        <Example caption="The word follows the score, and the box follows the word: solid, outlined, quiet, never colour alone">
          <ul className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
            {BANDS.map((score) => (
              <li key={score}>
                <ReviewScore score={score} count={240} size="sm" />
              </li>
            ))}
          </ul>
        </Example>
      </div>

      <Example caption="Another scale and your own words: five points, as a link to the reviews, with no count yet">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5 rounded-xl border border-border bg-card p-5 shadow-xs">
          <ReviewScore
            score={4.6}
            max={5}
            href="#reviews"
            labels={[
              { min: 4.5, label: "Loved by students" },
              { min: 4, label: "Well liked" },
              { min: 3, label: "Mixed" },
              { min: 0, label: "Needs work" },
            ]}
          />
          <ReviewScore score={4.1} max={5} count={1} />
          <ReviewScore score={null} />
        </div>
      </Example>
    </div>
  );
}
