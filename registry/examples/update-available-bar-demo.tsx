"use client";

import { useState, type ReactNode } from "react";

import { UpdateAvailableBar } from "@rhs-ui/application/update-available-bar";
import { Button } from "@rhs-ui/primitives/button";

const ROWS = [
  { name: "Reformer Pilates", detail: "Studio 2, 18:30, 9 of 12 booked" },
  { name: "Sunrise Vinyasa", detail: "Studio 1, 07:00, 12 of 14 booked" },
  { name: "Kettlebell Basics", detail: "Studio 3, 12:15, 4 of 10 booked" },
  { name: "Evening Stretch", detail: "Studio 1, 20:00, 6 of 14 booked" },
] as const;

/** More of the day, for the window that scrolls. */
const LATER = [
  { name: "Mobility Flow", detail: "Studio 2, 08:15, 7 of 12 booked" },
  { name: "Lunchtime HIIT", detail: "Studio 3, 13:00, 10 of 10 booked" },
  { name: "Barre Burn", detail: "Studio 1, 17:30, 8 of 14 booked" },
  { name: "Breathwork", detail: "Studio 2, 20:30, 3 of 12 booked" },
  { name: "Yin Yoga", detail: "Studio 1, 21:00, 5 of 14 booked" },
  { name: "Cooldown Club", detail: "Studio 2, 21:30, 2 of 12 booked" },
] as const;

/** A small app to put the bar in. A top bar is its first child, in the flow, above the header; a bottom bar is fixed to the window instead of the page, so the demo can show both edges. */
function AppWindow({ top, children }: { top?: ReactNode; children?: ReactNode }): React.JSX.Element {
  return (
    <div className="relative h-[21rem] overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      {top}
      <div className="flex h-12 items-center justify-between border-b border-border px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
        <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
          <span>Schedule</span>
          <span>Members</span>
          <span>Reports</span>
        </span>
      </div>
      <div className="px-4 py-5 sm:px-6">
        <p className="text-base font-semibold tracking-[-0.02em]">Today&rsquo;s classes</p>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
          {ROWS.map((row) => (
            <li key={row.name} className="px-3 py-2.5">
              <p className="text-sm font-medium">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      {children}
    </div>
  );
}

/** A page that scrolls inside its own window. The bar is sticky and the header hangs under it through --update-bar-height, so neither covers the other. */
function ScrollingWindow({ top }: { top: ReactNode }): React.JSX.Element {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="A scrolling page under a sticky update bar"
      className="relative h-[21rem] overflow-y-auto rounded-xl border border-border bg-background shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      {top}
      <div className="sticky top-[var(--update-bar-height,0px)] z-40 flex h-12 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
        <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
          <span>Schedule</span>
          <span>Members</span>
          <span>Reports</span>
        </span>
      </div>
      <ul className="divide-y divide-border px-4 sm:px-6">
        {[...ROWS, ...LATER].map((row) => (
          <li key={row.name} className="py-3">
            <p className="text-sm font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Clears a snooze the way a new browser tab would, so the bar can be seen again. */
function forget(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage is blocked: there is nothing to forget.
  }
}

export default function Demo(): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [reloads, setReloads] = useState(0);

  /** A real app reloads here. The demo only waits, so the busy state can be seen, and counts. */
  async function reload() {
    await new Promise((resolve) => setTimeout(resolve, 1600));
    setReloads((count) => count + 1);
  }

  function again() {
    forget("demo-update-top");
    forget("demo-update-bottom");
    forget("demo-update-sticky");
    setRound((count) => count + 1);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid items-start gap-y-8">
        <Case caption="At the top the bar sits in the flow and pushes the page down, with the version and a link to what changed. It scrolls away with the page. Reload now shows a spinner while the page restarts.">
          <AppWindow top={<UpdateAvailableBar key={`top-${round}`} position="top" appName="Halcyon" version="2.4.0" changesHref="#changes" storageKey="demo-update-top" onReload={reload} />} />
        </Case>

        <Case caption="At the bottom it is fixed over the page and clears the home indicator on a phone. Later hides it for 15 minutes and survives navigation.">
          <AppWindow>
            <UpdateAvailableBar key={`bottom-${round}`} className="absolute" position="bottom" appName="Halcyon" snoozeMinutes={15} storageKey="demo-update-bottom" onReload={reload} />
          </AppWindow>
        </Case>

        <Case caption="With sticky the bar stays in view while the page scrolls, and tells the page how tall it is, so a sticky header hangs under it instead of being covered. Scroll inside the window.">
          <ScrollingWindow top={<UpdateAvailableBar key={`sticky-${round}`} sticky appName="Halcyon" version="2.4.0" storageKey="demo-update-sticky" onReload={reload} />} />
        </Case>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="button" size="sm" variant="outline" onClick={again}>
          Bring the bars back
        </Button>
        <p className="text-xs text-muted-foreground tabular-nums">
          Reload now was pressed {reloads} {reloads === 1 ? "time" : "times"}. Here it only waits; in an app it reloads the page.
        </p>
      </div>
    </div>
  );
}
