"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconClose, IconSpinner } from "@rhs-ui/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";
import { Button } from "@rhs-ui/primitives/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

/** One thing that is wrong with the form, as the summary at the top lists it. */
export interface FormSheetProblem {
  /** The `name` or `id` of the field it is about. The summary links to the field, and focus goes to the first one that has it. */
  field?: string;
  /** What is wrong, in a sentence a person can act on. */
  message: string;
}

/** The words the sheet says on its own, for another language or your own wording. */
export interface FormSheetLabels {
  /** The button that closes the sheet without saving. Default "Cancel". */
  cancel: string;
  /** The name of the close button in the corner. Default "Close". */
  close: string;
  /** Said to screen readers while the request runs. Default "Saving". */
  saving: string;
  /** The heading of the summary of problems. Default "Check these before saving". */
  problems: string;
  /** What the summary says when the request failed and gave no reason. Default "Nothing was saved. Try again." */
  failedFallback: string;
  /** The question asked before a changed form is closed. Default "Discard changes?" */
  discardTitle: string;
  /** The line under that question. Default "What you changed in this form will be lost." */
  discardBody: string;
  /** The safe answer, which has focus. Default "Keep editing". */
  keepEditing: string;
  /** The other answer. Default "Discard changes". */
  discard: string;
}

export interface FormSheetProps {
  /** Whether the sheet is open. */
  open: boolean;
  /** Called with the state the sheet asks for. A close that is blocked (while saving, or until a changed form is discarded) is not reported. */
  onOpenChange: (open: boolean) => void;
  /** What is being edited: "Edit customer". It is the heading and the name of the sheet. */
  title: ReactNode;
  /** One line under the title that says more. It describes the sheet to assistive technology. */
  description?: ReactNode;
  /** The edge it slides in from on a wide screen. On a phone a side sheet rises from the bottom instead; `bottom` does so everywhere. Default "right". */
  side?: "right" | "left" | "bottom";
  /**
   * Called with the form's values when it is submitted, by the Save button or by Enter in a field. Return a promise and the sheet waits for it, locked: it
   * closes when it resolves, and stays open when it rejects (the message of the `Error` goes in the summary) or resolves with a list of problems.
   * Mark the fields that are wrong with `aria-invalid="true"` and focus goes to the first of them.
   */
  onSubmit: (values: FormData, event: FormEvent<HTMLFormElement>) => void | FormSheetProblem[] | Promise<void | FormSheetProblem[]>;
  /** The text of the Save button. Say what it does ("Save customer"), not "OK". Default "Save". */
  submitLabel?: string;
  /** Whether the form has changes. Closing a changed form asks "Discard changes?" first, by the close button, Escape, the backdrop and Cancel. */
  dirty?: boolean;
  /** Lock the fields and the close button while something outside the sheet saves. Left out, the sheet is locked for as long as `onSubmit` is pending. */
  pending?: boolean;
  /** How wide the panel is from 640px wide: 384, 448 or 576px. Default "md". */
  width?: "sm" | "md" | "lg";
  /** The fields. Give each a `name`: the values come back as FormData. They sit in a fieldset, so they are switched off together while saving. */
  children: ReactNode;
  /** The words the sheet says, for translation. */
  labels?: Partial<FormSheetLabels>;
  /** Classes for the panel. */
  className?: string;
}

const DEFAULT_LABELS = {
  cancel: "Cancel",
  close: "Close",
  saving: "Saving",
  problems: "Check these before saving",
  failedFallback: "Nothing was saved. Try again.",
  discardTitle: "Discard changes?",
  discardBody: "What you changed in this form will be lost.",
  keepEditing: "Keep editing",
  discard: "Discard changes",
} satisfies FormSheetLabels;

/** The panel at each width, written out in full: a class is only generated from text it can read. */
const WIDTH = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-xl" } as const;

/** Red text on the pale red of a message: the destructive colour pulled toward the text colour keeps 4.5 to 1 in both themes. */
const RED_TEXT = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]";

/** Whether a media query matches. The server and the first browser render say no; the real answer arrives right after. */
function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | undefined)?.then === "function";

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

/** The control of a form that a problem names: by `name`, then by `id`. */
function fieldNamed(form: HTMLFormElement, field: string): HTMLElement | null {
  const escaped = typeof CSS !== "undefined" && "escape" in CSS ? CSS.escape(field) : field;
  return form.querySelector<HTMLElement>(`[name="${escaped}"]`) ?? form.querySelector<HTMLElement>(`#${escaped}`);
}

/** The first control in a container that a keyboard can reach: nothing disabled, hidden or inert. */
function firstField(container: HTMLElement | null): HTMLElement | null {
  if (!container) return null;
  for (const element of container.querySelectorAll<HTMLElement>('input:not([type="hidden"]), select, textarea, button, [href], [tabindex]')) {
    if (element.matches(":disabled") || element.tabIndex < 0 || element.closest('[inert], [hidden], [aria-hidden="true"]')) continue;
    return element;
  }
  return null;
}

/**
 * The frame for create and edit flows that should not leave the page: a side sheet (a bottom sheet on a phone) with a
 * header and a footer that stay in view while the body scrolls, and a soft shadow on an edge only when there is content
 * behind it. Closing a form with changes asks "Discard changes?" first. A failed submit keeps the sheet open, with a
 * summary of the problems at the top and focus on the first invalid field, so what was typed is never lost; while the
 * request runs the fields and the close button are locked and the Save button says it is busy. Put your fields inside and
 * give each a `name`: the sheet is one real form, so Enter submits from any field.
 */
export function FormSheet({ open, onOpenChange, title, description, side = "right", onSubmit, submitLabel = "Save", dirty = false, pending, width = "md", children, labels, className }: FormSheetProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const summaryId = useId();
  const wide = useMedia("(min-width: 640px)");
  const placed = side === "bottom" || !wide ? "bottom" : side;
  const form = useRef<HTMLFormElement>(null);
  const fields = useRef<HTMLFieldSetElement>(null);
  const body = useRef<HTMLDivElement | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const count = useRef(0);
  /** Where focus was before the sheet opened, to give it back. */
  const returnTo = useRef<HTMLElement | null>(null);
  /** Where focus was when "Discard changes?" was asked, so Keep editing can put it back there. */
  const askedFrom = useRef<HTMLElement | null>(null);
  /** The last thing inside the sheet that had focus: a click on the backdrop drops focus to the page before the question is asked. */
  const lastFocus = useRef<HTMLElement | null>(null);
  const [ownPending, setOwnPending] = useState(false);
  const [failed, setFailed] = useState<{ id: number; problems: readonly FormSheetProblem[] } | null>(null);
  const [asking, setAsking] = useState(false);
  const [edges, setEdges] = useState({ top: false, bottom: false, scrolls: false });
  const locked = pending ?? ownPending;

  // Every opening starts clean.
  useEffect(() => {
    if (open) return;
    setFailed(null);
    setAsking(false);
    setOwnPending(false);
    busy.current = false;
  }, [open]);

  // The body is in a portal and appears when the sheet opens, so its size is watched from the ref, not from an effect of this component.
  const watchBody = useCallback((node: HTMLDivElement | null) => {
    body.current = node;
    if (!node) return;
    const measure = () => {
      const next = { top: node.scrollTop > 1, bottom: node.scrollHeight - node.clientHeight - node.scrollTop > 1, scrolls: node.scrollHeight > node.clientHeight + 1 };
      setEdges((old) => (old.top === next.top && old.bottom === next.bottom && old.scrolls === next.scrolls ? old : next));
    };
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    // The body keeps its size when its content grows, so the content is watched too.
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  // A failed request: focus goes to the first field that is wrong, or to the summary when no field says so.
  useEffect(() => {
    if (!failed) return;
    const frame = window.requestAnimationFrame(() => {
      const root = form.current;
      if (!root) return;
      const named = failed.problems.map((problem) => (problem.field ? fieldNamed(root, problem.field) : null)).find((element) => element && !element.matches(":disabled"));
      (named ?? root.querySelector<HTMLElement>('[aria-invalid="true"]') ?? summary.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [failed]);

  function requestClose() {
    if (locked) return;
    if (dirty) {
      // The question has no trigger to give focus back to, so where focus is now (a field, Cancel, the close button) is kept for Keep editing.
      const active = document.activeElement;
      askedFrom.current = active instanceof HTMLElement && active !== document.body ? active : lastFocus.current;
      setAsking(true);
    } else onOpenChange(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The sheet is drawn in a portal, but React still passes its events up to the component that rendered it: a sheet opened from inside a form must not submit that form too.
    event.stopPropagation();
    if (busy.current || locked) return;
    busy.current = true;
    setFailed(null);
    const values = new FormData(event.currentTarget);
    let work: void | FormSheetProblem[] | Promise<void | FormSheetProblem[]>;
    try {
      work = onSubmit(values, event);
    } catch (thrown) {
      busy.current = false;
      setFailed({ id: (count.current += 1), problems: [{ message: messageOf(thrown) ?? words.failedFallback }] });
      return;
    }
    let outcome: void | FormSheetProblem[];
    if (isThenable(work)) {
      setOwnPending(true);
      // The fields are about to switch off, and with them the focus. The save button stays focusable, so focus rests there while it says it is busy.
      submit.current?.focus();
      try {
        outcome = await work;
      } catch (thrown) {
        busy.current = false;
        setOwnPending(false);
        setFailed({ id: (count.current += 1), problems: [{ message: messageOf(thrown) ?? words.failedFallback }] });
        return;
      }
      setOwnPending(false);
    } else {
      outcome = work;
    }
    busy.current = false;
    if (Array.isArray(outcome) && outcome.length > 0) {
      setFailed({ id: (count.current += 1), problems: outcome });
      return;
    }
    onOpenChange(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) onOpenChange(true);
          else requestClose();
        }}
      >
        <SheetContent
          data-slot="form-sheet"
          side={placed}
          showCloseButton={false}
          {...(description ? {} : { "aria-describedby": undefined })}
          onFocus={(event) => {
            lastFocus.current = event.target instanceof HTMLElement ? event.target : null;
          }}
          onOpenAutoFocus={(event) => {
            // The first field, so someone can type at once; Radix would pick the close button, which comes first.
            event.preventDefault();
            const active = document.activeElement;
            returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
            (firstField(fields.current) ?? submit.current)?.focus();
          }}
          onCloseAutoFocus={(event) => {
            // Back to the button that opened the sheet, which is not a trigger of this component.
            const back = returnTo.current;
            returnTo.current = null;
            if (!back?.isConnected) return;
            event.preventDefault();
            back.focus({ preventScroll: true });
          }}
          className={cn(
            "gap-0 p-0",
            placed === "bottom" ? "max-h-[92dvh]" : cn("w-full max-w-none", WIDTH[width]),
            className,
          )}
        >
          <form ref={form} noValidate onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
            {/* The header and the footer cast a shadow only while there is content behind them. A shadow does not show on a near-black surface, so in dark the divider itself gets stronger. */}
            <div
              className={cn(
                "relative z-10 shrink-0 border-b border-border px-5 py-4 pr-14 transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none",
                edges.top ? "shadow-[0_8px_10px_-8px_rgb(0_0_0/0.28)] dark:border-foreground/25" : "shadow-[0_8px_10px_-8px_rgb(0_0_0/0)]",
              )}
            >
              <SheetTitle className="text-lg leading-snug tracking-[-0.02em]">{title}</SheetTitle>
              {description ? <SheetDescription className="mt-1">{description}</SheetDescription> : null}
            </div>

            <div
              ref={watchBody}
              // A body that scrolls is a tab stop with a name, so the keys can scroll it; one that does not has none.
              {...(edges.scrolls ? { tabIndex: 0, role: "group", "aria-label": typeof title === "string" ? title : undefined } : {})}
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
            >
              {failed ? (
                <div
                  ref={summary}
                  key={failed.id}
                  tabIndex={-1}
                  role="alert"
                  aria-labelledby={summaryId}
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3.5 py-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-destructive/30"
                >
                  <IconAlertCircle aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", RED_TEXT)} />
                  <div className="grid min-w-0 gap-1.5">
                    <p id={summaryId} className={cn("font-medium", RED_TEXT)}>
                      {words.problems}
                    </p>
                    <ul className="grid gap-1 leading-relaxed text-foreground">
                      {failed.problems.map((problem, index) => (
                        <li key={`${index}-${problem.field ?? "form"}`} className="[overflow-wrap:anywhere]">
                          {problem.field ? (
                            <button
                              type="button"
                              onClick={() => (form.current ? fieldNamed(form.current, problem.field ?? "") : null)?.focus()}
                              className="rounded-sm text-left underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                            >
                              {problem.message}
                            </button>
                          ) : (
                            problem.message
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
              {/* A disabled fieldset switches off every control inside it, whatever the control is, and keeps what was typed. */}
              <fieldset ref={fields} disabled={locked} className="m-0 grid min-w-0 grid-cols-1 gap-5 border-0 p-0">
                {children}
              </fieldset>
            </div>

            <div
              className={cn(
                "relative z-10 flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/30 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-end",
                edges.bottom ? "shadow-[0_-8px_10px_-8px_rgb(0_0_0/0.28)] dark:border-foreground/25" : "shadow-[0_-8px_10px_-8px_rgb(0_0_0/0)]",
              )}
            >
              <Button type="button" variant="outline" disabled={locked} onClick={requestClose}>
                {words.cancel}
              </Button>
              {/* Busy is said with aria-busy and aria-disabled, not with disabled: a disabled button gives up focus, which would leave a keyboard on no control until the request ends. */}
              <Button ref={submit} type="submit" aria-busy={locked || undefined} aria-disabled={locked || undefined}>
                {locked ? <IconSpinner data-slot="button-spinner" /> : null}
                {submitLabel}
              </Button>
              <span role="status" className="sr-only">
                {locked ? words.saving : ""}
              </span>
            </div>
          </form>

          <SheetClose asChild>
            <button
              type="button"
              disabled={locked}
              aria-label={words.close}
              className="absolute top-3.5 right-3.5 z-20 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
            >
              <IconClose size={16} />
            </button>
          </SheetClose>
        </SheetContent>
      </Sheet>

      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // Keep editing, or Escape: with no trigger Radix has nowhere to send focus and it would drop to the page. Back to where it was, else the first field.
            event.preventDefault();
            const back = askedFrom.current;
            askedFrom.current = null;
            // Discard: the sheet is closing and gives focus back to what opened it, so nothing is focused inside it.
            if (!open) return;
            const target = back?.isConnected && !back.matches(":disabled") && !back.closest("[inert]") ? back : (firstField(fields.current) ?? submit.current);
            target?.focus({ preventScroll: true });
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{words.discardTitle}</AlertDialogTitle>
            <AlertDialogDescription>{words.discardBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{words.keepEditing}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setAsking(false);
                onOpenChange(false);
              }}
            >
              {words.discard}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
