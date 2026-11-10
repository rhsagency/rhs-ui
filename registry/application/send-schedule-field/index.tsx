"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCalendarCheck, IconSend } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  dayLabel,
  draftOf,
  fill,
  gmtLabel,
  instantOfDraft,
  isoAt,
  millisecondsOf,
  nextSlot,
  offsetAt,
  pad,
  relative,
  safeZone,
  wallAt,
  type Draft,
  type SendScheduleLabels,
  type SendScheduleValue,
} from "@rhs-ui/application/send-schedule-field/zone";
import { DateTimePicker } from "@rhs-ui/primitives/date-time-picker";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { cn } from "@/lib/utils";

export type { SendScheduleLabels, SendScheduleValue } from "@rhs-ui/application/send-schedule-field/zone";

export interface SendScheduleFieldProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children"> {
  /** What is chosen, when you control it. `at` is an ISO time with an offset ("2026-10-27T09:00:00+01:00"), and null while the day or the time is missing or was refused. */
  value?: SendScheduleValue;
  /** What is chosen to begin with, when the field keeps it itself. Default send now. */
  defaultValue?: SendScheduleValue;
  /** Called with the mode and the time whenever either changes. A time that is too soon is reported as `at: null`, so a Send button can wait for a good one. */
  onValueChange?: (value: SendScheduleValue) => void;
  /** The least time between now and the send, in minutes. Anything sooner is refused. Default 15. */
  minLeadMinutes?: number;
  /** The zone the times are read and written in, as an IANA name: the reader's own, usually. It is named under the pickers and in the sentence. Default "UTC". */
  timeZone?: string;
  /** Minutes between the times in the list. Default 15. */
  minuteStep?: number;
  /** The language of the dates and of "in 3 days". Default "en-US". */
  locale?: string;
  /** The moment to count from, as a Date, milliseconds or ISO text: for tests and previews. Default the browser's clock, read after the page has loaded, so the server and the browser agree. */
  now?: Date | number | string;
  /** What the group is called. It is the legend, so a screen reader names the group before the first choice. Default "When should it go out?" */
  legend?: ReactNode;
  /** Keep the legend for screen readers only, when the page has a heading of its own. */
  hideLegend?: boolean;
  /** The words the field says, for translation. */
  labels?: SendScheduleLabels;
}

interface OptionProps {
  id: string;
  value: "now" | "later";
  selected: boolean;
  title: string;
  hint: string;
  children?: ReactNode;
}

/** A choice as a card: the whole card is the click target, and what it reveals sits above that target so it stays usable. */
function Option({ id, value, selected, title, hint, children }: OptionProps) {
  return (
    <div
      data-state={selected ? "selected" : "idle"}
      className={cn("relative rounded-lg border p-4 transition-colors duration-150 motion-reduce:transition-none", selected ? "border-foreground bg-card" : "border-border hover:bg-muted/40")}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem id={id} value={value} aria-describedby={`${id}-hint`} className="mt-0.5" />
        <div className="grid min-w-0 gap-0.5">
          <Label htmlFor={id} className="text-sm leading-5 font-medium after:absolute after:inset-0 after:content-['']">
            {title}
          </Label>
          <p id={`${id}-hint`} className="text-sm leading-5 text-pretty text-muted-foreground">
            {hint}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * The choice at the end of a campaign, a post or an export: send now, or
 * schedule for later. Choosing Schedule opens a day and a time from the house
 * pickers. A time inside the lead time (`minLeadMinutes`, 15 by default) or in
 * the past is refused with a message that names the earliest time that works,
 * and is reported as `at: null`. A sentence under the choices always says the
 * result in the zone you give ("Goes out Tue 27 Oct at 09:00, Europe/Amsterdam,
 * in 3 days") in a polite live region, so a change is read out. The two
 * choices are a real radio group (arrow keys move and choose), and a time
 * comes back as an ISO string with the zone's offset at that moment, daylight
 * saving included. Pass `now` for a fixed clock; without it the field reads
 * the browser's clock once the page has loaded and every half minute after.
 */
export function SendScheduleField({
  value,
  defaultValue,
  onValueChange,
  minLeadMinutes = 15,
  timeZone = "UTC",
  minuteStep = 15,
  locale = "en-US",
  now,
  legend,
  hideLegend,
  disabled,
  labels,
  className,
  ...props
}: SendScheduleFieldProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const legendId = `${base}-legend`;
  const zone = safeZone(timeZone);
  const [own, setOwn] = useState<SendScheduleValue>(defaultValue ?? { mode: "now", at: null });
  const current = value ?? own;
  const [draft, setDraft] = useState<Draft>(() => draftOf(current.at, zone));
  const [seen, setSeen] = useState(current.at);
  const [clock, setClock] = useState<number | null>(null);

  // A time that arrives from outside replaces what was picked. What the field reported itself is already in `seen`.
  if (current.at !== seen) {
    setSeen(current.at);
    setDraft(draftOf(current.at, zone));
  }

  const fixed = now === undefined ? null : millisecondsOf(now);
  useEffect(() => {
    if (fixed !== null) return;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [fixed]);
  const nowMs = fixed ?? clock;

  const later = current.mode === "later";
  // The first time on the list that is far enough away: it is what the message names, and it is allowed. The list is laid out on the zone's clock, so it is rounded there.
  const earliest = nowMs === null ? null : nextSlot(nowMs + minLeadMinutes * 60_000, Math.max(1, minuteStep), zone);
  const instant = draft.date && draft.time ? instantOfDraft(draft.date, draft.time, zone) : null;
  const refused = later && instant !== null && earliest !== null && instant < earliest;
  const passed = refused && nowMs !== null && instant !== null && instant < nowMs;

  const whenOf = (at: number) => {
    const wall = wallAt(zone, at);
    return fill(text.at, { date: dayLabel(wall, locale), time: `${pad(wall.hour)}:${pad(wall.minute)}` });
  };
  const earliestLabel = earliest === null ? null : whenOf(earliest);

  function report(next: SendScheduleValue) {
    setSeen(next.at);
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  // The clock moving on can make a time that was fine too soon: tell the form, which then holds no time.
  useEffect(() => {
    if (refused && current.at !== null) {
      setSeen(null);
      if (value === undefined) setOwn({ mode: "later", at: null });
      onValueChange?.({ mode: "later", at: null });
    }
  }, [refused, current.at, value, onValueChange]);

  function choose(next: string) {
    const mode = next === "later" ? "later" : "now";
    const good = mode === "later" && instant !== null && (earliest === null || instant >= earliest);
    report({ mode, at: good && instant !== null ? isoAt(zone, instant) : null });
  }

  function pick(next: Draft) {
    setDraft(next);
    const at = next.date && next.time ? instantOfDraft(next.date, next.time, zone) : null;
    const good = at !== null && (earliest === null || at >= earliest);
    report({ mode: "later", at: good && at !== null ? isoAt(zone, at) : null });
  }

  // The offset the pickers are read at: the picked time, else the earliest one, else now.
  const reference = instant ?? earliest ?? nowMs;
  const offset = reference === null ? null : gmtLabel(offsetAt(zone, reference));
  const sentence = !later
    ? text.sentenceNow
    : current.at !== null && instant !== null
      ? fill(nowMs === null ? text.sentenceLaterQuiet : text.sentenceLater, { when: whenOf(instant), zone, relative: nowMs === null ? "" : relative(nowMs, instant, locale) })
      : refused
        ? text.sentenceRefused
        : text.sentencePick;
  const problem = !refused || !earliestLabel ? null : fill(passed ? text.past : text.soon, { when: earliestLabel });

  return (
    <fieldset data-slot="send-schedule-field" disabled={disabled} className={cn("@container m-0 min-w-0 border-0 p-0", className)} {...props}>
      <legend id={legendId} className={cn("p-0 text-sm font-medium", hideLegend ? "sr-only" : "mb-3")}>
        {legend ?? text.legend}
      </legend>

      <div className="grid gap-3">
        <RadioGroup value={current.mode} onValueChange={choose} aria-labelledby={legendId} className="gap-2.5">
          <Option id={`${base}-now`} value="now" selected={!later} title={text.now} hint={text.nowHint} />
          <Option id={`${base}-later`} value="later" selected={later} title={text.later} hint={text.laterHint}>
            {/* The pickers sit above the card's click target and out of the tab order until Schedule is chosen. */}
            <div className={cn("relative z-10 grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none", later ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div inert={!later} className="-mx-1 -mb-1 min-h-0 overflow-hidden px-1 pb-1">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 pt-4 @md:pl-7">
                  {/* The picker puts day and time side by side from the screen's `sm`; here it does so from the field's own width, so a narrow card stacks them instead of cutting the time off. The triggers drop their minimum width (a day field is 12rem otherwise) so a field narrower than that shrinks them rather than being clipped, and the column above may shrink so the messages wrap. */}
                  <DateTimePicker
                    value={draft}
                    onValueChange={pick}
                    step={minuteStep}
                    min="00:00"
                    max="23:59"
                    locale={locale}
                    className="sm:grid-cols-1 @md:grid-cols-[1fr_auto] @max-md:[&_[data-slot=time-picker]]:w-full [&_[data-slot=date-picker]]:min-w-0 [&_[data-slot=time-picker]]:min-w-0"
                  />
                  {problem ? (
                    <p role="alert" className="flex items-start gap-2 text-sm leading-5 font-medium text-destructive">
                      <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      {problem}
                    </p>
                  ) : earliestLabel ? (
                    <p className="text-xs text-muted-foreground">{fill(text.earliest, { when: earliestLabel })}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{offset === null ? fill(text.zoneOnly, { zone }) : fill(text.zoneNote, { zone, offset })}</p>
                </div>
              </div>
            </div>
          </Option>
        </RadioGroup>

        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
          {later ? <IconCalendarCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <IconSend aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
          <p role="status" aria-live="polite" className={cn("min-w-0 text-sm leading-5", current.at !== null || !later ? "font-medium text-foreground" : "text-muted-foreground")}>
            {sentence}
          </p>
        </div>
      </div>
    </fieldset>
  );
}
