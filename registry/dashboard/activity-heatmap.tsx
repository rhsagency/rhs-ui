"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface HeatmapDay {
  /** yyyy-mm-dd */
  date: string;
  value: number;
}

export interface ActivityHeatmapProps {
  days: readonly HeatmapDay[];
  /** "commits", "orders", "sessions": used in the readout and the summary. */
  unit: string;
  /** The last day shown; weeks run back from it. */
  end: string;
  weeks?: number;
  label: string;
  locale?: string;
  className?: string;
}

const LEVELS = [0.06, 0.25, 0.45, 0.7, 1];
const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

/**
 * A year of activity as a calendar of squares, darker for busier days, like
 * a contribution graph. Hovering a day reads it out; screen readers get the
 * total and the busiest day in words instead of 365 squares.
 */
export function ActivityHeatmap({ days, unit, end, weeks = 26, label, locale = "en-GB", className }: ActivityHeatmapProps) {
  const [hover, setHover] = useState<HeatmapDay | null>(null);
  const values = new Map(days.map((day) => [day.date, day.value]));
  const max = Math.max(1, ...days.map((day) => day.value));
  const last = parse(end);
  const first = new Date(last);
  first.setUTCDate(first.getUTCDate() - (weeks * 7 - 1) - ((last.getUTCDay() + 6) % 7));
  const columns = Array.from({ length: weeks + 1 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(first);
      date.setUTCDate(first.getUTCDate() + week * 7 + weekday);
      return date > last ? null : { date: iso(date), value: values.get(iso(date)) ?? 0 };
    }),
  );
  const total = days.reduce((sum, day) => sum + day.value, 0);
  const busiest = days.reduce<HeatmapDay | null>((best, day) => (!best || day.value > best.value ? day : best), null);
  const dayName = (date: string) => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(parse(date));
  return (
    <figure data-slot="activity-heatmap" className={cn("grid gap-3", className)}>
      <div aria-hidden="true" className="flex gap-[3px] overflow-x-auto pb-1">
        {columns.map((column, c) => (
          <div key={c} className="grid grid-rows-7 gap-[3px]">
            {column.map((cell, r) =>
              cell ? (
                <span
                  key={cell.date}
                  onPointerEnter={() => setHover(cell)}
                  onPointerLeave={() => setHover(null)}
                  className="size-3 rounded-[3px] bg-foreground transition-transform duration-100 hover:scale-125"
                  style={{ opacity: cell.value === 0 ? LEVELS[0] : LEVELS[Math.min(4, Math.ceil((cell.value / max) * 4))] }}
                />
              ) : (
                <span key={r} className="size-3" />
              ),
            )}
          </div>
        ))}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span aria-live="polite" suppressHydrationWarning>{hover ? `${dayName(hover.date)}: ${hover.value} ${unit}` : `${total.toLocaleString(locale)} ${unit} in ${weeks} weeks`}</span>
        <span className="flex items-center gap-1" aria-hidden="true">
          Less
          {LEVELS.map((level) => (
            <span key={level} className="size-2.5 rounded-[2px] bg-foreground" style={{ opacity: level }} />
          ))}
          More
        </span>
      </figcaption>
      <p className="sr-only" suppressHydrationWarning>
        {label}: {total} {unit} in {weeks} weeks{busiest ? `, the busiest day ${dayName(busiest.date)} with ${busiest.value}` : ""}.
      </p>
    </figure>
  );
}
