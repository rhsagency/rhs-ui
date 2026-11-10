"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";

import { AlphabetIndex } from "@rhs-ui/primitives/alphabet-index";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";

const CONTACTS: readonly (readonly [string, string])[] = [
  ["Amara Osei", "Design lead, Kestrel & Co"],
  ["Anders Holm", "Buyer, Fernhill Garden"],
  ["Beatriz Lopes", "Operations, Atlas Courier"],
  ["Bram de Wit", "Owner, Polder Bakery"],
  ["Camille Laurent", "Finance, Tidewater Books"],
  ["Chidi Okeke", "Engineer, Lumen Labs"],
  ["Cora Whitfield", "Partnerships, Northwind"],
  ["Dara Nwosu", "Support, Halcyon Studio"],
  ["Dmitri Volkov", "Logistics, Atlas Courier"],
  ["Elif Demir", "Founder, Kestrel & Co"],
  ["Elias Brandt", "Sales, Northwind"],
  ["Farah Haddad", "Product, Lumen Labs"],
  ["Felix Aaltonen", "Studio manager, Halcyon"],
  ["Gabriel Santos", "Warehouse, Fernhill Garden"],
  ["Greta Lindgren", "Editor, Tidewater Books"],
  ["Hana Kobayashi", "Designer, Halcyon Studio"],
  ["Hugo Marchetti", "Chef, Polder Bakery"],
  ["Jonas Lindqvist", "CTO, Lumen Labs"],
  ["Joy Adeyemi", "Recruiter, Northwind"],
  ["Julia Novak", "Accounts, Kestrel & Co"],
  ["Kaito Mori", "Photographer, Halcyon"],
  ["Katya Ivanova", "Researcher, Lumen Labs"],
  ["Lena Hartmann", "Head of CX, Northwind"],
  ["Luca Bianchi", "Courier, Atlas Courier"],
  ["Mara Okafor", "CEO, Halcyon Studio"],
  ["Mateo Ruiz", "Barista, Polder Bakery"],
  ["Mei Tanaka", "Analyst, Kestrel & Co"],
  ["Nadia Rahman", "Legal, Northwind"],
  ["Noor Hassan", "Buyer, Tidewater Books"],
  ["Omar Farouk", "Driver, Atlas Courier"],
  ["Oskar Nilsson", "Gardener, Fernhill Garden"],
  ["Pieter Bos", "Baker, Polder Bakery"],
  ["Priya Raman", "Billing, Halcyon Studio"],
  ["Rafael Costa", "Engineer, Lumen Labs"],
  ["Ruth Abebe", "Director, Tidewater Books"],
  ["Sana Qureshi", "Sales, Kestrel & Co"],
  ["Sven Eriksson", "Dispatcher, Atlas Courier"],
  ["Tessa van Dijk", "Marketing, Northwind"],
  ["Tomasz Wrona", "Platform, Lumen Labs"],
  ["Vera Petrova", "Curator, Tidewater Books"],
  ["Wei Zhang", "Procurement, Fernhill Garden"],
  ["Willa Brooks", "Producer, Halcyon Studio"],
  ["Yusuf Demir", "Operations, Kestrel & Co"],
];

interface Group {
  letter: string;
  people: readonly (readonly [string, string])[];
}

function grouped(): Group[] {
  const map = new Map<string, (readonly [string, string])[]>();
  for (const person of CONTACTS) {
    const letter = person[0].charAt(0).toUpperCase();
    map.set(letter, [...(map.get(letter) ?? []), person]);
  }
  return [...map].map(([letter, people]) => ({ letter, people }));
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Contacts(): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  const quiet = useRef(0);
  const groups = useMemo(grouped, []);
  const letters = useMemo(() => groups.map((group) => group.letter), [groups]);
  const [value, setValue] = useState("A");

  const sectionOf = (letter: string) => scroller.current?.querySelector<HTMLElement>(`[data-letter="${letter}"]`) ?? null;

  /** The list follows the finger at once: a scrub calls this on every letter it crosses, so it never glides. */
  function jump(letter: string) {
    const section = sectionOf(letter);
    if (scroller.current && section) scroller.current.scrollTop = section.offsetTop;
    // The scroll this causes is not the reader's: the rail keeps the letter that was chosen, even when the list cannot go that far.
    quiet.current = performance.now() + 150;
    setValue(letter);
  }

  /** The letter whose section is at the top of the list, and the last one once the list can go no further. */
  function follow() {
    const box = scroller.current;
    if (!box || performance.now() < quiet.current) return;
    let current = letters[0] ?? "A";
    for (const letter of letters) if ((sectionOf(letter)?.offsetTop ?? 0) <= box.scrollTop + 1) current = letter;
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 1) current = letters[letters.length - 1] ?? current;
    setValue(current);
  }

  return (
    <div className="flex h-[30rem] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Contacts</h2>
        <p className="text-xs text-muted-foreground tabular-nums">{CONTACTS.length} people</p>
      </div>
      <div className="flex min-h-0 flex-1">
        <div ref={scroller} tabIndex={0} role="region" aria-label="Contacts" onScroll={follow} className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40">
          {groups.map((group) => (
            <section key={group.letter} data-letter={group.letter} aria-label={group.letter}>
              <h3 className="sticky top-0 z-[1] border-b border-border bg-muted px-4 py-1 text-xs font-semibold text-muted-foreground">{group.letter}</h3>
              <ul>
                {group.people.map(([name, role]) => (
                  <li key={name} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                    <Avatar size="sm">
                      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">{role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="border-l border-border py-2 pr-1.5 pl-1">
          <AlphabetIndex available={letters} value={value} onSelect={jump} className="h-full" />
        </div>
      </div>
    </div>
  );
}

const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"] as const;
const REPORTS: Record<string, string> = {
  "2020": "61 pages, remote first",
  "2022": "88 pages, the Rotterdam hub opens",
  "2023": "97 pages, carbon neutral deliveries",
  "2024": "112 pages, 1 million parcels",
  "2025": "120 pages, the Halcyon partnership",
  "2026": "Draft, due in April",
};

function Reports(): React.JSX.Element {
  const [year, setYear] = useState("2024");
  return (
    <div className="grid w-full max-w-sm gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold tracking-[-0.02em]">Annual reports</h2>
        <p className="text-xs text-muted-foreground">No report was published for 2021, so it is dimmed and skipped.</p>
      </div>
      <AlphabetIndex orientation="horizontal" letters={YEARS} available={YEARS.filter((item) => item in REPORTS)} value={year} onSelect={setYear} label="Report years" />
      <div className="rounded-lg border border-dashed border-border px-4 py-5">
        <p className="text-sm font-medium tabular-nums">{year}</p>
        <p className="text-sm text-muted-foreground">{REPORTS[year]}</p>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2 md:items-start">
      <Example caption="Press or drag along the rail: the list follows and the bubble shows the letter. Letters nobody has are dimmed.">
        <Contacts />
      </Example>
      <Example caption="Any strings work, here along the top. Tab into the rail, move with the arrow keys, press Enter.">
        <Reports />
      </Example>
    </div>
  );
}
