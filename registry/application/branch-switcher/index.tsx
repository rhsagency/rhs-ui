"use client";

import { useState, type ComponentProps } from "react";

import { IconChevronsUpDown, IconGitBranch, IconTag } from "@rhs-ui/icons";
import { RefName, BranchPanel, type BranchPanelProps } from "@rhs-ui/application/branch-switcher/panel";
import { DEFAULT_LABELS, NONE, type BranchSwitcherLabels, type RefKind } from "@rhs-ui/application/branch-switcher/refs";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { BranchSwitcherLabels, RefKind } from "@rhs-ui/application/branch-switcher/refs";

export interface BranchSwitcherProps extends Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> {
  /** Every branch of the repository, by name, in the order they should be listed. */
  branches: readonly string[];
  /** Every tag, by name. They get their own tab. */
  tags?: readonly string[];
  /** The refs used lately, newest first, branches and tags together. They sit on top of the list while nothing is typed. Keep the list yourself: the switcher only shows it. */
  recent?: BranchPanelProps["recent"];
  /** The ref in use, when you control it. Pair it with `onValueChange`. */
  value?: string;
  /** The ref in use at the start, when the switcher keeps it itself. Default the default branch, or else the first branch. */
  defaultValue?: string;
  /** Someone chose a ref, or made a branch. It receives the name and whether it is a branch or a tag. */
  onValueChange?: (ref: string, kind: RefKind) => void;
  /** The default branch of the repository: marked "default" in the list, and put first among the branches. */
  defaultRef?: string;
  /** The ref a new branch starts from. Default the default branch, or else the first branch. */
  createFrom?: string;
  /** Turns on "Create branch …": it appears when what is typed is no branch yet. `onCreate(name, from)` may return a promise: the row shows a spinner while it runs, a rejection keeps the popover open with its message, and when it resolves the new branch is chosen. */
  onCreate?: BranchPanelProps["onCreate"];
  /** The refs are still loading: the list shows placeholders. */
  loading?: boolean;
  /** Turns the button off. */
  disabled?: boolean;
  /** Which edge of the button the popover lines up with. Default "start". */
  align?: "start" | "center" | "end";
  /** Whether the popover is open, when you control it. */
  open?: boolean;
  /** Whether the popover is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** How many refs show before "Show more". Default 40. */
  pageSize?: number;
  /** The words the switcher says, for translation. */
  labels?: BranchSwitcherLabels;
}

/**
 * Picks the branch or tag a page is about, in the manner of a code host. The
 * button shows the ref in use with an icon, and a name that is too long gives
 * way in the middle so its end stays readable. It opens a popover with a search
 * field and two tabs, Branches and Tags: the default branch is marked, the one
 * in use is checked, recently used refs sit on top, and typing filters the list
 * and draws the letters that matched in bold. When what is typed is no branch
 * yet and `onCreate` exists, a first row offers "Create branch feature/x from
 * main". The list is a listbox driven from the search field, so Arrow keys move
 * and Enter chooses, and a repository with hundreds of refs stays fast because
 * only the first batch is drawn, with "Show 40 more" for the rest.
 */
export function BranchSwitcher({
  branches,
  tags = NONE,
  recent = NONE,
  value,
  defaultValue,
  onValueChange,
  defaultRef,
  createFrom,
  onCreate,
  loading = false,
  disabled = false,
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  pageSize,
  labels,
  className,
  ...props
}: BranchSwitcherProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<{ name: string | undefined; kind: RefKind | null }>({ name: defaultValue ?? defaultRef ?? branches[0], kind: null });
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;

  const current = value === undefined ? own.name : value;
  // A name that is a branch and a tag too reads as the branch, unless the person just chose the tag.
  const kind: RefKind = (value === undefined ? own.kind : null) ?? (current !== undefined && !branches.includes(current) && tags.includes(current) ? "tag" : "branch");

  function setOpen(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  function select(name: string, picked: RefKind) {
    if (value === undefined) setOwn({ name, kind: picked });
    onValueChange?.(name, picked);
    setOpen(false);
  }

  return (
    <div data-slot="branch-switcher" className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled} data-kind={kind} className="max-w-full min-w-0 justify-between gap-2 px-3">
            {kind === "tag" ? <IconTag aria-hidden="true" className="text-muted-foreground" /> : <IconGitBranch aria-hidden="true" className="text-muted-foreground" />}
            <span className="sr-only">{kind === "tag" ? words.tagPrefix : words.branchPrefix} </span>
            {current ? <RefName name={current} className="font-medium" /> : <span className="text-muted-foreground">{words.branches}</span>}
            <IconChevronsUpDown aria-hidden="true" className="-me-0.5 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          collisionPadding={8}
          aria-label={words.dialog}
          // Escape empties the search field when it has words in it, and only then closes the popover: the field's own handler does the emptying.
          onEscapeKeyDown={(event) => {
            const field = event.target;
            if (field instanceof HTMLInputElement && field.dataset.slot === "branch-switcher-search" && field.value !== "") event.preventDefault();
          }}
          // The popover never grows past the room the window has: the list inside gives way, so the foot of the panel stays in reach.
          className="flex max-h-(--radix-popover-content-available-height) w-[min(23rem,calc(100vw-1rem))] flex-col overflow-hidden p-0"
        >
          <BranchPanel
            branches={branches}
            tags={tags}
            recent={recent}
            value={current}
            defaultRef={defaultRef}
            createFrom={createFrom}
            onCreate={onCreate}
            onChoose={select}
            loading={loading}
            pageSize={pageSize}
            labels={labels}
            className="flex-1"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
