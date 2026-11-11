"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactElement, type ReactNode } from "react";

import { IconAlertCircle, IconClose, IconSpinner } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

/** The words the dialog says, for translation. */
export interface FormDialogLabels {
  /** The button that leaves without saving. Default "Cancel". */
  cancel?: string;
  /** The name of the close button, for screen readers. Default "Close". */
  close?: string;
  /** Said to screen readers while the request runs. Default "Saving". */
  saving?: string;
  /** The title of the alert when the request failed. Default "Could not save". */
  failed?: string;
  /** The text of that alert when the rejection carries no message. Default "Nothing was saved, so you can try again." */
  failedMessage?: string;
  /** The question asked before a changed form is closed. Default "Discard changes?" */
  discardTitle?: string;
  /** The line under that question. Keep it short enough for one line beside the buttons: the footer holds its height. Default "Your changes will be lost." */
  discardBody?: string;
  /** The safe answer. Default "Keep editing". */
  keepEditing?: string;
  /** The other answer. Default "Discard". */
  discard?: string;
}

export interface FormDialogProps {
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether the dialog is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes. A close that is blocked (while saving, or until a changed form is discarded) is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The element that opens the dialog, usually a Button. Focus returns to it when the dialog closes. Without one, focus goes back to whatever had it when the dialog opened. */
  trigger?: ReactElement;
  /** What the dialog is for: "Invite a teammate". */
  title: ReactNode;
  /** One line that says more. It describes the dialog to assistive technology. */
  description?: ReactNode;
  /** The fields. Give each a `name`: the values come back as FormData, and the `dirtyGuard` compares them by name. */
  children: ReactNode;
  /** The submit button. Say what it does ("Send invitation"), not "OK". Default "Save". */
  submitLabel?: string;
  /**
   * Called with the form's values when the form is submitted, by the submit button or by Enter in any field. Return a promise
   * and the dialog waits for it: it locks while it runs, closes when it resolves, and stays open with the message in an alert
   * when it rejects. Native validation (`required`, `type="email"`) runs first.
   */
  onSubmit: (values: FormData, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Ask "Discard changes?" in place before a changed form is closed by Cancel, the close button, Escape or the backdrop. Default false. */
  dirtyGuard?: boolean;
  /** The words the dialog says, for translation. */
  labels?: FormDialogLabels;
  /** Extra classes for the dialog panel, for a different width. */
  className?: string;
}

const DEFAULT_LABELS = {
  cancel: "Cancel",
  close: "Close",
  saving: "Saving",
  failed: "Could not save",
  failedMessage: "Nothing was saved, so you can try again.",
  discardTitle: "Discard changes?",
  discardBody: "Your changes will be lost.",
  keepEditing: "Keep editing",
  discard: "Discard",
} satisfies Required<FormDialogLabels>;

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
 * A modal that is a form. The body and the footer sit inside one real `<form>`, so Enter submits from any field
 * and the submit button is a proper `type="submit"`; focus starts on the first field, not on the close button. While
 * `onSubmit` is pending the fields, Cancel and the close button are disabled, and Escape and the backdrop do nothing, so a
 * half-saved request cannot be abandoned by accident; the save button stays focusable and says it is busy. If the request
 * rejects, the message appears in an alert at the top of the body and everything typed stays; if it resolves, the dialog
 * closes and focus returns to the trigger. With `dirtyGuard`, closing a changed form asks "Discard changes?" in place, in
 * the footer, with Keep editing as the answer that has focus.
 */
export function FormDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  submitLabel = "Save",
  onSubmit,
  dirtyGuard = false,
  labels,
  className,
}: FormDialogProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const discardId = useId();
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const content = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const fields = useRef<HTMLFieldSetElement>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  /** What the form held a moment after it opened, to tell whether it has changed. */
  const baseline = useRef<string | null>(null);
  /** Where focus goes when there is no trigger to return to. */
  const returnTo = useRef<HTMLElement | null>(null);
  /** The control that had focus when the form was submitted, so a failed request can give it back. */
  const resume = useRef<HTMLElement | null>(null);
  const busy = useRef(false);
  const finished = useRef(false);
  const wasPending = useRef(false);

  function setOpen(next: boolean) {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    finished.current = false;
    setError(null);
    setConfirming(false);
  }, [open]);

  // The question has just appeared: the safe answer takes focus, so Enter cannot throw the work away.
  useEffect(() => {
    if (confirming) keep.current?.focus();
  }, [confirming]);

  // After a request that failed the dialog is still open: focus goes back to where it was, which the disabled fields had taken.
  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    if (finished.current) return;
    const back = resume.current;
    (back && back.isConnected && !back.matches(":disabled") ? back : firstField(fields.current))?.focus();
  }, [pending]);

  function isDirty(): boolean {
    const element = form.current;
    return element !== null && baseline.current !== null && snapshot(element) !== baseline.current;
  }

  function keepEditing() {
    setConfirming(false);
    window.requestAnimationFrame(() => (firstField(fields.current) ?? submit.current)?.focus());
  }

  /** Someone wants to leave: Cancel, the close button, Escape or the backdrop. */
  function requestClose() {
    if (pending) return;
    if (confirming) {
      keepEditing();
      return;
    }
    if (dirtyGuard && isDirty()) {
      setConfirming(true);
      return;
    }
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) setOpen(true);
    else requestClose();
  }

  function finish() {
    busy.current = false;
    finished.current = true;
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The dialog is drawn in a portal, but React still passes its events up to the component that rendered it: a dialog opened from inside a form must not submit that form too.
    event.stopPropagation();
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setConfirming(false);
    const values = new FormData(event.currentTarget);
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let work: void | Promise<void>;
    try {
      work = onSubmit(values, event);
    } catch (thrown) {
      busy.current = false;
      setError(messageOf(thrown) ?? text.failedMessage);
      return;
    }
    if (!isThenable(work)) {
      finish();
      return;
    }
    resume.current = active;
    setPending(true);
    // The fields are about to switch off, and with them the focus. The save button stays focusable, so focus rests there and it says it is busy.
    submit.current?.focus();
    try {
      await work;
    } catch (thrown) {
      busy.current = false;
      setPending(false);
      setError(messageOf(thrown) ?? text.failedMessage);
      return;
    }
    setPending(false);
    finish();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger {...AS_CHILD}>{trigger}</DialogTrigger> : null}
      <DialogContent
        ref={content}
        data-slot="form-dialog"
        showCloseButton={false}
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0", className)}
        onOpenAutoFocus={(event) => {
          // Focus starts on the first field. Radix would pick the first control in the DOM, which is the same, but this does not depend on the order of the close button.
          event.preventDefault();
          if (!trigger) returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          (firstField(fields.current) ?? submit.current ?? content.current)?.focus();
          window.requestAnimationFrame(() => {
            if (form.current) baseline.current = snapshot(form.current);
          });
        }}
        onCloseAutoFocus={(event) => {
          // With a trigger, Radix gives focus back to it. Without one it would give it to nothing.
          if (trigger) return;
          event.preventDefault();
          returnTo.current?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <form ref={form} onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 gap-1.5 pt-6 pr-14 pb-4 pl-6">
            <DialogTitle className="tracking-[-0.015em]">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6">
            {error !== null ? (
              <Alert tone="destructive" role="alert" className="mb-5 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
                <IconAlertCircle />
                <AlertTitle>{text.failed}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {/* A disabled fieldset switches off every control inside it, whatever the control is, and keeps what was typed. */}
            <fieldset ref={fields} disabled={pending} className="m-0 grid min-w-0 grid-cols-1 gap-4 border-0 p-0">
              {children}
            </fieldset>
          </div>

          {/* As tall as the question makes it (two lines, the padding and the top border), so the footer does not move when it appears. */}
          <div className="flex min-h-[4.5625rem] shrink-0 flex-col justify-center border-t border-border bg-muted/30 px-6 py-4">
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
                    onClick={() => setOpen(false)}
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
                <Button type="button" variant="outline" disabled={pending} onClick={requestClose}>
                  {text.cancel}
                </Button>
                {/* Busy is said with aria-busy and aria-disabled, not with disabled: a disabled button gives up focus, which would leave a keyboard on no control until the request ends. */}
                <Button ref={submit} type="submit" aria-busy={pending || undefined} aria-disabled={pending || undefined}>
                  {pending ? <IconSpinner data-slot="button-spinner" /> : null}
                  {submitLabel}
                </Button>
              </div>
            )}
            <span role="status" className="sr-only">
              {pending ? text.saving : ""}
            </span>
          </div>
        </form>

        <DialogClose asChild>
          <button
            type="button"
            disabled={pending}
            aria-label={text.close}
            className="absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
          >
            <IconClose size={16} />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
