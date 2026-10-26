"use client";

import { useRef, useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { TaskRow, type TaskRowTask } from "@rhs-ui/application/task-row";
import { IconCopy, IconMoreHorizontal, IconTrash } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";

// A fixed "now" keeps the due dates the same on every load. In an app, leave `now` out and the rows read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");

const START: readonly TaskRowTask[] = [
  { id: "t1", title: "Final copy review for the pricing page", due: "2026-10-24", priority: "high", subtasks: { done: 2, total: 5 }, assignee: { name: "Mara Okafor" } },
  { id: "t2", title: "Redirect map for 212 legacy URLs", due: "2026-10-26", priority: "urgent", subtasks: { done: 4, total: 5 }, assignee: { name: "Leo Martins" } },
  { id: "t3", title: "Replace placeholder photography", due: "2026-10-27", priority: "medium", subtasks: { done: 1, total: 3 }, assignee: { name: "Sofia Rossi" } },
  {
    id: "t4",
    title: "Cookie banner wording in Dutch and German, with legal sign-off from Ines before the Friday content freeze",
    due: "2026-10-31",
    priority: "low",
    assignee: { name: "Ines Kowalski" },
  },
  { id: "t5", title: "Go-live call and handover", due: "2026-11-14", assignee: { name: "Mara Okafor" } },
  { id: "t6", title: "Send the press kit to the agency" },
  { id: "t7", title: "Rollback rehearsal on staging", done: true, completedAt: "2026-10-23T09:12:00Z", subtasks: { done: 3, total: 3 }, assignee: { name: "Tomas Brandt" } },
  { id: "t8", title: "Accessibility notes for the checkout", done: true, completedAt: "2026-10-20T16:40:00Z", assignee: { name: "Priya Nair" } },
];

export default function Demo(): React.JSX.Element {
  const [tasks, setTasks] = useState(START);
  const [selected, setSelected] = useState<string | null>("t2");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const list = useRef<HTMLUListElement>(null);
  const copies = useRef(0);
  const open = tasks.filter((task) => !task.done).length;

  function duplicate(task: TaskRowTask) {
    copies.current += 1;
    const copy: TaskRowTask = { ...task, id: `${task.id}-copy-${copies.current}`, title: `${task.title} (copy)`, done: false, completedAt: undefined, subtasks: task.subtasks ? { done: 0, total: task.subtasks.total } : undefined };
    setTasks((current) => current.flatMap((item) => (item.id === task.id ? [item, copy] : [item])));
  }

  function remove(task: TaskRowTask) {
    setTasks((current) => current.filter((item) => item.id !== task.id));
    // The row that had focus is gone: focus moves to the list, not to the top of the page.
    requestAnimationFrame(() => list.current?.focus());
  }

  return (
    <figure className="grid w-full max-w-3xl gap-2">
      <figcaption className="text-xs text-muted-foreground">Complete a task with its checkbox without opening it. A long title is cut to one line (two on a phone) and appears in full on hover and on focus.</figcaption>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em]">Northwind redesign</h2>
            <p aria-live="polite" className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {open} open, {tasks.length - open} done
            </p>
          </div>
          <SegmentedControl
            label="Row density"
            value={density}
            onValueChange={(value) => setDensity(value === "compact" ? "compact" : "comfortable")}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </div>
        <ul ref={list} tabIndex={-1} aria-label="Tasks" className="divide-y divide-border outline-none">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={{ ...task, href: `/tasks/${task.id}` }}
              now={NOW}
              density={density}
              selected={selected === task.id}
              onOpen={(event) => {
                // A preview has nowhere to go: a router would navigate here.
                event.preventDefault();
                setSelected(task.id);
              }}
              onToggle={(done) => setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, done, completedAt: done ? new Date(NOW).toISOString() : undefined } : item)))}
              actions={
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`More actions for ${task.title}`}
                      className="size-7 text-muted-foreground hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/task-row:opacity-100"
                    >
                      <IconMoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuItem onSelect={() => duplicate(task)}>
                      <IconCopy />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => remove(task)}>
                      <IconTrash />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </ul>
      </div>
    </figure>
  );
}
