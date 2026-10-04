"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface ScheduleSlot {
  id: string;
  /** "09:30". */
  start: string;
  end: string;
  title: string;
  /** Speaker names, comma separated by you. */
  speakers?: string;
  /** "Main stage", "Room B". */
  room?: string;
  kind?: "talk" | "workshop" | "break";
}

export interface ScheduleDay {
  id: string;
  /** "Day 1, Thu 12 June". */
  label: string;
  slots: readonly ScheduleSlot[];
}

export interface EventScheduleProps {
  title: string;
  days: readonly ScheduleDay[];
  /** "All times in CEST." Say the time zone once. */
  timezoneNote: string;
  className?: string;
}

/**
 * The programme of a conference or a course: a tab per day, then the slots
 * in order with time, title, speakers and room, breaks quieter than talks,
 * and the time zone said once. Each slot is a list item with its times as
 * text, so the order reads the same without the layout.
 */
export function EventSchedule({ title, days, timezoneNote, className }: EventScheduleProps) {
  const [day, setDay] = useState(days[0]?.id ?? "");
  const current = days.find((d) => d.id === day);
  return (
    <section data-slot="event-schedule" className={cn("mx-auto max-w-4xl py-16 sm:py-20", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{timezoneNote}</p>
      </div>
      <div role="group" aria-label="Day" className="mt-6 flex flex-wrap gap-2">
        {days.map((d) => <button key={d.id} type="button" aria-pressed={d.id === day} onClick={() => setDay(d.id)} className="rounded-full border border-border px-4 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background">{d.label}</button>)}
      </div>
      <ol aria-label={current?.label} className="mt-6 divide-y divide-border border-y border-border">
        {current?.slots.map((slot) => (
          <li key={slot.id} className={cn("grid gap-1 py-4 sm:grid-cols-[8rem_1fr_9rem] sm:gap-6", slot.kind === "break" && "text-muted-foreground")}>
            <p className="text-sm tabular-nums">{slot.start} to {slot.end}</p>
            <div>
              <p className={cn(slot.kind === "break" ? "text-sm" : "font-medium")}>{slot.title}{slot.kind === "workshop" ? <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[11px] font-normal">Workshop</span> : null}</p>
              {slot.speakers ? <p className="mt-0.5 text-sm text-muted-foreground">{slot.speakers}</p> : null}
            </div>
            {slot.room ? <p className="text-sm text-muted-foreground sm:text-right">{slot.room}</p> : <span />}
          </li>
        ))}
      </ol>
    </section>
  );
}
