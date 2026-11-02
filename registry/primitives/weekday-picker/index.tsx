"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from "react";

import { IconInfo, IconRepeat } from "@rhs-ui/icons";
import {
  describeDays,
  dayNames,
  firstDayOf,
  normalise,
  PRESET_DAYS,
  sameDays,
  wordsFor,
  type WeekdayPreset,
  type WeekdayWords,
  type WeekStart,
} from "@rhs-ui/primitives/weekday-picker/days";
import { cn } from "@/lib/utils";

export type { WeekdayPreset, WeekdayPresetKey, WeekdayWords, WeekStart } from "@rhs-ui/primitives/weekday-picker/days";

export interface WeekdayPickerProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children" | "name" | "dir" | "disabled"> {
  /** What the days are for: "Repeat on", "Open on", "Remind me on". It is the legend of the group and names it for a screen reader. */
  legend?: string;
  /** Keep the legend for screen readers only, when the page already says it. */
  hideLegend?: boolean;
  /** The chosen days, as `getDay()` numbers: 0 is Sunday, 1 is Monday, up to 6 for Saturday. Use it to control the picker. */
  value?: readonly number[];
  /** The days to start with, when you do not control the picker. */
  defaultValue?: readonly number[];
  /** Called with the chosen days, in ascending order of number, whenever a chip or a preset changes them. */
  onValueChange?: (days: number[]) => void;
  /** The day the row starts on, 0 (Sunday) to 6. Default the first day of the week in `locale`: Sunday for en-US, Monday for en-GB and nl-NL. */
  weekStartsOn?: WeekStart;
  /** The language of the names of the days, and of the words of the summary where the picker has them (English, Dutch, German, French and Spanish). Default "en-US". */
  locale?: string;
  /** `letter` writes "M", `short` writes "Mon". Either way the chip is named by the whole day, "Monday". Default "letter". */
  variant?: "letter" | "short";
  /** Add preset chips that set the whole group: `true` for Weekdays, Weekend and Every day, or a list of those and your own `{ label, days }`. Default none. */
  presets?: boolean | readonly WeekdayPreset[];
  /** Keep at least one day chosen: the last chip refuses to turn off, and says why. Default false. */
  requireOne?: boolean;
  /** The field's name for a plain form submit: one hidden input per chosen day, holding its number. */
  name?: string;
  /** Turn the whole picker off. */
  disabled?: boolean;
  /** The words of the summary and of the preset chips, for another language or your own voice. The names of the days always come from the locale. */
  labels?: Partial<WeekdayWords>;
}

const PRESET_LABEL = { weekdays: "presetWeekdays", weekend: "presetWeekend", everyday: "presetEveryDay" } as const;

const TOUCH_BAND = "[@media(pointer:coarse)]:before:absolute [@media(pointer:coarse)]:before:content-['']";

/**
 * The days of the week as seven toggle chips, for anything that repeats or
 * applies on certain days: a schedule, reminders, opening hours. The names
 * come from the browser in the language you ask for ("M", "Mon", "maandag"),
 * and the week starts where the locale says it does. Every chip is a pressed
 * button named by the whole day. Under the chips a sentence puts the choice
 * into words ("Monday to Friday", "Weekends", "Every day", "Tuesday and
 * Thursday"), read out politely whenever it changes. Optional preset chips set
 * the whole group at once, and with `requireOne` the last chip refuses to turn
 * off and says why.
 */
export function WeekdayPicker({
  legend = "Repeat on",
  hideLegend,
  value,
  defaultValue,
  onValueChange,
  weekStartsOn,
  locale = "en-US",
  variant = "letter",
  presets = false,
  requireOne = false,
  name,
  disabled,
  labels,
  className,
  ...rest
}: WeekdayPickerProps) {
  const base = useId();
  const summaryId = `${base}-summary`;
  const requireId = `${base}-require`;
  const words = useMemo(() => wordsFor(locale, labels), [locale, labels]);
  const names = useMemo(() => dayNames(locale), [locale]);
  const first = weekStartsOn ?? firstDayOf(locale);
  const [own, setOwn] = useState(() => normalise(defaultValue));
  const [note, setNote] = useState<string | null>(null);
  const [refused, setRefused] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const days = value === undefined ? own : normalise(value);
  const row = Array.from({ length: 7 }, (_, index) => (first + index) % 7);
  const summary = describeDays(days, locale, words, names);
  const lone = requireOne && days.length === 1;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function write(next: number[]) {
    const sorted = normalise(next);
    window.clearTimeout(timer.current);
    setNote(null);
    setRefused(null);
    if (value === undefined) setOwn(sorted);
    onValueChange?.(sorted);
  }

  function refuse(day: number | null) {
    window.clearTimeout(timer.current);
    setNote(words.requireOne);
    setRefused(day);
    timer.current = window.setTimeout(() => {
      setNote(null);
      setRefused(null);
    }, 3200);
  }

  function toggle(day: number) {
    const on = days.includes(day);
    if (on && lone) return refuse(day);
    write(on ? days.filter((item) => item !== day) : [...days, day]);
  }

  const chips: readonly WeekdayPreset[] = presets === true ? ["weekdays", "weekend", "everyday"] : presets === false ? [] : presets;

  return (
    <fieldset
      data-slot="weekday-picker"
      aria-describedby={summaryId}
      className={cn("relative m-0 grid min-w-0 gap-3 border-0 p-0", className)}
      {...rest}
    >
      <legend className={cn("p-0 text-sm font-medium", hideLegend ? "sr-only" : "mb-1")}>{legend}</legend>

      {chips.length ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((preset) => {
            const label = typeof preset === "string" ? words[PRESET_LABEL[preset]] : preset.label;
            const target = typeof preset === "string" ? PRESET_DAYS[preset] : preset.days;
            const active = sameDays(days, target);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => (active ? (requireOne ? refuse(null) : write([])) : write([...target]))}
                className={cn(
                  "relative inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium whitespace-nowrap outline-none transition-[background-color,border-color,color,box-shadow] duration-150 motion-reduce:transition-none",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
                  "[@media(pointer:coarse)]:before:inset-x-0 [@media(pointer:coarse)]:before:-inset-y-[9px]",
                  TOUCH_BAND,
                  active ? "border-foreground bg-muted text-foreground" : "border-border text-muted-foreground enabled:hover:bg-muted/60 enabled:hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {row.map((day) => {
          const on = days.includes(day);
          return (
            <button
              key={day}
              type="button"
              data-slot="weekday-picker-day"
              data-selected={on ? "" : undefined}
              data-refused={refused === day ? "" : undefined}
              aria-pressed={on}
              aria-label={names.long[day]}
              aria-describedby={on && lone ? requireId : undefined}
              disabled={disabled}
              onClick={() => toggle(day)}
              className={cn(
                "relative grid min-w-0 cursor-pointer place-items-center justify-self-center rounded-full border border-border bg-background font-medium text-foreground select-none",
                "outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 motion-reduce:transition-none",
                "enabled:hover:bg-muted enabled:active:translate-y-px",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
                "data-[selected]:border-foreground data-[selected]:bg-foreground data-[selected]:text-background data-[selected]:enabled:hover:bg-foreground/90 data-[selected]:focus-visible:border-foreground",
                "data-[refused]:ring-[3px] data-[refused]:ring-foreground/30",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "[@media(pointer:coarse)]:before:-inset-[5.5px]",
                TOUCH_BAND,
                variant === "letter" ? "aspect-square w-full max-w-11 text-sm" : "h-9 w-full px-0.5 text-[0.8125rem]",
              )}
            >
              <span className="min-w-0 truncate">{variant === "letter" ? names.narrow[day] : names.short[day]}</span>
            </button>
          );
        })}
      </div>

      <p id={summaryId} role="status" aria-live="polite" className={cn("flex min-h-5 items-center gap-2 text-sm leading-5", note ? "text-foreground" : "text-muted-foreground")}>
        {note ? <IconInfo aria-hidden="true" className="size-4 shrink-0" /> : <IconRepeat aria-hidden="true" className="size-4 shrink-0" />}
        <span className={cn("min-w-0", !note && days.length > 0 && "font-medium text-foreground")}>{note ?? summary}</span>
      </p>
      {requireOne ? (
        <span id={requireId} className="sr-only">
          {words.requireOne}
        </span>
      ) : null}
      {name ? days.map((day) => <input key={day} type="hidden" name={name} value={day} disabled={disabled} />) : null}
    </fieldset>
  );
}
