"use client";

import { useId } from "react";

import { Slider } from "@rhs-ui/primitives/slider";
import { cn } from "@/lib/utils";

export interface RangeSliderProps {
  label: string;
  value: readonly [number, number];
  onValueChange: (value: [number, number]) => void;
  min: number;
  max: number;
  step?: number;
  /** How a value is printed: "€120", "25 km". */
  format?: (value: number) => string;
  className?: string;
}

/**
 * A minimum and a maximum on one track, with number fields that type the
 * same values: for price filters and ranges. The two stay in order; typing
 * a minimum above the maximum moves the maximum with it.
 */
export function RangeSlider({ label, value, onValueChange, min, max, step = 1, format = String, className }: RangeSliderProps) {
  const id = useId();
  const [low, high] = value;
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
  const box = "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";
  return (
    <div data-slot="range-slider" role="group" aria-labelledby={`${id}-label`} className={cn("grid gap-3", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span id={`${id}-label`} className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{format(low)} – {format(high)}</span>
      </div>
      <Slider value={[low, high]} min={min} max={max} step={step} thumbLabels={[`Minimum ${label.toLowerCase()}`, `Maximum ${label.toLowerCase()}`]} onValueChange={([a = low, b = high]) => onValueChange([a, b])} minStepsBetweenThumbs={1} />
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-xs text-muted-foreground">Minimum<input type="number" inputMode="numeric" className={box} value={low} min={min} max={max} step={step} onChange={(event) => { const next = clamp(Number(event.target.value)); onValueChange([next, Math.max(next, high)]); }} /></label>
        <label className="grid gap-1 text-xs text-muted-foreground">Maximum<input type="number" inputMode="numeric" className={box} value={high} min={min} max={max} step={step} onChange={(event) => { const next = clamp(Number(event.target.value)); onValueChange([Math.min(low, next), next]); }} /></label>
      </div>
    </div>
  );
}
