"use client";

import { useId, useRef, useState, useSyncExternalStore, type ComponentProps, type FocusEvent, type FormEvent, type KeyboardEvent } from "react";

import { IconAlertCircle, IconSpinner, IconUser } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

/** The person who is writing: the avatar beside the field. */
export interface CommentComposerAuthor {
  /** Their name. It gives the initials shown until a picture loads, or when there is none. */
  name: string;
  /** A picture. */
  image?: string;
}

/** The words the composer uses, for translation. `{key}`, `{count}` and `{max}` are filled in. */
export interface CommentComposerLabels {
  /** The name of the field for a screen reader. Default "Write a comment". */
  field?: string;
  /** The button that throws the draft away. Default "Cancel". */
  cancel?: string;
  /** Said after the keys of the shortcut. Default "to send". */
  hint?: string;
  /** What a screen reader hears about the shortcut. Default "Press {key} and Enter to send." */
  shortcut?: string;
  /** The name of the first key on a Mac, for a screen reader. Default "Command". */
  command?: string;
  /** The name of the first key elsewhere, for a screen reader. Default "Control". */
  control?: string;
  /** Said while the comment is on its way. Default "Posting your comment". */
  posting?: string;
  /** Shown when posting failed and the error had no message of its own. Default "Your comment could not be posted. Your text is still here." */
  failed?: string;
  /** The count beside the buttons once the text is near the limit. Default "{count} / {max}". */
  count?: string;
}

export interface CommentComposerProps extends Omit<ComponentProps<"form">, "onSubmit" | "onChange" | "defaultValue" | "children"> {
  /** Who is writing. Without it the avatar is a plain person. */
  author?: CommentComposerAuthor;
  /** The text, when you control it: keep it in your state or your store and the draft survives re-renders and route changes. */
  value?: string;
  /** The text to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the new text on every change, and with an empty string once a comment is posted or the draft is cancelled. */
  onChange?: (value: string) => void;
  /** Called with the trimmed text when Comment is pressed or Cmd or Ctrl Enter is. Return a promise: the composer shows it is busy until it settles, clears itself when it resolves and, when it rejects, keeps the text and says what happened. A rejection with a message is shown as it is. */
  onSubmit: (value: string) => void | Promise<void>;
  /** What the quiet line says. Default "Add a comment…". */
  placeholder?: string;
  /** The most characters. A count appears once the text is near it. */
  maxLength?: number;
  /** Locks the composer, for a closed thread or a signed-out visitor. Say why in `placeholder`. */
  disabled?: boolean;
  /** The label of the button that posts. Default "Comment". */
  submitLabel?: string;
  /** The field's name, for a plain form submit. */
  name?: string;
  /** The words the composer uses, for translation. */
  labels?: CommentComposerLabels;
}

const DEFAULT_LABELS = {
  field: "Write a comment",
  cancel: "Cancel",
  hint: "to send",
  shortcut: "Press {key} and Enter to send.",
  command: "Command",
  control: "Control",
  posting: "Posting your comment",
  failed: "Your comment could not be posted. Your text is still here.",
  count: "{count} / {max}",
} satisfies Required<CommentComposerLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const subscribeNever = () => () => undefined;

/**
 * The input at the bottom of a thread. At rest it is one quiet line beside
 * the writer's avatar; focus it and it grows into a box with Cancel and
 * Comment and the shortcut that sends. Comment stays disabled until there is
 * text, Cmd or Ctrl Enter sends from the keyboard, and Escape folds an empty
 * box back to its line. `onSubmit` may return a promise: while it runs the
 * button shows a spinner (and keeps focus, so a keyboard is not stranded), and
 * if it rejects the text stays and an alert says what happened. Because the
 * value is yours, a draft survives re-renders and navigation, and a draft is
 * never folded away: a box with text stays open. After a comment is posted or
 * the draft is cancelled the box goes back to its line and the focus stays in
 * the field. It is a `<form>` of its own, so do not nest it in another one.
 */
export function CommentComposer({
  author,
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  placeholder = "Add a comment…",
  maxLength,
  disabled = false,
  submitLabel = "Comment",
  name,
  labels,
  className,
  onBlur,
  ...props
}: CommentComposerProps) {
  const text: Required<CommentComposerLabels> = { ...DEFAULT_LABELS, ...labels };
  const hintId = useId();
  const errorId = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLFormElement>(null);
  // A focus that must not open the box: the one that puts the cursor back after a post or a cancel.
  const quiet = useRef(false);
  const [own, setOwn] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The first key of the shortcut is known only in the browser; the server says Control, and nothing is drawn until the box opens anyway.
  const platform = useSyncExternalStore(
    subscribeNever,
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "command" : "control"),
    () => "control",
  );

  const current = value ?? own;
  const filled = current.trim().length > 0;
  const expanded = !disabled && (open || current.length > 0 || busy || error !== null);
  const near = maxLength !== undefined && current.length >= maxLength * 0.8;

  function change(next: string) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  /** Back to the quiet line, with the cursor still in the field. */
  function rest() {
    setOpen(false);
    quiet.current = true;
    field.current?.focus({ preventScroll: true });
    quiet.current = false;
  }

  async function submit() {
    const body = current.trim();
    if (busy || disabled || body === "") return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(body);
    } catch (failure) {
      setBusy(false);
      setError(failure instanceof Error && failure.message ? failure.message : text.failed);
      return;
    }
    setBusy(false);
    change("");
    // Whoever pressed Comment is still in the composer; the button they pressed is about to fold away.
    if (root.current?.contains(document.activeElement)) rest();
    else setOpen(false);
  }

  function cancel() {
    change("");
    setError(null);
    rest();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    } else if (event.key === "Escape" && expanded && current === "" && !busy) {
      // Only an empty box folds; a draft is never thrown away by a key. Folded already, Escape belongs to whatever is around the composer.
      event.preventDefault();
      setOpen(false);
      setError(null);
    }
  }

  function onFormBlur(event: FocusEvent<HTMLFormElement>) {
    onBlur?.(event);
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  const modifier = platform === "command" ? "⌘" : "Ctrl";
  const describedBy = [error ? errorId : null, expanded ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <form
      ref={root}
      data-slot="comment-composer"
      data-state={expanded ? "open" : "closed"}
      aria-busy={busy || undefined}
      className={cn("@container flex items-start gap-3", className)}
      {...props}
      onBlur={onFormBlur}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Avatar aria-hidden="true" className="mt-0.5 shrink-0">
        {author?.image ? <AvatarImage src={author.image} alt="" /> : null}
        <AvatarFallback>{author ? initialsOf(author.name) : <IconUser size={16} />}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-xl border bg-background shadow-xs transition-[border-color,box-shadow] duration-150 focus-within:ring-[3px] motion-reduce:transition-none",
            error ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/30" : "border-input focus-within:border-ring focus-within:ring-ring/40",
            disabled && "border-dashed bg-muted/50 shadow-none",
          )}
        >
          <Textarea
            ref={field}
            name={name}
            rows={1}
            value={current}
            maxLength={maxLength}
            disabled={disabled}
            readOnly={busy}
            placeholder={placeholder}
            aria-label={text.field}
            aria-invalid={error !== null || undefined}
            aria-describedby={describedBy}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            onChange={(event) => {
              setError(null);
              setOpen(true);
              change(event.target.value);
            }}
            onFocus={() => {
              if (!quiet.current) setOpen(true);
            }}
            onClick={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={cn(
              "block min-h-10 resize-none rounded-xl border-0 bg-transparent px-3.5 py-2 leading-6 shadow-none transition-[min-height] duration-200 focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-transparent aria-invalid:ring-0 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-100",
              expanded && "min-h-[5.5rem]",
            )}
          />

          {/* A row folds from 1fr to 0fr, which animates height without measuring anything. Folded, the buttons leave the tab order. */}
          <div
            inert={expanded ? undefined : true}
            className={cn("grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out motion-reduce:transition-none", expanded ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0")}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-2.5 pt-0.5 pb-2.5">
                <div id={hintId} className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground @sm:flex">
                  <KbdGroup aria-hidden="true">
                    <Kbd>{modifier}</Kbd>
                    <Kbd>↵</Kbd>
                  </KbdGroup>
                  <span aria-hidden="true">{text.hint}</span>
                  <span className="sr-only">{fill(text.shortcut, { key: platform === "command" ? text.command : text.control })}</span>
                </div>
                <div className="ms-auto flex items-center gap-1.5">
                  {near && maxLength !== undefined ? (
                    <span aria-live={current.length >= maxLength * 0.95 ? "polite" : "off"} className={cn("me-1.5 text-xs tabular-nums", current.length >= maxLength * 0.95 ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {fill(text.count, { count: String(current.length), max: String(maxLength) })}
                    </span>
                  ) : null}
                  <Button type="button" variant="ghost" size="sm" aria-disabled={busy || undefined} onClick={() => !busy && cancel()} className="text-muted-foreground hover:text-foreground">
                    {text.cancel}
                  </Button>
                  {/* Busy is said with aria-busy and aria-disabled, not with disabled: a disabled button gives up focus, which would leave a keyboard on no control until the request ends. */}
                  <Button type="submit" size="sm" disabled={!filled && !busy} aria-busy={busy || undefined} aria-disabled={busy || undefined} className="aria-busy:cursor-progress">
                    {busy ? <IconSpinner data-slot="button-spinner" /> : null}
                    {submitLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error !== null ? (
          <p id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 text-xs leading-5 font-medium text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
        <span role="status" className="sr-only">
          {busy ? text.posting : ""}
        </span>
      </div>
    </form>
  );
}
