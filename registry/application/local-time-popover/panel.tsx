"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck, IconCopy } from "@rhs-ui/icons";
import {
  browserZone,
  copyLine,
  copyText,
  dayText,
  DEFAULT_LABELS,
  relativeText,
  toTimestamp,
  zoneRows,
  type LocalTime,
  type LocalTimeLabels,
  type LocalZone,
} from "@rhs-ui/application/local-time-popover/zones";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface LocalTimePanelProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The moment of the event, as an ISO string with its offset or a "Z": "2026-10-22T16:00:00+02:00". A Date or a timestamp works too. */
  instant: LocalTime;
  /** The zones to show it in, each an IANA name and the name of the place. The viewer's own zone is added at the top if it is not among them. */
  zones: readonly LocalZone[];
  /** The zone the event is in: the day in the head of the list is its day, and every other zone's day is compared with it. Default: the first of `zones`. */
  eventZone?: string;
  /** The viewer's zone. Leave it out to use the browser's own, read once the page is live; nothing here reads the server's zone. */
  viewerZone?: string;
  /** The language of the weekdays, the months and the way a time is written. Default "en-US". */
  locale?: string;
  /** The moment "in 3 days" is measured from. Leave it out to use the browser's clock once the page is live; pass it for the same words in server HTML, in tests and in previews. */
  now?: LocalTime;
  /** The name of the event. It leads the line that Copy as text produces: "Product sync: Thu 22 Oct, 18:00 Amsterdam (UTC+2) / ...". */
  title?: string;
  /** The words the panel says, for translation. */
  labels?: LocalTimeLabels;
}

const subscribeNever = (): (() => void) => () => undefined;

/**
 * The inside of the local time popover, on its own, for a sheet on a phone: the day of the event, and under it the same moment in
 * each zone, the viewer's own first and tagged "You", with the day change marked ("Next day") and the distance from UTC in
 * tabular digits. "Copy as text" puts one line on the clipboard to paste into a chat. Daylight saving comes from Intl for the
 * actual date, and nothing depends on the server's zone.
 */
export function LocalTimePanel({ instant, zones, eventZone, viewerZone, locale = "en-US", now, title, labels, className, ...props }: LocalTimePanelProps) {
  const words: Required<LocalTimeLabels> = { ...DEFAULT_LABELS, ...labels };
  const headingId = useId();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  // The browser's own zone and clock are only known in the browser: null on the server and while hydrating, so both write the same list.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const browser = useSyncExternalStore(subscribeNever, () => browserZone(locale), () => null);
  const [tick] = useState(() => Date.now());
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const at = toTimestamp(instant);
  const pinned = now === undefined ? Number.NaN : toTimestamp(now);
  const clock = !Number.isNaN(pinned) ? pinned : mounted ? tick : null;
  const home = eventZone ?? zones[0]?.id ?? "UTC";
  const listed = zones.some((zone) => zone.id === home) ? zones : [{ id: home }, ...zones];
  const rows = Number.isNaN(at) ? [] : zoneRows(at, listed, home, viewerZone ?? browser, locale);
  const relative = clock === null || Number.isNaN(at) ? "" : relativeText(at, clock, locale);

  async function copy() {
    window.clearTimeout(timer.current);
    try {
      await copyText(copyLine(at, rows, home, locale, title));
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    timer.current = window.setTimeout(() => setStatus("idle"), 2400);
  }

  if (Number.isNaN(at)) return null;

  return (
    <div data-slot="local-time-panel" role="group" aria-labelledby={headingId} className={cn("flex flex-col bg-popover text-popover-foreground", className)} {...props}>
      <div className="grid gap-0.5 px-4 pt-3 pb-3">
        <h2 id={headingId} className="text-sm font-semibold tracking-[-0.01em]">
          {words.title}
        </h2>
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {dayText(at, locale, home)}
          {relative ? <span className="whitespace-nowrap"> · {relative}</span> : null}
        </p>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium tracking-[-0.01em]">{row.label}</span>
                {row.you ? (
                  <Badge variant="secondary" className="h-[1.125rem] shrink-0 px-1.5 text-[0.6875rem]">
                    {words.you}
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">{row.offset}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium tabular-nums">{row.time}</p>
              {/* On the narrowest phones (the list is then about 300px wide) the day chip drops under the date, so the place name keeps its room. */}
              <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground max-[22rem]:flex-col-reverse max-[22rem]:items-end max-[22rem]:gap-0.5">
                {row.shift !== 0 ? (
                  <span className="rounded-sm border border-border px-1 text-[0.6875rem] leading-4 whitespace-nowrap text-foreground">{row.shift > 0 ? words.nextDay : words.previousDay}</span>
                ) : null}
                <span className="whitespace-nowrap">{row.date}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border bg-muted/30 p-1.5">
        {/* Not `disabled` after a press: the button stays focusable, and its words change to say what happened. */}
        <Button type="button" variant="ghost" size="sm" onClick={() => void copy()} className="w-full justify-center text-muted-foreground hover:text-foreground">
          {status === "copied" ? <IconCheck /> : status === "failed" ? <IconAlertCircle /> : <IconCopy />}
          {status === "copied" ? words.copied : status === "failed" ? words.copyFailed : words.copy}
        </Button>
      </div>
      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status === "copied" ? words.copiedSaid : status === "failed" ? words.copyFailed : ""}
      </p>
    </div>
  );
}
