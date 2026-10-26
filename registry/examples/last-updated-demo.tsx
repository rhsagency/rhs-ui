"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";

import { LastUpdated } from "@rhs-ui/primitives/last-updated";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** When the preview opened, or null on the server: the ages below are measured from it, so they read the same however long the page was cached. */
function useOpenedAt(): number | null {
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  useLayoutEffect(() => setOpenedAt(Date.now()), []);
  return openedAt;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const BARS = [38, 52, 47, 61, 55, 70, 58, 66, 74, 63, 80, 69] as const;

/** A widget that keeps its own clock: the button runs a "request", the promise it returns drives the spinner, and the label counts again from zero. */
function OrdersCard({ openedAt }: { openedAt: number }): React.JSX.Element {
  const [updatedAt, setUpdatedAt] = useState(openedAt - 4 * MINUTE - 20_000);
  const [orders, setOrders] = useState(1284);
  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Orders today</h2>
        <LastUpdated
          updatedAt={updatedAt}
          onRefresh={() =>
            new Promise<void>((resolve) => {
              window.setTimeout(() => {
                setOrders((count) => count + 9);
                setUpdatedAt(Date.now());
                resolve();
              }, 1400);
            })
          }
        />
      </div>
      <div>
        <p className="text-3xl font-medium tracking-[-0.04em] tabular-nums">{orders.toLocaleString("en-US")}</p>
        <p className="text-xs text-muted-foreground">+12.4% on yesterday, Northwind web shop</p>
      </div>
      <div aria-hidden="true" className="flex h-16 items-end gap-1.5">
        {BARS.map((height, index) => (
          <span key={index} className="w-full rounded-t-sm bg-foreground/80" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

const DUTCH = {
  justNow: "Zojuist bijgewerkt",
  minutes: "{n} min geleden bijgewerkt",
  today: "Bijgewerkt om {time}",
  earlier: "Bijgewerkt op {date} om {time}",
  stale: "{text}, mogelijk verouderd",
  refresh: "Gegevens vernieuwen",
  refreshed: "Gegevens vernieuwd",
} as const;

export default function Demo(): React.JSX.Element {
  const openedAt = useOpenedAt();
  const rows: readonly { age: string; node: ReactNode }[] =
    openedAt === null
      ? []
      : [
          { age: "12 seconds", node: <LastUpdated className="text-sm text-foreground" updatedAt={openedAt - 12_000} /> },
          { age: "3 minutes", node: <LastUpdated className="text-sm text-foreground" updatedAt={openedAt - 3 * MINUTE} /> },
          { age: "22 minutes, stale after 15", node: <LastUpdated className="text-sm" updatedAt={openedAt - 22 * MINUTE} staleAfterMs={15 * MINUTE} /> },
          { age: "3 hours, stale after 6", node: <LastUpdated className="text-sm text-foreground" updatedAt={openedAt - 3 * HOUR} staleAfterMs={6 * HOUR} /> },
          { age: "30 hours, never stale", node: <LastUpdated className="text-sm text-foreground" updatedAt={openedAt - 30 * HOUR} staleAfterMs={Infinity} /> },
          { age: "2 hours, Dutch", node: <LastUpdated className="text-sm text-foreground" updatedAt={openedAt - 2 * HOUR} staleAfterMs={Infinity} locale="nl-NL" timeZone="Europe/Amsterdam" labels={DUTCH} /> },
        ];

  // The ages are measured from the moment the preview opens, so the server HTML cannot draw them. It draws dashed outlines as tall as the card and the list will be instead, and the page below does not move.
  // The card's header wraps in two steps as the demo narrows, and the list's stale line wraps once: the container queries sit at the widths where the real heights change.
  return (
    <div className="@container w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-9 @3xl:grid-cols-2">
        <Example caption="Press refresh: it spins while the request runs, says Data refreshed, and starts counting again">
          {openedAt === null ? (
            <div aria-hidden="true" className="h-[13.625rem] rounded-xl border border-dashed border-border @max-[17.625rem]:h-[14.875rem] @max-[16.75rem]:h-[15.875rem]" />
          ) : (
            <OrdersCard openedAt={openedAt} />
          )}
        </Example>

        <Example caption="How the age reads as it grows, and what a stale one says">
          {openedAt === null ? (
            <div aria-hidden="true" className="h-[24.4375rem] rounded-xl border border-dashed border-border @max-[19.4375rem]:h-[25.6875rem]" />
          ) : (
            <ul className="grid divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
              {rows.map((row) => (
                <li key={row.age} className="flex flex-col gap-1 px-4 py-3">
                  <span className="text-xs text-muted-foreground">{row.age}</span>
                  {row.node}
                </li>
              ))}
            </ul>
          )}
        </Example>
      </div>
    </div>
  );
}
