"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type ComponentProps, type KeyboardEvent } from "react";

import { IconAlertCircle, IconCalendar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Calendar } from "@rhs-ui/primitives/calendar";
import { asciiDigits, dateLayout, daysInMonth, explainDate, monthName, padNumber, parseIso, toIso, weekStart, type DateSegment } from "@rhs-ui/primitives/date-field/dates";
import { InputGroup } from "@rhs-ui/primitives/input-group";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/** The words the field says to a screen reader, for another language or your own voice. */
export interface DateFieldLabels {
  /** The name of the whole group when you give no label of your own. Default "Date". */
  group: string;
  /** The name of the day part, as a screen reader says it. Default "Day". */
  day: string;
  /** The name of the month part. Default "Month". */
  month: string;
  /** The name of the year part. Default "Year". */
  year: string;
  /** The name of the calendar button. Default "Open calendar". */
  calendar: string;
}

export interface DateFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "id" | "children"> {
  /** The date as 2026-03-14, or an empty string while it is not complete, when you control it. */
  value?: string;
  /** The date to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the date as 2026-03-14 once it is complete and real, and with an empty string whenever it is not. */
  onValueChange?: (value: string, state: { valid: boolean }) => void;
  /** The locale that decides the order of day, month and year, the separator and the names of months. Default "en-US". */
  locale?: string;
  /** The earliest date that can be used, as 2026-03-14. */
  min?: string;
  /** The latest date that can be used, as 2026-03-14. */
  max?: string;
  /** Add a button that opens a calendar in a popover and writes the day you pick back into the field. */
  showCalendar?: boolean;
  /** The field's name for a plain form submit: the date as 2026-03-14 in a hidden input. */
  name?: string;
  /** Turn the whole field off: the parts and the calendar button stop taking input, and the hidden input is not posted. */
  disabled?: boolean;
  /** Tell assistive technology that a date is needed (aria-required on every part). It does not block a submit by itself. */
  required?: boolean;
  /** Put on the first part, so a <label htmlFor> focuses the field. Or name the group with aria-labelledby. */
  id?: string;
  /** Other words for the parts and the button. */
  labels?: Partial<DateFieldLabels>;
}

type Parts = Record<DateSegment, string>;

const EMPTY: Parts = { day: "", month: "", year: "" };
const MAX = { day: 31, month: 12, year: 9999 } as const;
const WIDTH = { day: 2, month: 2, year: 4 } as const;
const PLACEHOLDER = { day: "dd", month: "mm", year: "yyyy" } as const;
// InputGroup keeps its neutral focus ring even on an invalid field; an impossible date keeps its error colour while someone is fixing it.
const STAYS_RED = "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";
const DEFAULT_LABELS: DateFieldLabels = { group: "Date", day: "Day", month: "Month", year: "Year", calendar: "Open calendar" };

/** The parts of a date as 2026-03-14. An impossible one (2026-02-31) is kept as it is, so the field can say what is wrong with it. */
function toParts(iso: string): Parts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return match ? { year: match[1] ?? "", month: match[2] ?? "", day: match[3] ?? "" } : EMPTY;
}

/** A date from text that was pasted: 2026-03-14, or three numbers in the order of the locale. */
function readPasted(text: string, order: readonly DateSegment[]): Parts | null {
  const numbers = asciiDigits(text).match(/\d+/g) ?? [];
  const found: Partial<Parts> = {};
  const [first = "", second = "", third = ""] = numbers;
  if (numbers.length === 1 && first.length === 8) {
    // Eight digits in a row are read in the order of the locale: 14032026, 03142026 or 20260314.
    let at = 0;
    for (const segment of order) {
      found[segment] = first.slice(at, at + WIDTH[segment]);
      at += WIDTH[segment];
    }
  } else if (numbers.length === 3) {
    // Four digits at the front is a year, whatever the locale writes first: that is how an ISO date reads.
    const sorted: readonly DateSegment[] = first.length === 4 ? ["year", "month", "day"] : order;
    [first, second, third].forEach((chunk, index) => {
      const segment = sorted[index];
      if (!segment) return;
      // A year written with two digits is read the way most systems read it: 00 to 68 are this century, 69 to 99 the last one.
      found[segment] = segment === "year" && chunk.length <= 2 ? String((Number(chunk) >= 69 ? 1900 : 2000) + Number(chunk)) : padNumber(chunk, WIDTH[segment]).slice(-WIDTH[segment]);
    });
  } else {
    return null;
  }
  return { day: found.day ?? "", month: found.month ?? "", year: found.year ?? "" };
}

/** A date in a local day, which is what the Calendar speaks. */
const localDay = (iso: string | undefined) => {
  const date = iso ? parseIso(iso) : null;
  return date ? new Date(date.year, date.month - 1, date.day) : undefined;
};

/**
 * A date you can type. Day, month and year are three small fields in the order
 * the locale writes them, with its separator, and together they are one group
 * (named "Date" unless you name it with aria-labelledby) whose parts are named
 * Day, Month and Year for a screen reader.
 * Digits move on to the next part by themselves (a 4 can only be 04), the
 * arrow keys step a part, Backspace clears it, and a pasted date fills all
 * three. An impossible date such as 31 February is explained in words, but only
 * once all three parts are filled in; until then the field stays quiet. With
 * `showCalendar` a button opens the Calendar in a popover and writes the picked
 * day back. For people who know their date and would rather not scroll to it.
 */
export function DateField({
  value,
  defaultValue = "",
  onValueChange,
  locale = "en-US",
  min,
  max,
  showCalendar = false,
  name,
  disabled,
  required,
  id,
  labels,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: DateFieldProps) {
  const messageId = useId();
  const words = { ...DEFAULT_LABELS, ...labels };
  const { order, separator } = useMemo(() => dateLayout(locale), [locale]);
  const [parts, setParts] = useState<Parts>(() => toParts(value ?? defaultValue));
  const [synced, setSynced] = useState(value);
  const [open, setOpen] = useState(false);
  const refs = useRef<Partial<Record<DateSegment, HTMLInputElement | null>>>({});
  // A part that was just entered starts over with the next digit, instead of adding to what it held.
  const replace = useRef(true);
  const moveTo = useRef<DateSegment | null>(null);
  const reported = useRef(parseIso(value ?? defaultValue) ? (value ?? defaultValue) : "");

  const date = parts.day !== "" && parts.month !== "" && parts.year.length === 4 ? { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) } : null;
  const message = date ? explainDate(date, { min, max, locale }) : null;
  const iso = date && !message ? toIso(date.year, date.month, date.day) : "";

  // A date that arrives from outside replaces the parts, unless it is the date they already make (an empty one does not wipe a half-typed date).
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== iso) setParts(toParts(value));
  }

  useEffect(() => {
    if (iso === reported.current) return;
    reported.current = iso;
    if (value !== undefined && iso === value) return;
    onValueChange?.(iso, { valid: iso !== "" });
  }, [iso]);

  // After a digit completes a part the next one takes the focus, once the parts have been written.
  useLayoutEffect(() => {
    const target = moveTo.current;
    if (!target) return;
    moveTo.current = null;
    const node = refs.current[target];
    node?.focus();
    node?.select();
  });

  function write(next: Parts) {
    setParts(next);
  }

  /** One more digit for a part. Returns the part that is next in line to be typed into. */
  function enter(draft: Parts, segment: DateSegment, digit: string, fresh: boolean): DateSegment {
    // A part that is already full (stepped to, or typed to the end) starts over: a digit never makes it longer than it can be.
    const base = fresh || draft[segment].length >= WIDTH[segment] ? "" : draft[segment];
    const next = base + digit;
    const following = order[order.indexOf(segment) + 1];
    // Too big to be one number: what was there is the whole part, and the digit starts the next one.
    if (segment !== "year" && Number(next) > MAX[segment]) {
      draft[segment] = padNumber(base || "0", 2);
      return following ? enter(draft, following, digit, true) : segment;
    }
    if (segment === "year" && next.length > 4) return segment;
    draft[segment] = next;
    // A first digit that cannot start a longer number (a 4 for a day, a 2 for a month) completes the part at once.
    const done = segment === "year" ? next.length === 4 : next.length === 2 || Number(next) > (segment === "day" ? 3 : 1);
    if (!done) return segment;
    if (segment !== "year") draft[segment] = padNumber(next, 2);
    return following ?? segment;
  }

  function typeDigit(segment: DateSegment, digit: string) {
    const draft = { ...parts };
    const target = enter(draft, segment, digit, replace.current);
    // The next digit starts over when the part has handed on, and also when it is the last one and is now full: there is nowhere left for a digit to go.
    replace.current = target !== segment || draft[segment].length === WIDTH[segment];
    if (target !== segment) moveTo.current = target;
    write(draft);
  }

  function clear(segment: DateSegment) {
    replace.current = true;
    write({ ...parts, [segment]: "" });
  }

  function step(segment: DateSegment, delta: number) {
    const today = new Date();
    const year = Number(parts.year) || today.getFullYear();
    const month = Number(parts.month) || today.getMonth() + 1;
    let next: number;
    if (segment === "year") {
      next = parts.year ? Math.min(MAX.year, Math.max(1, Number(parts.year) + delta)) : year;
    } else if (segment === "month") {
      next = parts.month ? ((((Number(parts.month) - 1 + delta) % 12) + 12) % 12) + 1 : month;
    } else {
      const days = parts.month && parts.year.length === 4 ? daysInMonth(year, month) : 31;
      const current = Math.min(Number(parts.day), days);
      next = parts.day ? ((((current - 1 + delta) % days) + days) % days) + 1 : today.getDate();
    }
    // What was stepped to is a whole number now: the next digit starts the part over instead of being added to it.
    replace.current = true;
    write({ ...parts, [segment]: padNumber(next, WIDTH[segment]) });
  }

  function go(segment: DateSegment, delta: number) {
    const target = order[order.indexOf(segment) + delta];
    if (!target) return;
    replace.current = true;
    refs.current[target]?.focus();
  }

  function keyDown(segment: DateSegment, event: KeyboardEvent<HTMLInputElement>) {
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
    } else if (key === separator || key === "/" || key === "-" || key === "." || key === " " || key === ",") {
      // The separator the person types moves on, and finishes a part that has one digit.
      event.preventDefault();
      if (!parts[segment]) return;
      if (segment !== "year" && parts[segment].length === 1) write({ ...parts, [segment]: padNumber(parts[segment], 2) });
      go(segment, 1);
    } else if (key.length === 1 && !/\d/.test(asciiDigits(key))) {
      event.preventDefault();
    }
  }

  function change(segment: DateSegment, event: ChangeEvent<HTMLInputElement>) {
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
    const found = readPasted(event.clipboardData.getData("text"), order);
    event.preventDefault();
    if (!found) return;
    replace.current = true;
    write(found);
  }

  function leave(segment: DateSegment) {
    const text = parts[segment];
    if (segment !== "year" && text.length === 1) write({ ...parts, [segment]: padNumber(text, 2) });
  }

  function pick(day: Date) {
    write(toParts(toIso(day.getFullYear(), day.getMonth() + 1, day.getDate())));
    setOpen(false);
  }

  const selected = iso ? localDay(iso) : null;
  const rangeError = Boolean(message);

  return (
    <div data-slot="date-field" className={cn("grid w-full justify-items-start", className)} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <InputGroup data-slot="input-group" role="group" aria-label={labelledBy ? undefined : (ariaLabel ?? words.group)} aria-labelledby={labelledBy} className={cn("w-fit max-w-full gap-0.5 pl-2", STAYS_RED)}>
            {order.map((segment, index) => {
              const number = Number(parts[segment]);
              return (
                <Fragment key={segment}>
                  {index > 0 ? (
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
                    inputMode="numeric"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={disabled}
                    aria-label={words[segment]}
                    aria-required={required || undefined}
                    aria-invalid={rangeError || undefined}
                    aria-describedby={[describedBy, messageId].filter(Boolean).join(" ")}
                    aria-valuemin={1}
                    aria-valuemax={MAX[segment]}
                    aria-valuenow={parts[segment] ? number : undefined}
                    aria-valuetext={parts[segment] ? (segment === "month" && number >= 1 && number <= 12 ? monthName(locale, number) : String(number)) : "Empty"}
                    placeholder={PLACEHOLDER[segment]}
                    value={parts[segment]}
                    onFocus={(event) => {
                      replace.current = true;
                      event.currentTarget.select();
                    }}
                    onClick={(event) => {
                      // A click on the part that already has focus would put the caret in it; the next digit must still replace it.
                      replace.current = true;
                      event.currentTarget.select();
                    }}
                    onBlur={() => leave(segment)}
                    onChange={(event) => change(segment, event)}
                    onKeyDown={(event) => keyDown(segment, event)}
                    onPaste={paste}
                    className={cn(
                      "h-7 rounded-sm bg-transparent px-1 text-center text-sm tabular-nums outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus:placeholder-shown:bg-muted disabled:cursor-not-allowed",
                      segment === "year" ? "w-[calc(4ch+0.75rem)]" : "w-[calc(3ch+0.75rem)]",
                    )}
                  />
                </Fragment>
              );
            })}
            {showCalendar ? (
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label={words.calendar} className="mr-0.5 ml-1.5 size-7 shrink-0 text-muted-foreground hover:text-foreground">
                  <IconCalendar />
                </Button>
              </PopoverTrigger>
            ) : (
              <span className="w-1.5 shrink-0" aria-hidden="true" />
            )}
          </InputGroup>
        </PopoverAnchor>
        {showCalendar ? (
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar value={selected} onValueChange={pick} min={localDay(min)} max={localDay(max)} locale={locale} weekStartsOn={weekStart(locale)} />
          </PopoverContent>
        ) : null}
      </Popover>
      <div id={messageId} aria-live="polite">
        {message ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {message}
          </p>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={iso} disabled={disabled} /> : null}
    </div>
  );
}
