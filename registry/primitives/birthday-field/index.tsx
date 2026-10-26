"use client";

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import {
  asciiDigits,
  birthdayOrder,
  DEFAULT_MESSAGES,
  explainBirthday,
  localToday,
  longDate,
  monthNames,
  padNumber,
  parseIso,
  toIso,
  type BirthdayMessages,
  type BirthdayParts,
  type BirthdaySegment,
  type DateNumbers,
} from "@rhs-ui/primitives/birthday-field/birthdays";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

/** The words the field says, for another language or your own voice. */
export interface BirthdayFieldLabels {
  /** The name of the whole group when you give no label of your own. Default "Date of birth". */
  group: string;
  /** The small label above the day. Default "Day". */
  day: string;
  /** The small label above the month. Default "Month". */
  month: string;
  /** The small label above the year. Default "Year". */
  year: string;
  /** What the empty day shows. Default "DD". */
  dayPlaceholder: string;
  /** What the month menu shows until a month is chosen. Default "Select". */
  monthPlaceholder: string;
  /** What the empty year shows. Default "YYYY". */
  yearPlaceholder: string;
}

export interface BirthdayFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "id" | "children"> {
  /** The date as 1990-03-14, or an empty string while it is not complete or not allowed, when you control it. */
  value?: string;
  /** The date to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the date as 1990-03-14 once it is complete, real and allowed, and with an empty string whenever it is not. Only the date is reported, never an age. */
  onValueChange?: (value: string, state: { valid: boolean }) => void;
  /** The youngest age that is allowed, in whole years: 18 refuses anyone who has not had their 18th birthday. */
  minAge?: number;
  /** The oldest age that is allowed, in whole years. A typo in the year is then caught before it becomes a person of 160. */
  maxAge?: number;
  /** Today as 2026-10-26, when your form should not depend on the clock of the reader (a server that decides, a test). By default the reader's own date. */
  today?: string;
  /** The locale that decides the order of day, month and year and the names of the months. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit: the date as 1990-03-14 in a hidden input. */
  name?: string;
  /** Turn the whole field off: the three parts stop taking input and the hidden input is not posted. */
  disabled?: boolean;
  /** Tell assistive technology that a date is needed (aria-required on every part). It does not block a submit by itself. */
  required?: boolean;
  /** Put on the first part, so a <label htmlFor> focuses the field. Or name the group with aria-labelledby. */
  id?: string;
  /** Other words for the labels and placeholders. */
  labels?: Partial<BirthdayFieldLabels>;
  /** Other words for what the field says is wrong. `tooYoung` and `tooOld` are functions of the age you set. */
  messages?: Partial<BirthdayMessages>;
}

const DEFAULT_LABELS: BirthdayFieldLabels = {
  group: "Date of birth",
  day: "Day",
  month: "Month",
  year: "Year",
  dayPlaceholder: "DD",
  monthPlaceholder: "Select",
  yearPlaceholder: "YYYY",
};

const EMPTY: BirthdayParts = { day: "", month: "", year: "" };

// Every part has the width its content needs; the month is what stretches, up to the longest month name. Below 20rem the field is a little tighter,
// so that a month still has a name to show in a narrow card or on the smallest phone.
const WIDTH: Record<BirthdaySegment, string> = {
  day: "w-16 shrink-0 @max-[20rem]:w-[3.25rem]",
  month: "min-w-0 max-w-44 flex-1 basis-0",
  year: "w-[5.25rem] shrink-0 @max-[20rem]:w-[4.5rem]",
};

const TIGHT = "@max-[20rem]:px-2.5";

/** The parts of a date as 1990-03-14. An impossible one (1990-02-31) is kept as it is, so the field can say what is wrong with it. */
function toParts(iso: string): BirthdayParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return match ? { year: match[1] ?? "", month: match[2] ?? "", day: match[3] ?? "" } : EMPTY;
}

/**
 * A date of birth without a calendar. Three parts in the order the locale
 * writes them: a day to type, a month to choose by name from the house select,
 * and a year to type with four digits, so nobody scrolls back forty years.
 * Together they are one group (named "Date of birth" unless you name it) with
 * a small label over every part. It checks that the date exists, that it is
 * not in the future and that it meets `minAge` and `maxAge`, says what is wrong
 * in words ("You must be at least 18 to register.") and marks only the part
 * that is wrong, while one line under the group, which the group points at with
 * aria-describedby, tells assistive technology the same, or the date it
 * understood once all is well. Only the ISO date is ever reported, never an
 * age. The parts carry the autofill tokens bday-day, bday-month and bday-year,
 * so a browser can fill them from the saved profile.
 */
export function BirthdayField({
  value,
  defaultValue = "",
  onValueChange,
  minAge,
  maxAge,
  today,
  locale = "en-US",
  name,
  disabled,
  required,
  id,
  labels,
  messages,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: BirthdayFieldProps) {
  const base = useId();
  const messageId = `${base}-message`;
  const words = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const text = useMemo<BirthdayMessages>(() => ({ ...DEFAULT_MESSAGES, ...messages }), [messages]);
  const order = useMemo(() => birthdayOrder(locale), [locale]);
  const months = useMemo(() => monthNames(locale), [locale]);
  const [parts, setParts] = useState<BirthdayParts>(() => toParts(value ?? defaultValue));
  const [synced, setSynced] = useState(value);
  const [yearLeft, setYearLeft] = useState(false);
  // Today is the reader's own date, which a server cannot know: it is read once the field is on the page, and until then only what a date says about itself is checked.
  const [clock, setClock] = useState<DateNumbers | null>(null);
  const reported = useRef(parseIso(value ?? defaultValue) ? (value ?? defaultValue) : "");

  useEffect(() => {
    if (!today) setClock(localToday());
  }, [today]);
  const now = (today ? parseIso(today) : null) ?? clock;

  const rules = { minAge, maxAge, today: now, locale, messages: text, yearLeft };
  const problem = explainBirthday(parts, rules);
  const complete = parts.day !== "" && parts.month !== "" && parts.year.length === 4;
  /** The date a set of parts stands for, when it is complete, real and allowed. */
  const isoOf = (candidate: BirthdayParts): string => {
    const done = candidate.day !== "" && candidate.month !== "" && candidate.year.length === 4;
    return done && !explainBirthday(candidate, rules) ? toIso(Number(candidate.year), Number(candidate.month), Number(candidate.day)) : "";
  };
  const iso = complete && !problem ? toIso(Number(parts.year), Number(parts.month), Number(parts.day)) : "";

  // A date that arrives from outside replaces the parts, unless it is the date they already make (an empty one does not wipe a half-typed date) or the very
  // date the field reported last: an empty one that came back from this field's own report, when a new rule has made the parts valid again, is not an order to clear them.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== iso && value !== reported.current) setParts(toParts(value));
  }

  // What a change does to the date is reported from the change itself, so the parent's value and the parts move in the same render. This one catches what no
  // keystroke caused: the reader's date arriving, or a new minAge, which can make a date that was fine unusable.
  useEffect(() => {
    if (iso === reported.current) return;
    reported.current = iso;
    if (value !== undefined && iso === value) return;
    onValueChange?.(iso, { valid: iso !== "" });
  }, [iso]);

  function write(next: BirthdayParts) {
    setParts(next);
    const nextIso = isoOf(next);
    if (nextIso === reported.current) return;
    reported.current = nextIso;
    onValueChange?.(nextIso, { valid: nextIso !== "" });
  }

  function typeDay(event: ChangeEvent<HTMLInputElement>) {
    write({ ...parts, day: asciiDigits(event.target.value).replace(/\D/g, "").slice(0, 2) });
  }

  function typeYear(event: ChangeEvent<HTMLInputElement>) {
    setYearLeft(false);
    write({ ...parts, year: asciiDigits(event.target.value).replace(/\D/g, "").slice(0, 4) });
  }

  function leaveDay() {
    // A day of one digit is written out in full, as it is reported.
    if (parts.day.length === 1) write({ ...parts, day: padNumber(parts.day, 2) });
  }

  function leaveYear(event: FocusEvent<HTMLInputElement>) {
    if (event.currentTarget.value.length > 0 && event.currentTarget.value.length < 4) setYearLeft(true);
  }

  const date = iso ? parseIso(iso) : null;
  const understood = date ? longDate(locale, date) : "";

  return (
    <div data-slot="birthday-field" className={cn("@container grid w-full max-w-[21.25rem] justify-items-start", className)} {...props}>
      <div
        role="group"
        aria-label={labelledBy ? undefined : (ariaLabel ?? words.group)}
        aria-labelledby={labelledBy}
        aria-describedby={[describedBy, messageId].filter(Boolean).join(" ")}
        className="flex w-full items-start gap-2 @max-[20rem]:gap-1.5"
      >
        {order.map((segment, index) => {
          const controlId = index === 0 && id ? id : `${base}-${segment}`;
          const invalid = problem?.part === segment || undefined;
          return (
            <div key={segment} className={cn("grid gap-1.5", WIDTH[segment])}>
              <Label htmlFor={controlId} className="text-xs font-medium text-muted-foreground">
                {words[segment]}
              </Label>
              {segment === "month" ? (
                <Select value={parts.month} onValueChange={(month) => write({ ...parts, month })} disabled={disabled} autoComplete="bday-month">
                  <SelectTrigger id={controlId} aria-required={required || undefined} aria-invalid={invalid} aria-describedby={problem ? messageId : undefined} className={TIGHT}>
                    <SelectValue placeholder={words.monthPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, position) => (
                      <SelectItem key={padNumber(position + 1, 2)} value={padNumber(position + 1, 2)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={controlId}
                  type="text"
                  inputMode="numeric"
                  autoComplete={segment === "day" ? "bday-day" : "bday-year"}
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={disabled}
                  aria-required={required || undefined}
                  aria-invalid={invalid}
                  aria-describedby={problem ? messageId : undefined}
                  placeholder={segment === "day" ? words.dayPlaceholder : words.yearPlaceholder}
                  value={parts[segment]}
                  onChange={segment === "day" ? typeDay : typeYear}
                  onBlur={segment === "day" ? leaveDay : leaveYear}
                  className={cn("tabular-nums", TIGHT)}
                />
              )}
            </div>
          );
        })}
      </div>
      <div id={messageId} aria-live="polite">
        {problem ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {problem.message}
          </p>
        ) : understood ? (
          <p className="sr-only">{understood}</p>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={iso} disabled={disabled} /> : null}
    </div>
  );
}
