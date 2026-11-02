"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";

import { IconAlertCircle, IconClock } from "@rhs-ui/icons";
import { trackPress, whenReleased } from "@rhs-ui/primitives/time-estimate-field/blur-guard";
import {
  DEFAULT_LABELS,
  listUnits,
  readEstimate,
  UNIT_ORDER,
  writeHours,
  writeLong,
  writeShort,
  type EstimateLabels,
  type EstimateReading,
  type EstimateRules,
  type EstimateUnit,
} from "@rhs-ui/primitives/time-estimate-field/estimates";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

export type { EstimateLabels, EstimateUnit } from "@rhs-ui/primitives/time-estimate-field/estimates";

export interface TimeEstimateFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "name" | "role" | "inputMode" | "children"> {
  /** The estimate in minutes, when you control it. Null while the field is empty. */
  value?: number | null;
  /** The estimate to start with, in minutes, when you do not control it. */
  defaultValue?: number | null;
  /**
   * Called with the estimate in minutes when the text is committed (Enter, or leaving the field), and with null when it was emptied or could not be read.
   * `valid` is true when there is a length inside `max`; one over it is still reported, so a form can say why.
   */
  onValueChange?: (minutes: number | null, state: { valid: boolean }) => void;
  /** How many hours a working day has: 1d is this many hours. Default 8. */
  hoursPerDay?: number;
  /** How many days a working week has: 1w is this many days. Default 5. */
  daysPerWeek?: number;
  /** The longest estimate allowed, in minutes. */
  max?: number;
  /** The units that may be typed and are written back: "w" for weeks, "d" for days, "h" and "m". Default all four. */
  units?: readonly EstimateUnit[];
  /** The field's name for a plain form submit: the estimate as whole minutes, or empty. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<EstimateLabels>;
}

// The group's own focus border would win over the red one while the cursor is still in a field that is wrong, so the red is asked for in the focused state too.
const WRONG = "border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/30";

/**
 * A duration you can type the way task trackers take it. "1h 30m", "90m",
 * "1.5h", "2:30" and "1d 2h" all work, and the length it was understood as is
 * written under the field ("1 h 30 min") before anything is committed, so a
 * wrong guess is seen while it is still cheap. A day is a working day (8 hours
 * unless `hoursPerDay` says otherwise) and a week a working week, and the line
 * says what the day was taken to be when one is used. Enter, or leaving the
 * field, rewrites the text in one form ("1h 30m"); Escape puts back the last
 * estimate. What cannot be read is answered with forms that would work, a unit
 * the field does not use is named, and a length over `max` is explained. It
 * reports minutes. One fast field where Duration input uses several number
 * boxes.
 */
export function TimeEstimateField({
  value,
  defaultValue = null,
  onValueChange,
  hoursPerDay = 8,
  daysPerWeek = 5,
  max,
  units = UNIT_ORDER,
  name,
  labels: labelOverrides,
  form,
  disabled,
  placeholder = "1h 30m",
  className,
  onBlur,
  onKeyDown,
  ref,
  "aria-describedby": describedBy,
  ...props
}: TimeEstimateFieldProps) {
  const base = useId();
  const noteId = `${base}-note`;
  const labels: EstimateLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const rules: EstimateRules = { hoursPerDay, daysPerWeek, units };
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value === undefined ? own : value;
  const [draft, setDraft] = useState(() => (current === null ? "" : writeShort(current, rules)));
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

  // An estimate that arrives from outside replaces what is typed; an echo of what was just reported changes nothing.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== reported.current) {
      setDraft(value === null ? "" : writeShort(value, rules));
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

  /** What is wrong with this reading, in words, or null. An empty field is not wrong: a form says what is required. */
  function problemOf(reading: EstimateReading): string | null {
    if (reading.kind === "format") return labels.unreadable(labels.examples);
    if (reading.kind === "unit") return labels.unusedUnit(labels.long[reading.unit], listUnits(rules, labels));
    if (reading.kind === "ok" && max !== undefined && reading.minutes > max) return labels.atMost(writeLong(max, rules, labels));
    return null;
  }

  function report(minutes: number | null, valid: boolean) {
    reported.current = minutes;
    if (value === undefined) setOwn(minutes);
    onValueChange?.(minutes, { valid });
  }

  const reading = readEstimate(draft, rules);
  const understood = reading.kind === "ok" ? reading : null;
  const days = understood?.units.some((unit) => unit === "d" || unit === "w") ?? false;

  function change(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    setDraft(text);
    window.clearTimeout(timer.current);
    setSaid("");
    // A message that is already showing follows the typing and goes as soon as the text is right. A new one waits for the field to be left.
    setError((showing) => (showing === null ? null : problemOf(readEstimate(text, rules))));
    const next = readEstimate(text, rules);
    if (next.kind === "ok") {
      const spoken = labels.said(writeLong(next.minutes, rules, labels));
      timer.current = window.setTimeout(() => setSaid(spoken), 700);
    }
  }

  /** The estimate is settled: written in one form, reported once, and any problem said in words. */
  function commit() {
    window.clearTimeout(timer.current);
    const settled = readEstimate(draft, rules);
    if (settled.kind === "empty") {
      setDraft("");
      if (current !== null) report(null, false);
      whenReleased(() => setError(null));
      return;
    }
    const problem = problemOf(settled);
    if (settled.kind !== "ok") {
      if (current !== null) report(null, false);
      whenReleased(() => setError(problem));
      return;
    }
    setDraft(writeShort(settled.minutes, rules));
    if (settled.minutes !== current || problem !== null) report(settled.minutes, problem === null);
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
      // Back to the last estimate, as when the field was entered.
      event.preventDefault();
      setDraft(current === null ? "" : writeShort(current, rules));
      setError(null);
    }
  }

  // The empty space in the field is part of the field: a click there puts the cursor in the text.
  function focusText(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== input.current) input.current?.focus();
  }

  const invalid = error !== null;

  return (
    <div data-slot="time-estimate-field" className={cn("grid w-full min-w-0 grid-cols-1", className)}>
      <InputGroup onClick={focusText} className={cn("cursor-text", invalid && WRONG)}>
        <InputGroupAddon aria-hidden="true" className="pr-0">
          <IconClock />
        </InputGroupAddon>
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
          className="pl-2 tabular-nums"
        />
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
        {error ? null : understood ? (
          <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-muted-foreground tabular-nums", disabled && "opacity-50")}>
            <span className="font-medium text-foreground">{writeLong(understood.minutes, rules, labels)}</span>
            {days && units.includes("h") ? (
              <span>
                {writeHours(understood.minutes, labels)}, {labels.day(`${hoursPerDay} ${labels.short.h}`)}
              </span>
            ) : null}
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
