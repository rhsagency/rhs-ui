import type { ReactNode } from "react";

import { RouteTimetable, type TimetableStop, type TimetableTrip } from "@rhs-ui/application/route-timetable";

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
      <Example caption="Weekday bus line, next run marked">
        <RouteTimetable
          stops={BUS_STOPS}
          trips={BUS_RUNS}
          now="2026-11-10T09:47:00Z"
          defaultHighlightStop="harbour"
          caption="Line 41, Central Station to Island Pier, weekdays"
          note="Times are local. Express runs do not stop at Marina Square or Fish Market."
        />
      </Example>

      <Example caption="Ferry on the 24-hour clock, in the harbour's time zone">
        <RouteTimetable
          stops={PIERS}
          trips={FERRIES}
          now="2026-11-10T09:55:00Z"
          timeZone="Europe/Amsterdam"
          locale="en-GB"
          defaultHighlightStop="central"
          caption="Island ferry, summer timetable"
          labels={{ stop: "Pier", yourStop: "Your pier" }}
          note="Fast ferries skip Fish Market Pier. Sailings may be cancelled in strong wind."
        />
      </Example>

      <Example caption="After the last sailing of the day">
        <RouteTimetable
          stops={PIERS}
          trips={FERRIES.slice(4)}
          now="2026-11-10T20:30:00Z"
          timeZone="Europe/Amsterdam"
          locale="en-GB"
          defaultHighlightStop="lighthouse"
          caption="Island ferry, evening sailings"
          labels={{ stop: "Pier", yourStop: "Your pier" }}
        />
      </Example>
    </div>
  );
}

/** A time of day written 06:37: a start and a number of minutes after it. */
function at(start: string, minutes: number): string {
  const [hours = 0, mins = 0] = start.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const BUS_STOPS: readonly TimetableStop[] = [
  { id: "central", name: "Central Station", note: "Bay 2" },
  { id: "harbour", name: "Harbour Gate", note: "Opposite the customs house" },
  { id: "marina", name: "Marina Square" },
  { id: "market", name: "Fish Market", note: "Stall side" },
  { id: "lighthouse", name: "Lighthouse Road" },
  { id: "pier", name: "Island Pier", note: "Ferry connection" },
];

/** Minutes after the first stop. The express runs are faster and do not call at the marina or the market. */
const STOP_RUN = { central: 0, harbour: 7, marina: 13, market: 19, lighthouse: 27, pier: 34 };
const EXPRESS_RUN = { central: 0, harbour: 6, lighthouse: 20, pier: 26 };

function bus(number: number, start: string, express = false): TimetableTrip {
  const offsets: Record<string, number> = express ? EXPRESS_RUN : STOP_RUN;
  return {
    id: `run-${number}`,
    label: `Run ${number}`,
    note: express ? "Express" : undefined,
    times: Object.fromEntries(Object.entries(offsets).map(([stop, minutes]) => [stop, at(start, minutes)])),
  };
}

const BUS_RUNS: readonly TimetableTrip[] = [
  bus(1, "06:30"),
  bus(2, "07:00"),
  bus(3, "07:30"),
  bus(4, "08:00"),
  bus(5, "08:30", true),
  bus(6, "09:00"),
  bus(7, "09:30"),
  bus(8, "10:00"),
  bus(9, "10:30", true),
  bus(10, "11:00"),
  bus(11, "11:30"),
  bus(12, "12:00"),
];

const PIERS: readonly TimetableStop[] = [
  { id: "central", name: "Central Pier", note: "Pontoon A" },
  { id: "market", name: "Fish Market Pier" },
  { id: "lighthouse", name: "Lighthouse Pier" },
  { id: "island", name: "Island Pier", note: "Arrivals" },
];

const FERRIES: readonly TimetableTrip[] = [
  { id: "s1", label: "Sailing 1", times: { central: "09:00", market: "09:12", lighthouse: "09:28", island: "09:40" } },
  { id: "s2", label: "Sailing 2", note: "Fast ferry", times: { central: "10:30", lighthouse: "10:47", island: "10:58" } },
  { id: "s3", label: "Sailing 3", times: { central: "12:00", market: "12:12", lighthouse: "12:28", island: "12:40" } },
  { id: "s4", label: "Sailing 4", times: { central: "13:30", market: "13:42", lighthouse: "13:58", island: "14:10" } },
  { id: "s5", label: "Sailing 5", note: "Fast ferry", times: { central: "15:00", lighthouse: "15:17", island: "15:28" } },
  { id: "s6", label: "Sailing 6", times: { central: "16:30", market: "16:42", lighthouse: "16:58", island: "17:10" } },
  { id: "s7", label: "Sailing 7", times: { central: "18:00", market: "18:12", lighthouse: "18:28", island: "18:40" } },
];
