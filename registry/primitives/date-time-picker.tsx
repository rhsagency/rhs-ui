import { DatePicker } from "@rhs-ui/primitives/date-picker";
import { TimePicker } from "@rhs-ui/primitives/time-picker";
import { cn } from "@/lib/utils";

export interface DateTimeValue {
  date: Date | null;
  /** "HH:MM", 24-hour. */
  time: string | null;
}

export interface DateTimePickerProps {
  value: DateTimeValue;
  onValueChange: (value: DateTimeValue) => void;
  /** Minutes between time slots. */
  step?: number;
  /** First and last slot of the day. */
  min?: string;
  max?: string;
  /** Taken slots for the chosen day. */
  unavailable?: readonly string[];
  /** Field name: submits "yyyy-mm-ddThh:mm" (local, no zone) once both parts are set. */
  name?: string;
  locale?: string;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-04-14T10:30" from the parts, or "" while either is missing. */
export function toLocalDateTime({ date, time }: DateTimeValue): string {
  return date && time ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}` : "";
}

/**
 * An appointment in two steps that read as one: a day from the calendar and
 * a time from the slot list beside it, side by side on wide screens and
 * stacked on a phone. The time waits for a day, and one hidden input submits
 * the combined local date and time.
 */
export function DateTimePicker({ value, onValueChange, step = 30, min = "09:00", max = "17:00", unavailable = [], name, locale = "en-GB", className }: DateTimePickerProps) {
  return (
    <div data-slot="date-time-picker" className={cn("grid gap-2 sm:grid-cols-[1fr_auto]", className)}>
      <DatePicker value={value.date} onValueChange={(date) => onValueChange({ date, time: value.time })} locale={locale} placeholder="Pick a day" />
      <div className={cn(!value.date && "pointer-events-none opacity-50")} aria-disabled={!value.date || undefined}>
        <TimePicker value={value.time} onValueChange={(time) => onValueChange({ date: value.date, time })} step={step} min={min} max={max} unavailable={unavailable} placeholder={value.date ? "Pick a time" : "Day first"} />
      </div>
      {name ? <input type="hidden" name={name} value={toLocalDateTime(value)} /> : null}
    </div>
  );
}
