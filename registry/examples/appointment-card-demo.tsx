"use client";

import { useRef, useState, type ReactNode } from "react";

import { AppointmentCard, type AppointmentStatus } from "@rhs-ui/application/appointment-card";

// A fixed "now" keeps "over" and "to come" the same on every load. In an app, leave `now` out and the card reads the browser's clock.
const NOW = Date.parse("2026-11-02T09:30:00Z");
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A head and shoulders, drawn in flat shapes. Use real photos in an app. */
const portrait = (ground: string, ink: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'><rect width='72' height='72' fill='${ground}'/><circle cx='36' cy='28' r='12' fill='${ink}'/><path d='M12 72c1-15 11-24 24-24s23 9 24 24z' fill='${ink}'/></svg>`);

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  // A case takes two rows of the grid and shares them with its neighbour: the caption row is as tall as the longer caption, so two cards start on one line however the captions wrap.
  return (
    <div className="row-span-2 grid min-w-0 grid-rows-subgrid gap-y-2.5">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [status, setStatus] = useState<AppointmentStatus>("confirmed");
  const [note, setNote] = useState("");
  const refused = useRef(false);

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Confirmed, in person. Cancel asks first; the first try fails, to show the retry.">
        <AppointmentCard
          title="Quarterly check-up"
          start="2026-11-05T10:00:00+01:00"
          end="2026-11-05T10:45:00+01:00"
          timeZone="Europe/Amsterdam"
          readerTimeZone="Europe/Amsterdam"
          now={NOW}
          status={status}
          person={{ name: "Dr. Mara Okafor", role: "Cardiologist", image: portrait("#e5e2dc", "#a39d91") }}
          location={{ address: "Prinsengracht 212, 1016 HD Amsterdam" }}
          actions={{
            onReschedule: () => setNote("Opening the calendar to pick a new time with Dr. Okafor."),
            onCancel: async () => {
              await wait(900);
              if (!refused.current) {
                refused.current = true;
                throw new Error("refused");
              }
              setStatus("cancelled");
            },
          }}
        />
      </Case>

      <Case caption="Waiting for the clinic, online, booked in another time zone.">
        <AppointmentCard
          title="Back pain follow-up"
          start="2026-11-06T09:00:00-05:00"
          end="2026-11-06T09:30:00-05:00"
          timeZone="America/New_York"
          readerTimeZone="Europe/Amsterdam"
          now={NOW}
          status="pending"
          person={{ name: "Lena Fischer", role: "Physiotherapist", image: portrait("#2f3236", "#6b7078") }}
          location={{ url: "https://meet.northwind.health/r/lena-3f9a" }}
          actions={{ onReschedule: () => setNote("Opening the calendar to pick a new time with Lena."), onCancel: () => wait(600) }}
        />
      </Case>

      <Case caption="Over: muted, and it says Completed.">
        <AppointmentCard
          title="Annual physical"
          start="2026-10-27T14:15:00+01:00"
          end="2026-10-27T15:00:00+01:00"
          timeZone="Europe/Amsterdam"
          readerTimeZone="Europe/Amsterdam"
          now={NOW}
          person={{ name: "Dr. Sam Whitfield", role: "General practitioner" }}
          location={{ address: "Keizersgracht 88, 1015 CT Amsterdam" }}
          actions={{ onReschedule: () => undefined }}
        />
      </Case>

      <Case caption="Cancelled: muted, the time struck through, no actions left.">
        <AppointmentCard
          title="Skin check"
          start="2026-11-09T11:30:00+01:00"
          end="2026-11-09T12:00:00+01:00"
          timeZone="Europe/Amsterdam"
          readerTimeZone="Europe/Amsterdam"
          now={NOW}
          status="cancelled"
          person={{ name: "Dr. Ines Kowalski", role: "Dermatologist" }}
          location={{ address: "Overtoom 301, 1054 HW Amsterdam" }}
          actions={{ onReschedule: () => undefined }}
        />
      </Case>

      <p role="status" className="min-h-4 text-xs text-muted-foreground md:col-span-2">
        {note}
      </p>
    </div>
  );
}
