"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconLock, IconSpinner, IconWarning } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@rhs-ui/primitives/alert-dialog";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

/** One thing that cannot be taken back: a row of the section, and the question it asks. */
export interface DangerAction {
  /** Identifies the action. Rows are keyed by it. */
  id: string;
  /** What it does, as a name: "Delete this workspace". */
  title: string;
  /** What happens, in words: what goes, who it affects and that there is no undo. This is the consequence the person reads before pressing the button, and the dialog repeats it. */
  description: ReactNode;
  /** The button, as the verb and the thing: "Delete workspace". Never "OK". */
  label: string;
  /** Does it. Return a promise and the dialog waits: it locks while it runs, closes when it resolves and stays open with the message when it rejects. */
  onConfirm: () => void | Promise<void>;
  /** The worst actions ask for this to be typed before the confirm button works: the name of what is destroyed. Leave it out for one that a plain confirmation is enough for. */
  confirmation?: string;
  /** Why the button is off: "Only the owner can do this". The reason is written out under the description, because a disabled button cannot say it. */
  disabledReason?: string;
  /** The question in the dialog. Default the button's label with a question mark. */
  dialogTitle?: string;
  /** What the dialog restates. Default the description. Plain text or inline elements, no paragraphs or lists. */
  dialogDescription?: ReactNode;
  /** The confirm button in the dialog. Default the button's label. */
  confirmLabel?: string;
}

/** The words the section says, for translation. */
export interface DangerZoneLabels {
  /** Leaves the dialog. Default "Cancel". */
  cancel?: string;
  /** The instruction above the field that asks for the name. `{value}` is the name, shown in monospace. Default "Type {value} to confirm". */
  type?: string;
  /** Under the field once the name is right. Default "The name matches." */
  matches?: string;
  /** Under the field until then. Default "Typed exactly, capitals included." */
  differs?: string;
  /** Said to screen readers while the action runs. Default "Working". */
  working?: string;
  /** The title of the alert when the action failed. Default "Nothing was changed". */
  failed?: string;
  /** The text of that alert when the rejection carries no message. Default "Something went wrong. Try again." */
  failedMessage?: string;
}

export interface DangerZoneProps extends Omit<ComponentProps<"section">, "title"> {
  /** The heading. The words are what say this is dangerous, so colour is never the only sign. Default "Danger zone". */
  title?: ReactNode;
  /** One line under the heading. */
  description?: ReactNode;
  /** The actions, in order, from the mildest to the worst. */
  actions: readonly DangerAction[];
  /** The level of the heading: 2 on a settings page, 3 inside another section. Default 2. */
  headingLevel?: 2 | 3;
  /** The words the section says, for translation. */
  labels?: DangerZoneLabels;
}

const DEFAULT_LABELS = {
  cancel: "Cancel",
  type: "Type {value} to confirm",
  matches: "The name matches.",
  differs: "Typed exactly, capitals included.",
  working: "Working",
  failed: "Nothing was changed",
  failedMessage: "Something went wrong. Try again.",
} satisfies Required<DangerZoneLabels>;

type Words = Required<DangerZoneLabels>;

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

/** The sentence with the name set in monospace, so it is clear what has to be copied exactly. */
function typePrompt(template: string, value: string): ReactNode {
  const [before = "", after = ""] = template.split("{value}");
  return (
    <>
      {before}
      <span className="font-mono text-[0.8125rem] font-semibold [overflow-wrap:anywhere]">{value}</span>
      {after}
    </>
  );
}

function DangerRow({ action, text }: { action: DangerAction; text: Words }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = Boolean(action.disabledReason);
  const needsName = Boolean(action.confirmation?.trim());
  const matches = needsName && typed.trim() === action.confirmation?.trim();
  const ready = !needsName || matches;

  function changeOpen(next: boolean) {
    // While the action runs the dialog stays: Escape and the buttons wait for the answer.
    if (busy) return;
    setOpen(next);
    if (!next) {
      setTyped("");
      setError(null);
    }
  }

  async function confirm() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await action.onConfirm();
      setOpen(false);
      setTyped("");
    } catch (thrown) {
      setError(messageOf(thrown) ?? text.failedMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li data-slot="danger-zone-action" className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
      <div className="min-w-0 sm:max-w-lg">
        <p className="text-sm font-medium">{action.title}</p>
        <p id={`${id}-description`} className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
          {action.description}
        </p>
        {action.disabledReason ? (
          <p id={`${id}-reason`} className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <IconLock aria-hidden="true" className="size-3.5 shrink-0" />
            {action.disabledReason}
          </p>
        ) : null}
      </div>

      <AlertDialog open={open} onOpenChange={changeOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={locked}
            aria-describedby={`${id}-description${locked ? ` ${id}-reason` : ""}`}
            className="w-fit shrink-0 sm:min-w-40 border-destructive/40 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)] hover:border-destructive/60 hover:bg-destructive/10 hover:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)] disabled:border-border disabled:text-muted-foreground"
          >
            {action.label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onEscapeKeyDown={(event) => busy && event.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-pretty">{action.dialogTitle ?? `${action.label}?`}</AlertDialogTitle>
            <AlertDialogDescription>{action.dialogDescription ?? action.description}</AlertDialogDescription>
          </AlertDialogHeader>

          {needsName && action.confirmation ? (
            <div className="grid gap-2">
              <Label htmlFor={`${id}-confirm`} className="block leading-snug font-normal">
                {typePrompt(text.type, action.confirmation)}
              </Label>
              <Input
                id={`${id}-confirm`}
                value={typed}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby={`${id}-confirm-hint`}
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void confirm();
                  }
                }}
              />
              <p id={`${id}-confirm-hint`} role="status" className="text-xs text-muted-foreground">
                {matches ? text.matches : text.differs}
              </p>
            </div>
          ) : null}

          {/* Always in the page, empty until there is something to say, so a screen reader hears the message when it arrives. */}
          <div role="alert" className="empty:sr-only">
            {error ? (
              <Alert tone="destructive" className="text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
                <IconWarning />
                <AlertTitle>{text.failed}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel aria-disabled={busy || undefined} onClick={(event) => busy && event.preventDefault()}>
              {text.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!ready}
              aria-busy={busy || undefined}
              aria-disabled={busy || undefined}
              onClick={(event) => {
                // The dialog stays open until the action has worked.
                event.preventDefault();
                void confirm();
              }}
            >
              {busy ? <IconSpinner data-slot="button-spinner" /> : null}
              {action.confirmLabel ?? action.label}
            </AlertDialogAction>
          </AlertDialogFooter>
          <span role="status" className="sr-only">
            {busy ? text.working : ""}
          </span>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

/**
 * The destructive actions of a settings page, together at the foot of it in one section that is marked as what it is.
 * Each row names an action, spells out its consequence in words and puts one button beside it; pressing the button opens an
 * alert dialog that restates what will happen, with Cancel as the answer that has focus, and for the worst actions it also
 * asks for the name of the thing to be typed before the confirm button works, so each row sets its own level of friction.
 * Rows are separated by hairlines. The destructive tone is only in the border and the button labels, and the heading says
 * "Danger zone" in words, so nothing relies on colour alone. A row can be off with a reason written out under it ("Only the
 * owner can do this").
 */
export function DangerZone({ title = "Danger zone", description, actions, headingLevel = 2, labels, className, ...props }: DangerZoneProps) {
  const text: Words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <section data-slot="danger-zone" aria-labelledby={`${id}-title`} className={cn("overflow-hidden rounded-xl border border-destructive/40 bg-card text-card-foreground", className)} {...props}>
      <div className="flex items-start gap-3 border-b border-border px-5 py-5 sm:px-6">
        <IconWarning aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-base leading-tight font-semibold tracking-[-0.015em]">
            {title}
          </Heading>
          {description ? <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <ul role="list" className="m-0 list-none divide-y divide-border p-0">
        {actions.map((action) => (
          <DangerRow key={action.id} action={action} text={text} />
        ))}
      </ul>
    </section>
  );
}
