"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconEdit } from "@rhs-ui/icons";
import { Input } from "@rhs-ui/primitives/input";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** One choice of a select cell. */
export interface EditableOption {
  /** What `onCommit` is called with, and what `value` holds once it is chosen. */
  value: string;
  /** What the choice says. */
  label: string;
}

/** The words the cell says on its own, for another language or your own wording. `{min}` and `{max}` are filled in. */
export interface EditableCellLabels {
  /** Said politely while the promise runs. Default "Saving". */
  saving: string;
  /** Said politely once it resolved. Default "Saved". */
  saved: string;
  /** The line under a field whose text is not a number. Default "Enter a number." */
  number: string;
  /** The line under a field that may not be empty. Default "This cannot be empty." */
  required: string;
  /** The line under a number below `min`. Default "Enter {min} or more." */
  min: string;
  /** The line under a number above `max`. Default "Enter {max} or less." */
  max: string;
  /** The line shown when saving failed and the rejection carried no message. Default "Could not save. The old value is back." */
  failed: string;
  /** What the cell shows while its value is empty. Default "Empty". */
  empty: string;
  /** The hint a mouse user gets on hover, because a single click does not edit. Default "Double-click or press Enter to edit". */
  edit: string;
}

/** What `onCommit` may return: nothing, or a promise the cell waits for. */
type Outcome = void | Promise<unknown>;

export interface EditableCellProps<V extends string | number = string | number> extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** What the cell holds, in a few words: "Unit price". It names the field while it is edited and prefixes the value for a screen reader ("Unit price: 48"). */
  label: string;
  /** What the cell holds: text for a `text` or `select` cell, a number for a `number` cell. */
  value: V;
  /** `text` (the default) edits a line of text. `number` edits a number, in a text field with the decimal keyboard on a phone. `select` chooses from `options` in the house select. */
  type?: "text" | "number" | "select";
  /** The choices of a `select` cell. */
  options?: readonly EditableOption[];
  /** Called with the new value when it is committed: text, or a number for a `number` cell, or the `value` of the chosen option. Return a promise to show the saving state; reject it to put the old value back. */
  onCommit: (value: V) => Outcome;
  /** Returns a message for a value that may not be saved, or nothing. The field stays open with the message tied to it. */
  validate?: (value: V) => string | null | undefined;
  /** Draws the value at rest, for when it is not what should show: a price, a percentage. Default the text, the option's label, or the number written in the locale. */
  format?: (value: V) => ReactNode;
  /** Refuse an empty text. Default false. */
  required?: boolean;
  /** The most characters a text field takes. */
  maxLength?: number;
  /** The lowest number a `number` cell accepts. */
  min?: number;
  /** The highest number a `number` cell accepts. */
  max?: number;
  /** Show the value and nothing else. Default false. */
  disabled?: boolean;
  /** Which side the value sits on. Numbers read best on the right. Default "left". */
  align?: "left" | "right";
  /** The locale that writes numbers. Default "en-US". */
  locale?: string;
  /** The words the cell says, for translation. */
  labels?: Partial<EditableCellLabels>;
}

const DEFAULT_LABELS = {
  saving: "Saving",
  saved: "Saved",
  number: "Enter a number.",
  required: "This cannot be empty.",
  min: "Enter {min} or more.",
  max: "Enter {max} or less.",
  failed: "Could not save. The old value is back.",
  empty: "Empty",
  edit: "Double-click or press Enter to edit",
} satisfies EditableCellLabels;

const fill = (template: string, values: Readonly<Record<string, string>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | null | undefined)?.then === "function";

/** A number from what was typed: spaces are ignored and one comma counts as the decimal point. Null when it is not a number. */
function parseNumber(text: string): number | null {
  const clean = text.replace(/\s/g, "").replace(",", ".");
  const number = Number(clean);
  return clean === "" || !Number.isFinite(number) ? null : number;
}

type Phase = "rest" | "editing" | "saving";

/**
 * A table cell that edits in place the way a spreadsheet does. At rest it shows the formatted value as a button with a
 * pencil that appears on hover and focus; Enter, F2 or a double-click swaps in the field with the value already
 * selected. Enter commits, Escape puts the old value back and Tab commits and moves on. An invalid value keeps the field
 * open with `aria-invalid` and its message tied to the field. `onCommit` may return a promise: while it runs the cell
 * shows the new value with a spinner and `aria-busy`, and a rejection puts the old value back and says why. Messages
 * appear in a small panel under the cell and over what follows, so they never widen a narrow column or push the rows
 * down. It is the content of a TableCell, so it also works in a list or a card. Update your own state in `onCommit`, or
 * pass the new `value` when it arrives; the cell follows `value` whenever it changes.
 */
export function EditableCell<V extends string | number = string>({ label, disabled = false, align = "left", locale = "en-US", labels, type = "text", value, options = [], onCommit, validate, format, required = false, maxLength, min, max, className, ...rest }: EditableCellProps<V>) {
  // Inside, a value is a string or a number whatever the kind of cell, so the three callbacks are held in that one shape.
  const commitValue = onCommit as (value: string | number) => unknown;
  const validateValue = validate as ((value: string | number) => string | null | undefined) | undefined;
  const formatValue = format as ((value: string | number) => ReactNode) | undefined;
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const messageId = `${id}-message`;

  // What is shown follows `value` when it changes, and holds the new value while it is being saved.
  const [shown, setShown] = useState<string | number>(value);
  const [seen, setSeen] = useState<string | number>(value);
  if (!Object.is(seen, value)) {
    setSeen(value);
    setShown(value);
  }
  const [phase, setPhase] = useState<Phase>("rest");
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  // The field lost the focus while its value is refused: it keeps the red border, but the message goes until the field is entered again.
  const [away, setAway] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  // The focus goes back to the button after Enter and Escape, but not after Tab or a click elsewhere: the person has moved on.
  const refocus = useRef(false);
  // The edit is over (committed or cancelled), so the blur that follows the field leaving the page is not a second commit.
  const closing = useRef(false);
  // The list of a select cell was closed by a press somewhere else: that is where the person went, so the focus is not taken back.
  const outsidePointer = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase === "editing" && type !== "select") {
      field.current?.focus();
      field.current?.select();
    }
    if (phase === "rest" && refocus.current) {
      refocus.current = false;
      button.current?.focus();
    }
  }, [phase, type]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 1800);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function display(next: string | number): ReactNode {
    if (formatValue) return formatValue(next);
    if (type === "select") return options.find((option) => option.value === next)?.label ?? String(next);
    if (type === "number" && typeof next === "number") return new Intl.NumberFormat(locale).format(next);
    return String(next);
  }

  /** The value a draft stands for, or the message that says why it cannot be saved. */
  function check(text: string): { value: string | number } | { message: string } {
    let next: string | number;
    if (type === "number") {
      const parsed = parseNumber(text);
      if (parsed === null) return { message: words.number };
      if (min !== undefined && parsed < min) return { message: fill(words.min, { min: new Intl.NumberFormat(locale).format(min) }) };
      if (max !== undefined && parsed > max) return { message: fill(words.max, { max: new Intl.NumberFormat(locale).format(max) }) };
      next = parsed;
    } else {
      next = type === "select" ? text : text.trim();
      if (required && next === "") return { message: words.required };
    }
    const custom = validateValue?.(next);
    return custom ? { message: custom } : { value: next };
  }

  function begin() {
    if (disabled || phase !== "rest") return;
    setDraft(String(shown));
    setProblem(null);
    setAway(false);
    setFailure(null);
    setSaved(false);
    closing.current = false;
    outsidePointer.current = false;
    setPhase("editing");
  }

  function cancel(keepFocus: boolean) {
    closing.current = true;
    if (keepFocus) refocus.current = true;
    setProblem(null);
    setPhase("rest");
  }

  async function commit(next: string | number) {
    closing.current = true;
    setProblem(null);
    if (Object.is(next, shown)) {
      setPhase("rest");
      return;
    }
    const previous = shown;
    setShown(next);
    let result: unknown;
    try {
      result = commitValue(next);
    } catch (error) {
      setShown(previous);
      setFailure(error instanceof Error && error.message ? error.message : words.failed);
      setPhase("rest");
      return;
    }
    if (!isThenable(result)) {
      setPhase("rest");
      setSaved(true);
      return;
    }
    setPhase("saving");
    try {
      await result;
      if (alive.current) setSaved(true);
    } catch (error) {
      if (alive.current) {
        setShown(previous);
        setFailure(error instanceof Error && error.message ? error.message : words.failed);
      }
    } finally {
      if (alive.current) setPhase("rest");
    }
  }

  function submit(keepFocus: boolean) {
    const outcome = check(draft);
    if ("message" in outcome) {
      setProblem(outcome.message);
      field.current?.focus();
      return;
    }
    if (keepFocus) refocus.current = true;
    void commit(outcome.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submit(true);
    } else if (event.key === "Escape") {
      // The cell takes the key: a dialog around the table must not close with it.
      event.preventDefault();
      event.stopPropagation();
      cancel(true);
    } else if (event.key === "Tab") {
      // A valid value is committed by the blur that follows, as focus moves on. An invalid one keeps the focus.
      const outcome = check(draft);
      if ("message" in outcome) {
        event.preventDefault();
        setProblem(outcome.message);
      }
    }
  }

  function onBlur(event: FocusEvent<HTMLInputElement>) {
    // The whole window lost focus, not the field: the field is still the active element, and the edit goes on.
    if (closing.current || document.activeElement === event.currentTarget) return;
    const outcome = check(draft);
    if ("message" in outcome) {
      // The field stays open and refused, but the message must not float over the next row once the person has gone elsewhere.
      setProblem(outcome.message);
      setAway(true);
      return;
    }
    void commit(outcome.value);
  }

  function choose(next: string) {
    const outcome = check(next);
    closing.current = true;
    if ("message" in outcome) {
      setProblem(outcome.message);
      return;
    }
    refocus.current = true;
    void commit(outcome.value);
  }

  const busy = phase === "saving";
  // What the popover under the cell says: why a value is refused while it is edited, why a save failed once it is back at rest.
  const message = phase === "editing" ? (away ? null : problem) : phase === "rest" ? failure : null;
  // The popover keeps its words while it fades out.
  const lastMessage = useRef("");
  if (message) lastMessage.current = message;
  const empty = shown === "";
  const shownText = empty ? words.empty : display(shown);
  const trailing = busy ? <Spinner size={14} label="" className="text-muted-foreground" /> : saved ? <IconCheck aria-hidden="true" className="size-3.5 shrink-0 text-foreground" /> : null;

  return (
    <Popover
      open={message !== null}
      onOpenChange={(open) => {
        // Escape or a move to somewhere else dismisses a failure; a refused value stays until it is fixed or given up.
        if (!open && phase === "rest") setFailure(null);
      }}
    >
      <PopoverAnchor asChild>
        <div ref={root} data-slot="editable-cell" data-state={phase} aria-busy={busy || undefined} className={cn("relative min-w-0", align === "right" && "text-right", className)} {...rest}>
          {/* The button stays in the flow while the field is open, hidden, so the cell keeps its size and no column moves; the field is laid over it. */}
          {disabled ? (
            <span className={cn("flex min-h-8 items-center", empty && "text-muted-foreground")}>
              <span className="truncate">{shownText}</span>
            </span>
          ) : (
            <button
              ref={button}
              type="button"
              title={busy ? undefined : words.edit}
              aria-disabled={busy || undefined}
              aria-describedby={failure ? messageId : undefined}
              onClick={(event) => {
                // A keyboard or assistive-technology activation arrives with no click count; a finger has no double click to give.
                if (busy) return;
                if (event.detail === 0 || window.matchMedia("(pointer: coarse)").matches) begin();
              }}
              onDoubleClick={() => (busy ? undefined : begin())}
              onKeyDown={(event) => {
                if (event.key === "F2" && !busy) {
                  event.preventDefault();
                  begin();
                }
              }}
              className={cn(
                "group/edit -mx-2 inline-flex min-h-8 max-w-[calc(100%+1rem)] min-w-12 cursor-text items-center gap-1.5 rounded-md px-2 text-left text-sm outline-none transition-colors duration-150 motion-reduce:transition-none",
                "enabled:hover:bg-muted aria-disabled:cursor-progress focus-visible:ring-[3px] focus-visible:ring-ring/40",
                align === "right" && "flex-row-reverse text-right",
                phase === "editing" && "invisible",
              )}
            >
              <span className={cn("min-w-0 truncate", empty && "text-muted-foreground")}>
                <span className="sr-only">{label}: </span>
                {shownText}
              </span>
              {trailing ?? (
                <IconEdit
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/edit:opacity-100 group-focus-visible/edit:opacity-100 motion-reduce:transition-none [@media(pointer:coarse)]:opacity-60"
                />
              )}
            </button>
          )}
          {phase === "editing" ? (
            type === "select" ? (
              // Choosing the option that is already chosen is not a change, so Radix never calls onValueChange for it: the list just closes, and the focus must come back to the cell like it does after Escape or a new choice. Only a press somewhere else keeps it away.
              <Select defaultOpen value={String(shown)} onValueChange={choose} onOpenChange={(open) => (open || closing.current ? undefined : cancel(!outsidePointer.current))}>
                <SelectTrigger size="sm" aria-label={label} aria-invalid={problem ? true : undefined} aria-describedby={problem ? messageId : undefined} className="absolute top-0 -start-2 w-[calc(100%+1rem)] max-w-none px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  // Enter chooses the option and the focus is back on the cell within that very key press. Left alone, the browser would go on to "press" the cell with the same Enter, and the list would open again.
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                  }}
                  onEscapeKeyDown={() => (refocus.current = true)}
                  onPointerDownOutside={(event) => {
                    outsidePointer.current = !root.current?.contains(event.target as Node);
                  }}
                >
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                ref={field}
                value={draft}
                inputMode={type === "number" ? "decimal" : undefined}
                maxLength={type === "number" ? undefined : maxLength}
                aria-label={label}
                aria-invalid={problem ? true : undefined}
                aria-describedby={problem && !away ? messageId : undefined}
                autoComplete="off"
                enterKeyHint="done"
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (problem) setProblem(null);
                }}
                onKeyDown={onKeyDown}
                onFocus={() => setAway(false)}
                onBlur={onBlur}
                className={cn("absolute inset-y-0 -start-2 h-auto w-[calc(100%+1rem)] max-w-none min-w-0 px-2 py-0", align === "right" && "text-right")}
              />
            )
          ) : null}
          <span role="status" className="sr-only">
            {busy ? words.saving : saved ? words.saved : ""}
          </span>
        </div>
      </PopoverAnchor>
      {/* Under the cell and over what follows, not in the flow: a message must not widen a narrow column or push the rows down. */}
      <PopoverContent
        role="alert"
        side="bottom"
        align={align === "right" ? "end" : "start"}
        sideOffset={4}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          // While the field is open the message belongs to it and stays; the cell itself is never "somewhere else".
          if (phase === "editing" || root.current?.contains(event.target as Node)) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (phase === "editing") event.preventDefault();
        }}
        className="w-auto max-w-64 px-3 py-2 text-xs"
      >
        <p id={messageId} className="flex items-start gap-1.5 text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span>{message ?? lastMessage.current}</span>
        </p>
      </PopoverContent>
    </Popover>
  );
}
