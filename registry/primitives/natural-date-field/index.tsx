"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ChangeEvent, type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";

import { IconAlertCircle, IconCalendar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Calendar } from "@rhs-ui/primitives/calendar";
import { InputGroup, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { trackPress, whenReleased } from "@rhs-ui/primitives/natural-date-field/blur-guard";
import {
  addDays,
  dayNumber,
  DEFAULT_LABELS,
  distanceInWords,
  fromLocalDate,
  fullDate,
  isoInZone,
  parseNaturalDate,
  shortDate,
  toLocalDate,
  weekStart,
  type NaturalDateLabels,
  type NaturalDateOptions,
  type NaturalPhrases,
} from "@rhs-ui/primitives/natural-date-field/natural";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { NaturalDateLabels, NaturalPhrases } from "@rhs-ui/primitives/natural-date-field/natural";

export interface NaturalDateFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "name" | "role" | "inputMode" | "children"> {
  /** The date as 2026-03-14, when you control it, or null for none. */
  value?: string | null;
  /** The date to start with, when you do not control it. */
  defaultValue?: string | null;
  /**
   * Called with the date as 2026-03-14 when the text is committed (Enter, leaving the field, or a day picked in the calendar),
   * and with null when it was emptied or could not be used. `valid` is true when there is a date inside `min` and `max`.
   */
  onValueChange?: (value: string | null, state: { valid: boolean }) => void;
  /** What "now" is, as a Date, a timestamp or an ISO string, so "tomorrow" is the same day on the server and in the browser. A date without a time ("2026-10-21") is that very day. Default: the clock. The Calendar behind the calendar button is the exception: it opens on, and marks, the browser's own today. */
  now?: Date | string | number;
  /** The time zone that decides which day it is now. Default "UTC". */
  timeZone?: string;
  /** The locale that writes the date, orders numeric dates (3/4 is the third of April or the fourth of March) and names the days. Default "en-US". */
  locale?: string;
  /** The earliest date that can be used, as 2026-03-14. */
  min?: string;
  /** The latest date that can be used, as 2026-03-14. */
  max?: string;
  /** The field's name for a plain form submit: the date as 2026-03-14 in a hidden input, or empty. */
  name?: string;
  /** The words the parser listens for, for another language. What you leave out stays English. */
  phrases?: Partial<NaturalPhrases>;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<NaturalDateLabels>;
}

const noSubscription = (): (() => void) => () => undefined;
// The group's own focus border would win over the red one while the cursor is still in a field that is wrong, so the red is asked for in the focused state too.
const WRONG = "border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/30";

/** Today in the time zone: from `now` when it is given, else from the browser's clock, which the server does not have, so it renders null. */
function useToday(now: NaturalDateFieldProps["now"], timeZone: string): string | null {
  const fixed = now === undefined ? null : isoInZone(now, timeZone);
  // The browser's clock is only known in the browser, so the server leaves out "in 2 days" and nothing mismatches when it hydrates.
  const live = useSyncExternalStore(
    noSubscription,
    () => isoInZone(new Date(), timeZone),
    () => null,
  );
  return fixed ?? live;
}

/**
 * A date you can say. Type tomorrow, next friday, in 3 weeks, end of month,
 * 14 mar or 2026-03-14 and the date it was understood as is written under the
 * field in full ("Friday 23 October 2026", and how far away that is) before
 * anything is committed. Enter, or leaving the field, commits it and rewrites
 * the text as a plain date; the arrow keys then nudge it by a day (Shift by a week). A calendar
 * button opens the Calendar for people who would rather click (it reads the
 * browser's own clock for the month it opens on and for today). Text that is
 * not understood is answered with a few phrases that would be. "Today" is
 * `now` in `timeZone`, so the server and the browser agree, and a day and month
 * without a year are placed in whichever year falls inside `min` and `max`. The
 * parser is the exported `parseNaturalDate`; its words are English, and
 * `phrases` replaces them for another language.
 */
export function NaturalDateField({
  value,
  defaultValue = null,
  onValueChange,
  now,
  timeZone = "UTC",
  locale = "en-US",
  min,
  max,
  name,
  phrases,
  labels: labelOverrides,
  form,
  disabled,
  placeholder = "e.g. next friday",
  className,
  onBlur,
  onKeyDown,
  ref,
  "aria-describedby": describedBy,
  ...props
}: NaturalDateFieldProps) {
  const base = useId();
  const noteId = `${base}-note`;
  const labels: NaturalDateLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const today = useToday(now, timeZone);
  const options: NaturalDateOptions = { now, timeZone, locale, phrases, min, max };
  /** A date as the field writes it: short ("23 Oct 2026"), or as an ISO date when the short form would not be read back as the same day. */
  const writtenAs = (iso: string): string => {
    const text = shortDate(iso, locale);
    return parseNaturalDate(text, options) === iso ? text : iso;
  };
  const [own, setOwn] = useState<string | null>(defaultValue);
  const current = value === undefined ? own : value;
  const [draft, setDraft] = useState(() => (current ? writtenAs(current) : ""));
  // The text as it was when the date was last settled: what is typed now is only a proposal while it differs.
  const [settled, setSettled] = useState(draft);
  const [synced, setSynced] = useState(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement | null>(null);
  const reported = useRef<string | null | undefined>(undefined);
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

  // A date that arrives from outside replaces what is typed; an echo of what was just reported changes nothing.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== reported.current) {
      const text = value ? writtenAs(value) : "";
      setDraft(text);
      setSettled(text);
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

  /** Why this date cannot be used, in words, or null. */
  function rangeProblem(iso: string): string | null {
    if (min !== undefined && iso < min) return labels.before(fullDate(min, locale));
    if (max !== undefined && iso > max) return labels.after(fullDate(max, locale));
    return null;
  }

  function problemOf(text: string): string | null {
    if (!text.trim()) return null;
    const iso = parseNaturalDate(text, options);
    return iso === null ? labels.unreadable(labels.examples) : rangeProblem(iso);
  }

  function report(date: string | null, valid: boolean) {
    reported.current = date;
    if (value === undefined) setOwn(date);
    onValueChange?.(date, { valid });
  }

  const typed = draft.trim() !== settled.trim();
  const reading = typed && draft.trim() ? parseNaturalDate(draft, options) : null;
  const shown = typed ? reading : current;
  const shownProblem = shown ? rangeProblem(shown) : null;
  const days = shown && today ? dayNumber(shown) - dayNumber(today) : null;

  function change(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    setDraft(text);
    setSaid("");
    window.clearTimeout(timer.current);
    // A message that is already showing follows the typing and goes as soon as the text is right. A new one waits for the field to be left.
    setError((showing) => (showing === null ? null : problemOf(text)));
    const iso = parseNaturalDate(text, options);
    if (iso !== null && !rangeProblem(iso)) {
      const spoken = labels.said(fullDate(iso, locale));
      timer.current = window.setTimeout(() => setSaid(spoken), 700);
    }
  }

  /** The date is settled: the text is rewritten as a plain date, it is reported, and anything wrong is said in words. */
  function commit() {
    window.clearTimeout(timer.current);
    if (!draft.trim()) {
      setDraft("");
      setSettled("");
      if (current !== null) report(null, false);
      whenReleased(() => setError(null));
      return;
    }
    const iso = parseNaturalDate(draft, options);
    const problem = iso === null ? labels.unreadable(labels.examples) : rangeProblem(iso);
    if (iso === null || problem) {
      if (current !== null) report(null, false);
      whenReleased(() => setError(problem));
      return;
    }
    const text = writtenAs(iso);
    setDraft(text);
    setSettled(text);
    if (iso !== current) report(iso, true);
    whenReleased(() => {
      setError(null);
      setSaid(labels.said(fullDate(iso, locale)));
    });
  }

  /** A date that is chosen outright (a day in the calendar, an arrow key) is settled at once. */
  function choose(iso: string) {
    const text = writtenAs(iso);
    setDraft(text);
    setSettled(text);
    setError(null);
    if (iso !== current) report(iso, true);
    setSaid(labels.said(fullDate(iso, locale)));
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    commit();
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      // Enter with nothing waiting is left to the form, which submits it; with a proposal waiting it only settles that.
      if (typed) commit();
    } else if (event.key === "Escape" && typed) {
      event.preventDefault();
      setDraft(settled);
      setError(null);
    } else if ((event.key === "ArrowUp" || event.key === "ArrowDown") && shown) {
      event.preventDefault();
      const next = addDays(shown, (event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 7 : 1));
      if (!rangeProblem(next)) choose(next);
    }
  }

  // The empty space in the field is part of the field: a click there puts the cursor in the text.
  function focusText(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) input.current?.focus();
  }

  const invalid = error !== null || (typed && shownProblem !== null);
  const calendarValue = toLocalDate(current);

  return (
    <div data-slot="natural-date-field" role={disabled ? "group" : undefined} aria-disabled={disabled || undefined} className={cn("grid w-full min-w-0 grid-cols-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <InputGroup onClick={focusText} className={cn("cursor-text pr-1", invalid && WRONG)}>
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
            />
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label={labels.calendar} className="size-7 shrink-0 text-muted-foreground hover:text-foreground">
                <IconCalendar />
              </Button>
            </PopoverTrigger>
          </InputGroup>
        </PopoverAnchor>
        <PopoverContent align="end" collisionPadding={8} aria-label={labels.name} className="w-auto p-0">
          <Calendar
            value={calendarValue ?? null}
            onValueChange={(date) => {
              choose(fromLocalDate(date));
              setOpen(false);
            }}
            min={toLocalDate(min)}
            max={toLocalDate(max)}
            locale={locale}
            weekStartsOn={weekStart(locale)}
          />
        </PopoverContent>
      </Popover>
      <div id={noteId} className="mt-1.5 min-h-5 text-xs">
        <div aria-live="polite">
          {error ? (
            <p className="flex items-start gap-1.5 text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>
        {error ? null : shown && shownProblem ? (
          <p className="flex items-start gap-1.5 text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {shownProblem}
          </p>
        ) : shown ? (
          <p suppressHydrationWarning className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground", disabled && "opacity-50")}>
            <span className="font-medium text-foreground">{fullDate(shown, locale)}</span>
            {days === null ? null : <span>{distanceInWords(days, locale)}</span>}
            {typed ? (
              <span className="ml-auto inline-flex items-center gap-1.5 pointer-coarse:hidden">
                <Kbd>{labels.confirm}</Kbd>
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
      {name ? <input type="hidden" name={name} form={form} value={current ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
