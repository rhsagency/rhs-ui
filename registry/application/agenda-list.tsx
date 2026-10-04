import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AgendaEvent {
  id: string;
  title: string;
  /** Already formatted in the reader's zone: "09:30". */
  start: string;
  end?: string;
  /** ISO start for the time element. */
  dateTime: string;
  location?: string;
  /** Faces or a count of attendees. */
  people?: ReactNode;
  /** Highlight the event that is happening now. */
  now?: boolean;
}

export interface AgendaDay {
  /** "Today", "Tue 14 April". */
  label: string;
  events: readonly AgendaEvent[];
}

export interface AgendaListProps {
  days: readonly AgendaDay[];
  className?: string;
}

/**
 * The days ahead as a list: day headings, then events with time on the left
 * and what, where and who on the right. The current event is marked in text
 * and with a bar. Format times before passing them in.
 */
export function AgendaList({ days, className }: AgendaListProps) {
  return (
    <div data-slot="agenda-list" className={cn("space-y-6", className)}>
      {days.map((day) => (
        <section key={day.label}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{day.label}</h3>
          {day.events.length ? (
            <ol className="divide-y divide-border rounded-xl border border-border">
              {day.events.map((event) => (
                <li key={event.id} className={cn("relative grid grid-cols-[4.5rem_1fr] gap-4 p-4", event.now && "bg-muted/60")}>
                  {event.now ? <span aria-hidden="true" className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-foreground" /> : null}
                  <time dateTime={event.dateTime} className="text-sm tabular-nums">
                    {event.start}
                    {event.end ? <span className="block text-xs text-muted-foreground">{event.end}</span> : null}
                  </time>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {event.title}
                      {event.now ? <span className="ml-2 rounded-full bg-foreground px-1.5 py-0.5 text-[0.625rem] font-normal text-background">Now</span> : null}
                    </p>
                    {event.location ? <p className="truncate text-xs text-muted-foreground">{event.location}</p> : null}
                    {event.people ? <div className="mt-2">{event.people}</div> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nothing planned.</p>
          )}
        </section>
      ))}
    </div>
  );
}
