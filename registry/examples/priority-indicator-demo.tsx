"use client";

import { useState, type ReactNode } from "react";

import { PriorityIndicator } from "@rhs-ui/application/priority-indicator";
import { PRIORITIES, type Priority } from "@rhs-ui/application/priority-indicator/glyph";

const MEANING: Record<Priority, string> = {
  urgent: "Drop everything, fix it today",
  high: "Needs doing this week",
  medium: "Planned for this cycle",
  low: "When there is room",
  none: "Not triaged yet",
};

interface Task {
  id: string;
  title: string;
  priority: Priority;
}

const TASKS: readonly Task[] = [
  { id: "cert", title: "Replace the expired certificate on api.northwind.dev", priority: "urgent" },
  { id: "redirects", title: "Redirect map for 212 legacy URLs", priority: "high" },
  { id: "photos", title: "Replace placeholder photography", priority: "medium" },
  { id: "footer", title: "Tidy the footer spacing on mobile", priority: "low" },
  { id: "press", title: "Ask Priya about the press kit", priority: "none" },
];

const SIZES = [
  ["14px mark", "sm"],
  ["16px mark", "md"],
  ["20px mark", "lg"],
] as const;

function Panel({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">{children}</div>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [tasks, setTasks] = useState(TASKS);

  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-xl gap-6">
        <Panel caption="Five levels, five shapes: they read without colour, and the word is real text">
          <ul className="divide-y divide-border">
            {PRIORITIES.map((level) => (
              <li key={level} className="flex items-center justify-between gap-4 px-4 py-3">
                <PriorityIndicator priority={level} />
                <span className="text-right text-[0.8125rem] text-muted-foreground">{MEANING[level]}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel caption="Three sizes on one 16 unit grid, each beside the type it was drawn for, and the mark alone">
          <div role="region" aria-label="The mark at each size" tabIndex={0} className="relative overflow-x-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
            <table className="w-full border-collapse text-left sm:min-w-[34rem]">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  {SIZES.map(([title, size]) => (
                    <th key={title} scope="col" className={size === "lg" ? "px-4 py-2.5 font-normal max-sm:hidden" : "px-4 py-2.5 font-normal"}>
                      {title}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-2.5 font-normal">
                    Mark only
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PRIORITIES.map((level) => (
                  <tr key={level}>
                    {SIZES.map(([title, size]) => (
                      <td key={title} className={size === "lg" ? "px-4 py-3 max-sm:hidden" : "px-4 py-3"}>
                        <PriorityIndicator priority={level} size={size} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <PriorityIndicator priority={level} size="lg" showLabel={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel caption="Editable: the priority is a button that opens the five levels, and the list follows the choice">
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span className="min-w-0 flex-1 text-sm leading-snug">{task.title}</span>
                <PriorityIndicator
                  priority={task.priority}
                  editable
                  size="sm"
                  // One width for every trigger, the mark at the start of it and the chevron at the end, so the five marks stand in one column.
                  className="min-w-[7.5rem] shrink-0 justify-start [&>svg:last-child]:ml-auto"
                  onPriorityChange={(next) => setTasks((list) => list.map((item) => (item.id === task.id ? { ...item, priority: next } : item)))}
                />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
