"use client";

import type { ReactNode } from "react";

import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { GroupedList, type ListGroup } from "@rhs-ui/primitives/grouped-list";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Contact = { id: string; first: string; last: string; role: string };

const CONTACTS: readonly Contact[] = [
  { id: "c01", first: "Chidi", last: "Abara", role: "Engineer, Kestrel Analytics" },
  { id: "c02", first: "Freja", last: "Andersen", role: "Product lead, Fjord Freight" },
  { id: "c03", first: "Daan", last: "Bakker", role: "Support, Oak Lane Bakery" },
  { id: "c04", first: "Inês", last: "Barros", role: "Designer, Halcyon Labs" },
  { id: "c05", first: "Wei", last: "Chen", role: "Finance, Northwind Traders" },
  { id: "c06", first: "Marco", last: "Costa", role: "Sales, Lumen Energy" },
  { id: "c07", first: "Anouk", last: "Dijkstra", role: "Operations, Mirror Labs" },
  { id: "c08", first: "Sofie", last: "Eriksen", role: "Legal, Fjord Freight" },
  { id: "c09", first: "Camille", last: "Fontaine", role: "Brand, Halcyon Labs" },
  { id: "c10", first: "Lucía", last: "Garcia", role: "Engineer, Northwind Traders" },
  { id: "c11", first: "Ben", last: "Hartley", role: "Founder, Oak Lane Bakery" },
  { id: "c12", first: "Haruto", last: "Ito", role: "Data, Kestrel Analytics" },
  { id: "c13", first: "Mila", last: "Jovanović", role: "Support, Mirror Labs" },
  { id: "c14", first: "Piotr", last: "Kowalski", role: "Warehouse, Lumen Energy" },
  { id: "c15", first: "Élise", last: "Laurent", role: "Finance, Halcyon Labs" },
  { id: "c16", first: "Lucas", last: "Moreau", role: "Support, Northwind Traders" },
  { id: "c17", first: "Grace", last: "Mwangi", role: "Sales, Fjord Freight" },
  { id: "c18", first: "Priya", last: "Nair", role: "Support, Mirror Labs" },
  { id: "c19", first: "Mara", last: "Okafor", role: "Support lead, Halcyon Labs" },
  { id: "c20", first: "Katya", last: "Petrov", role: "Engineer, Lumen Energy" },
  { id: "c21", first: "Émile", last: "Roche", role: "Studio, Oak Lane Bakery" },
  { id: "c22", first: "Ana", last: "Santos", role: "Design, Kestrel Analytics" },
  { id: "c23", first: "Jonas", last: "Schmidt", role: "Engineer, Mirror Labs" },
  { id: "c24", first: "Aiko", last: "Tanaka", role: "Designer, Mirror Labs" },
  { id: "c25", first: "Mateo", last: "Vargas", role: "Sales, Lumen Energy" },
  { id: "c26", first: "Jonas", last: "Weber", role: "Engineer, Kestrel Analytics" },
  { id: "c27", first: "Tess", last: "Wright", role: "Success, Northwind Traders" },
  { id: "c28", first: "Nina", last: "Zielinski", role: "Product, Halcyon Labs" },
];

/** The contacts under the first letter of their last name, in order, as the groups of the list. */
function byLetter(contacts: readonly Contact[]): ListGroup<Contact>[] {
  const sorted = [...contacts].sort((a, b) => a.last.localeCompare(b.last, "en") || a.first.localeCompare(b.first, "en"));
  const groups = new Map<string, Contact[]>();
  for (const contact of sorted) {
    const letter = (contact.last[0] ?? "#").normalize("NFD").charAt(0).toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), contact]);
  }
  return [...groups].map(([letter, items]) => ({ id: letter, label: letter, items }));
}

type Entry = { id: string; who: string; did: string; time: string };

const ACTIVITY: readonly ListGroup<Entry>[] = [
  {
    id: "2026-11-10",
    items: [
      { id: "e1", who: "Mara Okafor", did: "closed ticket #4821", time: "14:02" },
      { id: "e2", who: "Jonas Weber", did: "merged the checkout fix", time: "11:48" },
      { id: "e3", who: "Priya Nair", did: "replied to Kestrel Analytics", time: "10:15" },
      { id: "e4", who: "Lucas Moreau", did: "marked INV-1043 as paid", time: "09:30" },
    ],
  },
  {
    id: "2026-11-09",
    items: [
      { id: "e5", who: "Aiko Tanaka", did: "shared the onboarding designs", time: "17:20" },
      { id: "e6", who: "Mara Okafor", did: "invited Haruto Ito", time: "13:05" },
      { id: "e7", who: "Jonas Weber", did: "opened ticket #4833", time: "09:12" },
    ],
  },
  {
    id: "2026-11-07",
    items: [
      { id: "e8", who: "Priya Nair", did: "published the pricing FAQ", time: "16:40" },
      { id: "e9", who: "Lucas Moreau", did: "refunded order #1180", time: "10:02" },
    ],
  },
  {
    id: "2026-11-05",
    items: [
      { id: "e10", who: "Aiko Tanaka", did: "updated the brand guidelines", time: "15:55" },
      { id: "e11", who: "Mara Okafor", did: "approved the Q4 budget", time: "12:10" },
      { id: "e12", who: "Jonas Weber", did: "rotated the API keys", time: "08:45" },
    ],
  },
  {
    id: "2026-11-02",
    items: [
      { id: "e13", who: "Priya Nair", did: "joined the support rota", time: "14:30" },
      { id: "e14", who: "Lucas Moreau", did: "created the Northwind account", time: "09:00" },
    ],
  },
];

const TODAY = "2026-11-10";
const dayName = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** "2026-11-10" becomes Today, the day before Yesterday, and any other day its weekday and date. */
function dayLabel(group: ListGroup<Entry>): string {
  const days = Math.round((Date.parse(TODAY) - Date.parse(group.id)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return dayName.format(new Date(group.id));
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 p-4 sm:p-8 md:grid-cols-2">
      <Example caption="A letter rail for A to Z lists: Tab once, then Up and Down, Enter to jump">
        {/* Twenty-two letters at 24 pixels each fit in 34rem; a shorter list would make the rail scroll. */}
        <GroupedList
          label="Contacts"
          groups={byLetter(CONTACTS)}
          indexRail
          className="h-[34rem]"
          renderItem={(contact) => (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>{initialsOf(`${contact.first} ${contact.last}`)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm leading-5 font-medium">
                  {contact.first} {contact.last}
                </p>
                <p className="truncate text-xs leading-4 text-muted-foreground">{contact.role}</p>
              </div>
            </div>
          )}
        />
      </Example>
      <Example caption="Sticky day headings, with dates written as Today and Yesterday">
        <GroupedList
          label="Team activity"
          groups={ACTIVITY}
          getGroupLabel={dayLabel}
          className="h-[34rem]"
          renderItem={(event) => (
            <div className="flex items-baseline gap-3">
              <span className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">{event.time}</span>
              <p className="min-w-0 text-sm">
                <span className="font-medium">{event.who}</span> <span className="text-muted-foreground">{event.did}</span>
              </p>
            </div>
          )}
        />
      </Example>
    </div>
  );
}
