import type { ReactNode } from "react";

import { SeasonStrip, type SeasonMonth } from "@rhs-ui/application/season-strip";

// A fixed "now" keeps the ring in the same place on every load. In an app, leave `now` out and the strip reads the browser's clock.
const NOW = "2026-05-14T12:00:00Z";

const LISBON: readonly SeasonMonth[] = [
  { state: "off", note: "Mild but wet, and the quietest month for the museums." },
  "off",
  { state: "good", note: "Spring arrives with the odd shower. Hotels are still cheap." },
  { state: "best", note: "Around 20 degrees, long evenings and no queues yet." },
  { state: "best", note: "The jacaranda trees come into flower." },
  { state: "best", note: "Santo Antonio, on 12 and 13 June, fills the streets with grilled sardines." },
  { state: "good", note: "Hot, up to 33 degrees, and busy by the river." },
  { state: "off", note: "The hottest and most crowded month." },
  { state: "best", note: "The sea is warm and the crowds have thinned." },
  { state: "good", note: "Still warm, with the first autumn rain." },
  "off",
  { state: "off", note: "Christmas lights on Rossio, between the showers." },
];

const APPLES: readonly SeasonMonth[] = ["off", "off", "off", "off", "off", "off", "off", "good", "best", "best", "good", "off"];

const CABLE_CAR: readonly SeasonMonth[] = ["best", "best", "best", { state: "closed", note: "Closed for the yearly inspection." }, "closed", "good", "best", "best", "good", "closed", "closed", "good"];

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6">{children}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Case caption="Hover, focus or tap a month with a dot to read its note. Today is pinned to 14 May, so the ring is always on May.">
        <SeasonStrip label="Best time to visit Lisbon" months={LISBON} now={NOW} locale="en-GB" />
      </Case>

      <Case caption="A harvest year that starts in August: the data stays in calendar order, the strip starts where firstMonth says.">
        <SeasonStrip label="Apple harvest at Kestrel Farm" months={APPLES} firstMonth={8} now={NOW} locale="en-GB" />
      </Case>

      <Case caption="Closed months are hatched. Month names come from the locale and every word from labels, here in Dutch.">
        <SeasonStrip
          label="Halcyon Ridge kabelbaan"
          months={CABLE_CAR}
          now={NOW}
          locale="nl-NL"
          labels={{
            best: "Beste tijd",
            good: "Goed",
            off: "Buiten het seizoen",
            closed: "Gesloten",
            now: "Nu",
            group: "Seizoen per maand",
            summaryBest: "Het beste in {months}",
            summaryGood: "Goed in {months}",
            summaryNone: "Geen beste tijd aangegeven",
            hasNote: "Met toelichting",
          }}
        />
      </Case>
    </div>
  );
}
