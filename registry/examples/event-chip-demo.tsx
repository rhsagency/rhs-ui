"use client";

import { useState, type ReactNode } from "react";

import { EventChip, OverflowChip, type CalendarEvent, type EventTone } from "@rhs-ui/application/event-chip";

const DAYS = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"] as const;

/** The calendars of this team, each with its own tone. The name is what screen readers get, so the tone never has to carry meaning alone. */
const CALENDARS: Record<string, EventTone> = { Studio: "ink", Product: "graphite", Personal: "stone", Holidays: "mist" };

const event = (id: string, title: string, start: string, end: string | undefined, calendar: string, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  title,
  start: `${start}Z`,
  end: end ? `${end}Z` : undefined,
  calendar,
  tone: CALENDARS[calendar],
  ...extra,
});

const TIMED: readonly CalendarEvent[] = [
  event("standup", "Standup", "2026-10-26T09:00:00", "2026-10-26T09:30:00", "Studio"),
  event("review", "Design review", "2026-10-26T10:00:00", "2026-10-26T11:30:00", "Studio"),
  event("lunch", "Lunch with Priya", "2026-10-26T12:30:00", "2026-10-26T13:30:00", "Personal"),
  event("supplier", "Supplier call", "2026-10-26T14:00:00", "2026-10-26T15:00:00", "Product"),
  event("retro", "Retro", "2026-10-26T16:00:00", "2026-10-26T16:45:00", "Product"),
  event("prep", "Offsite prep", "2026-10-27T00:00:00", undefined, "Studio", { allDay: true }),
  event("one", "One to one with Mara", "2026-10-27T11:00:00", "2026-10-27T11:30:00", "Product"),
  event("sprint", "Sprint planning with the whole Kestrel team", "2026-10-28T09:30:00", "2026-10-28T11:00:00", "Product"),
  event("dentist", "Dentist", "2026-10-28T16:00:00", "2026-10-28T17:00:00", "Personal"),
  event("quarterly", "Quarterly review", "2026-10-29T14:00:00", "2026-10-29T15:30:00", "Studio", { tentative: true }),
  event("train", "Release train", "2026-10-30T10:00:00", "2026-10-30T11:00:00", "Product"),
  event("halloween", "Halloween", "2026-10-31T00:00:00", undefined, "Holidays", { allDay: true }),
];

const SPANS: readonly { event: CalendarEvent; column: string; before?: boolean; after?: boolean }[] = [
  { event: event("lisbon", "Lisbon conference", "2026-10-24T00:00:00", "2026-10-27T00:00:00", "Studio"), column: "sm:col-start-1 sm:col-span-2", before: true },
  { event: event("workshop", "Kestrel workshop", "2026-10-28T00:00:00", "2026-10-30T00:00:00", "Product"), column: "sm:col-start-3 sm:col-span-3" },
  { event: event("offsite", "Team offsite", "2026-10-31T00:00:00", "2026-11-03T00:00:00", "Personal"), column: "sm:col-start-6 sm:col-span-2", after: true },
];

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" });
const FULL = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const FULL_DAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const dayOf = (e: CalendarEvent) => new Date(e.start).toISOString().slice(0, 10);

function Row({ name, children }: { name: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid items-center gap-1.5 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs text-muted-foreground">{name}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<CalendarEvent | null>(TIMED[1] ?? null);
  const [open, setOpen] = useState<string | null>(null);
  const pick = (chosen: CalendarEvent) => setSelected((current) => (current?.id === chosen.id ? null : chosen));
  const common = { locale: "en-GB", timeZone: "UTC", onSelect: pick } as const;

  return (
    <div className="grid w-full max-w-4xl gap-8">
      <div className="grid gap-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-[-0.01em]">Week of 26 October</h2>
            <ul aria-label="Calendars" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {Object.entries(CALENDARS).map(([name, tone]) => (
                <li key={name} className="flex items-center gap-1.5">
                  <EventSwatch tone={tone} />
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-1 border-b border-border p-1.5 sm:grid-cols-7">
            {SPANS.map((span) => (
              <div key={span.event.id} className={span.column}>
                <EventChip event={span.event} variant="multi-day" dense continuesBefore={span.before} continuesAfter={span.after} selected={selected?.id === span.event.id} {...common} />
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-7">
            {DAYS.map((day) => {
              const events = TIMED.filter((item) => dayOf(item) === day);
              const crowded = events.length > 3 && open !== day;
              const shown = crowded ? events.slice(0, 2) : events;
              const date = new Date(`${day}T12:00:00Z`);
              return (
                <div key={day} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3 border-t border-border p-3 first:border-t-0 sm:block sm:min-h-40 sm:border-s sm:border-t-0 sm:p-1.5 sm:first:border-s-0">
                  <p className="text-xs text-muted-foreground sm:mb-1.5 sm:flex sm:items-center sm:justify-between sm:px-1">
                    <span className="uppercase">{WEEKDAY.format(date)}</span>
                    <span className={day === "2026-10-26" ? "ms-1 inline-grid size-5 place-items-center rounded-full bg-foreground text-[0.6875rem] font-semibold text-background tabular-nums sm:ms-0" : "block text-sm font-medium text-foreground tabular-nums sm:inline"}>{DATE.format(date)}</span>
                  </p>
                  <div className="grid content-start gap-1">
                    {shown.map((item) => (
                      <EventChip key={item.id} event={item} dense selected={selected?.id === item.id} {...common} />
                    ))}
                    {crowded ? (
                      <OverflowChip
                        dense
                        count={events.length - shown.length}
                        onClick={(clicked) => {
                          // The "+3 more" is replaced by the events it stood for: focus moves to the first of them.
                          const column = clicked.currentTarget.parentElement;
                          const first = shown.length;
                          setOpen(day);
                          requestAnimationFrame(() => column?.querySelectorAll<HTMLElement>("[data-slot=event-chip]")[first]?.focus());
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
          {selected ? (
            <>
              <span className="font-medium text-foreground">{selected.title}</span>
              {" · "}
              {selected.allDay ? FULL_DAY.format(new Date(selected.start)) : FULL.format(new Date(selected.start))}
              {selected.calendar ? ` · ${selected.calendar}` : ""}
            </>
          ) : (
            "Select an event to see it here."
          )}
        </p>
      </div>

      <section aria-labelledby="chip-demo-states" className="grid gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
        <h2 id="chip-demo-states" className="text-sm font-semibold tracking-[-0.01em]">
          Every kind of chip
        </h2>
        <dl className="grid max-w-xl gap-3">
          <Row name="Timed">
            <EventChip event={TIMED[1] as CalendarEvent} {...common} />
          </Row>
          <Row name="All day">
            <EventChip event={TIMED[5] as CalendarEvent} {...common} />
          </Row>
          <Row name="Multi-day">
            <EventChip event={SPANS[0]?.event as CalendarEvent} variant="multi-day" continuesBefore continuesAfter {...common} />
          </Row>
          <Row name="Tentative">
            <EventChip event={TIMED[9] as CalendarEvent} {...common} />
          </Row>
          <Row name="Cut, with tooltip">
            <div className="w-56">
              <EventChip event={TIMED[7] as CalendarEvent} {...common} />
            </div>
          </Row>
          <Row name="Dense">
            <div className="grid gap-1">
              {(["Studio", "Product", "Personal", "Holidays"] as const).map((calendar, index) => (
                <EventChip key={calendar} dense event={event(`tone-${calendar}`, `${calendar} calendar`, `2026-10-26T1${index}:00:00`, undefined, calendar)} {...common} />
              ))}
            </div>
          </Row>
        </dl>
      </section>
    </div>
  );
}

/** A small bar in a calendar's tone, for the legend. */
function EventSwatch({ tone }: { tone: EventTone }): React.JSX.Element {
  const fills: Record<EventTone, string> = { ink: "bg-foreground", graphite: "bg-foreground/75", stone: "bg-foreground/50", mist: "bg-foreground/25" };
  return <span aria-hidden="true" className={`h-3 w-[3px] rounded-full ${fills[tone]}`} />;
}
