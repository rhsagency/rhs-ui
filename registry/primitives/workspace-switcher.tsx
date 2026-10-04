"use client";

import { IconCheck, IconChevronsUpDown, IconPlus } from "@rhs-ui/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Workspace {
  id: string;
  name: string;
  /** "Team plan · 8 members". */
  detail?: string;
}

export interface WorkspaceSwitcherProps {
  workspaces: readonly Workspace[];
  current: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  className?: string;
}

function mark(name: string) {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

/**
 * The organisation picker at the top of a sidebar: the current workspace
 * with its plan, a menu of the others with the current one checked, and
 * "create workspace" at the bottom.
 */
export function WorkspaceSwitcher({ workspaces, current, onSelect, onCreate, className }: WorkspaceSwitcherProps) {
  const active = workspaces.find((workspace) => workspace.id === current) ?? workspaces[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-slot="workspace-switcher" className={cn("flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">{mark(active?.name ?? "")}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{active?.name}</span>
          {active?.detail ? <span className="block truncate text-xs text-muted-foreground">{active.detail}</span> : null}
        </span>
        <IconChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem key={workspace.id} onSelect={() => onSelect(workspace.id)}>
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted text-[10px] font-semibold">{mark(workspace.name)}</span>
            <span className="flex-1 truncate">{workspace.name}</span>
            {workspace.id === current ? <IconCheck className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
        {onCreate ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onCreate}><IconPlus className="size-4" /> Create workspace</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
