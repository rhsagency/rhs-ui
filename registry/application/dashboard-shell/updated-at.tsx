"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface UpdatedAtProps {
  /** When the data was last refreshed: a Date, an ISO string or a timestamp. */
  value: Date | string | number;
  /** The words before the time. Default "Updated". */
  prefix?: string;
  /** For the wording of the time. Default "en-US". */
  locale?: string;
  /** The time zone of the full date, which is also the tooltip. Default "UTC". */
  timeZone?: string;
  className?: string;
}

/** "2 minutes ago", "yesterday"; null once it is too long ago to be useful and a date reads better. */
function relative(from: number, now: number, locale: string): string | null {
  const diff = (from - now) / 1000;
  const abs = Math.abs(diff);
  const words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 45) return words.format(0, "second");
  if (abs < 45 * 60) return words.format(Math.round(diff / 60), "minute");
  if (abs < 22 * 3600) return words.format(Math.round(diff / 3600), "hour");
  if (abs < 14 * 86400) return words.format(Math.round(diff / 86400), "day");
  return null;
}

/**
 * The "Updated 2 minutes ago" line of a dashboard. The server writes the
 * full date (the same text in every browser, in the zone you give), and once
 * the page is alive it turns into the relative wording and keeps itself
 * current every thirty seconds. The full date stays in the tooltip and in
 * the element's datetime.
 */
export function UpdatedAt({ value, prefix = "Updated", locale = "en-US", timeZone = "UTC", className }: UpdatedAtProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const full = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
  const text = (now === null ? null : relative(date.getTime(), now, locale)) ?? full;

  return (
    <p data-slot="updated-at" className={cn("text-xs whitespace-nowrap text-muted-foreground", className)}>
      {prefix}{" "}
      <time dateTime={date.toISOString()} title={full}>
        {text}
      </time>
    </p>
  );
}
