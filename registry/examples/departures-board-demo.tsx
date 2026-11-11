"use client";

import { useState, type ReactNode } from "react";

import { DeparturesBoard, type Departure } from "@rhs-ui/application/departures-board";
import { Button } from "@rhs-ui/primitives/button";
import { IconRefresh } from "@rhs-ui/icons";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [updated, setUpdated] = useState(false);
  const [opened, setOpened] = useState<Departure | null>(null);
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 p-2 sm:p-6">
      <Example caption="Departures with a live update">
        <DeparturesBoard
          departures={updated ? UPDATED : BOARD}
          now={updated ? at("14:33") : at("14:32")}
          locale="en-GB"
          caption="Departures from Kestrel Central"
          onSelect={setOpened}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setUpdated((value) => !value)}>
            <IconRefresh />
            {updated ? "Go back to 14:32" : "Bring in the 14:33 update"}
          </Button>
          <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
            {opened ? `Opened the ${opened.destination} train from platform ${opened.platform ?? "not yet announced"}.` : "Press a destination to open it."}
          </p>
        </div>
      </Example>

      <Example caption="Ferry terminal on the 12-hour clock, with piers">
        <DeparturesBoard
          departures={PIER_BOARD}
          now="2026-11-10T14:02:00Z"
          caption="Ferry departures"
          labels={{ platform: "Pier", noPlatform: "Pier not announced" }}
        />
      </Example>
    </div>
  );
}

/** A moment on 10 November 2026, UTC: the board's own time zone, so what is written is what is meant. */
const at = (time: string) => `2026-11-10T${time}:00Z`;

const BOARD: readonly Departure[] = [
  { id: "ic-2318", scheduled: at("14:12"), destination: "Amsterdam Zuid", platform: "7", operator: "Kestrel Rail" },
  { id: "sp-5240", scheduled: at("14:26"), expected: at("14:34"), destination: "Gouda", via: "Woerden", platform: "3", operator: "Polder Regional" },
  { id: "ic-2322", scheduled: at("14:35"), destination: "Rotterdam Centraal", via: "Utrecht Centraal, Gouda", platform: "4b", operator: "Kestrel Rail", status: "boarding" },
  { id: "ex-9114", scheduled: at("14:40"), destination: "Antwerp-Central", via: "Breda", platform: "11", operator: "Fjord Express" },
  { id: "sp-5244", scheduled: at("14:44"), expected: at("14:49"), destination: "Utrecht Centraal", platform: "2", operator: "Kestrel Rail" },
  { id: "sp-5252", scheduled: at("14:52"), destination: "Nijmegen", via: "Arnhem", platform: "6a", operator: "Polder Regional", status: "cancelled" },
  { id: "ic-2326", scheduled: at("14:58"), destination: "Rotterdam Centraal", operator: "Kestrel Rail" },
  { id: "ic-2330", scheduled: at("15:05"), destination: "Schiphol Airport", via: "Amsterdam Zuid", platform: "9", operator: "Kestrel Rail" },
  { id: "sp-5260", scheduled: at("15:12"), expected: at("15:24"), destination: "Eindhoven", via: "'s-Hertogenbosch", platform: "5", operator: "Polder Regional" },
];

/** The same board a minute later: a delay grows, one train gets its platform, one is cancelled, one is nearly ready to board. */
const UPDATED: readonly Departure[] = BOARD.map((departure) => {
  if (departure.id === "ex-9114") return { ...departure, expected: at("14:47"), platform: "12" };
  if (departure.id === "ic-2326") return { ...departure, platform: "8" };
  if (departure.id === "ic-2330") return { ...departure, status: "cancelled" };
  if (departure.id === "sp-5244") return { ...departure, expected: at("14:44"), status: "on-time" };
  return departure;
});

const PIER_BOARD: readonly Departure[] = [
  { id: "f-1", scheduled: "2026-11-10T14:00:00Z", destination: "Island Pier", platform: "A", operator: "Harbour Ferries" },
  { id: "f-2", scheduled: "2026-11-10T14:30:00Z", expected: "2026-11-10T14:41:00Z", destination: "Lighthouse Pier", via: "Fish Market", platform: "B", operator: "Harbour Ferries" },
  { id: "f-3", scheduled: "2026-11-10T15:00:00Z", destination: "Island Pier", platform: "A", operator: "Harbour Ferries", status: "cancelled" },
  { id: "f-4", scheduled: "2026-11-10T15:30:00Z", destination: "Island Pier", operator: "Harbour Ferries" },
];
