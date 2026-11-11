"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { IconAlertCircle, IconSpinner } from "@rhs-ui/icons";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export { useLeaveGuard, type LeaveGuard, type LeaveGuardDialogProps, type LeaveGuardOptions } from "@rhs-ui/primitives/unsaved-changes-dialog/use-leave-guard";

/** The words the dialog says, for another language or your own wording. */
export interface UnsavedChangesLabels {
  /** The primary button. It says what it does, and it also leaves. Default "Save changes". */
  save: string;
  /** Said to screen readers while the save runs. Default "Saving your changes". */
  saving: string;
  /** The quiet button that leaves without saving. Default "Discard". */
  discard: string;
  /** The safe answer, which has focus when the dialog opens. Default "Keep editing". */
  stay: string;
  /** The heading of the message shown when the save failed. Default "Could not save". */
  failedTitle: string;
  /** The text of that message when the save failed without saying why. Default "Your changes were not saved. Try again, or keep editing." */
  failedFallback: string;
}

export interface UnsavedChangesDialogProps {
  /** Whether the question is showing. */
  open: boolean;
  /** Called with the state the dialog asks for: closed, by every way out of it. Use `onStay`, `onDiscard` and `onLeave` to tell them apart. */
  onOpenChange: (open: boolean) => void;
  /**
   * Saves the changes. Resolve `true`, or nothing, when they are saved: the dialog then leaves. Resolve `false` or throw to say that
   * it failed: the dialog stays open and shows why, with the message of an `Error` you throw. Leave it out for a question with two
   * answers, Keep editing and Discard.
   */
  onSave?: () => boolean | void | Promise<boolean | void>;
  /** Discard was chosen. Reset your form here; `onLeave` follows. */
  onDiscard?: () => void;
  /** Keep editing was chosen, or Escape was pressed. The dialog closes. */
  onStay?: () => void;
  /** The person is going on their way: after a Save that worked, and after Discard. This is where the way out that was blocked goes ahead; the guard's `leave` is made for it. */
  onLeave?: () => void;
  /** The question. Default "You have unsaved changes". */
  title?: ReactNode;
  /** What leaving costs, in a line. Default "Save them before you leave, or they will be lost." */
  description?: ReactNode;
  /** More under the description, such as a list of what changed. */
  children?: ReactNode;
  /** The words the dialog says, for translation. */
  labels?: Partial<UnsavedChangesLabels>;
  /** Classes for the panel, for a different width. */
  className?: string;
}

const DEFAULT_LABELS = {
  save: "Save changes",
  saving: "Saving your changes",
  discard: "Discard",
  stay: "Keep editing",
  failedTitle: "Could not save",
  failedFallback: "Your changes were not saved. Try again, or keep editing.",
} satisfies UnsavedChangesLabels;

/** Red text on the pale red of a message, or on a quiet red button: the destructive colour pulled toward the text colour keeps 4.5 to 1 in both themes. */
const RED_TEXT = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]";

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

/**
 * The question before leaving a form that has changes: Save, Discard or Keep editing. Keep editing has focus when it
 * opens and is what Escape does, because losing work is the mistake that cannot be taken back; Save is the one solid
 * button, shows that it is working, and only leaves if it worked, and when it did not the dialog stays and says why;
 * Discard is the quiet red choice, solid only when there is no Save and it is the one real decision. While a save runs
 * the dialog cannot be closed. The dialog is only the question: `useLeaveGuard` is the guard that raises it for a link
 * click, the Back button and the browser's own prompt, and each works without the other.
 */
export function UnsavedChangesDialog({ open, onOpenChange, onSave, onDiscard, onStay, onLeave, title = "You have unsaved changes", description = "Save them before you leave, or they will be lost.", children, labels, className }: UnsavedChangesDialogProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const failedId = useId();
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  /** Where focus was before the question appeared, so Keep editing puts it back there. */
  const returnTo = useRef<HTMLElement | null>(null);
  /** The person is leaving: focus is not put back on a page that is going away. */
  const leaving = useRef(false);
  const busy = useRef(false);

  // Every opening starts clean: no old failure, and not leaving.
  useEffect(() => {
    if (!open) return;
    setFailure(null);
    setSaving(false);
    busy.current = false;
    leaving.current = false;
  }, [open]);

  function stay() {
    if (busy.current) return;
    onStay?.();
    onOpenChange(false);
  }

  function discard() {
    if (busy.current) return;
    leaving.current = true;
    onDiscard?.();
    onLeave?.();
    onOpenChange(false);
  }

  async function save() {
    if (busy.current || !onSave) return;
    busy.current = true;
    setSaving(true);
    setFailure(null);
    let outcome: boolean | void;
    try {
      outcome = await onSave();
    } catch (thrown) {
      busy.current = false;
      setSaving(false);
      setFailure(messageOf(thrown) ?? words.failedFallback);
      return;
    }
    busy.current = false;
    setSaving(false);
    if (outcome === false) {
      setFailure(words.failedFallback);
      return;
    }
    leaving.current = true;
    onLeave?.();
    onOpenChange(false);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Escape, and Keep editing (the Radix cancel): both are a "stay", and neither works while a save runs.
        if (!next) stay();
      }}
    >
      <AlertDialogContent
        data-slot="unsaved-changes-dialog"
        // Radix focuses Keep editing, the cancel; this only notes where focus was, to give it back.
        onOpenAutoFocus={() => {
          const active = document.activeElement;
          returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
        }}
        onCloseAutoFocus={(event) => {
          const back = returnTo.current;
          returnTo.current = null;
          if (leaving.current || !back?.isConnected) return;
          event.preventDefault();
          back.focus({ preventScroll: true });
        }}
        onEscapeKeyDown={(event) => {
          if (busy.current) event.preventDefault();
        }}
        className={cn("gap-0 sm:max-w-md", className)}
      >
        <AlertDialogHeader className="gap-1.5">
          <AlertDialogTitle className="text-lg tracking-[-0.02em]">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children ? <div className="mt-4 text-sm">{children}</div> : null}
        {failure !== null ? (
          <div role="alert" aria-labelledby={failedId} className="mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm">
            <IconAlertCircle aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", RED_TEXT)} />
            <div className="grid min-w-0 gap-0.5">
              <p id={failedId} className={cn("font-medium", RED_TEXT)}>
                {words.failedTitle}
              </p>
              <p className="leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{failure}</p>
            </div>
          </div>
        ) : null}
        <AlertDialogFooter className="mt-6 sm:items-center">
          {onSave ? (
            // With a Save, Discard is the quiet choice, set apart on the left; without one it is the answer that matters and is solid.
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={discard}
              className={cn("sm:mr-auto sm:-ml-4", RED_TEXT, "hover:bg-destructive/10 hover:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]")}
            >
              {words.discard}
            </Button>
          ) : null}
          <AlertDialogCancel disabled={saving}>{words.stay}</AlertDialogCancel>
          {onSave ? (
            // Busy is said with aria-busy and aria-disabled, not with disabled: a disabled button gives up focus, which would leave a keyboard on no control until the save ends.
            <Button type="button" onClick={() => void save()} aria-busy={saving || undefined} aria-disabled={saving || undefined}>
              {saving ? <IconSpinner data-slot="button-spinner" /> : null}
              {words.save}
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={discard}>
              {words.discard}
            </Button>
          )}
        </AlertDialogFooter>
        <span role="status" className="sr-only">
          {saving ? words.saving : ""}
        </span>
      </AlertDialogContent>
    </AlertDialog>
  );
}
