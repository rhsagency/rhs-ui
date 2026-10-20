"use client";

import { useState, type ReactNode } from "react";

import { IconCalendarPlus, IconCamera, IconClock, IconEdit, IconFileText, IconImage, IconUpload, IconUserPlus } from "@rhs-ui/icons";
import { SpeedDial } from "@rhs-ui/primitives/speed-dial";

const EXPENSES = [
  { title: "Train to Utrecht", note: "Travel", amount: "€18.40" },
  { title: "Lunch with the Halcyon team", note: "Meals", amount: "€48.20" },
  { title: "Coworking day pass", note: "Workspace", amount: "€22.00" },
  { title: "Design tool seats, October", note: "Software", amount: "€72.00" },
  { title: "Taxi from Schiphol", note: "Travel", amount: "€39.50" },
  { title: "Printing: 40 flyers", note: "Marketing", amount: "€31.90" },
  { title: "Domain renewal", note: "Software", amount: "€14.99" },
  { title: "Client dinner at Kestrel", note: "Meals", amount: "€126.40" },
];

const NOTES = [
  { title: "Offsite packing list", snippet: "Chargers, name tags, the good coffee" },
  { title: "Pricing page copy", snippet: "Three tiers, one sentence each." },
  { title: "Kickoff questions", snippet: "Who signs off on the brand board?" },
  { title: "Book ideas", snippet: "Quiet Tools, Small Teams" },
  { title: "Recipe: harbour stew", snippet: "Fennel, cod, saffron, a lot of patience" },
  { title: "Reading list", snippet: "Four essays on typography and tone" },
  { title: "Gift for Marit", snippet: "A print from the Kestrel Quay series" },
];

const AGENDA = [
  { time: "09:00", title: "Standup with the Northwind crew", place: "Room 2" },
  { time: "10:30", title: "Design review: onboarding", place: "Video call" },
  { time: "12:00", title: "Lunch with Aiko", place: "Harbour Street 8" },
  { time: "14:00", title: "Roadmap planning", place: "Room 4" },
  { time: "15:30", title: "Interview: product designer", place: "Video call" },
];

/** A phone-sized screen. `relative` and `overflow-hidden` keep the dial inside it. */
function Phone({ title, caption, children }: { title: string; caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid min-w-0 justify-items-center gap-4">
      <div className="relative h-[28rem] w-full max-w-[17.5rem] overflow-hidden rounded-[2rem] border border-border bg-background shadow-xs">
        <div className="flex h-12 items-end px-5 pb-2">
          <p className="text-[0.9375rem] font-semibold tracking-[-0.02em]">{title}</p>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-hidden">{children}</div>
      </div>
      <figcaption className="max-w-[17.5rem] text-center text-xs text-muted-foreground" aria-live="polite">
        {caption}
      </figcaption>
    </figure>
  );
}

function ExpensesPhone(): React.JSX.Element {
  const [last, setLast] = useState("");
  const pick = (name: string) => () => setLast(name);
  return (
    <Phone title="Expenses" caption={last ? `You chose “${last}”. The dial closed and focus went back to the button.` : "Labelled actions fan upward over a veil. Escape or a tap outside closes it."}>
      <ul className="px-5">
        {EXPENSES.map((expense) => (
          <li key={expense.title} className="flex items-center justify-between gap-3 border-b border-border/70 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] font-medium">{expense.title}</p>
              <p className="text-[0.6875rem] text-muted-foreground">{expense.note}</p>
            </div>
            <span className="shrink-0 text-[0.8125rem] tabular-nums">{expense.amount}</span>
          </li>
        ))}
      </ul>
      <SpeedDial
        className="absolute"
        defaultOpen
        label="Add to expenses"
        actions={[
          { id: "scan", label: "Scan receipt", icon: <IconCamera />, onSelect: pick("Scan receipt") },
          { id: "manual", label: "Add expense", icon: <IconEdit />, onSelect: pick("Add expense") },
          { id: "import", label: "Import bank file", icon: <IconUpload />, onSelect: pick("Import bank file") },
        ]}
      />
    </Phone>
  );
}

function NotesPhone(): React.JSX.Element {
  const [last, setLast] = useState("");
  const pick = (name: string) => () => setLast(name);
  return (
    <Phone title="Notes" caption={last ? `You chose “${last}”.` : "Fanning left, with a short label above each button."}>
      <ul className="px-5">
        {NOTES.map((note) => (
          <li key={note.title} className="border-b border-border/70 py-3">
            <p className="truncate text-[0.8125rem] font-medium">{note.title}</p>
            <p className="truncate text-xs text-muted-foreground">{note.snippet}</p>
          </li>
        ))}
      </ul>
      <SpeedDial
        className="absolute"
        defaultOpen
        direction="left"
        label="New note"
        actions={[
          { id: "text", label: "Text", icon: <IconFileText />, onSelect: pick("Text") },
          { id: "photo", label: "Photo", icon: <IconImage />, onSelect: pick("Photo") },
        ]}
      />
    </Phone>
  );
}

function AgendaPhone(): React.JSX.Element {
  const [last, setLast] = useState("");
  const pick = (name: string) => () => setLast(name);
  return (
    <Phone title="Today" caption={last ? `You chose “${last}”.` : "Closed, on the left. Press it, or focus it and use the arrow keys."}>
      <ul className="px-5">
        {AGENDA.map((item) => (
          <li key={item.time} className="grid grid-cols-[3rem_1fr] gap-3 border-b border-border/70 py-3">
            <span className="text-xs text-muted-foreground tabular-nums">{item.time}</span>
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] font-medium">{item.title}</p>
              <p className="text-[0.6875rem] text-muted-foreground">{item.place}</p>
            </div>
          </li>
        ))}
      </ul>
      <SpeedDial
        className="absolute"
        position="bottom-left"
        label="Add to agenda"
        actions={[
          { id: "event", label: "New event", icon: <IconCalendarPlus />, onSelect: pick("New event") },
          { id: "invite", label: "Invite someone", icon: <IconUserPlus />, onSelect: pick("Invite someone") },
          { id: "task", label: "Block focus time", icon: <IconClock />, onSelect: pick("Block focus time"), disabled: true },
        ]}
      />
    </Phone>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <div className="grid gap-x-8 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]">
        <ExpensesPhone />
        <NotesPhone />
        <AgendaPhone />
      </div>
    </div>
  );
}
