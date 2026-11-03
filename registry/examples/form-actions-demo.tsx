"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { FormActions } from "@rhs-ui/application/form-actions";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";

/** A caption above a case, in the quiet voice the rest of the demo uses. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The delete action kept apart at the start: quiet until you reach for it. */
function DeleteButton({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <Button type="button" variant="ghost" className="text-destructive @min-[30rem]:-ml-4 hover:bg-destructive/10 hover:text-destructive">
      {children}
    </Button>
  );
}

/** A small form that pretends to save for a moment, so the row can be seen working. */
function RenameForm({ withDelete = false }: { withDelete?: boolean }): React.JSX.Element {
  const fieldId = useId();
  const [name, setName] = useState("Halcyon website relaunch 2027");
  const [saved, setSaved] = useState("Halcyon website relaunch");
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const dirty = name.trim() !== saved;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    timer.current = setTimeout(() => {
      setSaved(name.trim());
      setPending(false);
    }, 1400);
  }

  return (
    <form onSubmit={save} className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-2">
        <Label htmlFor={fieldId}>Project name</Label>
        {/* Read only while it saves, not disabled: a disabled field gives up the focus, and whoever pressed Command or Control plus Enter in it would lose their place. */}
        <Input id={fieldId} value={name} onChange={(event) => setName(event.target.value)} readOnly={pending} className={pending ? "opacity-60" : undefined} />
      </div>
      <FormActions
        primary={{ label: "Save changes" }}
        secondary={{ label: "Cancel", onClick: () => setName(saved) }}
        start={withDelete ? <DeleteButton>Delete project</DeleteButton> : undefined}
        hint={dirty ? "Unsaved changes" : "All changes saved"}
        pending={pending}
        shortcut="hint"
        labels={{ pending: "Saving the project name" }}
      />
    </form>
  );
}

/** A form longer than its box, to show the row pinned to the bottom while the fields scroll under it. */
function StickyForm(): React.JSX.Element {
  const id = useId();
  return (
    <form className="relative h-96 overflow-y-auto rounded-xl border border-border bg-card" onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-5 p-5">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-name`}>Teammate name</Label>
          <Input id={`${id}-name`} defaultValue="Ines Marchetti" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-email`}>Work email</Label>
          <Input id={`${id}-email`} type="email" defaultValue="ines@kestrel.example" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-role`}>Role</Label>
          <Input id={`${id}-role`} defaultValue="Editor" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-note`}>Welcome note</Label>
          <Textarea id={`${id}-note`} rows={4} defaultValue="Welcome to the Kestrel workspace. Your first project is Northwind Q4: start with the brief in Docs and shout if anything is unclear." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-folders`}>Folders to share</Label>
          <Textarea id={`${id}-folders`} rows={3} defaultValue={"Northwind Q4\nBrand assets\nMeeting notes"} />
        </div>
      </div>
      <FormActions sticky className="px-5" primary={{ label: "Send invite" }} secondary={{ label: "Cancel" }} hint="Sent from ines@kestrel.example" shortcut="hint" />
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-8 @container sm:px-6">
      <Case caption="The usual row. Edit the name, then press Save changes or Command or Control plus Enter: the buttons are switched off together while it saves, the primary keeps its label and shows a spinner.">
        <RenameForm />
      </Case>

      <Case caption="An action of another kind goes at the start, apart from the pair that ends the form. It is switched off with them while the form is sent.">
        <RenameForm withDelete />
      </Case>

      <Case caption="On the start side, for a short form on a page of its own. The order stays the same, with the primary last, and the hint moves to the end.">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <FormActions align="start" primary={{ label: "Create account", type: "button" }} secondary={{ label: "Back" }} hint="Takes about a minute" shortcut="off" />
        </div>
      </Case>

      <Case caption="While the form is being sent, held here so it can be seen: every button is off and the row is busy.">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <FormActions pending primary={{ label: "Create project" }} secondary={{ label: "Cancel" }} start={<DeleteButton>Discard draft</DeleteButton>} hint="Creating Halcyon relaunch" labels={{ pending: "Creating the project" }} />
        </div>
      </Case>

      <Case caption="Sticky: the row stays at the bottom of the box while the fields scroll under it, with a hairline above and room for the home bar on a phone.">
        <StickyForm />
      </Case>
    </div>
  );
}
