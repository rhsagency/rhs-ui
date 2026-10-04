"use client";

import { useEffect, useRef, useState } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CheckboxTreeNode {
  id: string;
  label: string;
  children?: readonly CheckboxTreeNode[];
}

export interface CheckboxTreeProps {
  nodes: readonly CheckboxTreeNode[];
  /** Checked leaf ids; parents follow from their children. */
  value: readonly string[];
  onValueChange: (leaves: string[]) => void;
  label: string;
  defaultExpanded?: readonly string[];
  className?: string;
}

const leavesOf = (node: CheckboxTreeNode): string[] => (node.children?.length ? node.children.flatMap(leavesOf) : [node.id]);

function Box({ state, label, onChange }: { state: "on" | "off" | "mixed"; label: string; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "mixed";
  }, [state]);
  return (
    <label className="relative flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-1.5 text-sm">
      <input ref={ref} type="checkbox" checked={state === "on"} onChange={onChange} className="peer sr-only" />
      <span aria-hidden="true" className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-input peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40", state !== "off" && "border-foreground bg-foreground text-background")}>
        {state === "on" ? <svg viewBox="0 0 12 12" className="size-3"><path d="M2.5 6.5l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : state === "mixed" ? <span className="h-0.5 w-2 rounded-full bg-current" /> : null}
      </span>
      <span className="truncate">{label}</span>
    </label>
  );
}

/**
 * Permissions, categories or folders to pick as a tree: ticking a parent
 * ticks everything under it, a partly ticked group shows the mixed state
 * (and says so to screen readers through the real indeterminate checkbox),
 * and groups fold open and closed. The value is the list of ticked leaves.
 */
export function CheckboxTree({ nodes, value, onValueChange, label, defaultExpanded = [], className }: CheckboxTreeProps) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultExpanded));
  const checked = new Set(value);
  const stateOf = (node: CheckboxTreeNode): "on" | "off" | "mixed" => {
    const leaves = leavesOf(node);
    const on = leaves.filter((leaf) => checked.has(leaf)).length;
    return on === 0 ? "off" : on === leaves.length ? "on" : "mixed";
  };
  const toggle = (node: CheckboxTreeNode) => {
    const leaves = leavesOf(node);
    const turnOn = stateOf(node) !== "on";
    onValueChange(turnOn ? [...new Set([...value, ...leaves])] : value.filter((leaf) => !leaves.includes(leaf)));
  };
  const render = (list: readonly CheckboxTreeNode[], depth: number) => (
    <ul className={cn("grid", depth > 0 && "ml-6 border-l border-border pl-2")}>
      {list.map((node) => {
        const parent = Boolean(node.children?.length);
        const expanded = open.has(node.id);
        return (
          <li key={node.id}>
            <div className="flex items-center gap-1">
              {parent ? (
                <button type="button" onClick={() => setOpen((set) => { const next = new Set(set); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })} aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} ${node.label}`} className="inline-flex size-6 shrink-0 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  <IconChevronRight className={cn("size-4 transition-transform motion-reduce:transition-none", expanded && "rotate-90")} />
                </button>
              ) : <span className="w-6 shrink-0" />}
              <Box state={stateOf(node)} label={node.label} onChange={() => toggle(node)} />
            </div>
            {parent && expanded ? render(node.children ?? [], depth + 1) : null}
          </li>
        );
      })}
    </ul>
  );
  return (
    <fieldset data-slot="checkbox-tree" className={cn("grid gap-1", className)}>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {render(nodes, 0)}
    </fieldset>
  );
}
