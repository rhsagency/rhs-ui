"use client";

import { useState, type ReactNode } from "react";

import { AvatarGroupPopover, type AvatarPerson } from "@rhs-ui/application/avatar-group-popover";

/** A flat, monochrome portrait drawn as an SVG data URI, so the demo needs no picture from anywhere. */
function portrait(background: string, figure: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${background}"/><circle cx="32" cy="25" r="11" fill="${figure}"/><path d="M10 64c2-15 13-22 22-22s20 7 22 22z" fill="${figure}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const TEAM: readonly AvatarPerson[] = [
  { id: "maya", name: "Maya Okafor", role: "Product lead", status: "online", image: portrait("#d9d9d9", "#8a8a8a") },
  { id: "leo", name: "Leo Martins", role: "Engineering manager", status: "busy" },
  { id: "priya", name: "Priya Nair", role: "Design lead", status: "online", image: portrait("#cfcfcf", "#737373") },
  { id: "dan", name: "Dan Cho", role: "Backend engineer", status: "away" },
  { id: "sofia", name: "Sofia Rossi", role: "Customer success", status: "offline" },
  { id: "tomas", name: "Tomas Brandt", role: "Data analyst", status: "online" },
  { id: "hana", name: "Hana Sato", role: "Content strategist", status: "away", image: portrait("#e2e2e2", "#9a9a9a") },
  { id: "zoe", name: "Zoë Janssen", role: "QA engineer", status: "offline" },
  { id: "amara", name: "Amara Diallo", role: "Legal counsel", status: "busy" },
];

const MORE: readonly AvatarPerson[] = [
  { id: "ines", name: "Ines Costa", role: "Support", status: "online" },
  { id: "marcus", name: "Marcus Hill", role: "Sales", status: "away" },
  { id: "yuki", name: "Yuki Tanaka", role: "Security", status: "offline" },
];

export default function Demo(): React.JSX.Element {
  const [picked, setPicked] = useState("Nobody chosen yet.");

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-3xl gap-12">
        <Case caption="The +5 of an avatar stack, opened: everyone in a short list with name, role and where they are now. Nine people is more than eight, so there is a filter field (try “zoe”, or “lead”). The stack reads as Maya Okafor and 8 others.">
          <section aria-labelledby="avatar-group-demo-title" className="relative h-[32rem] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-5 py-4">
              <div className="grid gap-0.5">
                <h2 id="avatar-group-demo-title" className="text-base font-semibold tracking-[-0.02em]">
                  Q4 launch plan
                </h2>
                <p className="text-xs text-muted-foreground">Edited 12 minutes ago by Maya Okafor</p>
              </div>
              <AvatarGroupPopover
                defaultOpen
                align="end"
                people={TEAM}
                viewAllHref="/projects/q4-launch/people"
                onSelect={(person) => setPicked(`Opened the profile of ${person.name}.`)}
              />
            </div>
            <div aria-hidden="true" className="grid gap-3 p-5">
              <div className="h-4 w-48 rounded-md bg-muted" />
              <div className="h-3 w-full rounded bg-muted/70" />
              <div className="h-3 w-11/12 rounded bg-muted/70" />
              <div className="h-3 w-3/5 rounded bg-muted/70" />
            </div>
          </section>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {picked}
          </p>
        </Case>

        <Case caption="Three sizes. The first has seven people and shows three; the second has six, so no filter; the third has twelve at 48px. Without onSelect a row is plain text that the arrow keys can still reach.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile label="Small, 7 people">
              <AvatarGroupPopover size="sm" max={3} people={TEAM.slice(0, 7)} />
            </Tile>
            <Tile label="Default, 6 people">
              <AvatarGroupPopover people={TEAM.slice(0, 6)} onSelect={(person) => setPicked(`Opened the profile of ${person.name}.`)} />
            </Tile>
            <Tile label="Large, 12 people">
              <AvatarGroupPopover size="lg" max={3} people={[...TEAM, ...MORE]} />
            </Tile>
          </div>
        </Case>
      </div>
    </div>
  );
}

function Tile({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid content-between gap-4 rounded-xl border border-border bg-card px-4 py-4 text-card-foreground shadow-xs">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div>{children}</div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}
