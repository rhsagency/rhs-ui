"use client";

import { useState } from "react";

import { IconCalendarCheck, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface BookingDay {
  /** Machine value: "2026-04-14". */
  id: string;
  /** "Tue", "14 Apr", formatted by you. */
  weekday: string;
  date: string;
  /** Free slots as "09:30"; an empty list shows the day as full. */
  slots: readonly string[];
}

export interface BookingSectionProps {
  title: string;
  description?: string;
  /** "30 minutes, video call". */
  duration: string;
  days: readonly BookingDay[];
  /** Resolve to confirm, reject to show the error. */
  onBook: (day: string, slot: string) => Promise<void> | void;
  className?: string;
}

/**
 * Book a call without leaving the page: pick a day, pick a time, confirm.
 * Days and times are radio groups (arrow keys move, one tab stop each), full
 * days are disabled, and the confirmation names the slot you got.
 */
export function BookingSection({ title, description, duration, days, onBook, className }: BookingSectionProps) {
  const firstOpen = days.find((day) => day.slots.length)?.id ?? "";
  const [day, setDay] = useState(firstOpen);
  const [slot, setSlot] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const current = days.find((item) => item.id === day);
  async function book() {
    if (!day || !slot) return;
    setState("busy");
    try {
      await onBook(day, slot);
      setState("done");
    } catch {
      setState("error");
    }
  }
  const option = "relative rounded-xl border border-border px-3 py-2.5 text-sm outline-none transition-colors has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:disabled]:opacity-40 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 hover:bg-muted has-[:checked]:hover:bg-foreground";
  return (
    <section data-slot="booking-section" className={cn("grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_1.4fr] lg:gap-16", className)}>
      <div>
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        <p className="mt-6 inline-flex items-center gap-2 text-sm"><IconClock className="size-4" />{duration}</p>
      </div>
      <div className="rounded-3xl border border-border p-6 sm:p-8">
        {state === "done" ? (
          <p role="status" className="flex flex-col items-center gap-3 py-10 text-center">
            <IconCalendarCheck className="size-8" />
            <span className="text-lg font-medium">Booked: {current?.weekday} {current?.date} at {slot}</span>
            <span className="text-sm text-muted-foreground">The invite is on its way to your inbox.</span>
          </p>
        ) : (
          <>
            <fieldset>
              <legend className="text-sm font-medium">Day</legend>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {days.map((item) => (
                  <label key={item.id} className={cn(option, "flex cursor-pointer flex-col items-center")}>
                    <input type="radio" name="booking-day" value={item.id} checked={day === item.id} disabled={!item.slots.length} onChange={() => { setDay(item.id); setSlot(""); }} className="sr-only" />
                    <span className="text-xs opacity-70">{item.weekday}</span>
                    <span className="font-medium">{item.date}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-6">
              <legend className="text-sm font-medium">Time</legend>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {current?.slots.map((time) => (
                  <label key={time} className={cn(option, "cursor-pointer text-center tabular-nums")}>
                    <input type="radio" name="booking-slot" value={time} checked={slot === time} onChange={() => setSlot(time)} className="sr-only" />
                    {time}
                  </label>
                ))}
              </div>
            </fieldset>
            <Button size="lg" className="mt-8 w-full" disabled={!slot} loading={state === "busy"} onClick={book}>
              {slot ? `Book ${current?.weekday} at ${slot}` : "Pick a time"}
            </Button>
            {state === "error" ? <p role="alert" className="mt-3 text-sm text-destructive">That slot was just taken. Please pick another.</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
