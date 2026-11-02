"use client";

import { useRef, useState, type ReactNode } from "react";

import { ClassSessionCard, type ClassSessionStatus } from "@rhs-ui/application/class-session-card";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A head and shoulders, drawn in flat shapes. Use real photos in an app. */
const portrait = (ground: string, ink: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'><rect width='72' height='72' fill='${ground}'/><circle cx='36' cy='28' r='12' fill='${ink}'/><path d='M12 72c1-15 11-24 24-24s23 9 24 24z' fill='${ink}'/></svg>`);

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const ZONE = { locale: "en-GB", timeZone: "Europe/Amsterdam" } as const;

/** A waitlist is a booking of a kind: the card shows it as booked, in the words of a waitlist. */
const WAITLIST = {
  statuses: { booked: "On waitlist" },
  cancel: "Leave waitlist",
  cancelFor: "Leave waitlist for {title}, {date}",
  cancelling: "Leaving the waitlist for {title}…",
  doneBooked: "You are on the waitlist for {title}.",
  doneCancelled: "You left the waitlist for {title}.",
  failed: "Could not update the waitlist for {title}. Nothing was changed.",
};

export default function Demo(): React.JSX.Element {
  const [vinyasa, setVinyasa] = useState<{ status: ClassSessionStatus; spots: number }>({ status: "open", spots: 3 });
  const [mobility, setMobility] = useState<{ status: ClassSessionStatus; spots: number }>({ status: "booked", spots: 6 });
  const [hiit, setHiit] = useState<ClassSessionStatus>("full");
  const refused = useRef(false);

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Open: the first try fails, to show the retry.">
        <ClassSessionCard
          title="Vinyasa flow"
          start="2026-11-05T18:30:00+01:00"
          end="2026-11-05T19:30:00+01:00"
          coach={{ name: "Anna de Vries", image: portrait("#e5e2dc", "#a39d91") }}
          room="Studio 2"
          level="All levels"
          capacity={14}
          spots={vinyasa.spots}
          status={vinyasa.status}
          onBook={async () => {
            await wait(900);
            if (!refused.current) {
              refused.current = true;
              throw new Error("refused");
            }
            setVinyasa({ status: "booked", spots: vinyasa.spots - 1 });
          }}
          onCancel={async () => {
            await wait(600);
            setVinyasa({ status: "open", spots: vinyasa.spots + 1 });
          }}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Full: the button becomes Join waitlist, and the card shows the result.">
        <ClassSessionCard
          title="HIIT 45"
          start="2026-11-05T07:15:00+01:00"
          end="2026-11-05T08:00:00+01:00"
          coach={{ name: "Jonas Weber", image: portrait("#2f3236", "#6b7078") }}
          room="The Loft"
          level="Intermediate"
          capacity={16}
          spots={0}
          status={hiit}
          onWaitlist={async () => {
            await wait(700);
            setHiit("booked");
          }}
          onCancel={async () => {
            await wait(600);
            setHiit("full");
          }}
          labels={WAITLIST}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Booked: Cancel in place of Book. It frees the spot.">
        <ClassSessionCard
          title="Mobility and breath"
          start="2026-11-05T12:15:00+01:00"
          end="2026-11-05T13:00:00+01:00"
          coach={{ name: "Lena Fischer" }}
          room="Studio 1"
          level="Beginner"
          capacity={12}
          spots={mobility.spots}
          status={mobility.status}
          onBook={async () => {
            await wait(700);
            setMobility({ status: "booked", spots: mobility.spots - 1 });
          }}
          onCancel={async () => {
            await wait(600);
            setMobility({ status: "open", spots: mobility.spots + 1 });
          }}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Cancelled by the studio: muted, struck through.">
        <ClassSessionCard
          title="Spin 60"
          start="2026-11-05T19:45:00+01:00"
          end="2026-11-05T20:45:00+01:00"
          coach={{ name: "Marco Rossi" }}
          room="Cycle room"
          level="Intermediate"
          status="cancelled"
          capacity={20}
          spots={9}
          className="flex-1"
          {...ZONE}
        />
      </Case>
    </div>
  );
}
