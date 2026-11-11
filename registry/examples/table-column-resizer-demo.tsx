"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { TableColumnResizer } from "@rhs-ui/primitives/table-column-resizer";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Key = "name" | "owner" | "status" | "updated";

const COLUMNS: readonly { key: Key; label: string; start: number; min: number; max: number }[] = [
  { key: "name", label: "Meeting", start: 334, min: 120, max: 560 },
  { key: "owner", label: "Owner", start: 190, min: 96, max: 360 },
  { key: "status", label: "Status", start: 150, min: 88, max: 240 },
  { key: "updated", label: "Updated", start: 156, min: 96, max: 280 },
];

const ROWS: readonly Record<Key, string>[] = [
  { name: "Quarterly business review with the Northwind Traders leadership team", owner: "Mara Okafor", status: "Scheduled", updated: "12 min ago" },
  { name: "Kestrel Analytics onboarding kickoff and data migration plan", owner: "Jonas Weber-Lindqvist", status: "Draft", updated: "2 hours ago" },
  { name: "Halcyon Labs brand refresh: first look", owner: "Aiko Tanaka", status: "Done", updated: "Yesterday" },
  { name: "Oak Lane Bakery wholesale pricing", owner: "Lucas Moreau", status: "Scheduled", updated: "3 days ago" },
  { name: "Mirror Labs security review follow-up with the engineering leads", owner: "Priya Nair", status: "Done", updated: "Last week" },
];

const START: Record<Key, number> = Object.fromEntries(COLUMNS.map((column) => [column.key, column.start])) as Record<Key, number>;

export default function Demo(): React.JSX.Element {
  const [widths, setWidths] = useState<Record<Key, number>>(START);
  const total = COLUMNS.reduce((sum, column) => sum + widths[column.key], 0);
  const changed = COLUMNS.some((column) => widths[column.key] !== column.start);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-4 sm:p-8">
      <Example caption="Drag a header edge, or Tab to it and use the arrow keys; Enter or double-click resets">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table className="table-fixed" style={{ width: total }}>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableHead key={column.key} scope="col" className="relative" style={{ width: widths[column.key] }}>
                    <span className="block truncate pr-2">{column.label}</span>
                    <TableColumnResizer
                      label={column.label}
                      width={widths[column.key]}
                      min={column.min}
                      max={column.max}
                      defaultWidth={column.start}
                      onWidthChange={(width) => setWidths((current) => ({ ...current, [column.key]: width }))}
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="truncate font-medium">{row.name}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{row.owner}</TableCell>
                  <TableCell className="truncate">{row.status}</TableCell>
                  <TableCell className="truncate text-muted-foreground">{row.updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border px-4 py-2">
            <p className="min-w-0 text-xs text-muted-foreground tabular-nums">
              {COLUMNS.map((column) => `${column.label} ${widths[column.key]}`).join(", ")} px
            </p>
            <Button type="button" variant="ghost" size="sm" disabled={!changed} onClick={() => setWidths(START)} className="shrink-0">
              Reset widths
            </Button>
          </div>
        </div>
      </Example>
    </div>
  );
}
