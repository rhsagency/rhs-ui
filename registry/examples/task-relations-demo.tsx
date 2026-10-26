"use client";

import { useState } from "react";

import { TaskRelations, type RelatedTask, type RelationKind, type TaskRelationsData } from "@rhs-ui/application/task-relations";
import { IconCheck } from "@rhs-ui/icons";

const task = (key: number, title: string, status: RelatedTask["status"]): RelatedTask => ({ id: `nw-${key}`, key: `NW-${key}`, title, status, href: `#nw-${key}` });

const START: TaskRelationsData = {
  blockedBy: [
    task(142, "Fix checkout redirect for guest carts", "in-progress"),
    task(150, "Migrate card tokens to the new vault", "todo"),
    task(131, "Update the Stripe webhook secrets", "done"),
    task(128, "Approve the PSD2 exemption text", "cancelled"),
  ],
  blocks: [task(171, "Announce the new checkout in the newsletter", "todo"), task(173, "Retire the legacy checkout page", "todo")],
  related: [task(99, "Checkout conversion dashboard", "in-review"), task(87, "Guest cart analytics", "done")],
};

const CANDIDATES: readonly RelatedTask[] = [
  task(155, "Add the saved-card path to staging", "in-progress"),
  task(158, "Localise the checkout copy", "todo"),
  task(164, "Fix the Apple Pay button on Safari", "in-review"),
  task(166, "Document the checkout events", "todo"),
  task(180, "Audit tax rounding on invoices", "done"),
];

const READ_ONLY: TaskRelationsData = {
  related: [task(204, "Onboarding checklist copy", "done"), task(211, "Welcome email redesign", "in-progress")],
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const GROUP_KEY: Record<RelationKind, keyof TaskRelationsData> = { "blocked-by": "blockedBy", blocks: "blocks", related: "related" };

export default function Demo(): React.JSX.Element {
  const [relations, setRelations] = useState(START);
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto grid w-full max-w-xl gap-8">
      <section aria-label="Task NW-160" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="grid gap-0.5 border-b border-border px-4 py-3.5">
          <p className="font-mono text-xs text-muted-foreground tabular-nums">NW-160</p>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Ship the new checkout flow</h2>
        </div>
        <TaskRelations
          relations={relations}
          candidates={CANDIDATES}
          canEdit
          headingLevel={3}
          onOpen={(related, event) => {
            event.preventDefault();
            setNote(`Opening ${related.key}.`);
          }}
          onAdd={async (kind, related) => {
            await wait(500);
            setRelations((current) => ({ ...current, [GROUP_KEY[kind]]: [...(current[GROUP_KEY[kind]] ?? []), related] }));
          }}
          onRemove={async (kind, related) => {
            await wait(500);
            setRelations((current) => ({ ...current, [GROUP_KEY[kind]]: (current[GROUP_KEY[kind]] ?? []).filter((item) => item.id !== related.id) }));
          }}
        />
        <p aria-live="polite" className="flex min-h-11 items-center gap-2 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          {note ? (
            <>
              <IconCheck className="size-3.5 shrink-0 text-foreground" />
              {note}
            </>
          ) : (
            "Add a link, remove one, or open a task. Resolved blockers fold away behind a count."
          )}
        </p>
      </section>

      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">Read-only, and calm: empty groups are not drawn.</p>
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <TaskRelations relations={READ_ONLY} headingLevel={3} labels={{ heading: "Related work" }} onOpen={(related, event) => { event.preventDefault(); setNote(`Opening ${related.key}.`); }} />
        </div>
      </div>
    </div>
  );
}
