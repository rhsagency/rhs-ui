"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { FileNameField, type FileNameFieldProps } from "@rhs-ui/primitives/filename-field";
import { Label } from "@rhs-ui/primitives/label";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const TAKEN = ["budget.pdf", "Q3 summary.pdf", "kettle-photos.zip"];

function Field({ label, ...props }: Omit<FileNameFieldProps, "id"> & { label: string }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <FileNameField id={id} taken={TAKEN} {...props} />
    </div>
  );
}

function Rename(): React.JSX.Element {
  const id = useId();
  const [name, setName] = useState("Q3 report.pdf");
  const [valid, setValid] = useState(true);
  const [renamed, setRenamed] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) setRenamed(name);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Rename file</h2>
        <p className="text-xs text-muted-foreground">Shared with the Kestrel finance team, 2.4 MB.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>File name</Label>
        <FileNameField
          id={id}
          name="file"
          taken={TAKEN}
          value={name}
          onValueChange={(next, state) => {
            setName(next);
            setValid(state.valid);
            setRenamed(null);
          }}
        />
      </div>
      <Button type="submit" disabled={!valid}>
        Rename
      </Button>
      <div className="grid border-t border-border pt-4 text-xs text-muted-foreground">
        <p role="status" className="break-all">
          {renamed !== null ? `Renamed to ${renamed}` : null}
        </p>
        {renamed === null ? (
          // What the field reported is for the reader of the demo, so a screen reader is not read it on every key.
          <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span>onValueChange</span>
            <code className="font-mono text-[0.6875rem] break-all text-foreground">{JSON.stringify(name)}</code>
          </p>
        ) : null}
      </div>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      {/* Two columns of about the same height, so the sheet has no empty corner. */}
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: the name is selected when you focus the field, the extension stays put. Type a slash, paste report.pdf, or call it budget">
          <Rename />
        </Example>
        <Example caption="A name that exists is flagged in words, with the next free one offered">
          <Field label="Export" defaultValue="budget.pdf" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Compound extensions stay together">
          <Field label="Backup" defaultValue="shop-backup-2026-10.tar.gz" />
        </Example>
        <Example caption="Editable extension: it gets a box of its own, and a warning once it changes. Try .md, or clear it and type another">
          <Field label="Notes" defaultValue="meeting-notes.txt" extensionEditable />
        </Example>
        <Example caption="The limit counts the extension, and the name stops at it">
          <Field label="Attachment" defaultValue="annual-report-final.txt" maxLength={24} />
        </Example>
        <Example caption="Without an extension it is just a name. Disabled">
          <div className="grid gap-4">
            <Field label="Read me" defaultValue="README" />
            <Field label="Locked" defaultValue="invoice-0042.pdf" disabled />
          </div>
        </Example>
      </div>
    </div>
  );
}
