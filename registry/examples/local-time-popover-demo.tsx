"use client";

import type { ReactNode } from "react";

import { LocalTimePanel, LocalTimePopover, type LocalZone } from "@rhs-ui/application/local-time-popover";
import { IconCalendar, IconVideo } from "@rhs-ui/icons";

// A fixed "now" keeps "in 5 days" the same on every load. In an app, leave `now` out and the words read the browser's clock.
const NOW = Date.parse("2026-10-21T10:00:00Z");

const ZONES: readonly LocalZone[] = [
  { id: "Europe/Amsterdam", label: "Amsterdam" },
  { id: "America/Los_Angeles", label: "San Francisco" },
  { id: "America/New_York", label: "New York" },
  { id: "Asia/Kolkata", label: "Bengaluru" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Pacific/Auckland", label: "Auckland" },
];

// Monday 26 October, 17:00 in Amsterdam. Europe has put its clocks back by then and America has not: Amsterdam and San Francisco are eight hours apart, not nine.
const SYNC = "2026-10-26T17:00:00+01:00";

const WITH_DATE: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" };

const SYDNEY: readonly LocalZone[] = [
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Asia/Singapore", label: "Singapore" },
  { id: "Asia/Kolkata", label: "Bengaluru" },
  { id: "Europe/Amsterdam", label: "Amsterdam" },
  { id: "America/New_York", label: "New York" },
  { id: "America/Los_Angeles", label: "San Francisco" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start">
        <div className="grid min-w-0 content-start gap-10">
          <Case caption="A meeting invite. The time is a button with a dotted line under it: it opens the same moment in every zone, with you first (viewer: San Francisco). Sydney and Auckland are already on Tuesday, and the offsets are worked out for that date by Intl.">
            <section aria-labelledby="local-time-demo-title" className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
              <div className="grid gap-1">
                <h2 id="local-time-demo-title" className="text-base font-semibold tracking-[-0.02em]">
                  Halcyon product sync
                </h2>
                <p className="text-sm text-muted-foreground">Roadmap, launch risks and the pricing page.</p>
              </div>
              {/* The label sits above the value on the narrowest phones: the time is 17 characters and wraps when it has only what is left of the row. */}
              <dl className="grid min-w-0 gap-3 text-sm">
                <div className="flex min-w-0 items-baseline gap-3 max-[22rem]:flex-col max-[22rem]:items-stretch max-[22rem]:gap-1">
                  <dt className="flex w-16 shrink-0 items-center gap-2 text-muted-foreground">
                    <IconCalendar aria-hidden="true" className="size-4" />
                    When
                  </dt>
                  <dd className="min-w-0">
                    <LocalTimePopover defaultOpen instant={SYNC} zones={ZONES} viewerZone="America/Los_Angeles" locale="en-GB" format={WITH_DATE} now={NOW} title="Halcyon product sync" />
                  </dd>
                </div>
                <div className="flex min-w-0 items-baseline gap-3 max-[22rem]:flex-col max-[22rem]:items-stretch max-[22rem]:gap-1">
                  <dt className="flex w-16 shrink-0 items-center gap-2 text-muted-foreground">
                    <IconVideo aria-hidden="true" className="size-4" />
                    Where
                  </dt>
                  <dd className="min-w-0 truncate">meet.halcyon.example/product-sync</dd>
                </div>
              </dl>
              <div aria-hidden="true" className="grid gap-3 pt-2 pb-[26rem]">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted/70" />
                <div className="h-3 w-11/12 rounded bg-muted/70" />
                <div className="h-3 w-3/5 rounded bg-muted/70" />
              </div>
            </section>
          </Case>

          <Case caption="In a sentence, with the default format: the time and the zone's short name. Both readers are in Bengaluru.">
            <p className="max-w-xl text-sm leading-relaxed">
              The launch call starts at{" "}
              <LocalTimePopover instant="2026-10-28T15:30:00Z" zones={ZONES} eventZone="Europe/Amsterdam" viewerZone="Asia/Kolkata" locale="en-GB" now={NOW} /> and the retro follows at{" "}
              <LocalTimePopover
                instant="2026-10-29T18:00:00Z"
                zones={ZONES}
                eventZone="America/New_York"
                viewerZone="Asia/Kolkata"
                locale="en-US"
                now={NOW}
                format={{ hour: "numeric", minute: "2-digit", timeZoneName: "short" }}
              />
              .
            </p>
          </Case>
        </div>

        <Case caption="The same list on its own, for a sheet on a phone. A 09:00 start in Sydney is still the evening before in New York and San Francisco, and you (Amsterdam) come first.">
          <div className="w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-sm">
            <LocalTimePanel instant="2026-10-21T22:00:00Z" zones={SYDNEY} eventZone="Australia/Sydney" viewerZone="Europe/Amsterdam" locale="en-GB" now={NOW} title="Sprint review" />
          </div>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}
