"use client";

import { useState } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface JsonViewerProps {
  data: unknown;
  /** Levels open on first render. */
  expandDepth?: number;
  /** Shown for the root, e.g. "response". */
  rootName?: string;
  className?: string;
}

function Value({ value }: { value: unknown }) {
  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (typeof value === "string") return <span className="text-foreground">&quot;{value}&quot;</span>;
  if (typeof value === "number" || typeof value === "boolean") return <span className="font-semibold">{String(value)}</span>;
  return <span>{String(value)}</span>;
}

function Node({ name, value, depth, expandDepth }: { name: string; value: unknown; depth: number; expandDepth: number }) {
  const branch = value !== null && typeof value === "object";
  const [open, setOpen] = useState(depth < expandDepth);
  if (!branch) {
    return (
      <li className="py-0.5 pl-5">
        <span className="text-muted-foreground">{name}: </span>
        <Value value={value} />
      </li>
    );
  }
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value as Record<string, unknown>);
  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`;
  return (
    <li className="py-0.5">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 rounded outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40">
        <IconChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="text-muted-foreground">{name}</span>
        <span className="text-xs text-muted-foreground">{summary}</span>
      </button>
      {open ? (
        <ul className="ml-[0.4rem] border-l border-border pl-2">
          {entries.map(([key, child]) => <Node key={key} name={key} value={child} depth={depth + 1} expandDepth={expandDepth} />)}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * JSON as a tree you can fold: objects and arrays show their size, values
 * keep their type in the styling, and the first levels open by default.
 * For API responses, logs and webhook payloads.
 */
export function JsonViewer({ data, expandDepth = 2, rootName = "root", className }: JsonViewerProps) {
  return (
    <div data-slot="json-viewer" className={cn("relative overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs", className)}>
      <ul><Node name={rootName} value={data} depth={0} expandDepth={expandDepth} /></ul>
    </div>
  );
}
