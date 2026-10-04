"use client";

import { useState, type ReactNode } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TreeRow {
  id: string;
  /** The cells after the name, in the order of the columns. */
  cells: readonly ReactNode[];
  name: string;
  children?: readonly TreeRow[];
}

export interface TreeTableProps {
  /** Column headings; the first is the name column. */
  columns: readonly string[];
  rows: readonly TreeRow[];
  /** Rows open at the start, by id. */
  defaultExpanded?: readonly string[];
  label: string;
  className?: string;
}

/**
 * A table whose rows nest: budgets by department and team, files by folder,
 * accounts by region. A treegrid for assistive technology, with each parent
 * row's toggle announcing expanded or collapsed and the depth carried by
 * aria-level, so the hierarchy is heard and not only seen.
 */
export function TreeTable({ columns, rows, defaultExpanded = [], label, className }: TreeTableProps) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultExpanded));
  const toggle = (id: string) => setOpen((set) => { const next = new Set(set); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const flat: { row: TreeRow; level: number }[] = [];
  const walk = (list: readonly TreeRow[], level: number) => {
    for (const row of list) {
      flat.push({ row, level });
      if (row.children?.length && open.has(row.id)) walk(row.children, level + 1);
    }
  };
  walk(rows, 1);
  return (
    <div data-slot="tree-table" className={cn("relative overflow-x-auto rounded-xl border border-border", className)}>
      <table role="treegrid" aria-label={label} className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
          <tr>{columns.map((column, index) => <th key={column} scope="col" className={cn("px-4 py-2.5 font-normal", index === 0 ? "text-left" : "text-right")}>{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {flat.map(({ row, level }) => {
            const parent = Boolean(row.children?.length);
            const expanded = open.has(row.id);
            return (
              <tr key={row.id} aria-level={level} aria-expanded={parent ? expanded : undefined} className={cn(level === 1 && parent && "font-medium")}>
                <th scope="row" className="px-4 py-2.5 text-left font-[inherit]">
                  <span className="flex items-center gap-1.5" style={{ paddingLeft: `${(level - 1) * 1.25}rem` }}>
                    {parent ? (
                      <button type="button" onClick={() => toggle(row.id)} aria-label={`${expanded ? "Collapse" : "Expand"} ${row.name}`} aria-expanded={expanded} className="inline-flex size-6 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">
                        <IconChevronRight className={cn("size-4 transition-transform motion-reduce:transition-none", expanded && "rotate-90")} />
                      </button>
                    ) : <span className="inline-block w-6" aria-hidden="true" />}
                    {row.name}
                  </span>
                </th>
                {row.cells.map((cell, index) => <td key={index} className="px-4 py-2.5 text-right tabular-nums">{cell}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
