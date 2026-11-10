"use client";

import { useId, useState, type ReactNode } from "react";

import { StatusMarker, StatusSelect, type StatusOption } from "@rhs-ui/application/status-select";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const STATUSES: readonly StatusOption[] = [
  { value: "backlog", label: "Backlog", kind: "backlog", group: "Open" },
  { value: "todo", label: "To do", kind: "todo", group: "Open" },
  { value: "progress", label: "In progress", kind: "progress", group: "Open" },
  { value: "review", label: "In review", kind: "review", group: "Open" },
  { value: "done", label: "Done", kind: "done", group: "Closed" },
  { value: "cancelled", label: "Cancelled", kind: "cancelled", group: "Closed" },
];

/** Three ascending bars with `level` of them filled: a priority, drawn by hand and passed as a `marker`. */
function Bars({ level }: { level: 0 | 1 | 2 | 3 }): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false" className="size-4 shrink-0 text-foreground">
      {[0, 1, 2].map((index) => (
        <rect key={index} x={2 + index * 4.5} y={9 - index * 3} width="3" height={5 + index * 3} rx="0.8" opacity={index < level ? 1 : 0.28} />
      ))}
    </svg>
  );
}

const PRIORITIES: readonly StatusOption[] = [
  { value: "high", label: "High", marker: <Bars level={3} /> },
  { value: "medium", label: "Medium", marker: <Bars level={2} /> },
  { value: "low", label: "Low", marker: <Bars level={1} /> },
  { value: "none", label: "No priority", marker: <Bars level={0} /> },
];

interface Issue {
  id: string;
  title: string;
  status: string;
}

const ISSUES: readonly Issue[] = [
  { id: "KST-214", title: "Replace the expired certificate on api.northwind.dev", status: "progress" },
  { id: "KST-209", title: "Redirect map for 212 legacy URLs", status: "review" },
  { id: "KST-203", title: "Replace placeholder photography", status: "todo" },
  { id: "KST-198", title: "Ask Priya about the press kit", status: "backlog" },
  { id: "KST-187", title: "Retire the old status page", status: "done" },
];

const SIZES = [14, 16, 20, 24] as const;
const WORDS = Object.fromEntries(STATUSES.map((status) => [status.kind, status.label])) as Record<string, string>;

const card = "rounded-xl border border-border bg-card text-card-foreground shadow-xs";

export default function Demo(): React.JSX.Element {
  const detailId = useId();
  const keysId = useId();
  const priorityId = useId();
  const [detail, setDetail] = useState("progress");
  const [quick, setQuick] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [issues, setIssues] = useState(ISSUES);

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 grid-cols-1 content-start gap-9">
        <Example caption="A field in a detail panel. The list is grouped under Open and Closed, and a screen reader hears the group with the word.">
          <div className={cn(card, "grid gap-4 p-5 sm:p-6")}>
            <div className="grid gap-0.5">
              <h2 className="text-sm font-medium tracking-[-0.01em]">Replace the expired certificate</h2>
              <p className="text-xs text-muted-foreground">KST-214 · api.northwind.dev</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={detailId}>Status</Label>
              <StatusSelect id={detailId} statuses={STATUSES} value={detail} onValueChange={setDetail} />
            </div>
          </div>
        </Example>

        <Example caption="With showShortcuts: open the list and press a number. The number keys pick, and the words still answer typeahead.">
          <div className={cn(card, "grid gap-2 p-5 sm:p-6")}>
            <Label htmlFor={keysId}>Move to</Label>
            <StatusSelect id={keysId} statuses={STATUSES} value={quick} onValueChange={setQuick} showShortcuts />
          </div>
        </Example>

        <Example caption="The six markers at 14, 16, 20 and 24px. They differ in shape, not only in weight.">
          <div role="region" aria-label="The markers at each size" tabIndex={0} className={cn(card, "relative overflow-x-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40")}>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2.5 font-normal">
                    Kind
                  </th>
                  {SIZES.map((size) => (
                    <th key={size} scope="col" className="px-2 py-2.5 text-center font-normal tabular-nums">
                      {size}px
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {STATUSES.map((status) => (
                  <tr key={status.value}>
                    <th scope="row" className="px-4 py-2 font-normal whitespace-nowrap">
                      {WORDS[status.kind ?? "todo"]}
                    </th>
                    {SIZES.map((size) => (
                      <td key={size} className="px-2 py-2">
                        <span className="flex justify-center">
                          <StatusMarker kind={status.kind ?? "todo"} size={size} />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 grid-cols-1 content-start gap-9">
        <Example caption="Compact and borderless in a list: marker and word only, and a border when you hover or open it.">
          <ul className={cn(card, "divide-y divide-border")}>
            {issues.map((issue) => (
              <li key={issue.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm leading-5">{issue.title}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{issue.id}</p>
                </div>
                <StatusSelect
                  size="sm"
                  variant="ghost"
                  aria-label={`Status of ${issue.id}`}
                  statuses={STATUSES}
                  value={issue.status}
                  onValueChange={(next) => setIssues((list) => list.map((item) => (item.id === issue.id ? { ...item, status: next } : item)))}
                  className="-mx-3 w-36 shrink-0"
                />
              </li>
            ))}
          </ul>
        </Example>

        <Example caption="Not only statuses: pass your own marker. Here a priority is three bars drawn by hand, and a list with no groups has no headings.">
          <div className={cn(card, "grid gap-2 p-5 sm:p-6")}>
            <Label htmlFor={priorityId}>Priority</Label>
            <StatusSelect id={priorityId} statuses={PRIORITIES} value={priority} onValueChange={setPriority} placeholder="Set priority" />
          </div>
        </Example>
      </div>
    </div>
  );
}
