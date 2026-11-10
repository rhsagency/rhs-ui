"use client";

import { useEffect, useId, useMemo, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconBell, IconBellOff, IconMoon } from "@rhs-ui/icons";
import { DEFAULT_LABELS, dayNames, describeDays, fill, isOvernight, stretches, weekOrder, type QuietHoursLabels, type QuietHoursValue } from "@rhs-ui/application/quiet-hours-field/schedule";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { TimePicker } from "@rhs-ui/primitives/time-picker";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type { QuietHoursLabels, QuietHoursValue } from "@rhs-ui/application/quiet-hours-field/schedule";

export interface QuietHoursFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The schedule, when you control it. */
  value?: QuietHoursValue;
  /** The schedule to begin with, when the field keeps it itself. Default off, 22:00 to 07:00, every day. */
  defaultValue?: QuietHoursValue;
  /** Called with the whole schedule whenever the switch, a time or a day changes. A change the field refuses (the same time twice, no days at all) is not reported. */
  onValueChange?: (value: QuietHoursValue) => void;
  /** Minutes between the times in the lists. Default 15. */
  minuteStep?: number;
  /** The day the row of days starts on, 0 (Sunday) to 6. Default 1, Monday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** The language of the names of the days and of the sentence that lists them. Default "en-US". */
  locale?: string;
  /** Switch the whole field off, for instance while it is being saved. */
  disabled?: boolean;
  /** The words the field says, for translation. */
  labels?: QuietHoursLabels;
}

const FALLBACK: QuietHoursValue = { enabled: false, from: "22:00", to: "07:00", days: [0, 1, 2, 3, 4, 5, 6] };

/** A time and what it is for, as a group a screen reader can name: the picker's button only says "22:00". */
function TimeField({ label, value, step, invalid, describedBy, onChange }: { label: string; value: string; step: number; invalid: boolean; describedBy: string | undefined; onChange: (time: string) => void }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} aria-describedby={describedBy} data-invalid={invalid || undefined} className="grid gap-1.5">
      <span id={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <TimePicker value={value} onValueChange={onChange} step={step} min="00:00" max="23:59" className={cn("w-full", invalid && "border-destructive")} />
    </div>
  );
}

/** The 24 hours as a thin track with the quiet stretch filled in, in two pieces when it crosses midnight. Decorative: the summary says the same. */
function DayTrack({ from, to }: { from: string; to: string }) {
  return (
    <div aria-hidden="true" className="grid gap-1.5">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        {stretches(from, to).map(([start, end]) => (
          <span key={start} className="absolute inset-y-0 rounded-full bg-foreground transition-[left,width] duration-200 motion-reduce:transition-none" style={{ left: `${start / 14.4}%`, width: `${(end - start) / 14.4}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-[0.6875rem] text-muted-foreground tabular-nums">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}

/**
 * "Do not disturb" on a schedule, for the notification settings of an app: a
 * switch, a From and a To time, and the days the quiet starts on. A period
 * that crosses midnight (22:00 to 07:00) is valid and says so, with a thin
 * 24-hour track that shows where the quiet falls. The same time twice is
 * refused in words, and so is turning off the last day, and a refused change
 * is never reported. The days are toggle chips named by the whole weekday,
 * written in the language of `locale`, and a sentence under the field puts the
 * schedule into words ("Quiet from 22:00 to 07:00, Monday to Friday") in a
 * polite live region. Switching it off dims and locks the rest but clears
 * nothing, so switching it on again brings the old schedule back.
 */
export function QuietHoursField({ value, defaultValue, onValueChange, minuteStep = 15, weekStartsOn = 1, locale = "en-US", disabled, labels, className, ...props }: QuietHoursFieldProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const switchId = `${base}-switch`;
  const descriptionId = `${base}-description`;
  const refusalId = `${base}-refusal`;
  const [own, setOwn] = useState<QuietHoursValue>(defaultValue ?? FALLBACK);
  const [refusal, setRefusal] = useState<string | null>(null);
  const current = value ?? own;
  const names = useMemo(() => dayNames(locale), [locale]);
  const overnight = isOvernight(current.from, current.to);
  const phrase = describeDays(current.days, locale, text);
  const summary = fill(current.enabled ? text.summaryOn : text.summaryOff, { from: current.from, to: current.to, days: phrase });
  const locked = !current.enabled || Boolean(disabled);

  // A refusal is news for a few seconds; left on screen it would describe a field that has long been fine.
  useEffect(() => {
    if (!refusal) return;
    const timer = window.setTimeout(() => setRefusal(null), 6000);
    return () => window.clearTimeout(timer);
  }, [refusal]);

  function apply(next: Partial<QuietHoursValue>) {
    const merged: QuietHoursValue = { ...current, ...next, days: [...(next.days ?? current.days)].sort((a, b) => a - b) };
    setRefusal(null);
    if (value === undefined) setOwn(merged);
    onValueChange?.(merged);
  }

  function setTime(which: "from" | "to", time: string) {
    if (time === (which === "from" ? current.to : current.from)) {
      setRefusal(text.sameTime);
      return;
    }
    apply({ [which]: time });
  }

  return (
    <div data-slot="quiet-hours-field" data-state={current.enabled ? "on" : "off"} className={cn("@container grid w-full min-w-0 gap-5", className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <Label htmlFor={switchId} className="text-sm leading-5 font-medium">
            {text.title}
          </Label>
          <p id={descriptionId} className="text-sm leading-5 text-muted-foreground">
            {text.description}
          </p>
        </div>
        <Switch id={switchId} checked={current.enabled} disabled={disabled} aria-describedby={descriptionId} onCheckedChange={(enabled) => apply({ enabled })} className="mt-0.5 shrink-0" />
      </div>

      {/* Dimmed and out of reach while off, but still showing the schedule that will come back. */}
      <div inert={locked} className={cn("grid gap-5 transition-opacity duration-200 motion-reduce:transition-none", locked && "opacity-45")}>
        <div className="grid gap-4 @xs:grid-cols-2">
          <TimeField label={text.from} value={current.from} step={minuteStep} invalid={refusal === text.sameTime} describedBy={refusal === text.sameTime ? refusalId : undefined} onChange={(time) => setTime("from", time)} />
          <TimeField label={text.to} value={current.to} step={minuteStep} invalid={refusal === text.sameTime} describedBy={refusal === text.sameTime ? refusalId : undefined} onChange={(time) => setTime("to", time)} />
        </div>

        <div className="grid gap-3">
          <DayTrack from={current.from} to={current.to} />
          {overnight ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconMoon aria-hidden="true" className="size-3.5 shrink-0" />
              {fill(text.overnight, { to: current.to, from: current.from })}
            </p>
          ) : null}
        </div>

        <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-medium">{text.days}</legend>
          <ToggleGroup
            type="multiple"
            value={current.days.map(String)}
            onValueChange={(next) => {
              if (next.length === 0) {
                setRefusal(text.oneDay);
                return;
              }
              apply({ days: next.map(Number) });
            }}
            className="grid w-full grid-cols-7"
          >
            {weekOrder(weekStartsOn).map((day) => (
              // The name is the whole day, and it carries the letters on the chip as a word of its own ("Monday, Mon"), so someone who says what they see to a voice control hits the right chip.
              <ToggleGroupItem key={day} value={String(day)} aria-label={names.short[day] === names.long[day] ? names.long[day] : `${names.long[day]}, ${names.short[day]}`} className="min-w-0 px-0 text-[0.8125rem] focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid">
                {names.short[day]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </fieldset>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
        {current.enabled ? <IconBellOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <IconBell aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
        <p role="status" aria-live="polite" className={cn("min-w-0 text-sm leading-5", current.enabled ? "font-medium text-foreground" : "text-muted-foreground")}>
          {summary}
        </p>
      </div>

      <div id={refusalId} role="alert" className="empty:hidden">
        {refusal ? (
          <p className="flex items-start gap-2 text-sm leading-5 font-medium text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {refusal}
          </p>
        ) : null}
      </div>
    </div>
  );
}
