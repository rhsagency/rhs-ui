"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface LocalTimeProps extends Omit<ComponentProps<"p">, "children"> {
  /** The city, as it is written: "Amsterdam". */
  city: string;
  /** The IANA time zone of that city: "Europe/Amsterdam". A name the browser does not know shows the city without a clock. */
  timeZone: string;
  /** The locale the clock is written in. "en-GB" gives 14:32, "en-US" gives 02:32 PM. */
  locale: string;
  /** The accessible name of the time, with the city filled into `{city}`: "Local time in {city}". */
  label: string;
}

/**
 * The clock's formatter. A locale the browser does not know falls back to en-GB;
 * a time zone it does not know gives no formatter at all, because a clock in a
 * guessed zone shows a plausible time that is wrong.
 */
function clockFor(locale: string, timeZone: string): Intl.DateTimeFormat | null {
  const make = (tag: string) => new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit", timeZone });
  try {
    return make(locale);
  } catch {
    try {
      return make("en-GB");
    } catch {
      return null;
    }
  }
}

/**
 * The studio's local time, "Amsterdam 14:32", written in the given zone and
 * rewritten at the start of every minute. It renders after the page is live, so
 * the server and the browser can never disagree about the minute; until then the
 * place is held for it, so nothing shifts. It is a time element with an accessible
 * name ("Local time in Amsterdam: 14:32"), not a live region, so it is never
 * announced as it ticks. It stops while the tab is hidden and catches up when it
 * comes back. A time zone the browser does not know shows the city alone: no
 * clock, rather than the time of another place under this city's name.
 */
export function LocalTime({ city, timeZone, locale, label, className, ...props }: LocalTimeProps) {
  const [now, setNow] = useState<number | null>(null);
  const clock = useMemo(() => clockFor(locale, timeZone), [locale, timeZone]);

  useEffect(() => {
    // Nothing to tick for a zone that cannot be read.
    if (!clock) return;
    let timer = 0;
    const tick = () => {
      const moment = Date.now();
      setNow(moment);
      // The next change is at the start of the next minute.
      timer = window.setTimeout(tick, 60_000 - (moment % 60_000) + 30);
    };
    const onVisibility = () => {
      window.clearTimeout(timer);
      if (!document.hidden) tick();
    };
    if (!document.hidden) tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [clock]);

  const text = now === null || !clock ? null : clock.format(now);

  return (
    <p data-slot="footer-inverted-contact-time" className={cn("flex items-center gap-2.5", className)} {...props}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {/* The time carries the city in its own name; with no clock the city is the only thing there is to read. */}
      <span aria-hidden={clock ? "true" : undefined}>{city}</span>
      {!clock ? null : now !== null && text ? (
        <time dateTime={new Date(now).toISOString()} aria-label={`${label.replace("{city}", city)}: ${text}`} className="tabular-nums">
          {text}
        </time>
      ) : (
        <span aria-hidden="true" className="invisible tabular-nums">
          00:00
        </span>
      )}
    </p>
  );
}
