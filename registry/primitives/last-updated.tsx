"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import { IconRefresh, IconWarning } from "@rhs-ui/icons";
import { IconButton } from "@rhs-ui/primitives/icon-button";
import { cn } from "@/lib/utils";

/** The words the label and the refresh button use, for another language or your own voice. `{n}`, `{time}`, `{date}` and `{text}` are filled in. */
export interface LastUpdatedLabels {
  /** Under a minute old. Default "Updated just now". */
  justNow: string;
  /** Under an hour old, `{n}` minutes. Default "Updated {n} min ago". */
  minutes: string;
  /** An hour or more old, but still today (in the time zone). Default "Updated at {time}". */
  today: string;
  /** Older than today. Default "Updated {date}, {time}". */
  earlier: string;
  /** What a stale label becomes, `{text}` being what it would have said. Default "{text}, may be out of date". */
  stale: string;
  /** The name of the refresh button, and its tooltip. Default "Refresh data". */
  refresh: string;
  /** Said politely to screen readers when a refresh finishes. Default "Data refreshed". */
  refreshed: string;
}

export interface LastUpdatedProps extends Omit<ComponentProps<"span">, "children"> {
  /** When the data was last fetched: a Date, a timestamp in ms or an ISO string. */
  updatedAt: Date | number | string;
  /** Age in ms after which the data counts as stale and the label says so. `Infinity` turns it off. Default 15 minutes. */
  staleAfterMs?: number;
  /** Shows a refresh button and runs this when it is pressed. Return a promise and the button spins until it settles; a rejection stops the spinning without saying "Data refreshed". */
  onRefresh?: () => void | Promise<unknown>;
  /** Drive the spinner yourself, for example from a query's `isFetching`. Overrides the promise. */
  refreshing?: boolean;
  /** The locale of the clock time and the dates. Default "en-US". */
  locale?: string;
  /** The IANA time zone those are written in, so the server and the browser print the same. Default "UTC". */
  timeZone?: string;
  /** Different words, as templates. */
  labels?: Partial<LastUpdatedLabels>;
}

const DEFAULT_LABELS: LastUpdatedLabels = {
  justNow: "Updated just now",
  minutes: "Updated {n} min ago",
  today: "Updated at {time}",
  earlier: "Updated {date}, {time}",
  stale: "{text}, may be out of date",
  refresh: "Refresh data",
  refreshed: "Data refreshed",
};

const MINUTE = 60_000;
const HOUR = 3_600_000;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, name: string) => values[name] ?? "");

function build(locale: string, timeZone: string) {
  return {
    time: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }),
    date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone }),
    dateYear: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone }),
    full: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "long", timeZone }),
    // Only compared with itself: which calendar day, in the zone, a moment falls on.
    day: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone }),
  };
}

/** The formatters, or UTC and US English when the locale or the zone is not one the browser knows: a typo must not take the page down. */
function formatters(locale: string, timeZone: string) {
  try {
    return build(locale, timeZone);
  } catch {
    return build("en-US", "UTC");
  }
}

/** How long to wait before the text can change: at the next whole minute while it counts minutes, every five minutes after, and at the stale mark. */
function delayUntilChange(age: number, staleAfter: number): number {
  const clamped = Math.max(0, age);
  let delay = clamped < HOUR ? MINUTE - (clamped % MINUTE) : 5 * MINUTE;
  if (Number.isFinite(staleAfter) && clamped < staleAfter) delay = Math.min(delay, staleAfter - clamped);
  return Math.max(1000, delay + 40);
}

/**
 * The age of some data in words, with a refresh button: "Updated just now",
 * "Updated 3 min ago", then a clock time once it is an hour old. It rewrites
 * itself at the moments the text changes and not in between, and stops while
 * the tab is hidden. Past `staleAfterMs` it says so ("Updated 22 min ago, may
 * be out of date") in a warning mark and heavier type rather than colour. The
 * label is a `time` element with the full timestamp in its title. Before the
 * page is live, and on the server, it writes the date and clock time in the
 * given zone and locale instead of a relative age, so what the server printed
 * is exactly what the browser expects; the relative text takes over a moment
 * later. The refresh button spins while it runs and a polite status says
 * "Data refreshed" when it is done.
 */
export function LastUpdated({ updatedAt, staleAfterMs = 15 * MINUTE, onRefresh, refreshing: controlled, locale = "en-US", timeZone = "UTC", labels, className, ...props }: LastUpdatedProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const f = useMemo(() => formatters(locale, timeZone), [locale, timeZone]);
  const updated = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();

  // `now` stays null on the server and while hydrating, so both write the same absolute text. The layout effect fills it in before the browser paints a client-only render.
  const [now, setNow] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (Number.isNaN(updated)) return;
    let timer: number | undefined;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      timer = window.setTimeout(tick, delayUntilChange(current - updated, staleAfterMs));
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
  }, [updated, staleAfterMs]);

  const [pending, setPending] = useState(false);
  // A refresh that the promise says failed is not announced as done.
  const failed = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const refreshing = controlled ?? pending;

  // "Data refreshed" is said when a refresh ends, and cleared a few seconds later so the next one is a change again.
  const [heard, setHeard] = useState("");
  const was = useRef(refreshing);
  useEffect(() => {
    const finished = was.current && !refreshing;
    was.current = refreshing;
    if (refreshing) {
      setHeard("");
      return;
    }
    if (!finished || failed.current) return;
    setHeard(words.refreshed);
    const timer = window.setTimeout(() => setHeard(""), 3000);
    return () => window.clearTimeout(timer);
  }, [refreshing, words.refreshed]);

  function refresh() {
    if (refreshing) return;
    const result = onRefresh?.();
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setPending(true);
      failed.current = false;
      const settle = (ok: boolean) => {
        failed.current = !ok;
        if (alive.current) setPending(false);
      };
      (result as Promise<unknown>).then(
        () => settle(true),
        () => settle(false),
      );
    }
  }

  if (Number.isNaN(updated)) return null;

  const age = now === null ? 0 : now - updated;
  const stale = now !== null && Number.isFinite(staleAfterMs) && age >= staleAfterMs;
  let text: string;
  if (now === null) {
    text = fill(words.earlier, { date: f.dateYear.format(updated), time: f.time.format(updated) });
  } else if (age < MINUTE) {
    text = words.justNow;
  } else if (age < HOUR) {
    text = fill(words.minutes, { n: String(Math.floor(age / MINUTE)) });
  } else if (f.day.format(updated) === f.day.format(now)) {
    text = fill(words.today, { time: f.time.format(updated) });
  } else {
    const sameYear = f.day.format(updated).split("/")[2] === f.day.format(now).split("/")[2];
    text = fill(words.earlier, { date: (sameYear ? f.date : f.dateYear).format(updated), time: f.time.format(updated) });
  }

  return (
    <span data-slot="last-updated" data-stale={stale || undefined} data-refreshing={refreshing || undefined} className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)} {...props}>
      {stale ? <IconWarning aria-hidden="true" className="size-3.5 shrink-0 text-foreground" /> : null}
      <time dateTime={new Date(updated).toISOString()} title={f.full.format(updated)} className={cn("tabular-nums", stale && "font-medium text-foreground")}>
        {stale ? fill(words.stale, { text }) : text}
      </time>
      {onRefresh ? (
        <IconButton
          icon={<IconRefresh className={refreshing ? "motion-safe:animate-spin motion-reduce:animate-pulse" : undefined} />}
          label={words.refresh}
          size="sm"
          // Not `loading`: the arrow itself turns, which reads as refreshing at once. Focus stays on the button, and a press while it runs does nothing.
          aria-busy={refreshing || undefined}
          aria-disabled={refreshing || undefined}
          onClick={refresh}
          className="-my-1.5 text-muted-foreground hover:text-foreground"
        />
      ) : null}
      <span role="status" className="sr-only">
        {heard}
      </span>
    </span>
  );
}
