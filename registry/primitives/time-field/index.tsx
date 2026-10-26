"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";

import { IconAlertCircle, IconClock } from "@rhs-ui/icons";
import { InputGroup } from "@rhs-ui/primitives/input-group";
import { asciiDigits, explainTime, fromTwelve, padNumber, parseTime, periodForKey, stepHour, stepMinute, timeLayout, toTime, toTwelve, usesTwelveHour, type Period, type TimeNumbers, type TimeSegment } from "@rhs-ui/primitives/time-field/times";
import { cn } from "@/lib/utils";

/** The words the field says to a screen reader, for another language or your own voice. */
export interface TimeFieldLabels {
  /** The name of the whole group when you give no label of your own. Default "Time". */
  group: string;
  /** The name of the hour part, as a screen reader says it. Default "Hour". */
  hour: string;
  /** The name of the minute part. Default "Minute". */
  minute: string;
  /** The name of the AM and PM part. Default "AM or PM". */
  period: string;
}

export interface TimeFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "id" | "children"> {
  /** The time as "14:30" in 24-hour form, or null while it is not complete, when you control it. */
  value?: string | null;
  /** The time to start with, when you do not control it. */
  defaultValue?: string | null;
  /** Called with the time as "14:30" once it is complete and allowed, and with null whenever it is not. */
  onValueChange?: (value: string | null) => void;
  /** Write the time with AM and PM (true) or on the 24-hour clock (false). By default the locale decides: en-US is 12-hour, nl-NL is 24-hour. */
  hour12?: boolean;
  /** The locale that decides the clock, the separator and the words for the morning and the afternoon. Default "en-US". */
  locale?: string;
  /** The size of a step of the arrow keys on the minutes, 1 to 30. Default 1. A minute off the grid goes to the next slot on it. */
  minuteStep?: number;
  /** The earliest time that can be used, as "09:00" in 24-hour form. Later than `max` means a range that runs past midnight. */
  min?: string;
  /** The latest time that can be used, as "17:00" in 24-hour form. */
  max?: string;
  /** The field's name for a plain form submit: the time as "14:30" in a hidden input. */
  name?: string;
  /** Turn the whole field off: the parts stop taking input and the hidden input is not posted. */
  disabled?: boolean;
  /** Tell assistive technology that a time is needed (aria-required on every part). It does not block a submit by itself. */
  required?: boolean;
  /** Put on the first part, so a <label htmlFor> focuses the field. Or name the group with aria-labelledby. */
  id?: string;
  /** `sm` is a little shorter, for a table cell or a toolbar. */
  size?: "default" | "sm";
  /** Show the clock in front of the parts. Default true. */
  showIcon?: boolean;
  /** Other words for the parts. */
  labels?: Partial<TimeFieldLabels>;
}

interface Parts {
  hour: string;
  minute: string;
  period: Period | "";
}

const EMPTY: Parts = { hour: "", minute: "", period: "" };
const PLACEHOLDER = { hour: "hh", minute: "mm", period: "--" } as const;
const DEFAULT_LABELS: TimeFieldLabels = { group: "Time", hour: "Hour", minute: "Minute", period: "AM or PM" };
// InputGroup keeps its neutral focus ring even on an invalid field; a time outside the range keeps its error colour while someone is fixing it.
const STAYS_RED = "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";

/** The parts of a time as "14:30". Anything else is an empty field. */
function toParts(time: string | null | undefined, twelve: boolean): Parts {
  const parsed = parseTime(time);
  if (!parsed) return EMPTY;
  if (!twelve) return { hour: padNumber(parsed.hour, 2), minute: padNumber(parsed.minute, 2), period: "" };
  const clock = toTwelve(parsed.hour);
  return { hour: padNumber(clock.hour, 2), minute: padNumber(parsed.minute, 2), period: clock.period };
}

/** The time the parts make, or null while one of them is missing or half typed. */
function readTime(parts: Parts, twelve: boolean): TimeNumbers | null {
  if (parts.hour.length !== 2 || parts.minute.length !== 2) return null;
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  if (minute > 59) return null;
  if (!twelve) return hour <= 23 ? { hour, minute } : null;
  if (!parts.period || hour < 1 || hour > 12) return null;
  return { hour: fromTwelve(hour, parts.period), minute };
}

/** A time from text that was pasted: "14:30", "2:30 pm", "1430", "9.30". */
function readPasted(text: string, twelve: boolean, periods: Record<Period, string>): Parts | null {
  const folded = asciiDigits(text).trim();
  const match = /^(\d{1,2})\s*[:.hH]?\s*(\d{2})\s*(\D*)$/.exec(folded) ?? /^(\d{1,2})()\s*(\D*)$/.exec(folded);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (hour > 23 || minute > 59) return null;
  const squash = (word: string) => word.replace(/[\s.]/g, "").toLowerCase();
  const word = squash(match[3] ?? "");
  const typed: Period | null = !word ? null : word === "am" || word === "a" || word === squash(periods.am) ? "am" : word === "pm" || word === "p" || word === squash(periods.pm) ? "pm" : null;
  if (word && !typed) return null;
  // A time written with AM or PM is read on the 12-hour clock; one without is read as the 24-hour clock writes it, so 14:30 is 2:30 PM.
  if (typed && (hour < 1 || hour > 12)) return null;
  const hour24 = typed ? fromTwelve(hour, typed) : hour;
  if (!twelve) return { hour: padNumber(hour24, 2), minute: padNumber(minute, 2), period: "" };
  const clock = toTwelve(hour24);
  return { hour: padNumber(clock.hour, 2), minute: padNumber(minute, 2), period: clock.period };
}

/**
 * A time you can type. Hours and minutes are small fields in the order the
 * locale writes them, with its separator, and on a 12-hour clock a third one
 * for AM and PM. Together they are one group (named "Time" unless you name it
 * with aria-labelledby) whose parts are named Hour, Minute and AM or PM for a
 * screen reader. Digits move on by themselves (a 7 can only be 07), the arrow
 * keys step a part and wrap round (the minutes in steps of `minuteStep`),
 * Backspace clears it, typing a or p sets the period, and a pasted time fills
 * all of them. A time outside `min` and `max` is explained in words, naming
 * the range, once it is complete; until then the field stays quiet. It reports
 * "14:30" in 24-hour form, or null, which is also what the Time picker speaks,
 * and it is short enough for a table cell or either side of a range.
 */
export function TimeField({
  value,
  defaultValue = null,
  onValueChange,
  hour12,
  locale = "en-US",
  minuteStep = 1,
  min,
  max,
  name,
  disabled,
  required,
  id,
  size = "default",
  showIcon = true,
  labels,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: TimeFieldProps) {
  const messageId = useId();
  const words = { ...DEFAULT_LABELS, ...labels };
  const twelve = hour12 ?? usesTwelveHour(locale);
  const { order, separator, periods } = useMemo(() => timeLayout(locale, twelve), [locale, twelve]);
  const [parts, setParts] = useState<Parts>(() => toParts(value !== undefined ? value : defaultValue, twelve));
  const [synced, setSynced] = useState(value);
  const [wasTwelve, setWasTwelve] = useState(twelve);
  const refs = useRef<Partial<Record<TimeSegment, HTMLInputElement | null>>>({});
  // A part that was just entered starts over with the next digit, instead of adding to what it held.
  const replace = useRef(true);
  const moveTo = useRef<TimeSegment | null>(null);
  // Set while the field itself moves the focus, so the focus handler leaves alone what the field has just worked out.
  const focusedByField = useRef(false);
  // What the last press on the period was, so the click that follows can tell a tap on a phone from a mouse that only moves the focus there.
  const press = useRef<{ touch: boolean; focused: boolean } | null>(null);
  const reported = useRef<string | null>(parseTime(value !== undefined ? value : defaultValue) ? (value !== undefined ? value : defaultValue) : null);

  // The time a set of parts stands for, when it is complete and allowed.
  const isoOf = (candidate: Parts): string | null => {
    const found = readTime(candidate, twelve);
    return found && !explainTime(found, { min, max, locale, twelve }) ? toTime(found) : null;
  };
  const time = readTime(parts, twelve);
  const message = time ? explainTime(time, { min, max, locale, twelve }) : null;
  const iso = isoOf(parts);

  // A time that arrives from outside replaces the parts, unless it is the time they already make (an empty one does not wipe a half-typed time) or the very
  // time the field reported last: a null that came back from this field's own report, when a new min or max has made the parts valid again, is not an order to clear them.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== iso && value !== reported.current) setParts(toParts(value, twelve));
  }
  // Another clock rewrites what is there: 15:00 is 03 and PM on one and 15 on the other.
  if (twelve !== wasTwelve) {
    setWasTwelve(twelve);
    setParts(toParts(iso, twelve));
  }

  // What a change does to the time is reported from the change itself, so the parent's value and the parts move in the same render. This one only catches what
  // no keystroke caused (a new min or max, a clock that was turned over) and reports it once.
  useEffect(() => {
    if (iso === reported.current) return;
    reported.current = iso;
    if (value !== undefined && iso === value) return;
    onValueChange?.(iso);
  }, [iso]);

  function write(next: Parts) {
    setParts(next);
    const nextIso = isoOf(next);
    if (nextIso === reported.current) return;
    reported.current = nextIso;
    onValueChange?.(nextIso);
  }

  // After a digit completes a part the next one takes the focus, once the parts have been written.
  useLayoutEffect(() => {
    const target = moveTo.current;
    if (!target) return;
    moveTo.current = null;
    const node = refs.current[target];
    if (!node) return;
    focusedByField.current = true;
    node.focus();
    focusedByField.current = false;
    // A part waiting for its second digit keeps the caret behind the first one; a full part is selected, so the next digit replaces it.
    if (parts[target].length === 1) node.setSelectionRange(1, 1);
    else node.select();
  });

  const next = (segment: TimeSegment): TimeSegment | undefined => order[order.indexOf(segment) + 1];

  /** One more digit for a part. Returns the part that is next in line to be typed into. */
  function enter(draft: Parts, segment: "hour" | "minute", digit: string, fresh: boolean): TimeSegment {
    // A part that is already full (stepped to, or typed to the end) starts over: a digit never makes it longer than it can be.
    const base = fresh || draft[segment].length >= 2 ? "" : draft[segment];
    const typed = base + digit;
    const limit = segment === "minute" ? { max: 59, first: 5 } : twelve ? { max: 12, first: 1 } : { max: 23, first: 2 };
    const following = next(segment);
    // Too big to be one number: what was there is the whole part, and the digit starts the next one.
    if (Number(typed) > limit.max) {
      draft[segment] = padNumber(base || "0", 2);
      if (following === "minute") return enter(draft, "minute", digit, true);
      return following ?? segment;
    }
    draft[segment] = typed;
    // A first digit that cannot start a longer number (an 8 for an hour, a 6 for a minute) completes the part at once.
    if (typed.length < 2 && Number(typed) <= limit.first) return segment;
    // There is no hour 00 on a clock with AM and PM: it is the hour that follows 11.
    draft[segment] = twelve && segment === "hour" && Number(typed) === 0 ? "12" : padNumber(typed, 2);
    return following ?? segment;
  }

  function typeDigit(segment: "hour" | "minute", digit: string) {
    const draft = { ...parts };
    const target = enter(draft, segment, digit, replace.current);
    // The next digit starts over when a part is full: it has handed on, or it is the last one and there is nowhere left for a digit to go.
    // A part that was handed a digit but is not full yet (an overflowing 2 5 puts its 5 in the minutes) keeps waiting for the next one.
    replace.current = draft[target].length !== 1;
    if (target !== segment) moveTo.current = target;
    write(draft);
  }

  function setPeriod(period: Period, from: TimeSegment) {
    replace.current = true;
    write({ ...parts, period });
    const following = next("period");
    if (from === "period" && following) moveTo.current = following;
  }

  function clear(segment: TimeSegment) {
    replace.current = true;
    write({ ...parts, [segment]: "" });
  }

  function step(segment: TimeSegment, delta: 1 | -1) {
    // What was stepped to is a whole number now: the next digit starts the part over instead of being added to it.
    replace.current = true;
    if (segment === "period") {
      write({ ...parts, period: parts.period === "" ? (delta === 1 ? "am" : "pm") : parts.period === "am" ? "pm" : "am" });
    } else if (segment === "hour") {
      // From an empty part the arrow starts at the earliest hour that is allowed, if there is a `min`.
      const seed = parts.hour === "" ? parseTime(min) : null;
      const hour = seed ? (twelve ? toTwelve(seed.hour).hour : seed.hour) : stepHour(parts.hour ? Number(parts.hour) : null, delta, twelve);
      write({ ...parts, hour: padNumber(hour, 2) });
    } else {
      write({ ...parts, minute: padNumber(stepMinute(parts.minute ? Number(parts.minute) : null, delta, minuteStep), 2) });
    }
  }

  function go(segment: TimeSegment, delta: number) {
    const target = order[order.indexOf(segment) + delta];
    if (!target) return;
    replace.current = true;
    refs.current[target]?.focus();
  }

  function keyDown(segment: TimeSegment, event: KeyboardEvent<HTMLInputElement>) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const { key } = event;
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
      step(segment, key === "ArrowUp" ? 1 : -1);
    } else if (key === "ArrowLeft" || key === "ArrowRight") {
      event.preventDefault();
      go(segment, key === "ArrowRight" ? 1 : -1);
    } else if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      if (parts[segment]) clear(segment);
      else if (key === "Backspace") go(segment, -1);
    } else if (segment === "period" && key === " ") {
      event.preventDefault();
      step("period", 1);
    } else if (segment === "period" && /\d/.test(asciiDigits(key))) {
      // Where the period comes first (Korean, Japanese) the first thing someone types is a digit: it belongs to the hour.
      event.preventDefault();
      replace.current = true;
      refs.current.hour?.focus();
      typeDigit("hour", asciiDigits(key));
    } else if (key === separator || key === ":" || key === "." || key === "," || key === " ") {
      // The separator the person types moves on, and finishes a part that has one digit.
      event.preventDefault();
      if (segment === "period" || !parts[segment]) return;
      if (parts[segment].length === 1) write({ ...parts, [segment]: padNumber(parts[segment], 2) });
      go(segment, 1);
    } else if (key.length === 1 && !/\d/.test(asciiDigits(key))) {
      event.preventDefault();
      // On a clock with AM and PM a letter is the period, whichever part is in front of the person.
      const period = twelve ? periodForKey(key, periods) : null;
      if (period) setPeriod(period, segment);
    }
  }

  function change(segment: "hour" | "minute", event: ChangeEvent<HTMLInputElement>) {
    const native = event.nativeEvent as InputEvent;
    const digits = asciiDigits(event.target.value).replace(/\D/g, "");
    // A keyboard that sends no key for Backspace (a phone's) arrives here as a deletion.
    if (digits === "" || native.inputType?.startsWith("delete")) {
      clear(segment);
      return;
    }
    const before = parts[segment];
    let at = digits.length - 1;
    if (digits.length > before.length) {
      at = 0;
      while (at < before.length && before[at] === digits[at]) at += 1;
    }
    typeDigit(segment, digits.charAt(at));
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    const found = readPasted(event.clipboardData.getData("text"), twelve, periods);
    event.preventDefault();
    if (!found) return;
    replace.current = true;
    write(found);
  }

  function leavePart(segment: TimeSegment) {
    // A part that is left with one digit is written out in full whichever way the focus goes: a 2 in the minutes is 02, so the time is complete and reported at once.
    if (segment === "period" || parts[segment].length !== 1) return;
    write({ ...parts, [segment]: padNumber(parts[segment], 2) });
  }

  function leaveGroup(event: FocusEvent<HTMLDivElement>) {
    // Moving from one part to the next is not leaving.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    const pad = (text: string) => (text.length === 1 ? padNumber(text, 2) : text);
    const hour = pad(parts.hour);
    // An hour on its own is the whole hour: "9" is 9:00.
    const minute = parts.hour && !parts.minute ? "00" : pad(parts.minute);
    if (hour !== parts.hour || minute !== parts.minute) write({ ...parts, hour, minute });
  }

  const rangeError = Boolean(message);
  const sm = size === "sm";

  return (
    <div data-slot="time-field" className={cn("grid w-full justify-items-start", className)} {...props}>
      <InputGroup
        role="group"
        aria-label={labelledBy ? undefined : (ariaLabel ?? words.group)}
        aria-labelledby={labelledBy}
        onBlur={leaveGroup}
        className={cn("w-fit max-w-full gap-0.5", showIcon ? "pl-2.5" : "pl-1.5", "pr-1.5", sm && "h-8", STAYS_RED)}
      >
        {showIcon ? <IconClock aria-hidden="true" className="mr-1 size-4 shrink-0 text-muted-foreground" /> : null}
        {order.map((segment, index) => {
          const number = Number(parts[segment]);
          const period = segment === "period";
          return (
            <Fragment key={segment}>
              {segment === "minute" && order[index - 1] === "hour" ? (
                <span aria-hidden="true" className="px-px text-sm text-muted-foreground select-none">
                  {separator}
                </span>
              ) : null}
              <input
                ref={(node) => {
                  refs.current[segment] = node;
                }}
                id={index === 0 ? id : undefined}
                role="spinbutton"
                inputMode={period ? "none" : "numeric"}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                readOnly={period}
                disabled={disabled}
                aria-label={words[segment]}
                aria-required={required || undefined}
                aria-invalid={rangeError || undefined}
                aria-describedby={[describedBy, messageId].filter(Boolean).join(" ")}
                aria-valuemin={segment === "hour" && twelve ? 1 : 0}
                aria-valuemax={period ? 1 : segment === "hour" ? (twelve ? 12 : 23) : 59}
                aria-valuenow={period ? (parts.period === "" ? undefined : parts.period === "pm" ? 1 : 0) : parts[segment] ? number : undefined}
                aria-valuetext={period ? (parts.period ? periods[parts.period] : "Empty") : parts[segment] ? String(number) : "Empty"}
                placeholder={PLACEHOLDER[segment]}
                value={period ? (parts.period ? periods[parts.period] : "") : parts[segment as "hour" | "minute"]}
                onFocus={(event) => {
                  if (focusedByField.current) return;
                  replace.current = true;
                  event.currentTarget.select();
                }}
                onPointerDown={
                  period
                    ? (event) => {
                        press.current = { touch: event.pointerType === "touch", focused: document.activeElement === event.currentTarget };
                      }
                    : undefined
                }
                onClick={(event) => {
                  // A click on the part that already has focus would put the caret in it; the next digit must still replace it.
                  replace.current = true;
                  event.currentTarget.select();
                  if (!period) return;
                  // On a phone there is no keyboard for the period: a tap on it turns it over. A mouse that only comes here to focus it, before typing an a or a p, must not
                  // turn it over by arriving: from the second click on, it does.
                  const pressed = press.current;
                  press.current = null;
                  if (pressed && (pressed.touch || pressed.focused)) step("period", 1);
                }}
                onBlur={() => leavePart(segment)}
                onChange={period ? undefined : (event) => change(segment as "hour" | "minute", event)}
                onKeyDown={(event) => keyDown(segment, event)}
                onPaste={paste}
                className={cn(
                  "rounded-sm bg-transparent px-1 text-center text-sm tabular-nums outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus:placeholder-shown:bg-muted disabled:cursor-not-allowed",
                  sm ? "h-6" : "h-7",
                  period ? "ml-0.5 w-[calc(3.25ch+0.75rem)] cursor-pointer text-[0.8125rem] font-medium" : "w-[calc(2.5ch+0.75rem)]",
                )}
              />
            </Fragment>
          );
        })}
      </InputGroup>
      <div id={messageId} aria-live="polite">
        {message ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {message}
          </p>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={iso ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
