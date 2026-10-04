"use client";

import { useState } from "react";

import { KanbanBoard, type KanbanColumn } from "@rhs-ui/application/kanban-board";

const START: KanbanColumn[] = [
  { id: "todo", title: "To do", cards: [{ id: "a", title: "Pricing page copy", meta: "Marketing · AD" }, { id: "b", title: "Import from Asana", meta: "Engineering · LR" }, { id: "c", title: "Onboarding emails", meta: "Growth · MT" }] },
  { id: "doing", title: "In progress", limit: 2, cards: [{ id: "d", title: "Exports above 10k rows", meta: "Engineering · DP" }, { id: "e", title: "Guest links", meta: "Product · SH" }] },
  { id: "review", title: "Review", cards: [{ id: "f", title: "New empty states", meta: "Design · MT" }] },
  { id: "done", title: "Done", cards: [{ id: "g", title: "Two-step sign-in", meta: "Security · LR" }] },
];

export default function Demo(): React.JSX.Element {
  const [columns, setColumns] = useState(START);
  function move(cardId: string, toColumn: string, toIndex: number) {
    setColumns((current) => {
      const card = current.flatMap((col) => col.cards).find((item) => item.id === cardId);
      if (!card) return current;
      const without = current.map((col) => ({ ...col, cards: col.cards.filter((item) => item.id !== cardId) }));
      return without.map((col) => (col.id === toColumn ? { ...col, cards: [...col.cards.slice(0, toIndex), card, ...col.cards.slice(toIndex)] } : col));
    });
  }
  return (
    <div className="p-6">
      <KanbanBoard label="Spring launch" columns={columns} onMove={move} />
    </div>
  );
}
