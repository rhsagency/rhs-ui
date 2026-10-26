"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconCheck, IconChevronRight, IconPlus, IconWarning } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rhs-ui/primitives/dropdown-menu";
import { TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import {
  RACI_ROLES,
  ROLE_INFO,
  clearOfPinned,
  isRole,
  problemWords,
  roleOf,
  sectionsOf,
  stepRole,
  tallyPerson,
  tallyTask,
  verdictWords,
  withRole,
  type RaciChange,
  type RaciPerson,
  type RaciRole,
  type RaciTask,
  type RaciValue,
  type TaskTally,
} from "@rhs-ui/dashboard/raci-matrix/roles";
import { cn } from "@/lib/utils";

export type { RaciChange, RaciPerson, RaciRole, RaciTask, RaciValue } from "@rhs-ui/dashboard/raci-matrix/roles";

export interface RaciMatrixProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The work, one row each. A `group` folds the rows under a heading. */
  tasks: readonly RaciTask[];
  /** The people, one column each. */
  people: readonly RaciPerson[];
  /** Who plays which role, `value[taskId][personId]`. Pair it with `onValueChange` to control it. */
  value?: RaciValue;
  /** The roles to start from when you do not control them. */
  defaultValue?: RaciValue;
  /** Called with the whole new map and what changed, whenever someone sets or clears a role. */
  onValueChange?: (value: RaciValue, change: RaciChange) => void;
  /** Show the chart without a way to change it: plain letters, no menus. Groups still fold. */
  readOnly?: boolean;
  /** Groups that start folded. A folded group still says when one of its tasks needs attention. */
  defaultCollapsedGroups?: readonly string[];
  /** Names the table for screen readers. */
  caption?: string;
}

const CHIP_BASE = "inline-flex shrink-0 items-center justify-center rounded-md border font-semibold tabular-nums select-none";

/** Four weights of one monochrome chip, so the letter is never the only difference: solid, outlined, soft, dashed. */
const CHIP: Record<RaciRole, string> = {
  A: "border-primary bg-primary text-primary-foreground",
  R: "border-[1.5px] border-foreground bg-card text-foreground",
  C: "border-transparent bg-muted text-foreground",
  I: "border-dashed border-muted-foreground/60 bg-transparent text-muted-foreground",
};

const CHIP_HOVER: Record<RaciRole, string> = {
  A: "hover:bg-primary/85",
  R: "hover:bg-muted",
  C: "hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_9%)]",
  I: "hover:border-muted-foreground hover:bg-muted/60",
};

/** The same quiet fill for group headings and the workload row, solid so a pinned label hides what scrolls beneath it. */
const FILL = "bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)]";

/** The first column stays put while the table scrolls sideways; a soft edge appears once it has something to hide. */
const PINNED = "sticky left-0 z-10 border-r border-border group-data-[scrolled]/matrix:shadow-[4px_0_6px_-4px_oklch(0_0_0/0.14)]";

const NO_TALLY: TaskTally = { accountable: 0, involved: 0, problem: "none" };

const cellKey = (taskId: string, personId: string): string => `${taskId}\u0000${personId}`;

function RoleChip({ role, size = "md", className, ...props }: { role: RaciRole; size?: "sm" | "md" } & ComponentProps<"span">) {
  return (
    <span data-role={role} className={cn(CHIP_BASE, CHIP[role], size === "md" ? "size-8 text-[0.8125rem]" : "size-6 text-xs", className)} {...props}>
      {role}
    </span>
  );
}

interface RoleCellProps {
  task: RaciTask;
  person: RaciPerson;
  role: RaciRole | undefined;
  readOnly: boolean;
  /** The one cell in the tab order. The others are reached with the arrow keys. */
  tabbable: boolean;
  register: (key: string, element: HTMLButtonElement | null) => void;
  onActivate: (task: RaciTask, person: RaciPerson, cell: HTMLButtonElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, task: RaciTask, person: RaciPerson) => void;
  onChange: (task: RaciTask, person: RaciPerson, role: RaciRole | undefined) => void;
}

/** One cell: a letter in a chip, and with it the full sentence ("Design review, Mara Visser, Accountable") as its name. */
function RoleCell({ task, person, role, readOnly, tabbable, register, onActivate, onKeyDown, onChange }: RoleCellProps) {
  const spoken = `${task.label}, ${person.name}, ${role ? ROLE_INFO[role].word : "not involved"}`;

  if (readOnly) {
    return (
      <span className="inline-flex size-8 items-center justify-center">
        <span className="sr-only">{spoken}</span>
        {role ? <RoleChip role={role} aria-hidden="true" /> : null}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={(element) => register(cellKey(task.id, person.id), element)}
          type="button"
          aria-label={spoken}
          tabIndex={tabbable ? 0 : -1}
          onFocus={(event) => onActivate(task, person, event.currentTarget)}
          onKeyDown={(event) => onKeyDown(event, task, person)}
          className={cn(
            CHIP_BASE,
            "size-8 text-[0.8125rem] outline-none motion-safe:transition-[background-color,border-color,color,box-shadow,transform] motion-safe:duration-150 motion-safe:active:translate-y-px",
            "focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:ring-[3px] data-[state=open]:ring-ring/25",
            role
              ? [CHIP[role], CHIP_HOVER[role]]
              : "border-dashed border-transparent text-transparent hover:border-border hover:text-muted-foreground focus-visible:border-border focus-visible:text-muted-foreground data-[state=open]:border-border data-[state=open]:text-muted-foreground [@media(pointer:coarse)]:border-border/60 [@media(pointer:coarse)]:text-muted-foreground/50",
          )}
        >
          {role ?? <IconPlus size={14} aria-hidden="true" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" collisionPadding={8} className="w-64 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="max-w-full truncate">
          {task.label} &middot; {person.name}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={role ?? ""} onValueChange={(next) => onChange(task, person, isRole(next) ? next : undefined)}>
          {RACI_ROLES.map((info) => (
            <DropdownMenuRadioItem key={info.key} value={info.key} className="gap-2.5 py-1.5">
              <RoleChip role={info.key} size="sm" aria-hidden="true" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-medium">{info.word}</span>
                <span className="text-xs text-muted-foreground">{info.meaning}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!role} onSelect={() => onChange(task, person, undefined)}>
          Not involved
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Who does what on a project, as a RACI chart: tasks down the side, people
 * across the top, and in each cell the role that person plays on that task:
 * Responsible, Accountable, Consulted or Informed. The four letters are four
 * chip weights (solid, outlined, soft, dashed), so the matrix scans in
 * monochrome. Every cell is named in full ("Design review, Mara Visser,
 * Accountable"). A click opens a small menu; from the keyboard the arrow keys
 * move between cells, R, A, C and I set the role, plus and minus step through
 * them and Backspace clears it.
 * Every task needs exactly one accountable person: a row with none, or with
 * two, says so in words with a mark, and a line above the table counts them.
 * Counts at the end of each row and under each column show who carries how
 * much, tasks fold into their groups, and on a narrow screen the table scrolls
 * sideways while the task names stay pinned.
 */
export function RaciMatrix({
  tasks,
  people,
  value,
  defaultValue,
  onValueChange,
  readOnly = false,
  defaultCollapsedGroups,
  caption = "RACI matrix",
  className,
  ...props
}: RaciMatrixProps) {
  const [own, setOwn] = useState<RaciValue>(defaultValue ?? {});
  const current = value ?? own;
  const [folded, setFolded] = useState<ReadonlySet<string>>(() => new Set(defaultCollapsedGroups));
  const [active, setActive] = useState<{ taskId: string; personId: string } | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [announcement, setAnnouncement] = useState("");
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const region = useRef<HTMLDivElement>(null);
  const hintId = useId();

  const sections = sectionsOf(tasks);
  const isFolded = (group: string | undefined): boolean => group !== undefined && folded.has(group);
  const visibleTasks = sections.flatMap((section) => (isFolded(section.group) ? [] : section.tasks));
  const tallies = new Map(tasks.map((task) => [task.id, tallyTask(current, task, people)] as const));
  const tallyOf = (task: RaciTask): TaskTally => tallies.get(task.id) ?? NO_TALLY;
  const verdict = verdictWords(tasks.map(tallyOf));
  const allGood = verdict !== "" && tasks.every((task) => tallyOf(task).problem === null);

  // One cell is in the tab order. It is the one last focused, or the first on screen when that one has folded away.
  const firstTask = visibleTasks[0];
  const firstPerson = people[0];
  const tabStop =
    active && visibleTasks.some((task) => task.id === active.taskId) && people.some((person) => person.id === active.personId)
      ? active
      : firstTask && firstPerson
        ? { taskId: firstTask.id, personId: firstPerson.id }
        : null;

  const register = (key: string, element: HTMLButtonElement | null): void => {
    if (element) cells.current.set(key, element);
    else cells.current.delete(key);
  };

  // A cell that takes focus becomes the tab stop, and the keyboard never rests on one hidden beside the pinned task names or past the edge.
  const activate = (task: RaciTask, person: RaciPerson, cell: HTMLButtonElement): void => {
    setActive({ taskId: task.id, personId: person.id });
    if (region.current) clearOfPinned(region.current, cell);
  };

  // Which edges have more to scroll to, so the pinned column can lift off and the right edge can say there is more.
  const measure = (): void => {
    const element = region.current;
    if (!element) return;
    const left = element.scrollLeft > 0;
    const right = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
    setEdges((before) => (before.left === left && before.right === right ? before : { left, right }));
  };
  const empty = tasks.length === 0 || people.length === 0;
  useEffect(() => {
    measure();
    const element = region.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    // The table is observed as well as the region, so a person or a folded group changing the width updates the edges.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
    // `measure` reads only a ref and a state setter, so it never goes stale; the observer is rebuilt when the matrix appears or disappears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empty]);

  const change = (task: RaciTask, person: RaciPerson, role: RaciRole | undefined): void => {
    if (roleOf(current, task.id, person.id) === role) return;
    const next = withRole(current, task.id, person.id, role);
    if (value === undefined) setOwn(next);
    onValueChange?.(next, { taskId: task.id, personId: person.id, role });
    setAnnouncement(
      role ? `${person.name} is now ${ROLE_INFO[role].word.toLowerCase()} for ${task.label}.` : `${person.name} is no longer involved in ${task.label}.`,
    );
  };

  const onCellKeyDown = (event: KeyboardEvent<HTMLButtonElement>, task: RaciTask, person: RaciPerson): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const row = visibleTasks.findIndex((entry) => entry.id === task.id);
    const column = people.findIndex((entry) => entry.id === person.id);
    const lastRow = visibleTasks.length - 1;
    const lastColumn = people.length - 1;
    let target: [number, number] | null = null;
    switch (event.key) {
      case "ArrowRight":
        target = [row, Math.min(lastColumn, column + 1)];
        break;
      case "ArrowLeft":
        target = [row, Math.max(0, column - 1)];
        break;
      case "ArrowDown":
        target = [Math.min(lastRow, row + 1), column];
        break;
      case "ArrowUp":
        target = [Math.max(0, row - 1), column];
        break;
      case "Home":
        target = [row, 0];
        break;
      case "End":
        target = [row, lastColumn];
        break;
      case "PageUp":
        target = [0, column];
        break;
      case "PageDown":
        target = [lastRow, column];
        break;
      case "Backspace":
      case "Delete":
        event.preventDefault();
        change(task, person, undefined);
        return;
      // Plus and minus step through the roles, for anyone who would rather cycle than jump.
      case "+":
      case "=":
      case "-":
      case "_":
        event.preventDefault();
        change(task, person, stepRole(roleOf(current, task.id, person.id), event.key === "+" || event.key === "=" ? 1 : -1));
        return;
      default: {
        const letter = event.key.length === 1 ? event.key.toUpperCase() : "";
        if (isRole(letter)) {
          event.preventDefault();
          change(task, person, letter);
        }
        return;
      }
    }
    // Arrow keys move focus; the menu opens with Enter or Space (ArrowDown must not open it here).
    event.preventDefault();
    const nextTask = visibleTasks[target[0]];
    const nextPerson = people[target[1]];
    if (nextTask && nextPerson) cells.current.get(cellKey(nextTask.id, nextPerson.id))?.focus();
  };

  const toggle = (group: string): void =>
    setFolded((before) => {
      const next = new Set(before);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  if (empty) {
    return (
      <div data-slot="raci-matrix" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          {tasks.length === 0 ? "No tasks yet. Add the work to see who does what." : "No people yet. Add the team to see who does what."}
        </p>
      </div>
    );
  }

  const columns = people.length + 1;

  return (
    <div data-slot="raci-matrix" data-scrolled={edges.left || undefined} className={cn("group/matrix @container w-full min-w-0", className)} {...props}>
      <p role="status" className="mb-3 flex min-h-5 items-start gap-2 text-sm">
        {verdict ? (
          <>
            {allGood ? <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <IconWarning aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />}
            <span className={allGood ? "text-muted-foreground" : "font-medium"}>{verdict}</span>
          </>
        ) : null}
      </p>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* The focus ring of the scrolling region is drawn on the card: nothing inside it, such as the pinned column, can cover it. */}
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground has-[[role=region]:focus-visible]:ring-[3px] has-[[role=region]:focus-visible]:ring-ring/40">
        <div className="relative">
          {/* A table that scrolls sideways takes the keyboard too: the region can be focused and scrolled with the arrow keys.
              The scroll padding is the width of the pinned column (w-36, w-60 from @lg) and half a rem more, so a cell the browser scrolls
              into view lands beside it and not beneath it. A browser leaves a cell alone while a sliver of it shows, so a cell the keyboard
              reaches is also cleared of the pinned column and of the edge in script (clearOfPinned). */}
          <div
            ref={region}
            role="region"
            aria-label={caption}
            aria-describedby={readOnly ? undefined : hintId}
            tabIndex={0}
            onScroll={measure}
            className="relative scroll-pl-38 overflow-x-auto outline-none @lg:scroll-pl-62"
          >
            <table data-slot="table" className="w-full border-separate border-spacing-0 text-sm">
              <TableCaption className="sr-only">{caption}</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className={cn(PINNED, "z-20 h-auto w-36 min-w-36 max-w-36 border-b bg-card px-3 pb-3 align-bottom @lg:w-60 @lg:min-w-60 @lg:max-w-none")}>
                    Task
                  </TableHead>
                  {people.map((person) => (
                    <TableHead key={person.id} scope="col" className="h-auto min-w-20 border-b border-border px-2 py-3 text-center @lg:min-w-[6.5rem] align-bottom font-normal whitespace-normal">
                      <Avatar size="sm" aria-hidden="true" className="mx-auto">
                        <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                      </Avatar>
                      <span className="mt-2 block text-[0.8125rem] leading-tight font-medium text-foreground">{person.name}</span>
                      {person.role ? <span className="mt-0.5 block text-xs leading-tight text-muted-foreground">{person.role}</span> : null}
                    </TableHead>
                  ))}
                  <TableHead scope="col" className="h-auto w-24 min-w-24 border-b border-l border-border px-3 pb-3 text-center align-bottom">
                    Involved
                  </TableHead>
                </TableRow>
              </TableHeader>

              {sections.map((section) => {
                const group = section.group;
                const open = !isFolded(group);
                const flagged = section.tasks.filter((task) => tallyOf(task).problem !== null).length;
                return (
                  <TableBody key={section.key}>
                    {group !== undefined ? (
                      <TableRow className="hover:bg-transparent">
                        <TableHead scope="rowgroup" className={cn(PINNED, FILL, "h-auto w-36 min-w-36 max-w-36 border-b p-0 text-left @lg:w-60 @lg:min-w-60 @lg:max-w-60")}>
                          {/* The toggle is pinned, so it is always in view. The margin is wider than the table, so the scroll padding of the region
                              never makes the browser scroll the table when the toggle takes focus. */}
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => toggle(group)}
                            className="flex w-full scroll-mr-[100vw] items-center gap-2 px-3 py-2.5 text-left text-[0.8125rem] font-medium text-foreground outline-none motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
                          >
                            <IconChevronRight size={14} aria-hidden="true" className={cn("shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-150", open && "rotate-90")} />
                            <span title={group} className="line-clamp-2 min-w-0 flex-1 leading-tight whitespace-normal [overflow-wrap:anywhere]">
                              {group}
                            </span>
                            <Badge variant="muted" className="tabular-nums">
                              {section.tasks.length}
                              <span className="sr-only"> {section.tasks.length === 1 ? "task" : "tasks"}</span>
                            </Badge>
                            {!open && flagged > 0 ? (
                              <>
                                <IconWarning size={14} aria-hidden="true" className="shrink-0 text-destructive" />
                                <span className="sr-only">
                                  {flagged} {flagged === 1 ? "task needs" : "tasks need"} attention
                                </span>
                              </>
                            ) : null}
                          </button>
                        </TableHead>
                        <TableCell colSpan={columns} className={cn(FILL, "border-b border-border p-0")} />
                      </TableRow>
                    ) : null}

                    {open
                      ? section.tasks.map((task) => {
                          const tally = tallyOf(task);
                          return (
                            <TableRow key={task.id} data-invalid={tally.problem ? "" : undefined} className="group/row hover:bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)]">
                              <TableHead
                                scope="row"
                                className={cn(
                                  PINNED,
                                  "h-auto w-36 min-w-36 max-w-36 border-b bg-card px-3 py-2.5 text-left font-normal whitespace-normal text-foreground @lg:w-60 @lg:min-w-60 @lg:max-w-none",
                                  "group-hover/row:bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)]",
                                  tally.problem && "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-destructive",
                                )}
                              >
                                <span className="block text-sm leading-snug font-medium">{task.label}</span>
                                {tally.problem ? (
                                  <span className="mt-1 flex items-start gap-1.5 text-xs leading-snug font-medium text-destructive">
                                    <IconWarning size={14} aria-hidden="true" className="mt-px shrink-0" />
                                    {problemWords(tally)}
                                  </span>
                                ) : null}
                              </TableHead>
                              {people.map((person) => (
                                <TableCell key={person.id} className="border-b border-border p-2 text-center">
                                  <RoleCell
                                    task={task}
                                    person={person}
                                    role={roleOf(current, task.id, person.id)}
                                    readOnly={readOnly}
                                    tabbable={tabStop?.taskId === task.id && tabStop.personId === person.id}
                                    register={register}
                                    onActivate={activate}
                                    onKeyDown={onCellKeyDown}
                                    onChange={change}
                                  />
                                </TableCell>
                              ))}
                              <TableCell className="border-b border-l border-border px-3 py-2 text-center tabular-nums">
                                <span className="sr-only">
                                  {tally.involved} {tally.involved === 1 ? "person" : "people"} involved
                                </span>
                                <span aria-hidden="true" className={cn("text-sm", tally.involved === 0 ? "text-muted-foreground" : "font-medium")}>
                                  {tally.involved}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      : null}
                  </TableBody>
                );
              })}

              <TableFooter className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="row" className={cn(PINNED, FILL, "h-auto w-36 min-w-36 max-w-36 px-3 py-3 text-left align-top font-normal whitespace-normal text-foreground @lg:w-60 @lg:min-w-60 @lg:max-w-none")}>
                    <span className="block text-sm font-medium">Workload</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground @max-lg:sr-only">Tasks each person does or answers for</span>
                  </TableHead>
                  {people.map((person) => {
                    const tally = tallyPerson(current, person, tasks);
                    return (
                      <TableCell key={person.id} className={cn(FILL, "px-2 py-3 text-center align-top")}>
                        <span className="sr-only">
                          {person.name} does or answers for {tally.carries} of {tasks.length} tasks: responsible for {tally.R}, accountable for {tally.A}. Consulted on {tally.C}, informed of {tally.I}.
                        </span>
                        <span aria-hidden="true" className="block text-base leading-none font-medium tracking-[-0.02em] tabular-nums">
                          {tally.carries}
                        </span>
                        <span aria-hidden="true" className="mx-auto mt-2 block h-1 w-10 overflow-hidden rounded-full bg-border">
                          <span className="block h-full rounded-full bg-foreground" style={{ width: `${Math.round((tally.carries / tasks.length) * 100)}%` }} />
                        </span>
                        <span aria-hidden="true" className="mt-1.5 flex items-center justify-center gap-2.5 text-xs font-normal text-muted-foreground">
                          <span className="inline-flex items-baseline gap-1">
                            R<span className="font-medium text-foreground tabular-nums">{tally.R}</span>
                          </span>
                          <span className="inline-flex items-baseline gap-1">
                            A<span className="font-medium text-foreground tabular-nums">{tally.A}</span>
                          </span>
                        </span>
                      </TableCell>
                    );
                  })}
                  <TableCell className={cn(FILL, "border-l border-border")} />
                </TableRow>
              </TableFooter>
            </table>
          </div>
          {/* The right edge lifts while more people wait off screen. */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-px shadow-[-4px_0_6px_-4px_oklch(0_0_0/0.14)] motion-safe:transition-opacity motion-safe:duration-150",
              edges.right ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <div className="border-t border-border px-4 py-4">
          <dl data-slot="raci-legend" className="grid grid-cols-2 gap-x-6 gap-y-3 @3xl:grid-cols-4">
            {/* A group in a description list is a div of dt and dd and nothing else, so the chip lives in the term and the meaning lines up under the word. */}
            {RACI_ROLES.map((info) => (
              <div key={info.key} className="grid grid-cols-[1.5rem_minmax(0,1fr)] content-start gap-x-2.5">
                <dt className="col-span-2 flex items-center gap-2.5 text-[0.8125rem] leading-6 font-medium">
                  <RoleChip role={info.key} size="sm" aria-hidden="true" />
                  {info.word}
                </dt>
                <dd className="col-start-2 text-xs leading-snug text-muted-foreground">{info.meaning}</dd>
              </div>
            ))}
          </dl>
          {readOnly ? null : (
            <p className="mt-3.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="@lg:hidden">Tap or click a cell to set a role.</span>
              <span className="hidden @lg:inline">Click a cell for the menu, or focus it and press R, A, C or I. Plus and minus step through the roles; Backspace clears it.</span>
            </p>
          )}
        </div>
      </div>
      {readOnly ? null : (
        <p id={hintId} className="sr-only">
          Arrow keys move between cells. Press R, A, C or I to set a role, plus or minus to step through the roles, Backspace to clear it, or Enter to open the menu.
        </p>
      )}
    </div>
  );
}
