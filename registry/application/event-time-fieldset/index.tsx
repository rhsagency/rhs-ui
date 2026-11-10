"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconClock } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  addMinutes,
  dateOf,
  endAllowed,
  fill,
  formatWall,
  fromMs,
  momentLabel,
  parseWall,
  summarise,
  timeOf,
  toMs,
  withDate,
  withTime,
  type EventTimeLabels,
  type EventTimeValue,
} from "@rhs-ui/application/event-time-fieldset/moments";
import { DatePicker } from "@rhs-ui/primitives/date-picker";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { TimePicker } from "@rhs-ui/primitives/time-picker";
import { cn } from "@/lib/utils";

export type { EventTimeLabels, EventTimeValue } from "@rhs-ui/application/event-time-fieldset/moments";

export interface EventTimeFieldsetProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children"> {
  /** When the event is, when you control it. `start` and `end` are "YYYY-MM-DDTHH:mm" wall-clock text in `timeZone`, or "" while nothing is chosen. */
  value?: EventTimeValue;
  /** When it is to begin with, when the fieldset keeps it itself. Default nothing chosen. */
  defaultValue?: EventTimeValue;
  /** Called with the whole value whenever the start, the end or All day changes. A refused end is not reported. */
  onValueChange?: (value: EventTimeValue) => void;
  /** Minutes between the times in the lists. Default 15. */
  minuteStep?: number;
  /** The zone the times are read in, as an IANA name. It is named in the sentence under the fields; nothing is converted. Default "UTC". */
  timeZone?: string;
  /** The first day that can be chosen, "YYYY-MM-DD". */
  minDate?: string;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** What the group is called. It is the legend, so a screen reader names the group before the first field. Default "When". */
  legend?: ReactNode;
  /** Keep the legend for screen readers only, when the page has a heading of its own. */
  hideLegend?: boolean;
  /** The words the fieldset says, for translation. */
  labels?: EventTimeLabels;
}

const EMPTY: EventTimeValue = { start: "", end: "", allDay: false };
const DATE_FORMAT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" };

interface MomentProps {
  label: string;
  /** The text the moment holds, "" when empty. */
  moment: string;
  showTime: boolean;
  min: Date | undefined;
  step: number;
  locale: string;
  pickDay: string;
  pickTime: string;
  dayFirst: string;
  describedBy: string | undefined;
  onDate: (date: Date) => void;
  onTime: (time: string) => void;
}

/** A start or an end: a day and a time side by side, in a group a screen reader can name, because the pickers' buttons only read the value. */
function Moment({ label, moment, showTime, min, step, locale, pickDay, pickTime, dayFirst, describedBy, onDate, onTime }: MomentProps) {
  const id = useId();
  const date = dateOf(moment);
  return (
    <div role="group" aria-labelledby={id} aria-describedby={describedBy} className="grid gap-1.5 @md:grid-cols-[4.25rem_minmax(0,1fr)] @md:items-center @md:gap-x-3">
      <span id={id} className="text-xs font-medium text-muted-foreground @md:text-sm @md:text-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {/* The day takes three parts of the row and the time one; when the row is too narrow for both, each takes a whole line. */}
        <DatePicker value={date} onValueChange={onDate} min={min} locale={locale} format={DATE_FORMAT} placeholder={pickDay} className="min-w-44 flex-[3_1_11rem]" />
        {showTime ? (
          // The time waits for a day: out of the tab order and dimmed until there is one.
          <div inert={!date} className={cn("flex-[1_1_9rem] transition-opacity duration-150 motion-reduce:transition-none", !date && "opacity-50")}>
            <TimePicker value={timeOf(moment)} onValueChange={onTime} step={step} min="00:00" max="23:59" placeholder={date ? pickTime : dayFirst} className="w-full" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The "when" of an event or a booking: a start and an end, each a day and a
 * time from the house pickers, and an All day switch. Moving the start moves
 * the end by the same amount, so a one-hour meeting stays one hour; an end at
 * or before the start is refused with the reason in words and the old end
 * stays, never swapped silently. All day hides the times and keeps them. A
 * sentence under the fields, in a polite live region, says the whole event
 * ("Tue 27 Oct, 14:00 to 15:00 (1 h), Europe/Amsterdam"). The value is
 * wall-clock text in `timeZone`, so it means the same on every machine; turn
 * it into an instant with the zone when you save it. The pickers sit in tab
 * order inside a real fieldset with a legend.
 */
export function EventTimeFieldset({
  value,
  defaultValue,
  onValueChange,
  minuteStep = 15,
  timeZone = "UTC",
  minDate,
  locale = "en-US",
  legend,
  hideLegend,
  disabled,
  labels,
  className,
  ...props
}: EventTimeFieldsetProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const messageId = `${base}-message`;
  const allDayId = `${base}-all-day`;
  const [own, setOwn] = useState<EventTimeValue>(defaultValue ?? EMPTY);
  const [message, setMessage] = useState<string | null>(null);
  const current = value ?? own;
  const min = minDate ? (dateOf(minDate) ?? undefined) : undefined;
  const summary = summarise(current, locale, timeZone, text);

  // A refusal is news for a few seconds; left on screen it would describe an end that has long been fine.
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 7000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function commit(next: EventTimeValue) {
    setMessage(null);
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  /** The start moved. The end moves with it by the same amount, so the length stays; with no end yet it gets the default length. */
  function moveStart(start: string) {
    const was = parseWall(current.start);
    const now = parseWall(start);
    const end = parseWall(current.end);
    if (!now) return;
    const fallback = current.allDay ? start : addMinutes(start, 60);
    let next = current.end;
    if (was && end) next = formatWall(fromMs(toMs(end) + toMs(now) - toMs(was)));
    else if (!end) next = fallback;
    commit({ ...current, start, end: endAllowed(start, next, current.allDay) ? next : fallback });
  }

  /** The end changed. An end that is not after the start is refused, and the old one stays. */
  function moveEnd(end: string) {
    if (!end) return;
    if (!endAllowed(current.start, end, current.allDay)) {
      setMessage(fill(current.allDay ? text.lastDayBeforeFirst : text.endBeforeStart, { end: momentLabel(current.end, current.allDay, locale) }));
      return;
    }
    commit({ ...current, end });
  }

  const endTime = timeOf(addMinutes(current.start, 60)) ?? "10:00";

  return (
    <fieldset data-slot="event-time-fieldset" disabled={disabled} className={cn("@container m-0 min-w-0 border-0 p-0", className)} {...props}>
      <legend className={cn("p-0 text-sm font-medium", hideLegend ? "sr-only" : "mb-4")}>{legend ?? text.legend}</legend>

      <div className="grid gap-4">
        <Moment
          label={text.starts}
          moment={current.start}
          showTime={!current.allDay}
          min={min}
          step={minuteStep}
          locale={locale}
          pickDay={text.pickDay}
          pickTime={text.pickTime}
          dayFirst={text.dayFirst}
          describedBy={undefined}
          onDate={(date) => moveStart(withDate(current.start, date, "09:00"))}
          onTime={(time) => moveStart(withTime(current.start, time))}
        />
        <Moment
          label={text.ends}
          moment={current.end}
          showTime={!current.allDay}
          min={min}
          step={minuteStep}
          locale={locale}
          pickDay={text.pickDay}
          pickTime={text.pickTime}
          dayFirst={text.dayFirst}
          describedBy={message ? messageId : undefined}
          onDate={(date) => moveEnd(withDate(current.end || current.start, date, endTime))}
          onTime={(time) => moveEnd(withTime(current.end || current.start, time))}
        />

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <Label htmlFor={allDayId} className="text-sm font-medium">
            {text.allDay}
          </Label>
          <Switch id={allDayId} checked={current.allDay} onCheckedChange={(allDay) => commit({ ...current, allDay })} />
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
          <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p role="status" aria-live="polite" className={cn("min-w-0 text-sm leading-5", summary ? "font-medium text-foreground" : "text-muted-foreground")}>
            {summary ?? text.incomplete}
          </p>
        </div>

        <div id={messageId} role="alert" className="empty:hidden">
          {message ? (
            <p className="flex items-start gap-2 text-sm leading-5 font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
