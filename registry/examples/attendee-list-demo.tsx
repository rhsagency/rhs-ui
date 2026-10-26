"use client";

import { useState } from "react";

import { AttendeeList, type Attendee, type RsvpChoice } from "@rhs-ui/application/attendee-list";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconCalendar, IconPin } from "@rhs-ui/icons";

const START: readonly Attendee[] = [
  { id: "leo", name: "Leo Martins", email: "leo@northwind.studio", response: "accepted" },
  { id: "priya", name: "Priya Nair", email: "priya@northwind.studio", response: "accepted" },
  { id: "mara", name: "Mara Okafor", email: "mara@northwind.studio", response: "tentative" },
  { id: "tom", name: "Tom Brandt", email: "tom@northwind.studio", response: "accepted", optional: true },
  { id: "anna", name: "Anna de Vries", email: "anna@halcyon.io", response: "accepted" },
  { id: "jonas", name: "Jonas Keller", email: "jonas@kestrel.dev", response: "declined" },
  { id: "mia", name: "Mia Jansen", email: "mia@northwind.studio", response: "none" },
  { id: "hana", name: "Hana Sato", email: "hana.sato@kestrel.dev", response: "none" },
  { id: "sofia", name: "Sofia Rossi", email: "sofia@polder.nl", response: "tentative" },
  { id: "imke", name: "Imke Visser", email: "imke@polder.nl", response: "accepted" },
  { id: "daan", name: "Daan Bakker", email: "daan@lumen.studio", response: "none", optional: true },
  { id: "eva", name: "Eva Smit", email: "eva@northwind.studio", response: "accepted" },
  { id: "noah", name: "Noah Peters", email: "noah@lumen.studio", response: "declined" },
  { id: "lotte", name: "Lotte Hendriks", email: "lotte@northwind.studio", response: "none" },
];

const SIDE: readonly Attendee[] = [
  { id: "leo", name: "Leo Martins", email: "leo@northwind.studio", response: "accepted" },
  { id: "mara", name: "Mara Okafor", email: "mara@northwind.studio", response: "none" },
  { id: "priya", name: "Priya Nair", email: "priya@northwind.studio", response: "tentative" },
  { id: "mia", name: "Mia Jansen", email: "mia@northwind.studio", response: "declined" },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Viewer = "mara" | "leo";

export default function Demo(): React.JSX.Element {
  const [people, setPeople] = useState(START);
  const [side, setSide] = useState(SIDE);
  const [viewer, setViewer] = useState<Viewer>("mara");

  const answer = (id: string, response: RsvpChoice) => (list: readonly Attendee[]) => list.map((person) => (person.id === id ? { ...person, response } : person));

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8">
      <div className="grid gap-3">
        <section aria-label="Q4 planning workshop" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="grid gap-1.5 px-4 py-4">
            <h2 className="text-base font-semibold tracking-[-0.02em]">Q4 planning workshop</h2>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IconCalendar className="size-3.5" />
                Thursday 29 October, 10:00 to 12:00
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconPin className="size-3.5" />
                Room Kestrel
              </span>
            </p>
          </div>
          <div className="border-t border-border">
            <AttendeeList
              attendees={people}
              organizer="leo"
              you={viewer}
              onRespond={async (response) => {
                await wait(600);
                setPeople(answer(viewer, response));
              }}
              onRemind={() => wait(800)}
            />
          </div>
        </section>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-muted-foreground">View as</span>
          <SegmentedControl
            label="View the list as"
            options={[
              { value: "mara", label: "An attendee" },
              { value: "leo", label: "The organizer" },
            ]}
            value={viewer}
            onValueChange={(value) => setViewer(value as Viewer)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">In a narrow panel the answer moves under the name, and your three buttons wrap.</p>
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <AttendeeList
            attendees={side}
            organizer="leo"
            you="mara"
            labels={{ heading: "Guests" }}
            onRespond={async (response) => {
              await wait(500);
              setSide(answer("mara", response));
            }}
          />
        </div>
      </div>
    </div>
  );
}
