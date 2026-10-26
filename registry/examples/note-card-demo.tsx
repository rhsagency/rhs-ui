"use client";

import { useRef, useState } from "react";

import { NoteCard, NoteCardSkeleton, type Note, type NoteCardAction } from "@rhs-ui/application/note-card";
import { IconArchive, IconCopy, IconTrash } from "@rhs-ui/icons";

// A fixed "now" keeps "Edited 12 minutes ago" the same on every load. In an app, leave `now` out and the cards read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const START: readonly Note[] = [
  {
    id: "onboarding",
    title: "Kestrel app: onboarding copy",
    preview: "Welcome to Kestrel.\nPlan a trip in under two minutes: pick a city, drop in the dates, and we sketch the days around what is open.\nNext: ask for notifications, but only after the first saved trip.",
    editedAt: ago(12),
    href: "/notes/onboarding",
    labels: [
      { name: "Work", tone: "ink" },
      { name: "Draft", tone: "mist" },
    ],
  },
  {
    id: "lisbon",
    title: "Lisbon, 29 Oct to 1 Nov",
    preview: "Flights land at 14:20 on Thursday. The hotel is a ten minute walk from Cais do Sodré.\nDinner is booked at 20:30 on Friday, a table for four under Okafor.\nSaturday: Sintra, if the weather holds.",
    editedAt: ago(2 * 24 * 60),
    href: "/notes/lisbon",
    labels: [{ name: "Personal", tone: "stone" }],
  },
  {
    id: "supplier",
    title: "Supplier call: Halcyon Textiles",
    preview: "- Lead time is down to 18 days for the linen range\n- Minimum order stays at 120 metres\n- Ask for the new swatch book before the 3rd\n- Send the revised order by Friday",
    editedAt: ago(3 * 60),
    href: "/notes/supplier",
    labels: [
      { name: "Work", tone: "ink" },
      { name: "Suppliers", tone: "graphite" },
    ],
  },
  {
    id: "debounce",
    title: "useDebouncedValue",
    code: true,
    preview: "export function useDebouncedValue<T>(value: T, ms = 250) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), ms);\n    return () => clearTimeout(id);\n  }, [value, ms]);\n  return debounced;\n}",
    editedAt: ago(5 * 24 * 60),
    href: "/notes/debounce",
    labels: [{ name: "Snippet", tone: "stone" }],
  },
  { id: "blank", title: "", preview: "", editedAt: new Date(NOW - 40_000).toISOString(), href: "/notes/blank" },
  {
    id: "planning",
    title: "Quarterly planning: what we agreed on the roadmap, the hiring plan and the budget for the second half of next year",
    preview: "Roadmap: the checkout redesign first, then the loyalty programme. Hiring: one designer and one engineer, both starting in January. Budget: the agency retainer stays flat.",
    editedAt: ago(9 * 24 * 60),
    href: "/notes/planning",
    labels: [
      { name: "Work", tone: "ink" },
      { name: "Planning", tone: "graphite" },
      { name: "Finance", tone: "stone" },
      { name: "Leadership", tone: "mist" },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const [notes, setNotes] = useState(START);
  const [pinned, setPinned] = useState<ReadonlySet<string>>(new Set(["onboarding", "lisbon"]));
  const [said, setSaid] = useState("");
  const grid = useRef<HTMLDivElement>(null);
  const copies = useRef(0);

  function menu(note: Note): readonly NoteCardAction[] {
    return [
      {
        id: "duplicate",
        label: "Duplicate",
        icon: <IconCopy />,
        onSelect: () => {
          copies.current += 1;
          const copy: Note = { ...note, id: `${note.id}-copy-${copies.current}`, title: note.title ? `${note.title} (copy)` : "", editedAt: new Date(NOW).toISOString() };
          setNotes((list) => list.flatMap((item) => (item.id === note.id ? [item, copy] : [item])));
        },
      },
      { id: "archive", label: "Archive", icon: <IconArchive />, onSelect: () => setSaid(`${note.title || "Untitled"} was archived.`) },
      {
        id: "delete",
        label: "Delete",
        icon: <IconTrash />,
        destructive: true,
        onSelect: () => {
          setNotes((list) => list.filter((item) => item.id !== note.id));
          // The card that had focus is gone: focus moves to the grid, not to the top of the page.
          requestAnimationFrame(() => grid.current?.focus());
        },
      },
    ];
  }

  return (
    <div className="grid w-full max-w-5xl gap-3">
      <div ref={grid} tabIndex={-1} className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 outline-none">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            now={NOW}
            pinned={pinned.has(note.id)}
            onPinChange={(next) =>
              setPinned((current) => {
                const copy = new Set(current);
                if (next) copy.add(note.id);
                else copy.delete(note.id);
                return copy;
              })
            }
            menu={menu(note)}
            onOpen={(_note, event) => {
              // A preview has nowhere to go: a router would navigate here.
              event.preventDefault();
              setSaid(`Opening ${note.title || "an untitled note"}.`);
            }}
          />
        ))}
        <NoteCardSkeleton />
      </div>
      <p aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
        {said || "Pin a note, open a menu, or open a note. The last tile is the loading state."}
      </p>
    </div>
  );
}
