import { IconClock } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface OpeningDay {
  /** "Monday". */
  day: string;
  /** "09:00 to 18:00", or null for closed. */
  hours: string | null;
}

export interface OpeningHoursProps {
  days: readonly OpeningDay[];
  /** Index of today in days, worked out on your side in the business's time zone. */
  today?: number;
  /** "Open now, until 18:00" or "Closed, opens Tuesday 09:00": your words, from your clock. */
  status?: { open: boolean; text: string };
  /** Holidays and exceptions: "Closed on 27 April (King's Day)". */
  note?: string;
  className?: string;
}

/**
 * Opening hours as every local business needs them: the week as a
 * definition list with today marked in words and weight, closed days said
 * as "Closed", an open-now line with a dot that also says it in words, and
 * room for holiday exceptions. Pair with the business's own clock for now.
 */
export function OpeningHours({ days, today, status, note, className }: OpeningHoursProps) {
  return (
    <section data-slot="opening-hours" aria-label="Opening hours" className={cn("relative rounded-2xl border border-border p-5", className)}>
      <h3 className="flex items-center gap-2 text-sm font-medium"><IconClock aria-hidden="true" className="size-4" />Opening hours</h3>
      {status ? <p className="mt-2 flex items-center gap-2 text-sm"><span aria-hidden="true" className={cn("size-2 rounded-full", status.open ? "bg-foreground" : "border border-muted-foreground")} />{status.text}</p> : null}
      <dl className="mt-4 grid gap-1.5 text-sm">
        {days.map((day, index) => (
          <div key={day.day} className={cn("flex justify-between gap-4 rounded-md px-2 py-1", index === today && "bg-muted font-medium")}>
            <dt>{day.day}{index === today ? <span className="sr-only"> (today)</span> : null}</dt>
            <dd className={cn("tabular-nums", !day.hours && "text-muted-foreground")}>{day.hours ?? "Closed"}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="mt-3 text-xs text-muted-foreground">{note}</p> : null}
    </section>
  );
}
