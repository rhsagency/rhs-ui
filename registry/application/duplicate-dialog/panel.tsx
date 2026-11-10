"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconSpinner } from "@rhs-ui/icons";
import {
  copySummary,
  DEFAULT_LABELS,
  fill,
  freeName,
  isTaken,
  messageOf,
  suggestName,
  type DuplicateLabels,
  type DuplicateOption,
} from "@rhs-ui/application/duplicate-dialog/duplicate";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { DialogClose, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { ResultState } from "@rhs-ui/primitives/result-state";
import { cn } from "@/lib/utils";

/** What `onDuplicate` receives: the name for the copy, and the ids of the options that are ticked. */
export interface DuplicateValues {
  /** The name for the copy, without the spaces around it. */
  name: string;
  /** The `id` of every ticked option, in the order the options were given. */
  include: string[];
}

export interface DuplicatePanelProps {
  /** The name of the thing being copied: "Halcyon launch". The copy starts as "Halcyon launch (copy)". */
  sourceName: string;
  /** What can come along: each with a label, a count, and whether it starts ticked. */
  options?: readonly DuplicateOption[];
  /** Names that are already used, so the suggestion steers around them and a clashing name is refused with a way out. */
  existingNames?: readonly string[];
  /** What is being copied, as a lower-case noun: "project", "document", "board". It is in the title and the buttons. Default "item". */
  kind?: string;
  /**
   * Makes the copy. Return a promise and the panel waits for it: the fields lock and the button shows progress while it runs. When
   * it resolves, the form is replaced by "Copy created" with a link to what you resolve with, the new item's address. When it
   * rejects, the form stays as it was with the message above it, so nothing has to be retyped.
   */
  onDuplicate: (values: DuplicateValues) => void | string | undefined | Promise<void | string | undefined>;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside a Dialog. The title is then a plain heading. */
  standalone?: boolean;
  /** Called when "Cancel" or "Done" is pressed in a standalone panel. Inside a Dialog those buttons close it. */
  onClose?: () => void;
  /** Called with true while the copy is made and false after, so a dialog around the panel can refuse to close in the meantime. */
  onBusyChange?: (busy: boolean) => void;
  /** The language of the numbers and of the way the list at the foot is joined. Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: DuplicateLabels;
  /** Classes for the panel. */
  className?: string;
}

function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <DialogTitle className={className}>{children}</DialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <DialogDescription className={className}>{children}</DialogDescription>;
}

/** A sentence with one name in it, set in a heavier weight: `{name}` in the template. */
function Naming({ template, token, value }: { template: string; token: string; value: string }) {
  const [before = "", ...after] = template.split(`{${token}}`);
  if (!after.length) return <>{template}</>;
  return (
    <>
      {before}
      <strong className="font-medium text-foreground">{value}</strong>
      {after.join(`{${token}}`)}
    </>
  );
}

/**
 * The inside of the duplicate dialog, on its own: a name that starts as "Halcyon launch (copy)" and steers around names that
 * are taken, a checkbox for each thing that can come along with how much of it there is, and a line at the foot that says
 * what will happen ("Copies 48 tasks and 12 files"). Duplicating shows progress on the button and locks the fields; a
 * success replaces the form with "Copy created" and a link to the copy; a failure keeps everything with its message above.
 * Use it inside a Dialog, or with `standalone` anywhere else.
 */
export function DuplicatePanel({
  sourceName,
  options = [],
  existingNames = [],
  kind = "item",
  onDuplicate,
  standalone = false,
  onClose,
  onBusyChange,
  locale = "en-US",
  labels,
  className,
}: DuplicatePanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const [name, setName] = useState(() => suggestName(sourceName, existingNames, words.copy));
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set(options.filter((option) => option.defaultChecked).map((option) => option.id)));
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState(false);
  const [href, setHref] = useState<string | null>(null);
  const [made, setMade] = useState("");
  const nameField = useRef<HTMLInputElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLAnchorElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  const pending = status === "pending";
  const clash = isTaken(name, existingNames);
  const empty = asked && name.trim() === "";
  const alternative = clash ? freeName(name, existingNames, words.copy) : "";
  const problem = empty ? words.empty : clash ? fill(words.taken, { kind, name: `“${name.trim()}”` }) : null;

  // The form leaves, and with it the button that had focus: the way on (the link to the copy) takes it. The page stays where it is.
  useEffect(() => {
    if (status === "done") (opener.current ?? closer.current)?.focus({ preventScroll: true });
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A dialog is drawn in a portal, but React still passes its events up to whatever rendered it: do not submit a form around it as well.
    event.stopPropagation();
    if (busy.current) return;
    setAsked(true);
    if (name.trim() === "" || clash) {
      nameField.current?.focus({ preventScroll: true });
      return;
    }
    busy.current = true;
    setError(null);
    setStatus("pending");
    onBusyChange?.(true);
    // The fields are about to switch off and take the focus with them. The button stays focusable, so focus rests there while it works.
    submitButton.current?.focus({ preventScroll: true });
    try {
      const result = await onDuplicate({ name: name.trim(), include: options.filter((option) => checked.has(option.id)).map((option) => option.id) });
      setMade(name.trim());
      setHref(typeof result === "string" && result ? result : null);
      setStatus("done");
    } catch (thrown) {
      setStatus("idle");
      setError(messageOf(thrown) ?? words.failedBody);
      window.requestAnimationFrame(() => nameField.current?.focus({ preventScroll: true }));
    } finally {
      busy.current = false;
      onBusyChange?.(false);
    }
  }

  const cancel = standalone ? (
    <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
      {words.cancel}
    </Button>
  ) : (
    <DialogClose asChild>
      <Button type="button" variant="outline" disabled={pending}>
        {words.cancel}
      </Button>
    </DialogClose>
  );

  if (status === "done") {
    return (
      <div data-slot="duplicate-panel" data-status="done" className={cn("grid", className)}>
        <Heading standalone={standalone} className="sr-only">
          {words.done}
        </Heading>
        <Lede standalone={standalone} className="sr-only">
          {fill(words.doneBody, { name: made })}
        </Lede>
        <p role="status" className="sr-only">
          {words.done}
        </p>
        <ResultState
          tone="success"
          title={words.done}
          description={fill(words.doneBody, { name: made })}
          className="px-5 py-10 sm:px-6 sm:py-12"
          actions={
            <>
              {href ? (
                <Button asChild>
                  <a ref={opener} href={href}>
                    {fill(words.open, { kind })}
                  </a>
                </Button>
              ) : null}
              {standalone ? (
                <Button ref={closer} type="button" variant={href ? "outline" : "default"} onClick={onClose}>
                  {words.close}
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button ref={closer} type="button" variant={href ? "outline" : "default"}>
                    {words.close}
                  </Button>
                </DialogClose>
              )}
            </>
          }
        />
      </div>
    );
  }

  return (
    <form data-slot="duplicate-panel" data-status={status} noValidate onSubmit={(event) => void submit(event)} className={cn("flex min-h-0 flex-col", className)}>
      <div className="shrink-0 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
        <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
          {fill(words.title, { kind })}
        </Heading>
        <Lede standalone={standalone} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          <Naming template={fill(words.description, { kind })} token="name" value={sourceName} />
        </Lede>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
        {error !== null ? (
          <Alert tone="destructive" role="alert" className="mb-5 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
            <IconAlertCircle />
            <AlertTitle>{words.failed}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {/* A disabled fieldset switches off every control inside it and keeps what was typed and ticked. */}
        <fieldset disabled={pending} className="m-0 grid min-w-0 gap-5 border-0 p-0">
          <div className="grid gap-2">
            <FormField error={problem} className="gap-1.5">
              <FormLabel>{words.name}</FormLabel>
              <FormControl>
                <Input
                  ref={nameField}
                  value={name}
                  autoComplete="off"
                  spellCheck={false}
                  // The message about an empty name waits until the name is edited: the press that asks for it also puts focus in the field.
                  onChange={(event) => {
                    setName(event.target.value);
                    setAsked(false);
                  }}
                />
              </FormControl>
            </FormField>
            {clash && alternative ? (
              <button
                type="button"
                onClick={() => {
                  setName(alternative);
                  nameField.current?.focus({ preventScroll: true });
                }}
                className="w-fit max-w-full rounded-sm text-left text-xs font-medium underline decoration-foreground/40 underline-offset-2 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {fill(words.useName, { name: `“${alternative}”` })}
              </button>
            ) : null}
          </div>

          {options.length ? (
            <fieldset className="m-0 grid min-w-0 gap-2.5 border-0 p-0">
              <legend className="mb-2.5 p-0 text-sm font-medium">{words.include}</legend>
              <ul className="m-0 grid list-none divide-y divide-border overflow-hidden rounded-lg border border-border p-0">
                {options.map((option) => {
                  const on = checked.has(option.id);
                  return (
                    <li key={option.id}>
                      <label
                        htmlFor={`${id}-${option.id}`}
                        className="flex cursor-pointer items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-muted/50 has-disabled:cursor-not-allowed has-disabled:hover:bg-transparent motion-reduce:transition-none"
                      >
                        <Checkbox
                          id={`${id}-${option.id}`}
                          checked={on}
                          disabled={option.disabled}
                          onCheckedChange={(next) =>
                            setChecked((current) => {
                              const copy = new Set(current);
                              if (next === true) copy.add(option.id);
                              else copy.delete(option.id);
                              return copy;
                            })
                          }
                        />
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className={cn("text-sm leading-snug font-medium", option.disabled && "text-muted-foreground")}>{option.label}</span>
                          {option.reason ? <span className="text-xs leading-snug text-muted-foreground">{option.reason}</span> : null}
                        </span>
                        {option.count !== undefined ? <span className="text-sm text-muted-foreground tabular-nums">{new Intl.NumberFormat(locale).format(option.count)}</span> : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : null}
        </fieldset>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p aria-live="polite" className="text-[0.8125rem] leading-snug text-muted-foreground">
          {copySummary(options, checked, locale, words, kind)}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:shrink-0 sm:flex-row">
          {cancel}
          {/* Busy is said with aria-busy and aria-disabled, not disabled: a disabled button gives up focus, which would leave a keyboard on no control until the copy is made. */}
          <Button ref={submitButton} type="submit" aria-busy={pending || undefined} aria-disabled={pending || undefined} className="aria-disabled:cursor-progress">
            {pending ? <IconSpinner data-slot="button-spinner" /> : null}
            {error !== null && !pending ? words.retry : words.duplicate}
          </Button>
        </div>
      </div>
      <p role="status" className="sr-only">
        {pending ? words.duplicating : ""}
      </p>
    </form>
  );
}
