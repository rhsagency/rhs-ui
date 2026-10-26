"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconAlertCircle, IconRefresh } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { ErrorBoundary } from "@rhs-ui/primitives/error-boundary";
import { withErrorBoundary } from "@rhs-ui/primitives/error-boundary/with-error-boundary";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

const PERIODS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
] as const;

const REVENUE: Record<Exclude<Period, "90d">, { total: string; change: string; bars: readonly number[] }> = {
  "7d": { total: "€12,480", change: "+4.2%", bars: [42, 58, 51, 66, 49, 72, 63] },
  "30d": { total: "€48,210", change: "+12.4%", bars: [38, 52, 47, 61, 55, 70, 58, 66, 74, 63, 80, 69] },
};

const PRODUCTS = [
  { name: "Trail bottle 750 ml", units: 1284 },
  { name: "Camp stove, compact", units: 912 },
  { name: "Merino base layer", units: 774 },
  { name: "Headlamp 400 lm", units: 641 },
] as const;

const FEED = [
  { who: "Mara de Vries", what: "approved the Halcyon order", when: "2 min ago" },
  { who: "Jonas Falk", what: "refunded NW-1047", when: "14 min ago" },
  { who: "Priya Nair", what: "added a Kestrel discount code", when: "1 h ago" },
] as const;

/** Which of the demo's widgets are broken. The widgets read it while they render, so a reset that mounts them again finds the bug fixed. */
interface Bugs {
  live: boolean;
  products: boolean;
  feed: boolean;
}

// React logs every error a boundary catches. These widgets fail on purpose, with the kind of message a failed request gives.
const PRODUCTS_ERROR = "Failed to load resource: /api/products/top returned 500";
const ACTIVITY_ERROR = "Failed to load resource: /api/activity timed out after 8000 ms";

function Revenue({ period }: { period: Period }): React.JSX.Element {
  if (period === "90d") throw new Error("Failed to load resource: the server responded with a status of 413");
  const { total, change, bars } = REVENUE[period];
  return (
    <div>
      <p className="text-3xl font-medium tracking-[-0.04em] tabular-nums">{total}</p>
      <p className="text-xs text-muted-foreground">{change} on the period before</p>
      <div aria-hidden="true" className="mt-4 flex h-14 items-end gap-1">
        {bars.map((height, index) => (
          <span key={index} className="w-full rounded-t-sm bg-foreground/80" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

function TopProducts({ bugs }: { bugs: { current: Bugs } }): React.JSX.Element {
  if (bugs.current.live && bugs.current.products) throw new Error(PRODUCTS_ERROR);
  return (
    <ol className="grid grid-cols-1 gap-2.5">
      {PRODUCTS.map((product, index) => (
        <li key={product.name} className="flex items-baseline gap-3 text-sm">
          <span className="w-4 text-xs text-muted-foreground tabular-nums">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate">{product.name}</span>
          <span className="text-muted-foreground tabular-nums">{product.units.toLocaleString("en-US")}</span>
        </li>
      ))}
    </ol>
  );
}

function ActivityFeed({ bugs }: { bugs: { current: Bugs } }): React.JSX.Element {
  if (bugs.current.live && bugs.current.feed) throw new Error(ACTIVITY_ERROR);
  return (
    <ul className="grid gap-3">
      {FEED.map((entry) => (
        <li key={entry.what} className="text-sm">
          <p>
            <span className="font-medium">{entry.who}</span> {entry.what}
          </p>
          <p className="text-xs text-muted-foreground">{entry.when}</p>
        </li>
      ))}
    </ul>
  );
}

/** A stand-in for a component you do not own: it draws a delivery route, and throws when told its data is bad. */
function RouteStatus({ broken }: { broken: boolean }): React.JSX.Element {
  if (broken) throw new Error("Failed to load resource: tiles.northwind.example");
  const stops = ["Rotterdam hub", "Utrecht depot", "Amersfoort"] as const;
  return (
    <ol className="grid gap-0">
      {stops.map((stop, index) => (
        <li key={stop} className="relative flex items-center gap-3 pb-4 text-sm last:pb-0">
          <span aria-hidden="true" className={cn("relative z-10 size-2.5 rounded-full border-2 border-foreground", index < 2 ? "bg-foreground" : "bg-background")} />
          {index < stops.length - 1 ? <span aria-hidden="true" className="absolute top-3 left-[4px] h-full w-px bg-border" /> : null}
          <span>{stop}</span>
          <span className="ml-auto text-xs text-muted-foreground">{index < 2 ? "Done" : "Out for delivery"}</span>
        </li>
      ))}
    </ol>
  );
}

const SafeRouteStatus = withErrorBoundary(RouteStatus, {
  fallback: (
    <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
      <IconAlertCircle aria-hidden="true" className="size-4 shrink-0" />
      The route is unavailable right now.
    </p>
  ),
  resetKeys: (props) => [props.broken],
});

/** `body` adds classes to the panel body: a panel that is going to break holds the height of its healthy content, so the fallback does not shrink it. */
function Panel({ caption, title, action, body, children }: { caption: string; title: string; action?: ReactNode; body?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <section className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-xs">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border py-2 pr-3 pl-5">
          <h2 className="text-sm font-medium tracking-[-0.01em]">{title}</h2>
          {action}
        </header>
        <div className={cn("flex-1 p-5", body)}>{children}</div>
      </section>
    </div>
  );
}

interface Report {
  source: string;
  message: string;
}

/** One line of the log: who reported, and what they said. */
function ReportLine({ source, message }: Report): React.JSX.Element {
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <Badge variant="muted" className="font-mono">
        {source}
      </Badge>
      <span className="min-w-0 break-words text-muted-foreground">{message}</span>
    </li>
  );
}

export default function Demo(): React.JSX.Element {
  const [period, setPeriod] = useState<Period>("30d");
  const [routeBroken, setRouteBroken] = useState(false);
  const [reports, setReports] = useState<readonly Report[]>([]);
  const [, rerender] = useState(0);
  const bugs = useRef<Bugs>({ live: false, products: true, feed: true });

  // The page starts healthy, as it would on the server, and two of the widgets break once it is live.
  useEffect(() => {
    bugs.current.live = true;
    rerender((count) => count + 1);
  }, []);

  /** What would go to Sentry or your own endpoint: once per error. */
  const report = (source: string) => (error: Error) => setReports((all) => [...all, { source, message: error.message }].slice(-4));

  return (
    // Two columns only when the preview itself is wide enough for two panels: the width of the page says nothing about the pane the demo gets.
    <div className="@container w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Panel
          caption="Default fallback. Pick 90d and this panel breaks; pick another period and resetKeys brings it back"
          title="Revenue"
          action={<SegmentedControl label="Period" value={period} onValueChange={(next) => setPeriod(next as Period)} options={PERIODS} />}
        >
          <ErrorBoundary resetKeys={[period]} onError={report("Revenue")}>
            <Revenue period={period} />
          </ErrorBoundary>
        </Panel>

        <Panel
          caption="Broken when the page went live, and the rest of the page works. Try again mounts it anew, with the bug fixed"
          title="Top products"
          body="min-h-[9.375rem]"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                bugs.current.products = true;
                rerender((count) => count + 1);
              }}
            >
              Break again
            </Button>
          }
        >
          <ErrorBoundary
            onError={report("Top products")}
            onReset={() => {
              bugs.current.products = false;
            }}
          >
            <TopProducts bugs={bugs} />
          </ErrorBoundary>
        </Panel>

        <Panel caption="A fallback of your own: a function that gets the error and reset" title="Activity" body="min-h-[10.75rem]">
          <ErrorBoundary
            onError={report("Activity")}
            onReset={() => {
              bugs.current.feed = false;
            }}
            fallback={({ error, reset }) => (
              <div className="grid gap-3.5 rounded-lg border border-dashed border-destructive/40 p-4">
                <div className="flex items-start gap-3">
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="grid min-w-0 gap-1">
                    <p className="text-sm font-medium">The activity feed is unavailable</p>
                    <p className="font-mono text-xs break-words text-muted-foreground">{error.message}</p>
                  </div>
                </div>
                <Button size="sm" className="w-fit" onClick={reset}>
                  <IconRefresh />
                  Try again
                </Button>
              </div>
            )}
          >
            <ActivityFeed bugs={bugs} />
          </ErrorBoundary>
        </Panel>

        <Panel
          caption="A component you do not render yourself, wrapped with withErrorBoundary"
          title="Delivery"
          action={
            <Button variant="ghost" size="sm" onClick={() => setRouteBroken((broken) => !broken)}>
              {routeBroken ? "Fix it" : "Break it"}
            </Button>
          }
        >
          <SafeRouteStatus broken={routeBroken} />
        </Panel>

        <div className="grid gap-3 @3xl:col-span-2">
          <p className="text-xs text-muted-foreground">What onError handed to the logger, once per error</p>
          <ul className="grid gap-1.5 rounded-xl border border-border bg-card p-4 font-mono text-xs shadow-xs">
            {reports.length === 0 ? (
              // The two widgets that break once the page is live report within a blink, and the server has not heard from them. Until then an invisible copy of both lines shares the cell
              // with this sentence, so the log is as tall as it will be and nothing below the preview steps.
              <li className="grid">
                <span className="col-start-1 row-start-1 text-muted-foreground">Nothing has broken yet.</span>
                <ul aria-hidden="true" className="invisible col-start-1 row-start-1 grid gap-1.5">
                  <ReportLine source="Top products" message={PRODUCTS_ERROR} />
                  <ReportLine source="Activity" message={ACTIVITY_ERROR} />
                </ul>
              </li>
            ) : null}
            {reports.map((entry, index) => (
              <ReportLine key={`${index}-${entry.source}`} source={entry.source} message={entry.message} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
