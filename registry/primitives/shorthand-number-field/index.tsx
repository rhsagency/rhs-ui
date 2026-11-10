"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { InputGroup, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { trackPress, whenReleased } from "@rhs-ui/primitives/shorthand-number-field/blur-guard";
import { DEFAULT_LABELS, formatFull, readShorthand, write, type ShorthandDisplay, type ShorthandLabels } from "@rhs-ui/primitives/shorthand-number-field/shorthand";
import { cn } from "@/lib/utils";

export type { ShorthandDisplay, ShorthandLabels } from "@rhs-ui/primitives/shorthand-number-field/shorthand";

export interface ShorthandNumberFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "name" | "role" | "inputMode" | "children"> {
  /** The number, when you control it. Null while the field is empty. */
  value?: number | null;
  /** The number to start with, when you do not control it. */
  defaultValue?: number | null;
  /**
   * Called with a plain number when the field is committed (Enter, or leaving it), and with null when it was emptied or could not be read.
   * `valid` is true when there is a number inside `min` and `max`; one outside them is still reported, so a form can say why.
   */
  onValueChange?: (value: number | null, state: { valid: boolean }) => void;
  /** The locale that writes the figures and decides the decimal sign. Default "en-US". */
  locale?: string;
  /** The lowest number allowed. */
  min?: number;
  /** The highest number allowed. */
  max?: number;
  /** A word after the number: "followers", "EUR". It sits in the field, is ignored if typed again, and is said with the figure. */
  unit?: string;
  /** How the number is written when the field is left: "full" with grouping (1,200) or "compact" short with a letter (1.2K). Default "full". */
  display?: ShorthandDisplay;
  /** The field's name for a plain form submit: the number with a point as the decimal sign, or empty. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<ShorthandLabels>;
}

const EXAMPLES = "250k, 1.2M, 3b or 2 million";
// The group's own focus border would win over the red one while the cursor is still in a field that is wrong, so the red is asked for in the focused state too.
const WRONG = "border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/30";

/**
 * A number field that reads shorthand. Type 250k, 1.2M, 3b or "2 million" and
 * the full figure is written under the field as you go, so the zeros are never
 * counted by eye. The decimal sign is the locale's and the other one is
 * understood too (1,2k and 1.2k both mean 1200, while 1,200 is twelve hundred),
 * a currency sign in front or the field's unit behind is ignored, and the
 * sums run on the digits, so 1.1k is exactly 1100. The number is committed with
 * Enter or when the field is left, where the text is rewritten the way
 * `display` says; Escape puts back the last number. What cannot be read, or is
 * outside `min` and `max`, is explained in words and not only refused. It suits
 * targets, budgets and audience sizes, where typing a row of zeros is how
 * mistakes happen.
 */
export function ShorthandNumberField({
  value,
  defaultValue = null,
  onValueChange,
  locale = "en-US",
  min,
  max,
  unit = "",
  display = "full",
  name,
  labels: labelOverrides,
  form,
  disabled,
  placeholder = "e.g. 250k",
  className,
  onBlur,
  onKeyDown,
  ref,
  "aria-describedby": describedBy,
  ...props
}: ShorthandNumberFieldProps) {
  const base = useId();
  const noteId = `${base}-note`;
  const labels: ShorthandLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value === undefined ? own : value;
  const [draft, setDraft] = useState(() => (current === null ? "" : write(current, display, locale)));
  const [synced, setSynced] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement | null>(null);
  const reported = useRef<number | null | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // A number that arrives from outside replaces what is typed; an echo of what was just reported changes nothing.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== reported.current) {
      setDraft(value === null ? "" : write(value, display, locale));
      setError(null);
    }
  }

  useEffect(trackPress, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const clear = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(clear);
  }, [said]);

  const withUnit = (figure: string) => (unit ? `${figure} ${unit}` : figure);

  /** What is wrong with this number, in words, or null. */
  function problemOf(number: number): string | null {
    if (min !== undefined && number < min) return labels.atLeast(withUnit(formatFull(min, locale)));
    if (max !== undefined && number > max) return labels.atMost(withUnit(formatFull(max, locale)));
    return null;
  }

  function report(number: number | null, valid: boolean) {
    reported.current = number;
    if (value === undefined) setOwn(number);
    onValueChange?.(number, { valid });
  }

  const reading = readShorthand(draft, locale, unit);
  const figure = reading.kind === "number" ? formatFull(reading.value, locale) : null;
  // The figure under the field is for shorthand; a text that already is the figure needs no echo.
  const echo = figure !== null && figure !== draft.trim();

  function change(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    setDraft(text);
    window.clearTimeout(timer.current);
    setSaid("");
    // A message that is already showing follows the typing and goes as soon as the text is right. A new one waits for the field to be left.
    setError((now) => {
      if (now === null) return null;
      const next = readShorthand(text, locale, unit);
      return next.kind === "unreadable" ? labels.unreadable(EXAMPLES) : next.kind === "number" ? problemOf(next.value) : null;
    });
    const next = readShorthand(text, locale, unit);
    if (next.kind === "number") {
      const spoken = labels.said(formatFull(next.value, locale), unit);
      timer.current = window.setTimeout(() => setSaid(spoken), 700);
    }
  }

  /** The number is settled: written the way `display` says, reported once, and any problem said in words. */
  function commit() {
    window.clearTimeout(timer.current);
    const settled = readShorthand(draft, locale, unit);
    if (settled.kind === "empty") {
      setDraft("");
      if (current !== null) report(null, false);
      whenReleased(() => setError(null));
      return;
    }
    if (settled.kind === "unreadable") {
      if (current !== null) report(null, false);
      whenReleased(() => setError(labels.unreadable(EXAMPLES)));
      return;
    }
    const problem = problemOf(settled.value);
    setDraft(write(settled.value, display, locale));
    if (settled.value !== current || problem !== null) report(settled.value, problem === null);
    whenReleased(() => {
      setError(problem);
      if (problem) setSaid(problem);
    });
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    commit();
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.key === "Enter") commit();
    else if (event.key === "Escape") {
      // Back to the last number, as when the field was entered.
      event.preventDefault();
      setDraft(current === null ? "" : write(current, display, locale));
      setError(null);
    }
  }

  // The empty space in the field is part of the field: a click there puts the cursor in the number.
  function focusNumber(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== input.current) input.current?.focus();
  }

  const invalid = error !== null;

  return (
    <div data-slot="shorthand-number-field" role={disabled ? "group" : undefined} aria-disabled={disabled || undefined} className={cn("grid w-full min-w-0 grid-cols-1", className)}>
      <InputGroup onClick={focusNumber} className={cn("cursor-text", invalid && WRONG)}>
        <InputGroupInput
          ref={attach}
          type="text"
          inputMode="text"
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          form={form}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
          aria-label={props.id === undefined && props["aria-label"] === undefined && props["aria-labelledby"] === undefined ? labels.name : props["aria-label"]}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, noteId].filter(Boolean).join(" ")}
          value={draft}
          onChange={change}
          onBlur={leave}
          onKeyDown={keyDown}
          className="tabular-nums"
        />
        {unit ? (
          <span aria-hidden="true" className="flex h-full shrink-0 items-center rounded-r-[inherit] border-l border-border bg-muted/50 px-3 text-[0.8125rem] font-medium text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </InputGroup>
      <div id={noteId} className="mt-1.5 min-h-5 text-xs">
        <div aria-live="polite">
          {error ? (
            <p className="flex items-start gap-1.5 text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>
        {error ? null : echo ? (
          <p className={cn("text-muted-foreground tabular-nums", disabled && "opacity-50")}>
            <span aria-hidden="true">= </span>
            <span className="font-medium text-foreground">{figure}</span>
            {unit ? ` ${unit}` : ""}
          </p>
        ) : (
          <p className={cn("text-muted-foreground", disabled && "opacity-50")}>{labels.hint}</p>
        )}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} form={form} value={current === null ? "" : String(current)} disabled={disabled} /> : null}
    </div>
  );
}
