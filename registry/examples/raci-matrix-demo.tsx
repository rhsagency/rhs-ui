"use client";

import { useState, type ReactNode } from "react";

import { RaciMatrix, type RaciPerson, type RaciTask, type RaciValue } from "@rhs-ui/dashboard/raci-matrix";

const team: RaciPerson[] = [
  { id: "mara", name: "Mara Visser", role: "Product lead" },
  { id: "tom", name: "Tom Jansen", role: "Design lead" },
  { id: "priya", name: "Priya Nair", role: "Engineering" },
  { id: "hana", name: "Hana Okafor", role: "Frontend" },
  { id: "joost", name: "Joost de Boer", role: "Marketing" },
  { id: "sofia", name: "Sofia Alvarez", role: "Legal counsel" },
];

const relaunch: RaciTask[] = [
  { id: "interviews", label: "Stakeholder interviews", group: "Discovery" },
  { id: "audit", label: "Competitor audit", group: "Discovery" },
  { id: "metrics", label: "Success metrics", group: "Discovery" },
  { id: "brand", label: "Brand guidelines", group: "Design" },
  { id: "review", label: "Design review", group: "Design" },
  { id: "testing", label: "Prototype testing", group: "Design" },
  { id: "frontend", label: "Frontend build", group: "Build" },
  { id: "a11y", label: "Accessibility audit", group: "Build" },
  { id: "migration", label: "Content migration", group: "Build" },
  { id: "legal", label: "Legal review", group: "Launch" },
  { id: "announce", label: "Launch announcement", group: "Launch" },
];

// Two rows are wrong on purpose: Legal review has two accountable people and the Launch announcement has none.
const relaunchRoles: RaciValue = {
  interviews: { mara: "A", tom: "R", joost: "C", priya: "I" },
  audit: { joost: "A", tom: "R", mara: "C", hana: "I" },
  metrics: { mara: "A", priya: "R", joost: "C", tom: "I" },
  brand: { tom: "A", joost: "R", mara: "C", sofia: "I" },
  review: { mara: "A", tom: "R", priya: "C", hana: "C", joost: "I" },
  testing: { tom: "A", hana: "R", mara: "C", joost: "I" },
  frontend: { priya: "A", hana: "R", tom: "C", mara: "I" },
  a11y: { priya: "A", hana: "R", tom: "C", sofia: "I" },
  migration: { priya: "A", joost: "R", hana: "C", mara: "I" },
  legal: { sofia: "A", mara: "A", joost: "C", priya: "I" },
  announce: { joost: "R", mara: "C", tom: "I", sofia: "C", hana: "I" },
};

const movers: RaciPerson[] = [
  { id: "anna", name: "Anna de Vries", role: "Office manager" },
  { id: "mo", name: "Mo Haddad", role: "IT" },
  { id: "lena", name: "Lena Fischer", role: "Facilities" },
  { id: "tomas", name: "Tomas Berg", role: "Finance" },
];

const move: RaciTask[] = [
  { id: "lease", label: "Sign the new lease", group: "Before the move" },
  { id: "network", label: "Order network and wifi", group: "Before the move" },
  { id: "furniture", label: "Choose the furniture", group: "Before the move" },
  { id: "pack", label: "Pack and label the old office", group: "Move day" },
  { id: "setup", label: "Set up desks and monitors", group: "Move day" },
];

const moveRoles: RaciValue = {
  lease: { anna: "R", tomas: "A", mo: "I", lena: "C" },
  network: { mo: "A", anna: "C", lena: "I" },
  furniture: { lena: "A", anna: "R", tomas: "C" },
  pack: { lena: "R", anna: "A", mo: "I" },
  setup: { mo: "R", lena: "R", anna: "I" },
};

function Example({ title, description, children }: { title: string; description: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h3 className="text-base font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-1 mb-5 max-w-2xl text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [roles, setRoles] = useState<RaciValue>(relaunchRoles);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-14 px-4 py-10 sm:px-6">
      <Example
        title="Website relaunch"
        description="Click a cell, or focus it and press R, A, C or I. Two rows are wrong on purpose: give each exactly one A and the line above clears."
      >
        <RaciMatrix caption="Website relaunch: who does what" tasks={relaunch} people={team} value={roles} onValueChange={setRoles} defaultCollapsedGroups={["Discovery"]} />
      </Example>

      <div className="max-w-3xl">
        <Example
          title="Office move, read only"
          description="The same chart for an approval screen or a report. The folded group still says when a task inside it needs attention."
        >
          <RaciMatrix caption="Office move: who does what" tasks={move} people={movers} defaultValue={moveRoles} readOnly defaultCollapsedGroups={["Move day"]} />
        </Example>
      </div>
    </div>
  );
}
