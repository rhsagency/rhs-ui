"use client";

import { IconClose, IconFilter } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: readonly FilterOption[];
}

export interface FilterBarProps {
  groups: readonly FilterGroup[];
  /** Selected option ids per group id. */
  value: Record<string, readonly string[]>;
  onChange: (value: Record<string, string[]>) => void;
  /** Results after filtering, announced to screen readers. */
  resultCount?: number;
  className?: string;
}

/**
 * Filters as toggle chips in labelled groups, with the active ones repeated
 * as removable tags and a clear-all. Works for a product grid, a job list or
 * a table; the result count is announced as it changes.
 */
export function FilterBar({ groups, value, onChange, resultCount, className }: FilterBarProps) {
  const toggle = (group: string, option: string) => {
    const current = value[group] ?? [];
    const next = current.includes(option) ? current.filter((id) => id !== option) : [...current, option];
    onChange({ ...Object.fromEntries(Object.entries(value).map(([key, ids]) => [key, [...ids]])), [group]: next });
  };
  const active = groups.flatMap((group) => (value[group.id] ?? []).map((id) => ({ group, option: group.options.find((option) => option.id === id) })).filter((entry) => entry.option));
  return (
    <div data-slot="filter-bar" className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {groups.map((group) => (
          <div key={group.id} role="group" aria-label={group.label}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground [&_svg]:size-3.5"><IconFilter />{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.options.map((option) => {
                const on = (value[group.id] ?? []).includes(option.id);
                return (
                  <button key={option.id} type="button" aria-pressed={on} onClick={() => toggle(group.id, option.id)} className={cn("rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40", on ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted")}>
                    {option.label}
                    {option.count !== undefined ? <span className="ml-1.5 tabular-nums opacity-60">{option.count}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {active.length || resultCount !== undefined ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
          {resultCount !== undefined ? <span role="status" className="mr-2 text-muted-foreground tabular-nums">{resultCount} {resultCount === 1 ? "result" : "results"}</span> : null}
          {active.map(({ group, option }) => (
            <span key={`${group.id}-${option!.id}`} className="inline-flex items-center gap-1 rounded-md bg-muted py-0.5 pr-0.5 pl-2 text-xs">
              {group.label}: {option!.label}
              <button type="button" aria-label={`Remove ${group.label} ${option!.label}`} onClick={() => toggle(group.id, option!.id)} className="inline-flex size-5 items-center justify-center rounded hover:bg-background [&_svg]:size-3"><IconClose /></button>
            </span>
          ))}
          {active.length ? <button type="button" onClick={() => onChange({})} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Clear all</button> : null}
        </div>
      ) : null}
    </div>
  );
}
