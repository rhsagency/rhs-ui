import type { ReactNode } from "react";

import { AvailabilityCalendar } from "@rhs-ui/application/availability-calendar";

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      {/* A caption that wraps on one side must not push its card below the card beside it: from lg the two share the height of two lines. */}
      <p className="mb-2.5 flex text-xs text-muted-foreground lg:min-h-8 lg:items-end">{caption}</p>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-7">{children}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Fernleaf Cabin</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Sleeps 6 · Two bedrooms · From €145 a night</p>
      </div>

      <div className="grid items-start gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Case caption="Two months. Today is pinned to 9 March, so the days before it go quiet. Use the arrow keys inside a month.">
          <AvailabilityCalendar
            months={2}
            today="2026-03-09"
            minStay={3}
            booked={[{ start: "2026-03-02", end: "2026-03-05" }, { start: "2026-03-14", end: "2026-03-18" }, { start: "2026-03-26", end: "2026-03-29" }, { start: "2026-04-03", end: "2026-04-06" }, { start: "2026-04-17", end: "2026-04-20" }]}
            onRequest={[{ start: "2026-03-20", end: "2026-03-22" }, { start: "2026-04-10", end: "2026-04-12" }]}
          />
        </Case>

        <Case caption="One month, in Dutch, with the week from Monday.">
          <AvailabilityCalendar
            today="2026-04-09"
            defaultMonth="2026-04-01"
            locale="nl-NL"
            timeZone="Europe/Amsterdam"
            minStay={1}
            booked={[{ start: "2026-04-03", end: "2026-04-06" }, { start: "2026-04-17", end: "2026-04-20" }, "2026-04-28"]}
            onRequest={[{ start: "2026-04-10", end: "2026-04-12" }]}
            labels={{
              available: "Beschikbaar",
              booked: "Bezet",
              onRequest: "Op aanvraag",
              past: "voorbij",
              today: "Vandaag",
              legend: "Legenda",
              previous: "Vorige maand",
              next: "Volgende maand",
              minStayOne: "Minimaal {count} nacht",
              minStayOther: "Minimaal {count} nachten",
            }}
          />
        </Case>
      </div>
    </div>
  );
}
