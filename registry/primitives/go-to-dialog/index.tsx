"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DateField } from "@rhs-ui/primitives/date-field";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { isTyping, matchesShortcut, parseShortcut, shortcutKeys } from "@rhs-ui/primitives/go-to-dialog/shortcut";
import { articleFor, checkNumber, dayHint, DEFAULT_LABELS, fillIn, numberHint, type GoToKind, type GoToLabels, type GoToValue } from "@rhs-ui/primitives/go-to-dialog/validate";
import { Input } from "@rhs-ui/primitives/input";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export type { GoToKind, GoToLabels, GoToValue } from "@rhs-ui/primitives/go-to-dialog/validate";

export interface GoToDialogProps<K extends GoToKind = "number"> {
  /** What to ask for: a whole `number` (a page, a line, a row) or a calendar `date`. Default "number". */
  kind?: K;
  /** The lowest value that can be used: a number, or an ISO date such as `2026-03-14` for a date. A number starts at 1. */
  min?: GoToValue<K>;
  /** The highest value that can be used, in the same form. */
  max?: GoToValue<K>;
  /** What the field starts with, usually where you are now. A number is selected when the dialog opens, so typing replaces it. */
  defaultValue?: GoToValue<K>;
  /** The title of the dialog and the name of the field: "Go to page". Default "Go to {noun}". */
  label?: string;
  /** What is being picked, for the messages: "page", "line", "row". Default "number", or "date" for a date. */
  noun?: string;
  /** The locale that writes numbers and decides the order of day, month and year in a date. Default "en-US". */
  locale?: string;
  /** Called with the value once Go (or Enter) was chosen, the dialog has closed and focus has been given back, so you can move focus to where you went. */
  onGo: (value: GoToValue<K>) => void;
  /** The keys that open it from anywhere on the page, as `mod+g` (Command on a Mac, Control elsewhere). Pass `false` for none. It is left alone while someone types in another field or another dialog is open. Default "mod+g". */
  shortcut?: string | false;
  /** The element that opens it, usually a Button. Without one it opens with the shortcut or through `open`. */
  trigger?: ReactNode;
  /** Whether it is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The words the dialog says, for translation. */
  labels?: Partial<GoToLabels>;
  /** Classes for the panel, for a different width. */
  className?: string;
}

/** Red text on the pale red of a message: the destructive colour pulled toward the text colour keeps 4.5 to 1 in both themes. */
const ERROR_TEXT = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]";

const isApple = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

interface GoToFormProps {
  kind: GoToKind;
  min?: number | string;
  max?: number | string;
  start?: number | string;
  locale: string;
  noun: string;
  title: string;
  labels: GoToLabels;
  fieldId: string;
  fieldRef: RefObject<HTMLInputElement | null>;
  keys: string[] | null;
  onSubmit: (value: number | string) => void;
}

/** The question itself. It mounts when the dialog opens, so every opening starts from the default value with no old message. */
function GoToForm({ kind, min, max, start, locale, noun, title, labels, fieldId, fieldRef, keys, onSubmit }: GoToFormProps) {
  const noteId = useId();
  const [text, setText] = useState(start === undefined ? "" : String(start));
  const [iso, setIso] = useState(typeof start === "string" ? start : "");
  const [tried, setTried] = useState(false);
  const [incomplete, setIncomplete] = useState(false);

  const isDate = kind === "date";
  const lower = typeof min === "number" ? min : 1;
  const upper = typeof max === "number" ? max : undefined;
  const check = checkNumber(text, { min: lower, max: upper, locale, noun, labels });
  const empty = fillIn(labels.empty, { noun, article: articleFor(noun) });
  const problem = isDate ? (incomplete ? empty : null) : check.state === "invalid" ? check.message : tried && check.state === "empty" ? empty : null;
  const hint = isDate ? dayHint({ min: typeof min === "string" ? min : undefined, max: typeof max === "string" ? max : undefined, locale, labels }) : numberHint({ min: lower, max: upper, locale, labels });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The dialog is drawn in a portal, but React still passes its events up to the component that rendered it: a dialog opened from inside a form must not submit that form too.
    event.stopPropagation();
    if (isDate) {
      if (iso) {
        onSubmit(iso);
        return;
      }
      // A date that is complete but impossible already has its reason under the field; only a date that is not finished needs ours.
      const parts = event.currentTarget.querySelectorAll<HTMLInputElement>('[data-slot="date-field"] input[role="spinbutton"]');
      setIncomplete(Array.from(parts).some((part) => part.value === ""));
      document.getElementById(fieldId)?.focus();
      return;
    }
    if (check.state === "valid") {
      onSubmit(check.value);
      return;
    }
    setTried(true);
    fieldRef.current?.focus();
  }

  /** The arrow keys step the number, and Shift steps by ten. */
  function step(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const base = check.state === "valid" ? check.value : lower;
    const next = base + (event.shiftKey ? 10 : 1) * (event.key === "ArrowUp" ? 1 : -1);
    setText(String(Math.min(upper ?? Number.MAX_SAFE_INTEGER, Math.max(lower, next))));
    setTried(false);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader className="gap-1">
        <DialogTitle className="text-base tracking-[-0.01em]">
          {title}
        </DialogTitle>
        <DialogDescription className="sr-only">{labels.description}</DialogDescription>
      </DialogHeader>

      {/* A date field says what is wrong with a date by itself, in the line under it: that line takes the place of the hint, and the note area stays one line. */}
      <div className={cn("grid gap-2", isDate && "[&:has([data-slot=date-field]_p)>[data-slot=go-to-note]]:hidden [&_[data-slot=date-field]_p]:mt-2")}>
        {isDate ? (
          <DateField
            // As wide as the dialog, like the number field.
            className="[&_[data-slot=input-group]]:w-full"
            id={fieldId}
            aria-label={title}
            aria-describedby={noteId}
            value={iso}
            onValueChange={(next) => {
              setIso(next);
              setIncomplete(false);
            }}
            locale={locale}
            min={typeof min === "string" ? min : undefined}
            max={typeof max === "string" ? max : undefined}
          />
        ) : (
          <Input
            ref={fieldRef}
            id={fieldId}
            type="text"
            inputMode="numeric"
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={title}
            aria-describedby={noteId}
            aria-invalid={problem ? true : undefined}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setTried(false);
            }}
            onKeyDown={step}
            // 16px keeps iOS from zooming into the field, and a taller field is the one thing on this dialog.
            className="h-11 px-3.5 text-base tabular-nums"
          />
        )}
        {/* One line, always: the range as a hint, or what is wrong in its place. It is polite, so a change is said once. */}
        <div id={noteId} data-slot="go-to-note" aria-live="polite" className="min-h-4 text-xs leading-4">
          {problem ? (
            <p className={cn("flex items-start gap-1.5", ERROR_TEXT)}>
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {problem}
            </p>
          ) : hint ? (
            <p className="text-muted-foreground tabular-nums">{hint}</p>
          ) : null}
        </div>
      </div>

      <DialogFooter className={cn("items-stretch sm:items-center", keys ? "sm:justify-between" : "sm:justify-end")}>
        {keys ? (
          <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:inline-flex">
            {labels.shortcut}
            <KbdGroup>
              {keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </KbdGroup>
          </span>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {labels.cancel}
            </Button>
          </DialogClose>
          <Button type="submit">{labels.go}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}

/**
 * Jump to a page, line, row or date from the keyboard: a dialog with one field, opened by a shortcut (Command or
 * Control with G) or by a trigger. The field shows the range as its hint ("1 to 240") and checks what is typed as it
 * is typed, naming the problem in words ("Pick a page between 1 and 240"), the arrow keys step a number, Enter goes and
 * closes, and Escape cancels. A number is selected when the dialog opens, so typing replaces it; a date is the
 * library's own date field, in the order the locale writes it. Focus goes back to where it was before the dialog
 * opened, and only then is `onGo` called, so the place you jump to can take focus. The shortcut is left alone while
 * someone is typing in another field, and while another dialog is open, so it never takes a key from a form.
 */
export function GoToDialog<K extends GoToKind = "number">({
  kind,
  min,
  max,
  defaultValue,
  label,
  noun,
  locale = "en-US",
  onGo,
  shortcut = "mod+g",
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
}: GoToDialogProps<K>) {
  const isDate = kind === "date";
  const word = noun ?? (isDate ? "date" : "number");
  const words = { ...DEFAULT_LABELS, ...labels };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const fieldId = useId();
  const field = useRef<HTMLInputElement | null>(null);
  /** Where focus was before the dialog opened. */
  const returnTo = useRef<HTMLElement | null>(null);
  /** The value that was chosen, handed to `onGo` once the dialog has let go of focus. */
  const chosen = useRef<{ value: GoToValue<K> } | null>(null);
  const fallback = useRef<number | undefined>(undefined);
  const latest = useRef({ onGo, onOpenChange, open });
  useEffect(() => {
    latest.current = { onGo, onOpenChange, open };
  });

  const change = useCallback((next: boolean) => {
    if (latest.current.open === undefined) setOwnOpen(next);
    latest.current.onOpenChange?.(next);
  }, []);

  const flush = useCallback(() => {
    window.clearTimeout(fallback.current);
    const go = chosen.current;
    chosen.current = null;
    if (go) latest.current.onGo(go.value);
  }, []);

  useEffect(() => () => window.clearTimeout(fallback.current), []);

  useEffect(() => {
    if (shortcut === false) return;
    const combo = parseShortcut(shortcut);
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || !matchesShortcut(event, combo)) return;
      // Typing in a field, or a modal already open (Radix locks the page's scroll for one): not the moment for a dialog.
      if (isTyping(event.target) || document.body.hasAttribute("data-scroll-locked")) return;
      event.preventDefault();
      change(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcut, change]);

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        data-slot="go-to-dialog"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          // Radix would focus the first control; this one knows which control is the field, and notes where focus was.
          event.preventDefault();
          const active = document.activeElement;
          returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
          const target = isDate ? document.getElementById(fieldId) : field.current;
          target?.focus();
          if (target instanceof HTMLInputElement) target.select();
        }}
        onCloseAutoFocus={(event) => {
          const back = returnTo.current;
          returnTo.current = null;
          // Back to where the person was, not only to the trigger; then, and only then, the jump.
          if (back?.isConnected) {
            event.preventDefault();
            back.focus({ preventScroll: true });
          }
          // After this handler returns Radix still moves focus to the trigger when it was not told not to; the jump comes after that, so it can take focus away again.
          window.setTimeout(flush, 0);
        }}
        className={cn("gap-0 p-5 sm:max-w-sm", className)}
      >
        <GoToForm
          kind={isDate ? "date" : "number"}
          min={min}
          max={max}
          start={defaultValue}
          locale={locale}
          noun={word}
          title={label ?? `Go to ${word}`}
          labels={words}
          fieldId={fieldId}
          fieldRef={field}
          keys={shortcut === false ? null : shortcutKeys(parseShortcut(shortcut), isApple())}
          onSubmit={(value) => {
            chosen.current = { value: value as GoToValue<K> };
            change(false);
            // The dialog hands focus back after its exit; if it is removed before that, the jump still happens.
            fallback.current = window.setTimeout(flush, 800);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
