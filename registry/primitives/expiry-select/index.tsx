"use client";

import { useId, useState, useSyncExternalStore, type ComponentProps } from "react";

import { IconAlertCircle, IconCalendar, IconInfinity } from "@rhs-ui/icons";
import { DatePicker } from "@rhs-ui/primitives/date-picker";
import {
  addDays,
  dateIn,
  DEFAULT_LABELS,
  DEFAULT_PRESETS,
  fromLocalDate,
  startOf,
  toLocalDate,
  writeDate,
  type ExpiryLabels,
  type ExpiryPreset,
} from "@rhs-ui/primitives/expiry-select/expiry";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export type { ExpiryLabels, ExpiryPreset } from "@rhs-ui/primitives/expiry-select/expiry";

export interface ExpirySelectProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The end date as a calendar date, "2026-12-02", or `null` for never. Use it to control the field. */
  value?: string | null;
  /** The date to start with, when you do not control the field. Nothing is chosen when you give none. */
  defaultValue?: string | null;
  /** Called with the date the choice comes to, always as an absolute calendar date, or `null` for never. */
  onValueChange?: (value: string | null) => void;
  /** The ready-made lengths, `{ label, days }`. Default 1 day, 7 days, 30 days, 90 days and 1 year. */
  presets?: readonly ExpiryPreset[];
  /** What the lengths count from: a date ("2026-11-02"), a Date or a timestamp. Default now. */
  from?: Date | string | number;
  /** Add a Never choice. It says so in words, never an empty field. Default false. */
  allowNever?: boolean;
  /** The latest date that can be chosen, "2027-11-02". A preset that would end after it is turned off, and the date picker stops there. */
  max?: string;
  /** The language the dates are written in: "en-GB" gives "Tue 17 Nov 2026", the default "en-US" gives "Tue, Nov 17, 2026". */
  locale?: string;
  /** The time zone that decides what day "now" is, and so where a preset lands. Default "UTC". */
  timeZone?: string;
  /** The field's name for a plain form submit: the date as "2026-12-02", or "never". */
  name?: string;
  /** The id of the select, so a form label's `htmlFor` can point at it. */
  id?: string;
  /** The name of the field for a screen reader, when there is no visible label. */
  "aria-label"?: string;
  /** The id of the element that names the field. */
  "aria-labelledby"?: string;
  /** Marks the field as not accepted. A date that has passed, or is past `max`, marks it by itself. */
  "aria-invalid"?: boolean | "true" | "false";
  /** Turn the field off. */
  disabled?: boolean;
  /** The words of the field, for another language or your own voice. */
  labels?: Partial<ExpiryLabels>;
}

const noSubscription = (): (() => void) => () => undefined;

/**
 * The choice of how long something lasts, for API keys, invitations, share
 * links, coupons and trials. A select with ready-made lengths ("7 days", "30
 * days") and, when you want them, a custom date and Never. Whatever is chosen
 * becomes an absolute date, so what is stored cannot drift with the clock, and
 * a polite line under the field writes it out ("Expires Tue 17 Nov 2026"), or
 * says "Never expires" in words. A custom date opens the house date picker,
 * which stops at `max`; a date that has passed is refused with a message. The
 * list is the house select, so it keeps its keyboard behaviour.
 */
export function ExpirySelect({
  value,
  defaultValue,
  onValueChange,
  presets = DEFAULT_PRESETS,
  from,
  allowNever = false,
  max,
  locale = "en-US",
  timeZone = "UTC",
  name,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-invalid": invalidProp,
  disabled,
  labels,
  className,
  ...rest
}: ExpirySelectProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const triggerId = id ?? `${base}-trigger`;
  const lineId = `${base}-line`;
  const dateId = `${base}-date`;
  const [own, setOwn] = useState<string | null | undefined>(defaultValue);
  const [pick, setPick] = useState<{ key: string; date: string | null } | null>(null);
  // Today is the reader's today: known only in the browser, so the server writes nothing that depends on it and nothing mismatches.
  const clock = useSyncExternalStore(noSubscription, () => dateIn(timeZone), () => null);
  const start = from !== undefined ? startOf(from, timeZone) : clock;
  const current = value !== undefined ? value : own;
  const date = typeof current === "string" ? current : null;

  // What the select shows. A choice made just now stands as long as the value is still what it produced; otherwise the value says what it is.
  const matched = start && date ? presets.findIndex((preset) => addDays(start, preset.days) === date) : -1;
  const key =
    pick && pick.date === (current ?? null) && current !== undefined
      ? pick.key
      : current === undefined
        ? ""
        : current === null
          ? "never"
          : matched >= 0
            ? `p${matched}`
            : "custom";

  function commit(next: string | null) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function choose(next: string) {
    const today = start ?? dateIn(timeZone);
    if (next === "never") {
      setPick({ key: next, date: null });
      commit(null);
      return;
    }
    if (next === "custom") {
      // The picker opens on a date: the one there is, or a month ahead, kept between today and the limit.
      let seed = date ?? addDays(today, 30);
      if (max && seed > max) seed = max;
      if (seed < today) seed = today;
      setPick({ key: next, date: seed });
      if (seed !== current) commit(seed);
      return;
    }
    const preset = presets[Number(next.slice(1))];
    if (!preset) return;
    const target = addDays(today, preset.days);
    setPick({ key: next, date: target });
    commit(target);
  }

  const error = date === null ? null : start && date < start ? text.past : max && date > max ? text.beyond(writeDate(max, locale)) : null;
  const line = error ?? (current === null ? text.neverExpires : date ? text.expires(writeDate(date, locale)) : "");
  const Mark = error ? IconAlertCircle : current === null ? IconInfinity : IconCalendar;
  const minDay = start ? toLocalDate(start) : null;
  const maxDay = max ? toLocalDate(max) : null;

  return (
    <div data-slot="expiry-select" data-invalid={error ? "" : undefined} className={cn("grid w-full min-w-0 gap-2", className)} {...rest}>
      <Select value={key} onValueChange={choose} disabled={disabled}>
        <SelectTrigger
          id={triggerId}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={line ? lineId : undefined}
          aria-invalid={Boolean(error) || invalidProp === true || invalidProp === "true" || undefined}
        >
          <SelectValue placeholder={text.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset, index) => {
            const resolved = start ? addDays(start, preset.days) : null;
            const tooLong = Boolean(resolved && max && resolved > max);
            return (
              <SelectItem key={`${preset.days}-${preset.label}`} value={`p${index}`} disabled={tooLong} description={tooLong && max ? text.tooLong(writeDate(max, locale)) : resolved ? writeDate(resolved, locale) : undefined}>
                {preset.label}
              </SelectItem>
            );
          })}
          <SelectSeparator />
          <SelectItem value="custom">{text.custom}</SelectItem>
          {allowNever || current === null ? <SelectItem value="never">{text.never}</SelectItem> : null}
        </SelectContent>
      </Select>

      {key === "custom" ? (
        <div className="grid gap-1.5">
          <label htmlFor={dateId} className="sr-only">
            {text.dateLabel}
          </label>
          <DatePicker
            id={dateId}
            value={date ? toLocalDate(date) : null}
            min={minDay ?? undefined}
            max={maxDay ?? undefined}
            locale={locale}
            format={{ day: "numeric", month: "long", year: "numeric" }}
            disabled={disabled}
            onValueChange={(picked) => {
              const next = fromLocalDate(picked);
              setPick({ key: "custom", date: next });
              commit(next);
            }}
          />
        </div>
      ) : null}

      <p id={lineId} role="status" aria-live="polite" className={cn("flex min-h-5 items-center gap-1.5 text-xs leading-5", error ? "font-medium text-destructive" : "text-muted-foreground")}>
        {line ? (
          <>
            <Mark aria-hidden="true" className="size-3.5 shrink-0" />
            <span>{line}</span>
          </>
        ) : null}
      </p>
      {name && current !== undefined ? <input type="hidden" name={name} value={current === null ? "never" : current} disabled={disabled} /> : null}
    </div>
  );
}
