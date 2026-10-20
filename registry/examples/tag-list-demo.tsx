"use client";

import { useState, type ReactNode } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { TagList, type TagItem } from "@rhs-ui/primitives/tag-list";

const tags = (...labels: string[]): TagItem[] => labels.map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label, href: `#tag-${label.toLowerCase().replace(/\s+/g, "-")}` }));

const PROJECTS = [
  { name: "Kestrel onboarding", owner: "Ines Kowalski", tags: tags("Design", "Research", "Onboarding", "Mobile", "Accessibility", "Q4 launch") },
  { name: "Halcyon pricing page", owner: "Tomas Brandt", tags: tags("Design", "Pricing") },
  { name: "Northwind API v2", owner: "Mara Okafor", tags: tags("Engineering", "Backend", "Docs", "Breaking change", "Security") },
  { name: "Lumen interviews", owner: "Ines Kowalski", tags: tags("Research") },
] as const;

const CARD_TAGS: TagItem[] = ["Design", "Research", "Onboarding", "Mobile", "Accessibility", "Q4 launch", "Brand"].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label }));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="In a table cell it stays on one line: what fits, then +N that opens the rest as links">
        <div className="w-full rounded-xl border border-border bg-card shadow-xs">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="w-40 sm:w-64">Tags</TableHead>
                <TableHead className="hidden w-36 sm:table-cell">Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROJECTS.map((project) => (
                <TableRow key={project.name}>
                  <TableCell className="font-medium sm:truncate">{project.name}</TableCell>
                  <TableCell>
                    <TagList tags={project.tags} fit />
                  </TableCell>
                  <TableCell className="hidden truncate text-muted-foreground sm:table-cell">{project.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>

      <Example caption="It re-measures when its box changes: drag the corner of this panel">
        <div className="w-[26rem] max-w-full min-w-40 resize-x overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="mb-3 text-sm font-medium">Kestrel onboarding</p>
          <TagList tags={PROJECTS[0].tags} fit size="md" />
        </div>
      </Example>

      <Example caption="In a card it can wrap, with a limit, and the tags can be buttons">
        <Card className="w-full max-w-sm gap-4 py-5">
          <CardHeader className="gap-1">
            <CardTitle className="text-[0.9375rem]">Kestrel onboarding</CardTitle>
            <CardDescription>A new first-run flow for the mobile app.</CardDescription>
          </CardHeader>
          <div className="px-6">
            <TagList tags={CARD_TAGS} wrap max={5} size="md" onTagSelect={(tag) => setPicked(tag.label)} />
          </div>
          <p className="px-6 text-xs text-muted-foreground" aria-live="polite">
            {picked ? `Filtering by ${picked}` : "Pick a tag to filter by it."}
          </p>
        </Card>
      </Example>
    </div>
  );
}
