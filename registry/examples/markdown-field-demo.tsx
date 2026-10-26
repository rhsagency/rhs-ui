"use client";

import { useId, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { MarkdownField, type MarkdownFieldProps } from "@rhs-ui/primitives/markdown-field";
import { Markdown } from "@rhs-ui/primitives/markdown-field/markdown";

const NOTES = [
  "## What changed in 2.4",
  "",
  "Halcyon now **remembers your filters** between visits. Three things worth knowing:",
  "",
  "- Filters are saved per workspace",
  "- Shared links open with the sender's filters",
  "- Reset any time with `Clear filters`",
  "",
  "> Saved filters never leave your browser.",
  "",
  "See the [migration guide](https://example.com/halcyon/2.4) before you update.",
].join("\n");

const REPLY = ["Thanks for the report, Marit. I could reproduce it with _two_ workspaces open.", "", "1. Update to **2.4.1**", "2. Clear the saved filters", "3. Reload the page"].join("\n");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field({ label, ...props }: Omit<MarkdownFieldProps, "id" | "aria-labelledby"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <MarkdownField id={id} {...props} />
    </div>
  );
}

function ReleaseNotes(): React.JSX.Element {
  const [notes, setNotes] = useState(NOTES);
  return (
    <div className="grid gap-5">
      <Field label="Release notes" name="notes" value={notes} onValueChange={setNotes} rows={9} />
      <div className="grid gap-2.5 rounded-xl border border-border bg-card p-5 shadow-xs">
        <p className="text-xs font-medium text-muted-foreground">Shown on the changelog, by the same renderer</p>
        <Markdown text={notes} />
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: select a word and press Ctrl or Cmd+B, or use a button. Enter in a list starts the next item">
          <ReleaseNotes />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Open on Preview: what is written is shown as elements, never as HTML">
          <Field label="Reply to Marit" defaultValue={REPLY} defaultTab="preview" rows={6} />
        </Example>
        <Example caption="A smaller toolbar, and a limit that is counted">
          <Field label="Comment" toolbar={["bold", "italic", "link"]} maxLength={280} rows={4} placeholder="Write a comment. Markdown works here" defaultValue="This **really** helps, thank you." />
        </Example>
        <Example caption="Disabled">
          <Field label="Notes" defaultValue="Archived with the release." disabled rows={3} />
        </Example>
      </div>
    </div>
  );
}
