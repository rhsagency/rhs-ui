"use client";

import { useState, type ReactNode } from "react";

import { CompetitionResultsTable, type CompetitionResult, type ResultCategory } from "@rhs-ui/application/competition-results-table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState<CompetitionResult | null>(null);
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 p-2 sm:p-6">
      <Example caption="Half marathon by category, one athlete highlighted">
        <CompetitionResultsTable
          results={HALF_MARATHON}
          categories={CATEGORIES}
          highlightName="Noor Hendrix"
          caption="Kestrel Coast Half Marathon, 2026"
          onSelect={setOpened}
        />
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {opened ? `You opened ${opened.name} (bib ${opened.bib}). Your own page would show the split times here.` : "Press an athlete's name to open the result."}
        </p>
      </Example>

      <Example caption="Swimming final with official places and lanes">
        <CompetitionResultsTable results={FINAL} precision={2} caption="Mixed 100 m freestyle, final" labels={{ bib: "Lane", bibFolded: "Lane {bib}" }} />
      </Example>
    </div>
  );
}

const CATEGORIES: readonly ResultCategory[] = [
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "women-40", label: "Women 40+" },
  { id: "men-40", label: "Men 40+" },
];

// No place is given, so the table ranks by time: Noor Hendrix and Amara Okafor crossed the line together and share second place.
const HALF_MARATHON: readonly CompetitionResult[] = [
  { name: "Tobias Ricci", club: "Kestrel AC", bib: 101, category: "men", time: "1:01:58", marks: ["personal-best"] },
  { name: "Daan Vermeulen", club: "Fjord AC", bib: 112, category: "men", time: "1:02:40" },
  { name: "Ilse Verbeek", club: "Fjord AC", bib: 118, category: "women", time: "1:08:42", marks: ["record"], note: "Course record, by 1:07" },
  { name: "Elias Brandt", club: "Harbour Park RC", bib: 127, category: "men", time: "1:04:11" },
  { name: "Ravi Menon", club: "Polder Runners", bib: 133, category: "men", time: "1:05:09" },
  { name: "Jonas Aalto", club: "Northwind RC", bib: 140, category: "men", time: "1:06:33" },
  { name: "Stefan Kruger", club: "Oak Lane TC", bib: 311, category: "men-40", time: "1:09:45", marks: ["season-best"] },
  { name: "Noor Hendrix", club: "Polder Runners", bib: 204, category: "women", time: "1:11:15", marks: ["personal-best"] },
  { name: "Amara Okafor", club: "Kestrel AC", bib: 131, category: "women", time: "1:11:15" },
  { name: "Henk Dijkstra", club: "Halcyon Joggers", bib: 318, category: "men-40", time: "1:13:20" },
  { name: "Saskia de Wit", club: "Oak Lane TC", bib: 219, category: "women", time: "1:14:03" },
  { name: "Mette Lindqvist", club: "Northwind RC", bib: 226, category: "women", time: "1:16:48", marks: ["season-best"] },
  { name: "Omar Rahimi", club: "Atlas AC", bib: 324, category: "men-40", time: "1:17:05" },
  { name: "Yara Haddad", club: "Halcyon Joggers", bib: 233, category: "women", time: "1:19:20" },
  { name: "Karin Joosten", club: "Juniper TC", bib: 402, category: "women-40", time: "1:21:30", marks: ["personal-best"] },
  { name: "Helga Brandt", club: "Harbour Park RC", bib: 409, category: "women-40", time: "1:25:12" },
  { name: "Piet Jansen", club: "Atlas AC", bib: 148, category: "men", status: "dnf" },
  { name: "Joanna Kowal", club: "Atlas AC", bib: 240, category: "women", status: "dnf" },
  { name: "Lucas Moreau", club: "Juniper TC", bib: 155, category: "men", time: "1:03:02", status: "dsq", note: "Cut the course at 14 km" },
  { name: "Freya Nilsen", club: "Northwind RC", bib: 247, category: "women", status: "dns" },
];

// Official places, given for every finisher, so the table trusts them: here a 0.31 s margin decided the final, and two swimmers share third.
// In a pool the number beside a swimmer is the lane, so `bib` holds it and the demo's labels rename the column.
const FINAL: readonly CompetitionResult[] = [
  { place: 1, name: "Mika Sorensen", club: "Fjord Swim", bib: 4, time: 57.84, marks: ["personal-best"] },
  { place: 2, name: "Alba Ferreira", club: "Kestrel Aquatics", bib: 5, time: 58.15 },
  { place: 3, name: "Jules Moreau", club: "Harbour Park SC", bib: 3, time: 58.97 },
  { place: 3, name: "Noor Hendrix", club: "Polder Swim", bib: 6, time: 58.97 },
  { place: 5, name: "Tilda Aaberg", club: "Northwind SC", bib: 2, time: "1:00.21" },
  { place: 6, name: "Rafael Costa", club: "Oak Lane Swim", bib: 7, time: "1:00.64", marks: ["season-best"] },
  { place: 7, name: "Eun-ji Park", club: "Halcyon Aquatics", bib: 1, time: "1:01.08" },
  { name: "Viktor Lang", club: "Atlas Swim", bib: 8, status: "dsq", note: "Early take-off" },
];
