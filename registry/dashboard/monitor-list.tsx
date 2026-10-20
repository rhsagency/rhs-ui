"use client";

import { useEffect, useMemo, useState, type ComponentProps } from "react";

import { IconActivity, IconCheck, IconClose, IconMoreHorizontal, IconPause, IconPlay, IconWarning } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export type MonitorState = "up" | "degraded" | "down" | "paused";

export interface Monitor {
  /** Stable identity, so a refresh updates a row instead of replacing it. */
  id: string;
  /** What is being watched: "Checkout API". */
  name: string;
  /** The address being checked: "api.northwind.example". */
  host: string;
  /** Where it stands. Each state has its own shape and word. */
  state: MonitorState;
  /** The last response time in milliseconds. `null` when there was none. */
  responseMs: number | null;
  /** When the monitor entered its current state. */
  since: Date | string | number;
}

export interface MonitorListProps extends Omit<ComponentProps<"div">, "children" | "onSelect" | "onPause"> {
  /** Every monitor. The list sorts them, down first. */
  monitors: readonly Monitor[];
  /** Makes the name a button, called with the monitor. Also offered as "View details" in the row menu. */
  onSelect?: (monitor: Monitor) => void;
  /** Called from the row menu with the monitor and whether it should now be paused (`true`) or resumed (`false`). */
  onPause?: (monitor: Monitor, paused: boolean) => void;
  /** The moment durations are measured from. Defaults to the current time. */
  now?: Date | string | number;
  /** Skeleton rows in the same footprint while the monitors load. */
  loading?: boolean;
  /** BCP 47 locale for the counts and response times. */
  locale?: string;
}

/** Each state has its own shape as well as its word, so the list reads without colour. */
const STATE = {
  down: { rank: 0, word: "Down", Icon: IconClose, shape: "rounded-md bg-destructive text-destructive-foreground" },
  degraded: { rank: 1, word: "Degraded", Icon: IconWarning, shape: "rounded-md border border-foreground/40 bg-background text-foreground" },
  up: { rank: 2, word: "Up", Icon: IconCheck, shape: "rounded-full bg-muted text-foreground" },
  paused: { rank: 3, word: "Paused", Icon: IconPause, shape: "rounded-full border border-dashed border-muted-foreground/60 bg-background text-muted-foreground" },
} as const;

/** In the summary a state nobody is in goes quiet: an empty outline, so a healthy list never wears a solid red "down". */
const QUIET_SHAPE = "rounded-md border border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground";

const ORDER = ["up", "degraded", "down", "paused"] as const;

const toMs = (value: Date | string | number): number => (value instanceof Date ? value.getTime() : new Date(value).getTime());

/** "14 min", "3 h", "12 days": one unit, because a list is read at a glance. */
function duration(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function inOrder(list: readonly Monitor[], ids: readonly string[]): Monitor[] {
  const byId = new Map(list.map((monitor) => [monitor.id, monitor]));
  const kept = ids.flatMap((id) => {
    const monitor = byId.get(id);
    return monitor ? [monitor] : [];
  });
  return [...kept, ...list.filter((monitor) => !ids.includes(monitor.id))];
}

/**
 * Uptime checks for sites and APIs as a list: a shape and a word for the
 * state (up, degraded, down, paused), the name, the host, the last response
 * time in tabular milliseconds and how long the monitor has been in that
 * state. Down monitors sort first, a summary line counts monitors per state,
 * and the row menu pauses or resumes. The list refreshes in place: while
 * focus is in it, or a menu is open, rows keep their order and new values
 * arrive without moving anything under the keyboard or the pointer.
 */
export function MonitorList({ monitors, onSelect, onPause, now, loading = false, locale = "en-US", className, ...props }: MonitorListProps) {
  const [focusWithin, setFocusWithin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [frozen, setFrozen] = useState<readonly string[] | null>(null);

  const sorted = useMemo(
    () =>
      [...monitors].sort(
        (a, b) =>
          STATE[a.state].rank - STATE[b.state].rank ||
          (a.state === "down" || a.state === "degraded" ? toMs(a.since) - toMs(b.since) : 0) ||
          a.name.localeCompare(b.name, locale),
      ),
    [monitors, locale],
  );
  const holding = focusWithin || menuOpen;
  useEffect(() => {
    setFrozen(holding ? (current) => current ?? sorted.map((monitor) => monitor.id) : null);
    // Only the moment of holding matters; later data changes must not re-freeze.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding]);
  const rows = holding && frozen ? inOrder(sorted, frozen) : sorted;

  const counts = ORDER.map((state) => ({ state, count: monitors.filter((monitor) => monitor.state === state).length }));
  const nowMs = now === undefined ? Date.now() : toMs(now);
  // "ms" and "s" are SI symbols, the same in every language; only the digits follow the locale.
  const milliseconds = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const seconds = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const count = new Intl.NumberFormat(locale);
  const response = (monitor: Monitor) => (monitor.responseMs === null ? null : monitor.responseMs >= 1000 ? `${seconds.format(monitor.responseMs / 1000)}\u00a0s` : `${milliseconds.format(monitor.responseMs)}\u00a0ms`);

  return (
    <div data-slot="monitor-list" aria-busy={loading || undefined} className={cn("@container w-full rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-4 py-3 text-sm">
        {loading ? (
          <>
            <p role="status" className="sr-only">
              Loading monitors
            </p>
            <Skeleton aria-hidden="true" className="h-4 w-64 max-w-full" />
          </>
        ) : (
          <p role="status" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {counts.map(({ state, count: total }) => {
              const meta = STATE[state];
              return (
                <span key={state} className={cn("inline-flex items-center gap-1.5 tabular-nums", total === 0 && "text-muted-foreground")}>
                  <span aria-hidden="true" className={cn("grid size-5 place-items-center", total === 0 ? QUIET_SHAPE : meta.shape)}>
                    <meta.Icon size={12} />
                  </span>
                  <span className={cn(total > 0 && "font-medium")}>{count.format(total)}</span> {meta.word.toLowerCase()}
                </span>
              );
            })}
          </p>
        )}
      </div>

      {loading ? (
        <ul aria-hidden="true" className="divide-y divide-border">
          {[0, 1, 2, 3].map((index) => (
            <li key={index} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="size-8 shrink-0 rounded-lg" delay={index * 80} />
              <div className="grid min-w-0 flex-1 gap-1.5">
                <Skeleton className="h-4 w-40 max-w-full" delay={index * 80 + 40} />
                <Skeleton className="h-3 w-48 max-w-full" delay={index * 80 + 80} />
              </div>
              <Skeleton className="hidden h-4 w-28 @xl:block" delay={index * 80 + 40} />
              <Skeleton className="hidden h-4 w-14 @xl:block" delay={index * 80 + 80} />
            </li>
          ))}
        </ul>
      ) : monitors.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <IconActivity size={20} />
          </span>
          <p className="mt-4 text-sm font-medium">No monitors yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">Add a site or an API to see its uptime and response time here.</p>
        </div>
      ) : (
        <ul
          aria-label="Monitors"
          onFocus={() => setFocusWithin(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
          }}
          className="divide-y divide-border"
        >
          {rows.map((monitor) => {
            const meta = STATE[monitor.state];
            const paused = monitor.state === "paused";
            const since = toMs(monitor.since);
            const text = response(monitor);
            const hasMenu = Boolean(onPause || onSelect);
            return (
              <li
                key={monitor.id}
                data-state={monitor.state}
                className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none @xl:grid-cols-[auto_minmax(0,1fr)_11rem_6.5rem_auto] @xl:gap-x-4"
              >
                <span aria-hidden="true" className={cn("row-span-2 grid size-8 self-start place-items-center @xl:row-span-1 @xl:self-center", meta.shape)}>
                  <meta.Icon size={16} />
                </span>

                <div className="min-w-0">
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(monitor)}
                      className="block max-w-full truncate rounded-sm text-left text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 focus-visible:after:ring-inset"
                    >
                      {monitor.name}
                      <span className="sr-only">, {meta.word.toLowerCase()}</span>
                    </button>
                  ) : (
                    <p className="truncate text-sm font-medium">{monitor.name}</p>
                  )}
                  <p title={monitor.host} className="truncate font-mono text-xs text-muted-foreground">
                    {monitor.host}
                  </p>
                </div>

                <p className="col-start-2 row-start-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm text-muted-foreground tabular-nums @xl:col-start-3 @xl:row-start-1 @xl:block">
                  <span>
                    <span className="font-medium text-foreground">{meta.word}</span>
                    {Number.isFinite(since) ? (
                      <>
                        {" "}
                        for <span suppressHydrationWarning>{duration(nowMs - since)}</span>
                      </>
                    ) : null}
                  </span>
                  {paused ? (
                    <span className="sr-only">Not checked</span>
                  ) : (
                    <span className="whitespace-nowrap @xl:hidden">{text === null ? "No response" : text}</span>
                  )}
                </p>

                <p className="hidden text-right text-sm whitespace-nowrap tabular-nums @xl:col-start-4 @xl:row-start-1 @xl:block">
                  {paused ? (
                    <>
                      <span aria-hidden="true" className="text-muted-foreground">
                        &ndash;
                      </span>
                      <span className="sr-only">Not checked</span>
                    </>
                  ) : text === null ? (
                    <span className="text-muted-foreground">No response</span>
                  ) : (
                    text
                  )}
                </p>

                <div className="col-start-3 row-span-2 row-start-1 self-center @xl:col-start-5 @xl:row-span-1">
                  {hasMenu ? (
                    <DropdownMenu onOpenChange={setMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${monitor.name}`} className="relative z-10 text-muted-foreground">
                          <IconMoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onSelect ? (
                          <DropdownMenuItem onSelect={() => onSelect(monitor)}>
                            <IconActivity />
                            View details
                          </DropdownMenuItem>
                        ) : null}
                        {onSelect && onPause ? <DropdownMenuSeparator /> : null}
                        {onPause ? (
                          <DropdownMenuItem onSelect={() => onPause(monitor, !paused)}>
                            {paused ? <IconPlay /> : <IconPause />}
                            {paused ? "Resume monitoring" : "Pause monitoring"}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
