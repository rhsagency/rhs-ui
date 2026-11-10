"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconEdit, IconSpinner } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

/** The words the section says, for translation. */
export interface EditableSectionLabels {
  /** The button that opens the form. Default "Edit". */
  edit?: string;
  /** The button that leaves the form. Default "Cancel". */
  cancel?: string;
  /** The note beside Edit after a save, also said politely. Default "Saved". */
  saved?: string;
  /** Said to screen readers while the save runs. Default "Saving". */
  saving?: string;
  /** The title of the alert when the save failed. Default "Could not save". */
  failed?: string;
  /** The text of that alert when the rejection carries no message. Default "Nothing was saved, so you can try again." */
  failedMessage?: string;
  /** The question asked before changed fields are left. Default "Discard changes?" */
  discardTitle?: string;
  /** The line under that question. Keep it short enough for one line beside the buttons: the footer holds its height. Default "Your changes will be lost." */
  discardBody?: string;
  /** The safe answer. Default "Keep editing". */
  keepEditing?: string;
  /** The other answer. Default "Discard". */
  discard?: string;
}

export interface EditableSectionProps extends Omit<ComponentProps<"div">, "title" | "children" | "onSubmit"> {
  /** What the group of details is called: "Contact details". It is the heading, and it names the Edit button for a screen reader ("Edit Contact details"). */
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** What is shown while the section is not being edited: the facts as read-only content, usually a DescriptionList. */
  view: ReactNode;
  /** The fields, shown in place of the view while editing. Give each a `name`: the values come back as FormData, and the dirty check compares them by name. */
  children: ReactNode;
  /** Whether the fields are shown, when you control it. */
  editing?: boolean;
  /** Whether the fields are shown to begin with. */
  defaultEditing?: boolean;
  /** Called when the section opens or closes. */
  onEditingChange?: (editing: boolean) => void;
  /**
   * Called with the form's values when it is saved, by the Save button or by Enter in a field. Return a promise and the section
   * waits: it locks while it runs, closes when it resolves and stays open with the message in an alert when it rejects.
   * Native validation (`required`, `type="email"`) runs first.
   */
  onSave: (values: FormData) => void | Promise<void>;
  /** The save button. Say what it does ("Save contact details"). Default "Save". */
  saveLabel?: string;
  /** Whether there are changes, when you track them yourself. Without it the section compares the values of the named fields with what they were when it opened. */
  dirty?: boolean;
  /** Switches the Edit button off. For the sections that wait while another one is open. */
  disabled?: boolean;
  /** The level of the heading: 2 on a page of sections, 3 inside another section. Default 2. */
  headingLevel?: 2 | 3;
  /** The words the section says, for translation. */
  labels?: EditableSectionLabels;
}

const DEFAULT_LABELS = {
  edit: "Edit",
  cancel: "Cancel",
  saved: "Saved",
  saving: "Saving",
  failed: "Could not save",
  failedMessage: "Nothing was saved, so you can try again.",
  discardTitle: "Discard changes?",
  discardBody: "Your changes will be lost.",
  keepEditing: "Keep editing",
  discard: "Discard",
} satisfies Required<EditableSectionLabels>;

const FIELDS = 'input:not([type="hidden"]), select, textarea, button, [href], [tabindex]';

/** The first control in a container that Tab can reach: nothing disabled, hidden or inert. */
function firstField(container: HTMLElement | null): HTMLElement | null {
  if (!container) return null;
  for (const element of container.querySelectorAll<HTMLElement>(FIELDS)) {
    if (element.matches(":disabled") || element.tabIndex < 0 || element.closest('[inert], [hidden], [aria-hidden="true"]')) continue;
    return element;
  }
  return null;
}

/** The values of a form as one string, to tell later whether anything changed. Files count by name and size. */
function snapshot(form: HTMLFormElement): string {
  return JSON.stringify([...new FormData(form).entries()].map(([key, entry]) => [key, typeof entry === "string" ? entry : `${entry.name}:${entry.size}`]));
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | undefined)?.then === "function";

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

/**
 * A group of details that is read in place and edited in place, the way account pages work: a card shows a few facts
 * (name, email, phone) and an Edit button; pressing it swaps the facts for the form. Opening moves focus to the first field.
 * Escape cancels and focus lands on the Edit button, and so does Save, after a polite "Saved". If fields have changed, Cancel
 * and Escape ask "Discard changes?" in place instead of losing them. While saving, the fields and Cancel lock and the save
 * button says it is busy; a failure keeps the form open with the message in an alert and everything as typed. `disabled` lets
 * the other sections wait while one is open. The edit form is a real `<form>`, so do not put the section inside another one.
 */
export function EditableSection({
  title,
  description,
  view,
  children,
  editing: editingProp,
  defaultEditing = false,
  onEditingChange,
  onSave,
  saveLabel = "Save",
  dirty,
  disabled,
  headingLevel = 2,
  labels,
  className,
  ...props
}: EditableSectionProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const titleId = `${base}-title`;
  const editId = `${base}-edit`;
  const discardId = `${base}-discard`;
  const Heading = headingLevel === 3 ? "h3" : "h2";

  const [editingState, setEditingState] = useState(defaultEditing);
  const editing = editingProp ?? editingState;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  const edit = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const fields = useRef<HTMLFieldSetElement>(null);
  const save = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  /** What the form held a moment after it opened, to tell whether it has changed. */
  const baseline = useRef<string | null>(null);
  /** The control that had focus when the form was saved, so a failed save can give it back. */
  const resume = useRef<HTMLElement | null>(null);
  const busy = useRef(false);
  const succeeded = useRef(false);
  const wasEditing = useRef(editing);
  const wasSaving = useRef(false);

  function setEditing(next: boolean) {
    if (editingProp === undefined) setEditingState(next);
    onEditingChange?.(next);
  }

  // Opening puts focus on the first field and closing puts it on Edit. It happens when `editing` changes, whoever changed it, and never on first render, so a page that loads with a section open does not grab focus.
  useEffect(() => {
    const changed = wasEditing.current !== editing;
    wasEditing.current = editing;
    if (editing) {
      if (changed) {
        succeeded.current = false;
        setSaved(false);
        setError(null);
        setConfirming(false);
        firstField(fields.current)?.focus();
      }
      const frame = window.requestAnimationFrame(() => {
        if (form.current) baseline.current = snapshot(form.current);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    if (changed) edit.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 3500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  // The question has just appeared: the safe answer takes focus, so Enter cannot throw the work away.
  useEffect(() => {
    if (confirming) keep.current?.focus();
  }, [confirming]);

  // After a save that failed the form is still open: focus goes back to where it was, which the disabled fields had taken.
  useEffect(() => {
    if (saving) {
      wasSaving.current = true;
      return;
    }
    if (!wasSaving.current) return;
    wasSaving.current = false;
    if (succeeded.current) return;
    const back = resume.current;
    (back && back.isConnected && !back.matches(":disabled") ? back : firstField(fields.current))?.focus();
  }, [saving]);

  function isDirty(): boolean {
    if (dirty !== undefined) return dirty;
    const element = form.current;
    return element !== null && baseline.current !== null && snapshot(element) !== baseline.current;
  }

  function keepEditing() {
    setConfirming(false);
    window.requestAnimationFrame(() => (firstField(fields.current) ?? save.current)?.focus());
  }

  /** Someone wants to leave the form: Cancel or Escape. */
  function requestCancel() {
    if (saving) return;
    if (confirming) {
      keepEditing();
      return;
    }
    if (isDirty()) {
      setConfirming(true);
      return;
    }
    setEditing(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    // An open list or popover inside the form has already used this Escape.
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    requestCancel();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setConfirming(false);
    const values = new FormData(event.currentTarget);
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let work: void | Promise<void>;
    try {
      work = onSave(values);
    } catch (thrown) {
      busy.current = false;
      setError(messageOf(thrown) ?? text.failedMessage);
      return;
    }
    if (isThenable(work)) {
      resume.current = active;
      setSaving(true);
      // The fields are about to switch off, and with them the focus. The save button stays focusable, so focus rests there and it says it is busy.
      save.current?.focus();
      try {
        await work;
      } catch (thrown) {
        busy.current = false;
        setSaving(false);
        setError(messageOf(thrown) ?? text.failedMessage);
        return;
      }
      setSaving(false);
    }
    busy.current = false;
    succeeded.current = true;
    setSaved(true);
    setEditing(false);
  }

  return (
    <Card
      data-slot="editable-section"
      data-state={editing ? "editing" : "viewing"}
      role="group"
      aria-labelledby={titleId}
      className={cn("gap-0 pb-0", className)}
      {...props}
    >
      <CardHeader className={cn("pb-5", !description && "grid-rows-[auto]")}>
        <CardTitle asChild>
          <Heading id={titleId} className="text-base">
            {title}
          </Heading>
        </CardTitle>
        {description ? <CardDescription className="text-pretty">{description}</CardDescription> : null}
        {editing ? null : (
          <CardAction className="flex items-center gap-3">
            {saved ? (
              <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none">
                <IconCheck className="size-4 text-foreground" />
                {text.saved}
              </span>
            ) : null}
            {/* The name is "Edit" and then the title, so a list of buttons reads "Edit Contact details", "Edit Billing address". */}
            <Button ref={edit} id={editId} type="button" variant="outline" size="sm" disabled={disabled} aria-labelledby={`${editId} ${titleId}`} onClick={() => setEditing(true)}>
              <IconEdit />
              {text.edit}
            </Button>
          </CardAction>
        )}
      </CardHeader>

      {editing ? (
        <form ref={form} onSubmit={(event) => void handleSubmit(event)} onKeyDown={onKeyDown} className="flex flex-col transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
          <CardContent className="pb-6">
            {error !== null ? (
              <Alert tone="destructive" role="alert" className="mb-5 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
                <IconAlertCircle />
                <AlertTitle>{text.failed}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {/* A disabled fieldset switches off every control inside it, whatever the control is, and keeps what was typed. */}
            <fieldset ref={fields} disabled={saving} className="m-0 grid min-w-0 grid-cols-1 gap-4 border-0 p-0">
              {children}
            </fieldset>
          </CardContent>

          {/* As tall as the question makes it (two lines, the padding and the top border), so the footer does not move when it appears. */}
          <div className="flex min-h-[4.5625rem] flex-col justify-center rounded-b-xl border-t border-border bg-muted/30 px-6 py-4">
            {confirming ? (
              <div
                role="group"
                aria-labelledby={discardId}
                className="flex flex-col gap-3 transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p id={discardId} className="text-sm font-medium">
                    {text.discardTitle}
                  </p>
                  <p className="text-sm text-pretty text-muted-foreground">{text.discardBody}</p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="border-destructive/40 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)] hover:border-destructive/60 hover:bg-destructive/10 hover:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]"
                  >
                    {text.discard}
                  </Button>
                  <Button ref={keep} type="button" onClick={keepEditing}>
                    {text.keepEditing}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" disabled={saving} onClick={requestCancel}>
                  {text.cancel}
                </Button>
                {/* Busy is said with aria-busy and aria-disabled, not with disabled: a disabled button gives up focus, which would leave a keyboard on no control until the save ends. */}
                <Button ref={save} type="submit" aria-busy={saving || undefined} aria-disabled={saving || undefined}>
                  {saving ? <IconSpinner data-slot="button-spinner" /> : null}
                  {saveLabel}
                </Button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <CardContent className="pb-6 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">{view}</CardContent>
      )}

      {/* One status for the whole section, always in the page, so a screen reader hears "Saved" even though the form that said it has gone. */}
      <span role="status" className="sr-only">
        {saving ? text.saving : saved ? text.saved : ""}
      </span>
    </Card>
  );
}
