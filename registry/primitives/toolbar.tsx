"use client";

import type { ReactNode } from "react";
import { Toolbar as ToolbarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export interface ToolbarAction {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect?: () => void;
  /** A toggle that stays pressed: bold, pin, wrap. */
  pressed?: boolean;
  disabled?: boolean;
}

export interface ToolbarProps {
  label: string;
  /** Groups of actions, with a divider between groups. */
  groups: readonly (readonly ToolbarAction[])[];
  className?: string;
}

/**
 * A row of icon buttons in groups, for an editor or a table header: one tab
 * stop, arrow keys between buttons (Radix Toolbar), toggles that report
 * aria-pressed, and the label of every button in its tooltip-free name.
 */
export function Toolbar({ label, groups, className }: ToolbarProps) {
  const button = "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-40 aria-pressed:bg-muted aria-pressed:text-foreground [&_svg]:size-4";
  return (
    <ToolbarPrimitive.Root data-slot="toolbar" aria-label={label} className={cn("inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1", className)}>
      {groups.map((group, index) => (
        <div key={index} className="contents">
          {index > 0 ? <ToolbarPrimitive.Separator className="mx-1 h-5 w-px bg-border" /> : null}
          {group.map((action) => (
            <ToolbarPrimitive.Button key={action.id} aria-label={action.label} title={action.label} aria-pressed={action.pressed === undefined ? undefined : action.pressed} disabled={action.disabled} onClick={action.onSelect} className={button}>
              {action.icon}
            </ToolbarPrimitive.Button>
          ))}
        </div>
      ))}
    </ToolbarPrimitive.Root>
  );
}
