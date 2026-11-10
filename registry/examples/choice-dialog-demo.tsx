"use client";

import { useRef, useState, type ReactNode } from "react";

import { IconCalendar, IconUpload } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ChoiceDialog, type ChoiceOption } from "@rhs-ui/primitives/choice-dialog";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Row({ icon, title, line, children }: { icon: ReactNode; title: string; line: string; children: ReactNode }): React.JSX.Element {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-[1.125rem]">
        {icon}
      </span>
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{line}</p>
      </div>
      {children}
    </li>
  );
}

const EVENT_OPTIONS: readonly ChoiceOption[] = [
  { id: "this", label: "This event", description: "Only Tuesday 18 March is removed. The rest of the series stays." },
  { id: "following", label: "This and following events", description: "Everything from 18 March on. The events before it stay.", destructive: true },
  { id: "all", label: "All events", description: "The whole series, including the 14 that have already happened.", destructive: true },
];

const FILE_OPTIONS: readonly ChoiceOption[] = [
  { id: "replace", label: "Replace the existing file", description: "The old version moves to the file's history and is kept for 30 days.", destructive: true },
  { id: "both", label: "Keep both", description: "The new file is saved as hero-v3 (1).png next to the old one." },
  { id: "skip", label: "Skip this file", description: "Nothing is uploaded. The file in the folder stays as it is." },
];

function Event({ onResult }: { onResult: (text: string) => void }): React.JSX.Element {
  const [removed, setRemoved] = useState<string | null>(null);
  const tries = useRef(0);
  return (
    <Row icon={<IconCalendar />} title="Weekly design review" line={removed ? `Deleted: ${removed.toLowerCase()}` : "Tuesdays, 10:00 to 10:45, repeats weekly"}>
      <ChoiceDialog
        trigger={<Button variant="outline">Delete event</Button>}
        title="Delete recurring event"
        description="Weekly design review repeats every Tuesday. Which events should go?"
        options={EVENT_OPTIONS}
        confirmLabel={(option) => `Delete ${option.label.toLowerCase()}`}
        onConfirm={async (id) => {
          await wait(900);
          // The first request for the whole series fails, to show where the message goes and that the dialog stays.
          if (id === "all" && tries.current++ === 0) throw new Error("The calendar service did not answer, so nothing was deleted.");
          const label = EVENT_OPTIONS.find((option) => option.id === id)?.label ?? id;
          setRemoved(label);
          onResult(`Deleted ${label.toLowerCase()}.`);
        }}
      />
    </Row>
  );
}

function Upload({ onResult }: { onResult: (text: string) => void }): React.JSX.Element {
  return (
    <Row icon={<IconUpload />} title="hero-v3.png" line="4.2 MB, ready to upload to Brand / Launch">
      <ChoiceDialog
        trigger={<Button variant="outline">Upload</Button>}
        title="A file with this name exists"
        description="hero-v3.png is already in Brand / Launch. What should happen to the new one?"
        options={FILE_OPTIONS}
        defaultValue="both"
        rememberLabel="Do this for the next 7 conflicts too"
        confirmLabel={(option) => (option.id === "replace" ? "Replace file" : option.id === "both" ? "Keep both files" : "Skip file")}
        onConfirm={async (id, { remember }) => {
          await wait(500);
          onResult(`${FILE_OPTIONS.find((option) => option.id === id)?.label ?? id}${remember ? ", for all conflicts" : ""}.`);
        }}
      />
    </Row>
  );
}

export default function Demo(): React.JSX.Element {
  const [result, setResult] = useState("Nothing chosen yet.");
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
        Each outcome says what it does before it is chosen, and the safest is already selected. A destructive one is only red while it is selected. In the first dialog, choose All events: the first request fails and the dialog stays open.
      </p>
      <ul className="m-0 grid list-none divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xs">
        <Event onResult={setResult} />
        <Upload onResult={setResult} />
      </ul>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        Last answer: {result}
      </p>
    </div>
  );
}
