"use client";

import { useState, type ReactNode } from "react";

import { IconMoreHorizontal } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { LinkedRowTable, type LinkedRowColumn } from "@rhs-ui/primitives/linked-row-table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Project = { id: string; slug: string; name: string; client: string; owner: string; status: "On track" | "At risk" | "Planning" | "Done"; updated: string };

const PROJECTS: readonly Project[] = [
  { id: "p1", slug: "halcyon-rebrand", name: "Halcyon rebrand", client: "Halcyon Labs", owner: "Mara Okafor", status: "On track", updated: "12 min ago" },
  { id: "p2", slug: "kestrel-dashboard", name: "Kestrel analytics dashboard", client: "Kestrel Analytics", owner: "Jonas Weber", status: "At risk", updated: "2 hours ago" },
  { id: "p3", slug: "northwind-checkout", name: "Northwind checkout rebuild", client: "Northwind Traders", owner: "Aiko Tanaka", status: "On track", updated: "Yesterday" },
  { id: "p4", slug: "oak-lane-site", name: "Oak Lane Bakery site", client: "Oak Lane Bakery", owner: "Lucas Moreau", status: "Planning", updated: "3 days ago" },
  { id: "p5", slug: "mirror-onboarding", name: "Mirror Labs onboarding flow", client: "Mirror Labs", owner: "Priya Nair", status: "Done", updated: "Last week" },
];

const STATUS_BADGE = { "On track": "outline", "At risk": "secondary", Planning: "muted", Done: "muted" } as const;

type Doc = { slug: string; name: string; kind: string; edited: string };

const DOCS: readonly Doc[] = [
  { slug: "brand-guidelines", name: "Brand guidelines 2027", kind: "Guide", edited: "Nov 8" },
  { slug: "launch-checklist", name: "Launch checklist", kind: "Checklist", edited: "Nov 6" },
  { slug: "pricing-faq", name: "Pricing FAQ", kind: "Article", edited: "Oct 29" },
];

const DOC_COLUMNS: readonly LinkedRowColumn<Doc>[] = [
  { key: "name", header: "Document" },
  { key: "kind", header: "Type", className: "text-muted-foreground" },
  { key: "edited", header: "Edited", align: "right", className: "whitespace-nowrap text-muted-foreground" },
];

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<readonly string[]>(["p3"]);
  const [said, setSaid] = useState("Press a row, then its checkbox or its menu button: only the row opens a page.");

  const columns: readonly LinkedRowColumn<Project>[] = [
    {
      key: "select",
      header: <span className="sr-only">Select</span>,
      interactive: true,
      className: "w-px pr-0",
      cell: (project) => (
        <Checkbox
          aria-label={`Select ${project.name}`}
          checked={selected.includes(project.id)}
          onCheckedChange={(checked) => {
            setSelected((list) => (checked === true ? [...list, project.id] : list.filter((id) => id !== project.id)));
            setSaid(`${checked === true ? "Selected" : "Unselected"} ${project.name}. The row did not open.`);
          }}
        />
      ),
    },
    { key: "name", header: "Project" },
    { key: "client", header: "Client", className: "hidden text-muted-foreground md:table-cell" },
    { key: "owner", header: "Owner", className: "hidden text-muted-foreground sm:table-cell" },
    { key: "status", header: "Status", cell: (project) => <Badge variant={STATUS_BADGE[project.status]}>{project.status}</Badge> },
    { key: "updated", header: "Updated", align: "right", className: "hidden whitespace-nowrap text-muted-foreground sm:table-cell" },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      interactive: true,
      align: "right",
      className: "w-px",
      cell: (project) => (
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${project.name}`} className="text-muted-foreground hover:text-foreground" onClick={() => setSaid(`Opened the menu of ${project.name}. The row did not open.`)}>
          <IconMoreHorizontal strokeWidth={2.5} className="size-[1.125rem]" />
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-4 sm:p-8">
      <Example caption="One link per row, on the name: the whole row is the target, the checkbox and the menu sit above it">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <LinkedRowTable
            columns={columns}
            rows={PROJECTS}
            linkColumn="name"
            getRowHref={(project) => `#/projects/${project.slug}`}
            onRowClick={(project) => setSaid(`Routed on the client to /projects/${project.slug}.`)}
            aria-label="Active projects, newest activity first"
          />
          <p role="status" className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {said}
          </p>
        </div>
      </Example>

      <Example caption="Without onRowClick the links are plain anchors the browser follows">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <LinkedRowTable columns={DOC_COLUMNS} rows={DOCS} linkColumn="name" getRowHref={(doc) => `#/docs/${doc.slug}`} getRowId={(doc) => doc.slug} />
        </div>
      </Example>
    </div>
  );
}
