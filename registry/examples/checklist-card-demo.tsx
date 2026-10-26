"use client";

import { useRef, useState } from "react";

import { ChecklistCard, type ChecklistItem } from "@rhs-ui/application/checklist-card";

const LAUNCH: readonly ChecklistItem[] = [
  { id: "notes", label: "Write the release notes", done: true, note: "Mara, in the shared draft" },
  { id: "rollback", label: "Rehearse the rollback on staging", done: true, note: "Tomas, Tuesday afternoon" },
  { id: "analytics", label: "Review the analytics events for the new checkout", note: "Waiting on Priya" },
  { id: "support", label: "Tell support about the new returns flow" },
  { id: "email", label: "Schedule the announcement email for Thursday 09:00", done: true },
];

const PACKING: readonly ChecklistItem[] = [
  { id: "passport", label: "Passport and boarding passes", done: true },
  { id: "charger", label: "Laptop, phone and chargers", done: true },
  { id: "adapter", label: "Travel adapter", done: true },
  { id: "meds", label: "Medication", done: true },
  { id: "camera", label: "Camera and two spare batteries", done: true },
  { id: "jacket", label: "Rain jacket", done: true },
];

function useList(start: readonly ChecklistItem[]) {
  const [items, setItems] = useState(start);
  const next = useRef(0);
  return {
    items,
    onToggle: (id: string, done: boolean) => setItems((list) => list.map((item) => (item.id === id ? { ...item, done } : item))),
    onAdd: (label: string) => {
      next.current += 1;
      setItems((list) => [...list, { id: `new-${next.current}`, label }]);
    },
    onRemove: (id: string) => setItems((list) => list.filter((item) => item.id !== id)),
  };
}

export default function Demo(): React.JSX.Element {
  const launch = useList(LAUNCH);
  const packing = useList(PACKING);

  return (
    <div className="grid w-full max-w-4xl items-start gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <ChecklistCard title="Launch checklist" description="Everything that has to happen before Thursday's release." {...launch} />
        <p className="text-xs text-muted-foreground">Check an item, add one with Enter, or fold the finished ones away.</p>
      </div>
      <div className="grid gap-2">
        <ChecklistCard title="Packing list" description="Lisbon, four days." progressLabel="{done} of {total} packed" {...packing} onAdd={undefined} onRemove={undefined} />
        <p className="text-xs text-muted-foreground">With every item checked the count gives way to a quiet line. Uncheck one to see it count again.</p>
      </div>
    </div>
  );
}
