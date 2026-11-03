"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";

import { IconRepeat } from "@rhs-ui/icons";
import { DEFAULT_LABELS, kindOf, labelOf, REPEAT_KINDS, repeatOptions, ruleFor, type RepeatKind, type RepeatLabels, type RepeatMatch } from "@rhs-ui/primitives/repeat-select/rules";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export type { RepeatKind, RepeatLabels } from "@rhs-ui/primitives/repeat-select/rules";

export interface RepeatSelectProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The day the event or task starts, as an ISO date ("2026-10-27"). The weekday, the day of the month and the month in the labels all come from it. */
  start: string;
  /** The recurrence rule, as a calendar file writes it ("RRULE:FREQ=WEEKLY;BYDAY=TU"), or null for no repeat. Use it to control the field. */
  value?: string | null;
  /** The rule to start with, when you do not control the field. The field shows its placeholder while there is none. */
  defaultValue?: string | null;
  /** Called with the new rule, or null for no repeat. It is also called when a change of `start` moves the rule to the new date. */
  onValueChange?: (rule: string | null) => void;
  /** The language the weekdays, months and dates are written in. Default "en-US". */
  locale?: string;
  /** Which choices to offer: any of "none", "daily", "weekly", "monthly", "yearly" and "weekdays". They always keep that order. Default all six. */
  include?: readonly RepeatKind[];
  /** Adds a Custom choice that calls this with the current rule instead of choosing anything: open your own editor there. */
  onCustom?: (rule: string | null) => void;
  /** The words of the field, for another language or your own voice. */
  labels?: Partial<RepeatLabels>;
  /** The field's name for a plain form submit: the rule, or an empty value for no repeat. */
  name?: string;
  /** The id of the select, so a form label's `htmlFor` can point at it. */
  id?: string;
  /** The name of the field for a screen reader, when there is no visible label. Without it, and without an `id` for a label to point at, the field is called "Repeat". */
  "aria-label"?: string;
  /** The id of the element that names the field. */
  "aria-labelledby"?: string;
  /** Marks the field as not accepted. */
  "aria-invalid"?: boolean | "true" | "false";
  /** Turn the field off. */
  disabled?: boolean;
}

/**
 * The choice of how an event or a task repeats, with labels worked out from
 * its start date: "Every week on Tuesday", "Every month on the 27th" (or "on
 * the last Tuesday" in the last week of a month), "Every year on 27 October",
 * "Every weekday (Monday to Friday)". Weekdays, months and dates come from Intl
 * in the reader's language. The value is the rule itself, in the form a
 * calendar file takes, so it can go straight into one. When the start date
 * moves, the rule moves with it: the labels and the stored rule change
 * together, the change is reported through `onValueChange`, and it is
 * announced. A Custom choice hands over to your own editor, and a rule that
 * none of the choices describes (every other week, a count) shows as Custom.
 */
export function RepeatSelect({
  start,
  value,
  defaultValue,
  onValueChange,
  locale = "en-US",
  include = REPEAT_KINDS,
  onCustom,
  labels,
  name,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-invalid": invalid,
  disabled,
  className,
  ...rest
}: RepeatSelectProps) {
  const text: RepeatLabels = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const [own, setOwn] = useState<string | null | undefined>(defaultValue);
  // The start the rule was last made for. When `start` moves, the rule is carried from here to the new date.
  const [madeFor, setMadeFor] = useState(start);
  const [said, setSaid] = useState("");
  const current = value !== undefined ? value : own;
  const options = repeatOptions(start, locale, text, include);

  // What the rule is, for the date it is on. While the parent has not yet passed on the moved rule, it is read against the date it was made for, so the label already follows the date.
  const found: RepeatMatch | null = current === undefined ? null : kindOf(current, start);
  const carried: RepeatMatch | null = found === "custom" && current !== undefined && madeFor !== start ? kindOf(current, madeFor) : null;
  const match: RepeatMatch | null = carried && carried !== "custom" && carried !== "none" ? carried : found;
  const listed = match !== null && match !== "custom" && options.some((option) => option.kind === match);
  const key = match === null ? "" : listed ? match : match === "custom" || (match !== "none" && current !== null) ? "custom" : "";

  function commit(next: string | null) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  // A moved start date carries the rule with it, and says so.
  useEffect(() => {
    if (madeFor === start) return;
    const before = current === undefined ? null : kindOf(current, madeFor);
    setMadeFor(start);
    if (before === null || before === "none" || before === "custom") return;
    const next = ruleFor(before, start);
    if (next === current) return;
    commit(next);
    setSaid(text.updated(labelOf(before, start, locale, text)));
    // Said once: left in the live region it would be read again with the next message.
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [start]);

  function choose(next: string) {
    if (next === "edit") {
      onCustom?.(current ?? null);
      return;
    }
    if (next === "custom") return;
    const kind = next as RepeatKind;
    setMadeFor(start);
    setSaid("");
    commit(ruleFor(kind, start));
  }

  return (
    <div data-slot="repeat-select" className={cn("w-full min-w-0", className)} {...rest}>
      <Select value={key} onValueChange={choose} disabled={disabled}>
        <SelectTrigger
          id={id ?? `${base}-trigger`}
          // With an id there is a <label htmlFor> outside, and its text is the name; without one the field names itself.
          aria-label={labelledBy ? undefined : (ariaLabel ?? (id ? undefined : text.field))}
          aria-labelledby={labelledBy}
          aria-invalid={invalid === true || invalid === "true" || undefined}
        >
          <span className="flex min-w-0 items-center gap-2">
            <IconRepeat aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <SelectValue placeholder={text.placeholder} className="truncate" />
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.kind} value={option.kind}>
              {option.label}
            </SelectItem>
          ))}
          {key === "custom" || onCustom ? <SelectSeparator /> : null}
          {key === "custom" ? (
            <SelectItem value="custom" description={<span className="font-mono text-[0.6875rem] break-all">{current?.replace(/^RRULE:/i, "")}</span>}>
              {text.customRule}
            </SelectItem>
          ) : null}
          {onCustom ? <SelectItem value="edit">{text.custom}</SelectItem> : null}
        </SelectContent>
      </Select>
      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <span role="status" aria-live="polite" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} value={current ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
