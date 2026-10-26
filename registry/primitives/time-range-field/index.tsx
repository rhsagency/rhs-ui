"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type RefObject } from "react";

import { IconAlertCircle, IconArrowRight, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { InputGroup, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { trackPress, whenReleased } from "@rhs-ui/primitives/time-range-field/blur-guard";
import { buildSlots, checkRange, DEFAULT_LABELS, endKeepingLength, parseTime, rangeOf, stepTime, toMinutes, type RangeRules, type TimeRangeLabels, type TimeRangeValue } from "@rhs-ui/primitives/time-range-field/ranges";
import { cn } from "@/lib/utils";

export type { TimeRangeLabels, TimeRangeValue } from "@rhs-ui/primitives/time-range-field/ranges";

export interface TimeRangeFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "role"> {
  /** Goes on the start input, so a label's `htmlFor` focuses the field. The end input gets the same id with `-end` after it. Name the group with `aria-labelledby`. */
  id?: string;
  /** The range, when you control it. Null while it is incomplete or not allowed. */
  value?: TimeRangeValue | null;
  /** The range to start with, when you do not control it. Either time may be left out. */
  defaultValue?: { start?: string; end?: string } | null;
  /** Called with the range once both times are set and the range is allowed, and with null whenever it is not. */
  onValueChange?: (value: TimeRangeValue | null) => void;
  /** Minutes between the times in the list, and how far an arrow key moves a time. Default 15. */
  step?: number;
  /** The earliest time, "HH:MM". Default "00:00". */
  min?: string;
  /** The latest time, "HH:MM". Default "23:59". */
  max?: string;
  /** Let the end be earlier than the start: it is then on the next day, and the field says "+1 day" after the length. Default false. */
  allowOvernight?: boolean;
  /** When the start changes, move the end by the same amount, the way a calendar does. Default false. */
  keepDuration?: boolean;
  /** The field's name for a plain form submit: `<name>-start` and `<name>-end`, each "HH:MM" or empty. */
  name?: string;
  /** Dim the field and stop it responding. */
  disabled?: boolean;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<TimeRangeLabels>;
}

interface Slot {
  time: string;
  /** A quiet word after the time: how long the range would be. */
  hint?: string;
  disabled?: boolean;
}

interface Problem {
  field: "start" | "end";
  text: string;
}

interface TimeBoxProps {
  id?: string;
  label: string;
  pickLabel: string;
  text: string;
  /** The time the text stands for, when it is a time. */
  selected: string | null;
  /** The slot to bring into view when nothing is chosen yet. */
  around: string;
  invalid: boolean;
  describedBy: string | undefined;
  disabled: boolean | undefined;
  inputRef: RefObject<HTMLInputElement | null>;
  slots: () => Slot[];
  onText: (text: string) => void;
  onCommit: () => void;
  onStep: (direction: 1 | -1) => void;
  onPick: (time: string) => void;
}

function TimeBox({ id, label, pickLabel, text, selected, around, invalid, describedBy, disabled, inputRef, slots, onText, onCommit, onStep, onPick }: TimeBoxProps) {
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  // A time that was just chosen hands the focus back to the field; a list that was dismissed gives it to its button.
  const chose = useRef(false);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const root = list.current;
      if (!root) return;
      const target = root.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? root.querySelector<HTMLButtonElement>(`[data-time="${around}"]:not(:disabled)`) ?? root.querySelector<HTMLButtonElement>("button:not(:disabled)");
      if (!target) return;
      // Scroll the list itself, never the page behind it.
      root.scrollTop = target.offsetTop - root.clientHeight / 2 + target.offsetHeight / 2;
      target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, around]);

  function moveInList(event: KeyboardEvent<HTMLUListElement>) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
    buttons[next]?.focus();
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" && event.altKey) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onStep(event.key === "ArrowUp" ? 1 : -1);
    } else if (event.key === "Enter") onCommit();
  }

  const rows = open ? slots() : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup className="w-auto max-w-36 flex-1 basis-0">
          <InputGroupInput
            ref={inputRef}
            id={id}
            type="text"
            // A time is typed with digits, a colon and, for 2:30 pm, letters: the number pads have no colon and no letters.
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            aria-label={label}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            placeholder="--:--"
            value={text}
            onChange={(event) => onText(event.target.value)}
            onBlur={onCommit}
            onKeyDown={keyDown}
            // Less padding than the other inputs, so a five-character time still fits in a box on a 320px phone.
            className="w-0 pr-0.5 pl-2.5 tabular-nums"
          />
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label={pickLabel} className="mr-1 size-7 shrink-0 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
              <IconClock />
            </Button>
          </PopoverTrigger>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        aria-label={label}
        className="w-52 max-w-[calc(100vw-2rem)] p-1"
        onCloseAutoFocus={(event) => {
          if (chose.current) {
            event.preventDefault();
            inputRef.current?.focus();
          }
          chose.current = false;
        }}
      >
        <ul ref={list} role="listbox" aria-label={label} onKeyDown={moveInList} className="relative max-h-64 overflow-y-auto">
          {rows.map((slot) => (
            <li key={slot.time} role="presentation">
              <button
                type="button"
                role="option"
                data-time={slot.time}
                aria-selected={slot.time === selected}
                disabled={slot.disabled}
                onClick={() => {
                  chose.current = true;
                  setOpen(false);
                  onPick(slot.time);
                }}
                className="group/slot flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm tabular-nums outline-none hover:bg-muted focus-visible:bg-muted aria-selected:bg-foreground aria-selected:text-background disabled:pointer-events-none disabled:text-muted-foreground/50"
              >
                {slot.time}
                {slot.hint ? <span className="text-xs text-muted-foreground group-aria-selected/slot:text-background/70">{slot.hint}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const same = (a: TimeRangeValue | null, b: TimeRangeValue | null) => (a === null || b === null ? a === b : a.start === b.start && a.end === b.end && a.minutes === b.minutes);

/**
 * A start and an end time with the length between them: "09:00 to 11:30,
 * 2 h 30 min". Each end takes a typed time ("9", "930", "2:30 pm" all work) or
 * a pick from the list the Time picker offers, and the arrow keys move it by
 * `step` minutes. The end list says how long each choice would make the range.
 * An end that comes before the start is refused with the reason in words and
 * `aria-invalid` on the end, unless `allowOvernight` lets it fall on the next
 * day, which the field then marks with "+1 day" after the length. With
 * `keepDuration`, moving the start moves the end along with it, as calendar
 * apps do. It reports `{ start, end, minutes }` once the range is complete and
 * allowed.
 */
export function TimeRangeField({
  value,
  defaultValue = null,
  onValueChange,
  step = 15,
  min = "00:00",
  max = "23:59",
  allowOvernight = false,
  keepDuration = false,
  name,
  disabled,
  labels: labelOverrides,
  className,
  id: inputId,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...props
}: TimeRangeFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const lengthId = `${id}-length`;
  const labels: TimeRangeLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const rules: RangeRules = { min, max, allowOvernight };
  const initial = value === undefined ? defaultValue : value;
  const [drafts, setDrafts] = useState({ start: initial?.start ?? "", end: initial?.end ?? "" });
  // The times the drafts stand for, when they are times: what the range is worked out from.
  const [committed, setCommitted] = useState<{ start: string | null; end: string | null }>({ start: parseTime(initial?.start ?? ""), end: parseTime(initial?.end ?? "") });
  const [synced, setSynced] = useState(value);
  const [reported, setReported] = useState<TimeRangeValue | null>(() => rangeOf(parseTime(initial?.start ?? ""), parseTime(initial?.end ?? ""), rules).value);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [said, setSaid] = useState("");
  const startInput = useRef<HTMLInputElement | null>(null);
  const endInput = useRef<HTMLInputElement | null>(null);

  // A range that arrives from outside replaces what is typed, unless it is only what the typing already means.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (!same(value, reported)) {
      setReported(value);
      setDrafts({ start: value?.start ?? "", end: value?.end ?? "" });
      setCommitted({ start: parseTime(value?.start ?? ""), end: parseTime(value?.end ?? "") });
      setProblem(null);
    }
  }

  useEffect(trackPress, []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [said]);

  /** What is wrong with these two texts, in words and in which field, or null. */
  function problemOf(texts: { start: string; end: string }): Problem | null {
    const example = "09:30";
    const start = parseTime(texts.start);
    const end = parseTime(texts.end);
    if (texts.start.trim() && start === null) return { field: "start", text: labels.notATime(example) };
    if (texts.end.trim() && end === null) return { field: "end", text: labels.notATime(example) };
    const found = checkRange(start, end, rules).problem;
    if (!found) return null;
    const words = found.kind === "outside" ? labels.outside(min, max) : found.kind === "order" ? labels.endBeforeStart(start ?? "") : labels.sameTime;
    return { field: found.field, text: words };
  }

  function report(next: TimeRangeValue | null) {
    if (same(next, reported)) return;
    setReported(next);
    onValueChange?.(next);
  }

  /** A time was typed and left, picked from the list or stepped: settle it, move the end along if asked, say what the range is now. */
  function apply(which: "start" | "end", text: string) {
    const time = parseTime(text);
    const next = { ...committed, [which]: time };
    const texts = { ...drafts, [which]: time ?? text };
    let moved: string | null = null;
    if (which === "start" && keepDuration && time !== null && committed.start !== null && committed.end !== null && time !== committed.start) {
      const kept = endKeepingLength(committed.start, committed.end, time, rules);
      if (kept !== committed.end) {
        next.end = kept;
        texts.end = kept;
        moved = kept;
      }
    }
    setDrafts(texts);
    setCommitted(next);
    const { value: range, overnight } = rangeOf(next.start, next.end, rules);
    const issue = problemOf(texts);
    whenReleased(() => setProblem(issue));
    if (range && !same(range, reported)) {
      const kept = moved ? `${labels.moved(moved, labels.duration(range.minutes))} ` : "";
      setSaid(`${kept}${labels.spoken(range.start, range.end, range.minutes, overnight)}`);
    }
    report(range);
  }

  function type(which: "start" | "end", text: string) {
    const texts = { ...drafts, [which]: text };
    setDrafts(texts);
    // A message that is already showing follows the typing and goes as soon as the times are right. A new one waits for the field to be left.
    setProblem((now) => (now === null ? null : problemOf(texts)));
  }

  function stepBy(which: "start" | "end", direction: 1 | -1) {
    apply(which, stepTime(parseTime(drafts[which]), direction, step, min, max));
  }

  const check = checkRange(committed.start, committed.end, rules);
  const startAt = committed.start === null ? null : toMinutes(committed.start);
  const endSlots = (): Slot[] =>
    buildSlots(min, max, step).map((time) => {
      if (startAt === null) return { time };
      const at = toMinutes(time);
      if (at === startAt) return { time, disabled: true };
      if (at < startAt) return allowOvernight ? { time, hint: `${labels.duration(at + 1440 - startAt)} ${labels.nextDay}` } : { time, disabled: true };
      return { time, hint: labels.duration(at - startAt) };
    });
  const startAround = buildSlots(min, max, step).find((time) => toMinutes(time) >= 9 * 60) ?? min;
  const endAround = committed.start === null ? startAround : (buildSlots(min, max, step).find((time) => toMinutes(time) >= (startAt ?? 0) + 60) ?? max);
  const described = [problem ? messageId : "", check.minutes !== null ? lengthId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div
      data-slot="time-range-field"
      role="group"
      aria-disabled={disabled || undefined}
      aria-label={labelledBy ? undefined : (ariaLabel ?? labels.group)}
      aria-labelledby={labelledBy}
      className={cn("grid w-full min-w-0 grid-cols-1 gap-2", className)}
      {...props}
    >
      <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2">
        {/* The two times and the arrow stay together and share a narrow row; only the length drops below them. */}
        <div className="flex min-w-0 basis-[20.25rem] items-center gap-2.5">
          <TimeBox
            id={inputId}
            label={labels.start}
            pickLabel={labels.pickStart}
            text={drafts.start}
            selected={committed.start}
            around={startAround}
            invalid={problem?.field === "start"}
            describedBy={problem?.field === "start" ? messageId : undefined}
            disabled={disabled}
            inputRef={startInput}
            slots={() => buildSlots(min, max, step).map((time) => ({ time }))}
            onText={(text) => type("start", text)}
            onCommit={() => apply("start", drafts.start)}
            onStep={(direction) => stepBy("start", direction)}
            onPick={(time) => apply("start", time)}
          />
          <IconArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <TimeBox
            id={inputId ? `${inputId}-end` : undefined}
            label={labels.end}
            pickLabel={labels.pickEnd}
            text={drafts.end}
            selected={committed.end}
            around={endAround}
            invalid={problem?.field === "end"}
            describedBy={described}
            disabled={disabled}
            inputRef={endInput}
            slots={endSlots}
            onText={(text) => type("end", text)}
            onCommit={() => apply("end", drafts.end)}
            onStep={(direction) => stepBy("end", direction)}
            onPick={(time) => apply("end", time)}
          />
        </div>
        {check.minutes !== null ? (
          <span id={lengthId} className={cn("inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground tabular-nums", disabled && "opacity-50")}>
            {/* The night is said with the length, as the list of times says it, so the end time itself is never squeezed by a label. */}
            {labels.duration(check.minutes)}
            {check.overnight ? ` ${labels.nextDay}` : ""}
          </span>
        ) : null}
      </div>
      <div id={messageId} aria-live="polite">
        {problem ? (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {problem.text}
          </p>
        ) : null}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? (
        <>
          <input type="hidden" name={`${name}-start`} value={committed.start ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-end`} value={committed.end ?? ""} disabled={disabled} />
        </>
      ) : null}
    </div>
  );
}
