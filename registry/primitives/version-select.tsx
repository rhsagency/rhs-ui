"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface DocsVersion {
  value: string;
  /** "v2.4" */
  label: string;
  /** Released, or "Unreleased"; shown under the option. */
  note?: string;
  latest?: boolean;
}

export interface VersionSelectProps {
  versions: readonly DocsVersion[];
  value: string;
  onValueChange: (value: string) => void;
  /** Names the control for screen readers. */
  label?: string;
  className?: string;
}

/**
 * Which version of the docs you are reading, in the sidebar header: the
 * house select (never a native one), compact, with the latest release
 * marked in the list and a warning colour on the trigger when you are on
 * an older one.
 */
export function VersionSelect({ versions, value, onValueChange, label = "Documentation version", className }: VersionSelectProps) {
  const current = versions.find((version) => version.value === value);
  const old = current ? !current.latest : false;
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" aria-label={label} data-old={old || undefined} className={cn("w-36 font-mono text-xs data-[old]:border-[color-mix(in_oklch,var(--color-warning,oklch(0.72_0.16_75))_60%,transparent)]", className)}>
        <SelectValue>{current?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {versions.map((version) => (
          <SelectItem key={version.value} value={version.value} description={version.latest ? `Latest${version.note ? `, ${version.note}` : ""}` : version.note} className="font-mono text-xs">
            {version.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
