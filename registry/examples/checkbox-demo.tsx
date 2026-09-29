"use client";

import { useId, useState } from "react";

import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";

const TASKS = [
  { id: "changelog", label: "Write the changelog" },
  { id: "gates", label: "Run the release gates" },
  { id: "tag", label: "Tag the version" },
] as const;

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [done, setDone] = useState<string[]>(["changelog"]);
  const parent = done.length === TASKS.length ? true : done.length > 0 ? "indeterminate" : false;

  return (
    <fieldset className="w-full max-w-xs">
      <legend className="sr-only">Release checklist</legend>
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Checkbox id={`${id}-all`} checked={parent} onCheckedChange={(value) => setDone(value === true ? TASKS.map((task) => task.id) : [])} />
        <Label htmlFor={`${id}-all`}>Ready to release</Label>
        <span className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
          {done.length} of {TASKS.length}
        </span>
      </div>
      <div className="grid gap-3.5 pt-4">
        {TASKS.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <Checkbox
              id={`${id}-${task.id}`}
              checked={done.includes(task.id)}
              onCheckedChange={(value) => setDone((current) => (value === true ? [...current, task.id] : current.filter((item) => item !== task.id)))}
            />
            <Label htmlFor={`${id}-${task.id}`} className="font-normal">
              {task.label}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
