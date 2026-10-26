"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { trackPress, whenReleased } from "@rhs-ui/primitives/percentage-field/blur-guard";
import {
  clamp,
  DEFAULT_LABELS,
  formatPercent,
  formatWithCode,
  parsePercent,
  percentOf,
  roundTo,
  tidyTyping,
  type PercentageLabels,
} from "@rhs-ui/primitives/percentage-field/percentages";
import { cn } from "@/lib/utils";

export type { PercentageLabels } from "@rhs-ui/primitives/percentage-field/percentages";

export interface PercentageFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "name" | "role" | "inputMode" | "children"> {
  /** The percentage, when you control it: 12.5 is twelve and a half percent. Null while the field is empty. */
  value?: number | null;
  /** The percentage to start with, when you do not control it. */
  defaultValue?: number | null;
  /** Called with the number, brought into range and rounded to `precision`, whenever it changes, and with null when the field is emptied. */
  onValueChange?: (value: number | null) => void;
  /** The lowest percentage. Default 0. */
  min?: number;
  /** The highest percentage. Default 100. */
  max?: number;
  /** How much an arrow key adds or takes away; with Shift it is ten times as much. Default 1. */
  step?: number;
  /** How many decimals are kept. Default 2. */
  precision?: number;
  /** The amount the percentage is of, in minor units: 48000 is 480.00. With `currency` it is worked out under the field. */
  base?: number;
  /** The ISO code of `base` ("EUR"). */
  currency?: string;
  /** The locale that writes the numbers and decides the decimal sign. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit: the number with a point as the decimal sign, or empty. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<PercentageLabels>;
}

/**
 * A percentage you can type or nudge. It takes "12,5", "12.5" and "12.5%" alike,
 * keeps the number between `min` and `max` (0 and 100 unless you say otherwise)
 * and rounds it to `precision` decimals. The arrow keys step it, Shift makes the
 * step ten times as big, Ctrl or Cmd with Home and End go to the limits (Home and
 * End themselves move the caret, as in any field). A number that was out of
 * range is brought in when the field is left, and a quiet line says so. Give it a
 * `base` and a `currency` and it writes what the percentage comes to under the
 * field ("20% of 480.00 EUR is 96.00 EUR"), as it changes; a screen reader hears
 * the sentence once the number is settled, not on every key. It suits tax rates,
 * commissions, discounts and interest, where a bare number field leaves people
 * guessing the unit.
 */
export function PercentageField({
  value,
  defaultValue = null,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  precision = 2,
  base,
  currency,
  locale = "en-US",
  name,
  labels: labelOverrides,
  form,
  disabled,
  placeholder = "0",
  className,
  onBlur,
  onKeyDown,
  ref,
  "aria-describedby": describedBy,
  ...props
}: PercentageFieldProps) {
  const id = useId();
  const resultId = `${id}-result`;
  const noteId = `${id}-note`;
  const labels: PercentageLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value === undefined ? own : value;
  const [draft, setDraft] = useState(() => (current === null ? "" : formatPercent(current, precision, locale)));
  const [synced, setSynced] = useState(value);
  const [note, setNote] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement | null>(null);
  // The last sentence a screen reader was told, so leaving the field without a change says nothing.
  const announced = useRef<number | null>(current);
  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const settle = (parsed: number | null): number | null => (parsed === null ? null : clamp(roundTo(parsed, precision), min, max));
  const show = (number: number) => formatPercent(number, precision, locale);

  // A number that arrives from outside replaces what is typed, unless it is only what the typing already means.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== settle(parsePercent(draft, precision))) setDraft(value === null ? "" : show(value));
  }

  useEffect(trackPress, []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [said]);

  const hasBase = base !== undefined && currency !== undefined && Number.isFinite(base);
  const baseText = hasBase ? formatWithCode(base, currency, locale) : "";
  const resultFor = (rate: number) => (hasBase ? formatWithCode(percentOf(base, rate, precision), currency, locale) : "");
  const sentence = (rate: number) => labels.result(show(rate), baseText, resultFor(rate));

  function write(next: number | null) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    const text = tidyTyping(event.target.value);
    const next = settle(parsePercent(text, precision));
    setDraft(text);
    setNote(null);
    setSaid("");
    if (next !== current) write(next);
  }

  /** The number is settled: written the locale's way, and said once if it came to something new. */
  function commit() {
    const parsed = parsePercent(draft, precision);
    const next = settle(parsed);
    setDraft(next === null ? "" : show(next));
    if (next !== current) write(next);
    const rounded = parsed === null ? null : roundTo(parsed, precision);
    const brought = next !== null && rounded !== null && rounded !== next ? (rounded > next ? labels.capped(show(next)) : labels.raised(show(next))) : null;
    const spoken = next !== null && hasBase && announced.current !== next ? sentence(next) : null;
    announced.current = next;
    whenReleased(() => {
      setNote(brought);
      const words = [brought, spoken].filter(Boolean).join(" ");
      if (words) setSaid(words);
    });
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    commit();
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const { key } = event;
    let next: number | null | undefined;
    if (key === "ArrowUp" || key === "ArrowDown" || key === "PageUp" || key === "PageDown") {
      const size = step * (event.shiftKey || key.startsWith("Page") ? 10 : 1);
      const from = settle(parsePercent(draft, precision)) ?? 0;
      next = settle(from + (key === "ArrowUp" || key === "PageUp" ? size : -size));
    } else if (key === "Home" && (event.ctrlKey || event.metaKey) && Number.isFinite(min)) next = min;
    else if (key === "End" && (event.ctrlKey || event.metaKey) && Number.isFinite(max)) next = max;
    else if (key === "Enter") commit();
    if (next === undefined) return;
    event.preventDefault();
    setDraft(next === null ? "" : show(next));
    setNote(null);
    setSaid("");
    announced.current = next;
    if (next !== current) write(next);
  }

  // The empty space in the field is part of the field: a click there puts the cursor in the number.
  function focusNumber(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== input.current) input.current?.focus();
  }

  const valueText = current === null ? undefined : `${show(current)} ${labels.unit}${hasBase ? `, ${resultFor(current)}` : ""}`;
  const answer = current !== null && hasBase ? resultFor(current) : "";
  const line = current !== null && hasBase ? sentence(current) : "";
  const at = answer ? line.lastIndexOf(answer) : -1;

  return (
    <div data-slot="percentage-field" className={cn("grid w-full min-w-0 grid-cols-1", className)}>
      <InputGroup onClick={focusNumber} className="cursor-text">
        <InputGroupInput
          ref={attach}
          type="text"
          role="spinbutton"
          // The number pads have no minus: where the lowest percentage is below zero the full keyboard is the only way to type one.
          inputMode={min < 0 ? "text" : "decimal"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          form={form}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
          aria-label={props.id === undefined && props["aria-label"] === undefined && props["aria-labelledby"] === undefined ? labels.name : props["aria-label"]}
          value={draft}
          onChange={change}
          onBlur={leave}
          onKeyDown={keyDown}
          aria-valuenow={current ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-valuetext={valueText}
          aria-describedby={[describedBy, hasBase ? resultId : "", note ? noteId : ""].filter(Boolean).join(" ") || undefined}
          // Where the browser can size a field to its text, the percent sign sits right behind the number; elsewhere the field fills the row and the sign is at its end.
          className="pr-1 tabular-nums supports-[field-sizing:content]:field-sizing-content supports-[field-sizing:content]:flex-none"
        />
        <InputGroupAddon aria-hidden="true" className="pr-3 pl-0 text-foreground/70">
          %
        </InputGroupAddon>
      </InputGroup>
      {hasBase ? (
        <p id={resultId} className={cn("mt-1.5 text-xs text-muted-foreground tabular-nums", disabled && "opacity-50")}>
          {current === null ? (
            labels.prompt(baseText)
          ) : at === -1 ? (
            line
          ) : (
            <>
              {line.slice(0, at)}
              <span className="font-medium text-foreground">{answer}</span>
              {line.slice(at + answer.length)}
            </>
          )}
        </p>
      ) : null}
      {note ? (
        <p id={noteId} className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {note}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} form={form} value={current === null ? "" : String(current)} disabled={disabled} /> : null}
    </div>
  );
}
