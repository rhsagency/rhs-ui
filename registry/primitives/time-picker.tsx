"use client";

import { useEffect, useRef, useState } from "react";

import { IconClock } from "@rhs-ui/icons";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  /** "HH:MM" in 24-hour time, or null. */
  value: string | null;
  onValueChange: (time: string) => void;
  /** Minutes between slots. */
  step?: number;
  /** First and last slot, "HH:MM". */
  min?: string;
  max?: string;
  /** Slots that are taken. */
  unavailable?: readonly string[];
  placeholder?: string;
  className?: string;
}

function slots(min: string, max: string, step: number) {
  const [h1, m1] = min.split(":").map(Number);
  const [h2, m2] = max.split(":").map(Number);
  const out: string[] = [];
  for (let t = (h1 ?? 0) * 60 + (m1 ?? 0); t <= (h2 ?? 23) * 60 + (m2 ?? 59); t += step) out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  return out;
}

/**
 * A time field that opens a list of slots instead of a fiddly spinner:
 * every step minutes between min and max, taken slots disabled, and the
 * chosen one scrolled into view. Arrow keys move through the list.
 */
export function TimePicker({ value, onValueChange, step = 15, min = "08:00", max = "18:00", unavailable = [], placeholder = "Pick a time", className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const options = slots(min, max, step);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const target = list.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? list.current?.querySelector<HTMLButtonElement>("button:not([disabled])");
      target?.scrollIntoView({ block: "center" });
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
  function move(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[Math.max(0, Math.min(buttons.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger data-slot="time-picker" className={cn(fieldSurface, "inline-flex h-9 w-36 items-center gap-2 px-3 text-left", !value && "text-muted-foreground", className)}>
        <IconClock className="size-4 text-muted-foreground" />
        <span className="tabular-nums">{value ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-40 p-1">
        <ul ref={list} role="listbox" aria-label="Times" onKeyDown={move} className="relative max-h-64 overflow-y-auto">
          {options.map((option) => {
            const taken = unavailable.includes(option);
            return (
              <li key={option}>
                <button type="button" role="option" aria-selected={option === value} disabled={taken} onClick={() => { onValueChange(option); setOpen(false); }} className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm tabular-nums outline-none hover:bg-muted focus-visible:bg-muted aria-selected:bg-foreground aria-selected:text-background disabled:text-muted-foreground disabled:line-through">
                  {option}
                  {taken ? <span className="sr-only">, taken</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
