import { useId } from "react";

import { cn } from "@/lib/utils";

export interface DurationInputProps {
  /** Total minutes. */
  value: number;
  onValueChange: (minutes: number) => void;
  label: string;
  /** Show a days field too, for long durations. */
  days?: boolean;
  /** Quick picks in minutes: [15, 30, 60]. */
  presets?: readonly number[];
  className?: string;
}

const split = (minutes: number, withDays: boolean) => {
  const d = withDays ? Math.floor(minutes / 1440) : 0;
  const rest = minutes - d * 1440;
  return { d, h: Math.floor(rest / 60), m: rest % 60 };
};

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : "", m || !h ? `${m} min` : ""].filter(Boolean).join(" ");
}

/**
 * A duration as hours and minutes (and days if you want them), each its own
 * small number field under one group label, so nobody has to type "1:30" or
 * "90" and guess the unit. Presets fill it in one tap; the value you get is
 * total minutes.
 */
export function DurationInput({ value, onValueChange, label, days = false, presets = [], className }: DurationInputProps) {
  const id = useId();
  const parts = split(value, days);
  const set = (patch: Partial<typeof parts>) => {
    const next = { ...parts, ...patch };
    onValueChange(Math.max(0, next.d * 1440 + next.h * 60 + next.m));
  };
  const field = (key: "d" | "h" | "m", unit: string, max?: number) => (
    <label className="relative flex items-center rounded-md border border-input bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40">
      <input type="number" inputMode="numeric" min={0} max={max} value={parts[key]} onChange={(event) => set({ [key]: Math.min(max ?? Infinity, Math.max(0, Number(event.target.value) || 0)) })} className="h-9 w-14 bg-transparent pl-3 text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" aria-label={unit} />
      <span aria-hidden="true" className="pr-3 text-xs text-muted-foreground">{unit === "hours" ? "h" : unit === "minutes" ? "min" : "d"}</span>
    </label>
  );
  return (
    <fieldset data-slot="duration-input" aria-describedby={`${id}-total`} className={cn("grid gap-2", className)}>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {days ? field("d", "days") : null}
        {field("h", "hours", days ? 23 : undefined)}
        {field("m", "minutes", 59)}
        {presets.length ? (
          <span className="ml-1 flex flex-wrap gap-1">
            {presets.map((preset) => (
              <button key={preset} type="button" onClick={() => onValueChange(preset)} aria-pressed={value === preset} className="rounded-full border border-border px-2.5 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background">{formatDuration(preset)}</button>
            ))}
          </span>
        ) : null}
      </div>
      <p id={`${id}-total`} className="text-xs text-muted-foreground">Total: {formatDuration(value)}</p>
    </fieldset>
  );
}
