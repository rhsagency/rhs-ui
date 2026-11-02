"use client";

import { useState, type ReactNode } from "react";

import { FirstRunState, type FirstRunOption } from "@rhs-ui/application/first-run-state";
import { IconCheckCircle, IconDatabase, IconFileSheet, IconLayout, IconPlug, IconTable, IconUpload, IconUserPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">{children}</div>
    </div>
  );
}

const SOURCES: readonly FirstRunOption[] = [
  { id: "csv", title: "Upload a CSV file", description: "Drop a file and we read the columns.", icon: <IconFileSheet />, href: "#csv" },
  { id: "sheets", title: "Connect Google Sheets", description: "Keep a live copy of the sheet you already use.", icon: <IconTable />, href: "#sheets" },
  { id: "postgres", title: "Connect a database", description: "Postgres, MySQL or SQL Server, read-only.", icon: <IconDatabase />, href: "#database" },
  { id: "api", title: "Call an API", description: "Pull from any REST endpoint on a schedule.", icon: <IconPlug />, href: "#api" },
];

export default function Demo(): React.JSX.Element {
  const [chosen, setChosen] = useState<string | null>(null);
  const options: readonly FirstRunOption[] = [
    { id: "template", title: "Start from a template", description: "Pick a layout for classes, rooms and teachers, then fill in the blanks.", icon: <IconLayout />, onSelect: () => setChosen("Start from a template") },
    { id: "import", title: "Import your schedule", description: "Bring classes and members over from a spreadsheet or your old booking tool.", icon: <IconUpload />, onSelect: () => setChosen("Import your schedule") },
    { id: "invite", title: "Invite your team", description: "Add teachers and the front desk so each of them sees their own week.", icon: <IconUserPlus />, onSelect: () => setChosen("Invite your team") },
  ];

  return (
    <div className="grid w-full max-w-4xl gap-9">
      <Case caption="Pick a card, or use the arrow keys, Home and End to move between them. The recommended one says so in words.">
        {chosen ? (
          <div role="status" className="grid min-h-80 content-center justify-items-center gap-3 px-6 py-12 text-center">
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl border border-border bg-muted">
              <IconCheckCircle className="size-6" />
            </span>
            <p className="text-lg font-semibold tracking-[-0.02em]">You picked &ldquo;{chosen}&rdquo;</p>
            <p className="max-w-xs text-sm text-muted-foreground">In an app this is where the next step begins.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setChosen(null)}>
              Start over
            </Button>
          </div>
        ) : (
          <FirstRunState
            title="Welcome to Halcyon"
            description="Pick a starting point. Nothing is final, and you can change all of it later."
            options={options}
            recommendedId="template"
            onSkip={() => setChosen("Skip for now")}
          />
        )}
      </Case>

      <Case caption="Four options as links sit in two columns, and with no onSkip there is no skip link.">
        <FirstRunState title="Connect your first data source" description="Reports need something to read. Choose where your numbers live." options={SOURCES} recommendedId="sheets" headingLevel={2} />
      </Case>
    </div>
  );
}
