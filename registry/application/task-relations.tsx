"use client";

import { useId, useMemo, useRef, useState, type ComponentProps, type MouseEvent } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconBan, IconChevronDown, IconChevronRight, IconClose, IconPlus } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { ConfirmPopover } from "@rhs-ui/primitives/confirm-popover";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** Where a task stands. Each has its own shape and word, so none depends on colour. `done` and `cancelled` are resolved: they no longer block anything. */
export type TaskStatus = "todo" | "in-progress" | "in-review" | "done" | "cancelled";

/** How two tasks are linked, seen from this one. */
export type RelationKind = "blocked-by" | "blocks" | "related";

/** A task on the other end of a link. */
export interface RelatedTask {
  /** A stable identity, used to keep a task out of the list of candidates once it is linked. */
  id: string;
  /** The short reference people say out loud: "NW-142". */
  key: string;
  /** What the task is. */
  title: string;
  /** Where it stands. */
  status: TaskStatus;
  /** The task's own page. The title becomes a link and the whole row opens it. */
  href?: string;
}

/** The links of one task, in the three groups the panel draws. Empty or missing groups are left out. */
export interface TaskRelationsData {
  /** Tasks that must be finished before this one. */
  blockedBy?: readonly RelatedTask[];
  /** Tasks waiting on this one. */
  blocks?: readonly RelatedTask[];
  /** Tasks that are only connected. */
  related?: readonly RelatedTask[];
}

/** The words the panel uses, for translation. `{count}`, `{key}`, `{kind}` and `{name}` are filled in. */
export interface TaskRelationsLabels {
  /** The panel's heading. Default "Relations". */
  heading?: string;
  /** The name of the group of tasks that must be done first, also its choice in the add menu. Default "Blocked by". */
  blockedBy?: string;
  /** The name of the group of tasks that wait on this one. Default "Blocks". */
  blocks?: string;
  /** The name of the group of tasks that are only connected. Default "Related". */
  related?: string;
  /** The line under the heading when one task still blocks this one. Default "Blocked by {count} open task". */
  blockedOne?: string;
  /** The same for several. Default "Blocked by {count} open tasks". */
  blockedMany?: string;
  /** The status words. */
  status?: Partial<Record<TaskStatus, string>>;
  /** The button that unfolds the resolved blockers. Default "Show {count} resolved". */
  showResolved?: string;
  /** The same button once they are open. Default "Hide {count} resolved". */
  hideResolved?: string;
  /** The add button. Default "Add link". */
  add?: string;
  /** The name of the choice of relation in the add menu. Default "Relation". */
  relation?: string;
  /** The placeholder of the search field. Default "Search by key or title". */
  search?: string;
  /** Shown when nothing matches. Default "No tasks match". */
  noMatches?: string;
  /** Shown when there is nothing left to link. Default "There are no more tasks to link". */
  noCandidates?: string;
  /** Shown and said when adding a link failed. Default "Could not add the link. Nothing was changed." */
  addFailed?: string;
  /** The remove button's name. Default "Remove link to {key}". */
  removeName?: string;
  /** The question before removing. Default "Remove the link to {key}?" */
  removeTitle?: string;
  /** The line under the question. Default "{key} stays as it is. Only the link between the two tasks goes." */
  removeBody?: string;
  /** The confirm button. Default "Remove link". */
  removeConfirm?: string;
  /** Said after a link was added. Default "Added {key} under {kind}." */
  added?: string;
  /** Said after a link was removed. Default "Removed {key} from {kind}." */
  removed?: string;
  /** Said and shown when removing failed. Default "Could not remove {key}. Nothing was changed." */
  removeFailed?: string;
  /** What the panel says when it has no links at all. Default "No linked tasks yet." */
  empty?: string;
}

export interface TaskRelationsProps extends Omit<ComponentProps<"section">, "children"> {
  /** The links of this task. */
  relations: TaskRelationsData;
  /** The tasks that could be linked. Those already linked are left out, and the add menu searches the rest by key and title. */
  candidates?: readonly RelatedTask[];
  /** Show the add button and a remove button on every row. Leave it off for a read-only panel. Default false. */
  canEdit?: boolean;
  /** A task was picked in the add menu, with the kind of link chosen. Return a promise and the menu waits (the picked row shows a spinner and a second pick does nothing); a rejection keeps it open and says so. */
  onAdd?: (kind: RelationKind, task: RelatedTask) => void | Promise<void>;
  /** A removal was confirmed. Return a promise and the confirmation waits; a rejection leaves the link and says so. */
  onRemove?: (kind: RelationKind, task: RelatedTask) => void | Promise<void>;
  /** A task's row was opened. With `task.href` it runs on the link and receives the event, so a client-side router can call `preventDefault()`. Without an href it makes the row a button. */
  onOpen?: (task: RelatedTask, event: MouseEvent<HTMLElement>) => void;
  /** The heading's level, 2 to 4. The group names sit one level below. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the panel uses, for translation. */
  labels?: TaskRelationsLabels;
}

const DEFAULT_LABELS = {
  heading: "Relations",
  blockedBy: "Blocked by",
  blocks: "Blocks",
  related: "Related",
  blockedOne: "Blocked by {count} open task",
  blockedMany: "Blocked by {count} open tasks",
  status: { todo: "To do", "in-progress": "In progress", "in-review": "In review", done: "Done", cancelled: "Cancelled" },
  showResolved: "Show {count} resolved",
  hideResolved: "Hide {count} resolved",
  add: "Add link",
  relation: "Relation",
  search: "Search by key or title",
  noMatches: "No tasks match",
  noCandidates: "There are no more tasks to link",
  addFailed: "Could not add the link. Nothing was changed.",
  removeName: "Remove link to {key}",
  removeTitle: "Remove the link to {key}?",
  removeBody: "{key} stays as it is. Only the link between the two tasks goes.",
  removeConfirm: "Remove link",
  added: "Added {key} under {kind}.",
  removed: "Removed {key} from {kind}.",
  removeFailed: "Could not remove {key}. Nothing was changed.",
  empty: "No linked tasks yet.",
} satisfies Required<TaskRelationsLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const GROUPS: readonly { kind: RelationKind; data: keyof TaskRelationsData; name: "blockedBy" | "blocks" | "related" }[] = [
  { kind: "blocked-by", data: "blockedBy", name: "blockedBy" },
  { kind: "blocks", data: "blocks", name: "blocks" },
  { kind: "related", data: "related", name: "related" },
];

const isResolved = (task: RelatedTask) => task.status === "done" || task.status === "cancelled";

/** The failure text, darkened toward the foreground so the small red words reach 4.5:1 on a card. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** Five drawn states: a ring, a ring half full, a ring three quarters full, a solid disc with a tick, a ring with a slash. */
function StatusMark({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-status={status} className={cn("size-3.5 shrink-0", className)}>
      {status === "done" ? (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M4.9 8.3l2.2 2.2 4-4.4" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="stroke-background" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {status === "in-progress" ? <path d="M8 4.2a3.8 3.8 0 0 1 0 7.6z" fill="currentColor" /> : null}
          {status === "in-review" ? <path d="M8 8V4.2A3.8 3.8 0 1 1 4.2 8z" fill="currentColor" /> : null}
          {status === "cancelled" ? <path d="M5.4 10.6l5.2-5.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : null}
        </>
      )}
    </svg>
  );
}

/**
 * The relations panel of a task or an issue: what blocks it, what it blocks
 * and what is only related, each row a task with its key, its title and its
 * state as a shape and a word. A blocked task says so at the top ("Blocked by
 * 2 open tasks") and its resolved blockers fold away behind a count, so the
 * panel shows what still matters. Empty groups are left out and the panel
 * stays calm. With `canEdit`, "Add link" opens a small searchable menu of
 * candidates with the kind of link to make, and every row can be unlinked
 * after a question; both are announced, and focus lands on the panel when a
 * row disappears. Without `canEdit` it is read-only.
 */
export function TaskRelations({
  relations,
  candidates = [],
  canEdit = false,
  onAdd,
  onRemove,
  onOpen,
  headingLevel = 3,
  labels,
  className,
  ...props
}: TaskRelationsProps) {
  const text: Required<TaskRelationsLabels> = { ...DEFAULT_LABELS, ...labels, status: { ...DEFAULT_LABELS.status, ...labels?.status } };
  const headingId = useId();
  const panel = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const GroupHeading = `h${Math.min(headingLevel + 1, 5)}` as "h3" | "h4" | "h5";
  const [showResolved, setShowResolved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<RelationKind>("blocked-by");
  const [query, setQuery] = useState("");
  const [addFailed, setAddFailed] = useState(false);
  // The task being linked while `onAdd` runs: the menu waits on it, and a second pick does nothing.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [removeFailed, setRemoveFailed] = useState<string | null>(null);
  const [said, setSaid] = useState("");

  const kindName = (value: RelationKind) => text[GROUPS.find((group) => group.kind === value)?.name ?? "related"];
  const linked = useMemo(() => new Set(GROUPS.flatMap((group) => (relations[group.data] ?? []).map((task) => task.id))), [relations]);
  const open = candidates.filter((task) => !linked.has(task.id));

  const blockers = relations.blockedBy ?? [];
  const openBlockers = blockers.filter((task) => !isResolved(task));
  const total = GROUPS.reduce((sum, group) => sum + (relations[group.data]?.length ?? 0), 0);

  async function add(task: RelatedTask) {
    if (!onAdd || working.current) return;
    working.current = true;
    setPendingId(task.id);
    setAddFailed(false);
    try {
      await onAdd(kind, task);
      setAdding(false);
      setQuery("");
      setSaid(fill(text.added, { key: task.key, kind: kindName(kind).toLowerCase() }));
    } catch {
      setAddFailed(true);
    } finally {
      working.current = false;
      setPendingId(null);
    }
  }

  async function remove(group: RelationKind, task: RelatedTask) {
    if (!onRemove) return;
    setRemoveFailed(null);
    try {
      await onRemove(group, task);
      setSaid(fill(text.removed, { key: task.key, kind: kindName(group).toLowerCase() }));
      // The row that had focus is gone: focus moves to the panel, not to the top of the page.
      requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
    } catch {
      setRemoveFailed(task.id);
      setSaid(fill(text.removeFailed, { key: task.key }));
    }
  }

  const row = (group: RelationKind, task: RelatedTask) => {
    const resolved = isResolved(task);
    const interactive = Boolean(task.href || onOpen);
    const title = (
      <>
        <span className="min-w-14 shrink-0 font-mono text-xs tracking-tight text-muted-foreground tabular-nums">{task.key}</span>
        <span className={cn("line-clamp-2 min-w-0 text-sm tracking-[-0.01em] @md:line-clamp-1", resolved && "text-muted-foreground", task.status === "cancelled" && "line-through decoration-muted-foreground/60")}>{task.title}</span>
      </>
    );
    const reach = "col-start-1 row-start-1 flex min-w-0 items-baseline gap-2 rounded-sm outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-[3px] focus-visible:after:ring-inset focus-visible:after:ring-ring/50";
    return (
      <li key={task.id} data-status={task.status} className="group/row relative transition-colors duration-150 hover:bg-muted/50 motion-reduce:transition-none">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-2.5 @md:grid-cols-[minmax(0,1fr)_auto_auto]">
          {task.href ? (
            <a href={task.href} onClick={onOpen ? (event) => onOpen(task, event) : undefined} className={reach}>
              {title}
            </a>
          ) : interactive ? (
            <button type="button" onClick={(event) => onOpen?.(task, event)} className={cn(reach, "text-start")}>
              {title}
            </button>
          ) : (
            <p className="col-start-1 row-start-1 flex min-w-0 items-baseline gap-2">{title}</p>
          )}
          <Badge variant="outline" className={cn("col-start-1 row-start-2 w-fit justify-self-start gap-1.5 pe-2 @md:col-start-2 @md:row-start-1 @md:justify-self-end", resolved && "border-dashed text-muted-foreground")}>
            <StatusMark status={task.status} />
            {text.status[task.status]}
          </Badge>
          {canEdit && onRemove ? (
            <div className="relative z-10 col-start-2 row-start-1 -me-1.5 @md:col-start-3">
              <ConfirmPopover
                title={fill(text.removeTitle, { key: task.key })}
                description={fill(text.removeBody, { key: task.key })}
                confirmLabel={text.removeConfirm}
                onConfirm={() => remove(group, task)}
              >
                <Button type="button" variant="ghost" size="icon-sm" aria-label={fill(text.removeName, { key: task.key })} className="text-muted-foreground hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/row:opacity-100 [@media(hover:hover)]:group-hover/row:opacity-100">
                  <IconClose />
                </Button>
              </ConfirmPopover>
            </div>
          ) : null}
        </div>
        {removeFailed === task.id ? (
          <p role="alert" className={cn("px-4 pb-2.5 text-xs font-medium", DANGER_TEXT)}>
            {fill(text.removeFailed, { key: task.key })}
          </p>
        ) : null}
      </li>
    );
  };

  return (
    <section ref={panel} tabIndex={-1} data-slot="task-relations" aria-labelledby={headingId} className={cn("@container text-foreground outline-none", className)} {...props}>
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <Heading id={headingId} className="text-sm font-semibold tracking-[-0.01em]">
          {text.heading}
        </Heading>
        {canEdit && onAdd ? (
          <Popover open={adding} onOpenChange={(value) => { setAdding(value); if (!value) { setQuery(""); setAddFailed(false); } }}>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <IconPlus />
                {text.add}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              aria-label={text.add}
              className="w-80 p-0"
              // The search is what you came for: focus lands there, not on the choice of relation above it.
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                search.current?.focus();
              }}
            >
              <div className="border-b border-border p-3">
                <SegmentedControl
                  label={text.relation}
                  value={kind}
                  onValueChange={(value) => setKind(value as RelationKind)}
                  options={GROUPS.map((group) => ({ value: group.kind, label: text[group.name] }))}
                  className="w-full [&>button]:flex-1 [&>button]:px-2"
                />
              </div>
              <Command className="rounded-none bg-transparent">
                <CommandInput ref={search} value={query} onValueChange={setQuery} placeholder={text.search} />
                <CommandList className="max-h-60" aria-busy={pendingId !== null || undefined}>
                  <CommandEmpty>{open.length ? text.noMatches : text.noCandidates}</CommandEmpty>
                  <CommandGroup>
                    {open.map((task) => (
                      // While one link is being made every row waits; the picked one stays at full strength with a spinner where its status was.
                      <CommandItem key={task.id} value={`${task.key} ${task.title}`} disabled={pendingId !== null} onSelect={() => void add(task)} className={cn("gap-2.5", pendingId === task.id && "data-[disabled=true]:opacity-100")}>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{task.key}</span>
                        <span className="min-w-0 flex-1 truncate">{task.title}</span>
                        {pendingId === task.id ? <Spinner size={14} label="" role="presentation" aria-hidden="true" className="text-muted-foreground" /> : <StatusMark status={task.status} className="text-muted-foreground" />}
                        <span className="sr-only">{text.status[task.status]}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              {addFailed ? (
                <p role="alert" className={cn("border-t border-border px-3 py-2 text-xs font-medium", DANGER_TEXT)}>
                  {text.addFailed}
                </p>
              ) : null}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      <div role="status" className={openBlockers.length ? "mx-4 mb-3" : undefined}>
        {openBlockers.length ? (
          <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium">
            <IconBan className="size-4 shrink-0" />
            {fill(openBlockers.length === 1 ? text.blockedOne : text.blockedMany, { count: String(openBlockers.length) })}
          </p>
        ) : null}
      </div>

      {GROUPS.map((group) => {
        const all = relations[group.data] ?? [];
        if (!all.length) return null;
        const resolved = group.kind === "blocked-by" ? all.filter(isResolved) : [];
        const visible = group.kind === "blocked-by" ? all.filter((task) => !isResolved(task)) : all;
        const folderId = `${headingId}-${group.kind}-resolved`;
        return (
          <div key={group.kind} data-group={group.kind} className="border-t border-border">
            <div className="flex items-baseline gap-2 px-4 pt-3 pb-1">
              <GroupHeading className="text-[0.8125rem] font-medium tracking-[-0.01em]">{text[group.name]}</GroupHeading>
              <span className="text-xs text-muted-foreground tabular-nums">{group.kind === "blocked-by" ? openBlockers.length : all.length}</span>
            </div>
            {visible.length ? <ul>{visible.map((task) => row(group.kind, task))}</ul> : null}
            {resolved.length ? (
              <div className="px-2 pb-1.5">
                <Button type="button" variant="ghost" size="sm" aria-expanded={showResolved} aria-controls={folderId} onClick={() => setShowResolved((value) => !value)} className="text-muted-foreground hover:text-foreground">
                  {showResolved ? <IconChevronDown /> : <IconChevronRight />}
                  {fill(showResolved ? text.hideResolved : text.showResolved, { count: String(resolved.length) })}
                </Button>
                <ul id={folderId} hidden={!showResolved} className="-mx-2 mt-0.5">
                  {showResolved ? resolved.map((task) => row(group.kind, task)) : null}
                </ul>
              </div>
            ) : null}
          </div>
        );
      })}

      {total === 0 ? <p className="border-t border-border px-4 py-5 text-sm text-muted-foreground">{text.empty}</p> : null}

      <p role="status" className="sr-only">
        {said}
      </p>
    </section>
  );
}
