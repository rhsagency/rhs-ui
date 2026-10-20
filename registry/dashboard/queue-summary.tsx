import type { ComponentProps } from "react";

import { IconArrowUpRight, IconCheck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Card } from "@rhs-ui/primitives/card";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export interface Queue {
  /** Stable identity; the label when left out. */
  id?: string;
  /** What is waiting: "Orders to ship", "Tickets unanswered". */
  label: string;
  /** How many are waiting. Zero shows quietly; above `limit` it reads "99+". */
  count: number;
  /** The filtered list this count came from. */
  href: string;
  /** Marks the queue with the word "Urgent", so it never depends on colour. */
  urgent?: boolean;
}

export interface QueueSummaryProps extends Omit<ComponentProps<"div">, "children"> {
  /** The queues, one tile each. Every tile has the same width. */
  queues: readonly Queue[];
  /** Skeleton tiles in the same footprint while the counts load. */
  loading?: boolean;
  /** What a queue with nothing in it says. */
  emptyLabel?: string;
  /** Counts above this read "99+". The exact number stays in the accessible name. */
  limit?: number;
  /** What the group is called for screen readers. */
  label?: string;
  /** BCP 47 locale for the counts. */
  locale?: string;
}

const COLUMNS: Record<number, string> = {
  1: "@xl:grid-cols-1",
  2: "@xl:grid-cols-2",
  3: "@xl:grid-cols-3",
  // Four tiles stay two by two until each has room for a two-line label beside its arrow.
  4: "@2xl:grid-cols-4",
};

/**
 * The to-do strip of an admin home: a row of counters, each a big number, a
 * label and an arrow, and each one a link to the list it counts. Every tile
 * has the same width and wraps to two columns on a phone. A queue with
 * nothing in it is shown quietly with a check and "Nothing waiting"; a
 * count above the limit reads "99+" while the exact number stays in the
 * accessible name; an urgent queue carries the word "Urgent".
 */
export function QueueSummary({ queues, loading = false, emptyLabel = "Nothing waiting", limit = 99, label = "Work waiting", locale = "en-US", className, ...props }: QueueSummaryProps) {
  const number = new Intl.NumberFormat(locale);
  const tiles = loading && queues.length === 0 ? 4 : queues.length;
  if (tiles === 0) return null;
  const columns = COLUMNS[tiles] ?? "@xl:grid-cols-3";

  return (
    <div data-slot="queue-summary" aria-busy={loading || undefined} className={cn("@container w-full", className)} {...props}>
      {loading ? (
        <p role="status" className="sr-only">
          Loading {label.toLowerCase()}
        </p>
      ) : null}
      <ul role="list" aria-label={label} className={cn("grid grid-cols-2 gap-3", columns)}>
        {loading
          ? Array.from({ length: tiles }, (_, index) => {
              const queue = queues[index];
              return (
                <li key={queue?.id ?? queue?.label ?? index}>
                  <Card aria-hidden="true" className="h-full min-h-[7.5rem] gap-3 p-4 @xl:p-5">
                    {queue ? <p className="text-sm font-medium text-muted-foreground">{queue.label}</p> : <Skeleton className="h-4 w-24" delay={index * 80} />}
                    <Skeleton className="h-9 w-16" delay={index * 80 + 40} />
                  </Card>
                </li>
              );
            })
          : queues.map((queue) => {
              // A count that is not a number is a queue with nothing known to be waiting.
              const waiting = Number.isFinite(queue.count) ? Math.max(0, queue.count) : 0;
              const empty = waiting === 0;
              const capped = waiting > limit;
              return (
                <li key={queue.id ?? queue.label}>
                  <Card
                    data-urgent={(queue.urgent && !empty) || undefined}
                    className={cn(
                      "group/queue @container/tile h-full gap-0 overflow-hidden py-0 transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
                      "hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_28%)] has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/40",
                      queue.urgent && !empty && "border-[color-mix(in_oklch,var(--border),var(--foreground)_32%)]",
                    )}
                  >
                    <a
                      href={queue.href}
                      className="flex h-full min-h-[7.5rem] flex-col justify-between gap-4 p-4 outline-none transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none @xl:p-5"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-sm leading-snug font-medium">
                          {queue.label}
                          {/* The exact count belongs to the link's name, whatever the tile draws: "Orders to ship, 124 waiting, Urgent". */}
                          <span className="sr-only">{empty ? "," : `, ${number.format(waiting)} waiting${queue.urgent ? "," : ""}`}</span>
                        </span>
                        <IconArrowUpRight
                          size={16}
                          className="mt-px hidden shrink-0 text-muted-foreground transition-transform duration-150 group-hover/queue:translate-x-0.5 group-hover/queue:-translate-y-0.5 motion-reduce:transition-none @min-[9rem]/tile:block"
                        />
                      </span>
                      {empty ? (
                        <span className="flex items-center gap-2 text-[0.8125rem] leading-snug text-muted-foreground">
                          <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-muted">
                            <IconCheck size={12} />
                          </span>
                          {emptyLabel}
                        </span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span aria-hidden="true" className="text-4xl leading-none font-medium tracking-[-0.04em] tabular-nums">
                            {capped ? `${number.format(limit)}+` : number.format(waiting)}
                          </span>
                          {queue.urgent ? <Badge>Urgent</Badge> : null}
                        </span>
                      )}
                    </a>
                  </Card>
                </li>
              );
            })}
      </ul>
    </div>
  );
}
