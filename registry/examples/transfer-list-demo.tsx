"use client";

import { useState, type ReactNode } from "react";

import { TransferList, type TransferItem } from "@rhs-ui/application/transfer-list";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const MEMBERS: readonly TransferItem[] = [
  { id: "sofia", label: "Sofia Lindqvist", description: "Project lead", disabled: true },
  { id: "amara", label: "Amara Okafor", description: "Product designer" },
  { id: "tomas", label: "Tomás Herrera", description: "Frontend engineer" },
  { id: "priya", label: "Priya Raman", description: "Backend engineer" },
  { id: "jonas", label: "Jonas Verhoeven", description: "Data analyst" },
  { id: "mei", label: "Mei Tanaka", description: "Illustrator" },
  { id: "lucas", label: "Lucas Moreau", description: "Copywriter" },
  { id: "fatima", label: "Fatima Al-Sayed", description: "QA engineer" },
  { id: "noah", label: "Noah Fischer", description: "Motion designer" },
  { id: "ingrid", label: "Ingrid Solberg", description: "Accessibility specialist" },
  { id: "diego", label: "Diego Alvarez", description: "Support lead" },
  { id: "hannah", label: "Hannah Cohen", description: "Finance partner" },
  { id: "kofi", label: "Kofi Mensah", description: "DevOps engineer" },
  { id: "elena", label: "Elena Petrova", description: "Researcher" },
];

const COLUMNS: readonly TransferItem[] = [
  { id: "order", label: "Order", description: "The order number", disabled: true },
  { id: "customer", label: "Customer" },
  { id: "date", label: "Placed on" },
  { id: "total", label: "Total" },
  { id: "status", label: "Status" },
  { id: "payment", label: "Payment method" },
  { id: "shipping", label: "Shipping method" },
  { id: "channel", label: "Sales channel" },
  { id: "tags", label: "Tags" },
  { id: "notes", label: "Internal notes" },
];

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

export default function Demo(): React.JSX.Element {
  const [team, setTeam] = useState<string[]>(["sofia", "amara", "tomas"]);
  const [columns, setColumns] = useState<string[]>(["order", "customer", "total", "status"]);

  const names = team.map((id) => MEMBERS.find((member) => member.id === id)?.label ?? id);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-10 sm:px-6">
      <Example caption="Try it: click or Space to select, Shift with the arrows for a range, Enter or a double click to move. The focus stays where the items were, and Sofia is locked.">
        <div className={card}>
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold tracking-[-0.02em]">Kestrel redesign team</h2>
            <p className="text-xs text-muted-foreground">Choose who works on the project. Members get access to its files and its channel.</p>
          </div>
          <TransferList items={MEMBERS} value={team} onValueChange={setTeam} titles={{ available: "Everyone at Northwind", chosen: "On the project" }} />
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>On the project, {team.length} in all</span>
            <span className="min-w-0 text-foreground">{names.join(", ")}</span>
          </p>
        </div>
      </Example>

      <Example caption="In a narrow container the lists stack and the four buttons lie in a row between them.">
        <div className={`${card} max-w-md`}>
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold tracking-[-0.02em]">Columns in the orders table</h2>
          </div>
          <TransferList items={COLUMNS} value={columns} onValueChange={setColumns} titles={{ available: "Hidden", chosen: "Shown" }} height="12rem" />
        </div>
      </Example>
    </div>
  );
}
