"use client";

import { useMemo, useState, type ReactNode } from "react";

import { DisplayOptionsPanel, DisplayOptionsPopover, type DisplayField, type DisplayLayout, type DisplayProperty, type DisplayValue } from "@rhs-ui/application/display-options-popover";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<DisplayValue>(START);
  const [side, setSide] = useState<DisplayValue>(SIDE);
  const layout = LAYOUTS.find((item) => item.id === value.layout)?.label ?? "List";

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="The Display button of a list view, open. Every change shows in the list below at once: group by assignee, flip the ordering, hide Priority, switch to Board or Table. The button counts how many of the four settings differ from the defaults, and Reset puts them back.">
          <section aria-labelledby="display-options-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
              <div className="grid gap-0.5">
                <h2 id="display-options-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
                  Sprint 42
                </h2>
                <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                  {TASKS.length} tasks, {layout.toLowerCase()} view
                </p>
              </div>
              <DisplayOptionsPopover defaultOpen layouts={LAYOUTS} groupings={GROUPINGS} orderings={ORDERINGS} properties={PROPERTIES} value={value} onValueChange={setValue} />
            </div>
            <TaskView value={value} />
          </section>
        </Case>

        <Case caption="The panel on its own, for a sheet on a phone. A heading whose setting differs from the defaults says so, and Reset is on.">
          <div className="w-full max-w-[21rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-sm">
            <DisplayOptionsPanel layouts={LAYOUTS} groupings={GROUPINGS} orderings={ORDERINGS} properties={PROPERTIES} value={side} onValueChange={setSide} />
          </div>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Status = "todo" | "progress" | "review" | "done";
type Priority = "urgent" | "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: string;
  due: string;
  labels: readonly string[];
}

const TASKS: readonly Task[] = [
  { id: "NW-201", title: "Redirect map for 212 legacy URLs", status: "progress", priority: "high", assignee: "Maya Okafor", due: "2026-11-12", labels: ["SEO"] },
  { id: "NW-204", title: "Checkout: keyboard order and focus rings", status: "review", priority: "high", assignee: "Priya Nair", due: "2026-11-13", labels: ["Accessibility"] },
  { id: "NW-207", title: "Load test the search endpoint at 400 rps", status: "todo", priority: "urgent", assignee: "Dan Cho", due: "2026-11-11", labels: ["Performance"] },
  { id: "NW-209", title: "Empty states for the saved views list", status: "todo", priority: "medium", assignee: "Leo Martins", due: "2026-11-18", labels: ["Design"] },
  { id: "NW-212", title: "Invoice export as CSV and PDF", status: "progress", priority: "medium", assignee: "Dan Cho", due: "2026-11-16", labels: ["Billing"] },
  { id: "NW-215", title: "Rename Teams to Workspaces in the app", status: "done", priority: "low", assignee: "Maya Okafor", due: "2026-11-06", labels: ["Copy"] },
  { id: "NW-218", title: "Rate limit the public API per key", status: "review", priority: "urgent", assignee: "Leo Martins", due: "2026-11-12", labels: ["API", "Security"] },
  { id: "NW-221", title: "Dark mode contrast pass on the charts", status: "todo", priority: "low", assignee: "Priya Nair", due: "2026-11-24", labels: ["Design", "Accessibility"] },
  { id: "NW-224", title: "Webhook retries with backoff", status: "progress", priority: "high", assignee: "Dan Cho", due: "2026-11-14", labels: ["API"] },
  { id: "NW-226", title: "Onboarding checklist copy review", status: "done", priority: "medium", assignee: "Priya Nair", due: "2026-11-05", labels: ["Copy"] },
];

const STATUS_LABEL: Record<Status, string> = { todo: "To do", progress: "In progress", review: "In review", done: "Done" };
const STATUS_ORDER: readonly Status[] = ["todo", "progress", "review", "done"];
const PRIORITY_LABEL: Record<Priority, string> = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
const PRIORITY_ORDER: readonly Priority[] = ["urgent", "high", "medium", "low"];

const LAYOUTS: readonly DisplayLayout[] = [
  { id: "list", label: "List" },
  { id: "board", label: "Board" },
  { id: "table", label: "Table" },
];
const GROUPINGS: readonly DisplayField[] = [
  { id: "none", label: "No grouping" },
  { id: "status", label: "Status" },
  { id: "assignee", label: "Assignee" },
  { id: "priority", label: "Priority" },
];
const ORDERINGS: readonly DisplayField[] = [
  { id: "due", label: "Due date" },
  { id: "priority", label: "Priority" },
  { id: "title", label: "Title" },
];
const PROPERTIES: readonly DisplayProperty[] = [
  { id: "id", label: "ID" },
  { id: "status", label: "Status" },
  { id: "priority", label: "Priority" },
  { id: "assignee", label: "Assignee" },
  { id: "due", label: "Due date" },
  { id: "labels", label: "Labels", visible: false },
];

// The defaults are the first option of each, ascending, with every property except Labels. This view differs in grouping and ordering: 2 changed.
const START: DisplayValue = { layout: "list", grouping: "status", ordering: "priority", direction: "asc", properties: ["id", "status", "priority", "assignee", "due"] };
const SIDE: DisplayValue = { layout: "board", grouping: "assignee", ordering: "title", direction: "desc", properties: ["status", "assignee", "labels"] };

interface Group {
  key: string;
  label: string;
  tasks: Task[];
}

/** The tasks in the order and the groups the display value asks for. */
function arrange(tasks: readonly Task[], value: DisplayValue): Group[] {
  const sign = value.direction === "desc" ? -1 : 1;
  const sorted = [...tasks].sort((a, b) => {
    const diff =
      value.ordering === "due"
        ? a.due.localeCompare(b.due, "en-US")
        : value.ordering === "priority"
          ? PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
          : a.title.localeCompare(b.title, "en-US");
    return (diff || a.id.localeCompare(b.id, "en-US")) * sign;
  });
  if (value.grouping === "status") return STATUS_ORDER.map((key) => ({ key, label: STATUS_LABEL[key], tasks: sorted.filter((task) => task.status === key) }));
  if (value.grouping === "priority") return PRIORITY_ORDER.map((key) => ({ key, label: PRIORITY_LABEL[key], tasks: sorted.filter((task) => task.priority === key) })).filter((group) => group.tasks.length);
  if (value.grouping === "assignee") {
    const names = [...new Set(sorted.map((task) => task.assignee))].sort((a, b) => a.localeCompare(b, "en-US"));
    return names.map((name) => ({ key: name, label: name, tasks: sorted.filter((task) => task.assignee === name) }));
  }
  return [{ key: "all", label: "", tasks: sorted }];
}

const dueText = (due: string) => new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" }).format(Date.parse(`${due}T00:00:00Z`));

/** One property of one task, drawn the same way in every layout. */
function Cell({ task, property }: { task: Task; property: string }): ReactNode {
  switch (property) {
    case "status":
      return (
        <Badge variant="outline" className="h-[1.125rem] px-1.5 text-[0.6875rem]">
          {STATUS_LABEL[task.status]}
        </Badge>
      );
    case "priority":
      return <span className="text-xs text-muted-foreground">{PRIORITY_LABEL[task.priority]}</span>;
    case "assignee":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar aria-hidden="true" size="sm" className="size-5">
            <AvatarFallback className="text-[0.5625rem]">{initialsOf(task.assignee)}</AvatarFallback>
          </Avatar>
          {task.assignee}
        </span>
      );
    case "due":
      return (
        <time dateTime={task.due} className="text-xs text-muted-foreground tabular-nums">
          {dueText(task.due)}
        </time>
      );
    case "labels":
      return (
        <span className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span key={label} className="rounded-sm border border-border px-1 text-[0.6875rem] leading-4 text-muted-foreground">
              {label}
            </span>
          ))}
        </span>
      );
    default:
      return null;
  }
}

const META = ["status", "priority", "assignee", "due", "labels"] as const;

function TaskView({ value }: { value: DisplayValue }): React.JSX.Element {
  const groups = useMemo(() => arrange(TASKS, value), [value]);
  const shown = new Set(value.properties);
  const columns = META.filter((property) => shown.has(property));
  const title = (task: Task) => (
    <>
      {shown.has("id") ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{task.id}</span> : null}
      <span className="min-w-0 text-sm font-medium tracking-[-0.01em]">{task.title}</span>
    </>
  );

  if (value.layout === "board") {
    return (
      <div className="relative flex gap-3 overflow-x-auto p-3">
        {groups.map((group) => (
          <section key={group.key} aria-label={group.label || "All tasks"} className="w-64 shrink-0 rounded-lg bg-muted/50 p-2">
            <h3 className="flex items-center justify-between px-1.5 py-1 text-xs font-medium">
              {group.label || "All tasks"}
              <span className="text-muted-foreground tabular-nums">{group.tasks.length}</span>
            </h3>
            <ul className="mt-1 grid gap-2">
              {group.tasks.map((task) => (
                <li key={task.id} className="grid gap-2 rounded-md border border-border bg-card p-3 shadow-xs">
                  <p className="flex flex-wrap items-baseline gap-x-2">{title(task)}</p>
                  {columns.length ? <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">{columns.map((property) => <Cell key={property} task={task} property={property} />)}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  if (value.layout === "table") {
    return (
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-2 font-medium">
                Task
              </th>
              {columns.map((property) => (
                <th key={property} scope="col" className="px-3 py-2 font-medium capitalize">
                  {property === "due" ? "Due date" : property}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.flatMap((group) => [
              group.label ? (
                <tr key={`group-${group.key}`} className="bg-muted/40">
                  <th scope="colgroup" colSpan={columns.length + 1} className="px-4 py-1.5 text-left text-xs font-medium">
                    {group.label} <span className="font-normal text-muted-foreground tabular-nums">{group.tasks.length}</span>
                  </th>
                </tr>
              ) : null,
              ...group.tasks.map((task) => (
                <tr key={task.id}>
                  <th scope="row" className="px-4 py-2.5 text-left font-normal">
                    <span className="flex items-baseline gap-2">{title(task)}</span>
                  </th>
                  {columns.map((property) => (
                    <td key={property} className="px-3 py-2.5 align-middle">
                      <Cell task={task} property={property} />
                    </td>
                  ))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label || "All tasks"}>
          {group.label ? (
            <h3 className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-1.5 text-xs font-medium">
              {group.label}
              <span className="text-muted-foreground tabular-nums">{group.tasks.length}</span>
            </h3>
          ) : null}
          <ul className="divide-y divide-border border-b border-border last:border-b-0">
            {group.tasks.map((task) => (
              <li key={task.id} className="grid gap-1.5 px-4 py-2.5">
                <p className="flex min-w-0 items-baseline gap-2">{title(task)}</p>
                {columns.length ? <p className="flex flex-wrap items-center gap-x-3 gap-y-1">{columns.map((property) => <Cell key={property} task={task} property={property} />)}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
