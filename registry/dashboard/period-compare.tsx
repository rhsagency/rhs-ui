"use client";

import { useId } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface PeriodCompareValue {
  period: string;
  compare: boolean;
}

export interface PeriodCompareProps {
  periods: readonly { value: string; label: string }[];
  value: PeriodCompareValue;
  onValueChange: (value: PeriodCompareValue) => void;
  /** What the comparison is against, in words: "Previous period", "Same period last year". */
  compareLabel?: string;
  className?: string;
}

/**
 * The control row above a dashboard: the period (the house select) and a
 * switch to compare with the previous one, labelled with what it compares
 * against. One value object for both, so the charts below read the same
 * state.
 */
export function PeriodCompare({ periods, value, onValueChange, compareLabel = "Compare to previous period", className }: PeriodCompareProps) {
  const id = useId();
  return (
    <div data-slot="period-compare" className={cn("flex flex-wrap items-center gap-4", className)}>
      <Select value={value.period} onValueChange={(period) => onValueChange({ ...value, period })}>
        <SelectTrigger aria-label="Period" className="h-9 w-44"><SelectValue /></SelectTrigger>
        <SelectContent>{periods.map((period) => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex items-center gap-2 text-sm">
        <Switch id={id} checked={value.compare} onCheckedChange={(compare) => onValueChange({ ...value, compare })} />
        <label htmlFor={id} className="text-muted-foreground">{compareLabel}</label>
      </div>
    </div>
  );
}
