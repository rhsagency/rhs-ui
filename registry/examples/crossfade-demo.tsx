"use client";

import { useEffect, useRef, useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconRefresh } from "@rhs-ui/icons";
import { AutoHeight } from "@rhs-ui/motion/auto-height";
import { Crossfade } from "@rhs-ui/motion/crossfade";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

const PANELS: Record<string, { title: string; lines: readonly string[] }> = {
  overview: {
    title: "Overview",
    lines: ["Your store shipped 312 orders this week, 9 percent more than last week.", "Three orders are waiting on stock and will leave as soon as it arrives."],
  },
  usage: {
    title: "Usage",
    lines: [
      "API requests: 8,420 of 10,000 this month.",
      "Storage: 7.2 of 10 GB, mostly product photography.",
      "Seats: 12 of 12. Add a seat before the next teammate joins.",
      "Webhooks: 41,903 deliveries, 99.97 percent succeeded on the first try.",
    ],
  },
  billing: { title: "Billing", lines: ["Northwind Pro, billed yearly. The next invoice of €1,188.00 is issued on 1 November."] },
};

const FIELDS = [
  { label: "Orders handled", value: "1,284", wide: false },
  { label: "Median response", value: "8 min", wide: false },
  { label: "Region", value: "Europe and Africa", wide: true },
] as const;

// The profile and its skeleton are built from the same rows, with the same line boxes (24, 20, 16 and 20 px), and every
// line of the profile is a single line, so the card is exactly as tall in both and nothing moves when the data lands.
function Profile(): React.JSX.Element {
  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>MO</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-6 font-medium tracking-[-0.02em]">Mara Okafor</p>
          <p className="truncate text-sm leading-5 text-muted-foreground">Head of Operations</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {FIELDS.map((field) => (
          <div key={field.label} className={cn("min-w-0", field.wide && "col-span-2")}>
            <dt className="truncate text-xs leading-4 text-muted-foreground">{field.label}</dt>
            <dd className="mt-0.5 truncate text-sm leading-5 font-medium tabular-nums">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ProfileSkeleton(): React.JSX.Element {
  return (
    <div role="status" aria-label="Loading profile">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex h-6 items-center">
            <Skeleton className="h-4 w-28 max-w-full" delay={120} />
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-36 max-w-full" delay={240} />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {FIELDS.map((field, index) => (
          <div key={field.label} className={cn("min-w-0", field.wide && "col-span-2")}>
            <div className="flex h-4 items-center">
              <Skeleton className="h-2.5 w-20 max-w-full" delay={360 + index * 120} />
            </div>
            <div className="mt-0.5 flex h-5 items-center">
              <Skeleton className={cn("h-3.5 max-w-full", field.wide ? "w-40" : "w-14")} delay={420 + index * 120} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState("overview");
  const [mode, setMode] = useState<"overlap" | "wait">("overlap");
  const timer = useRef(0);

  // The button stays focusable while it loads (aria-disabled, not disabled), so a keyboard user keeps their place; the status beside it says what is happening.
  const reload = (): void => {
    if (loading) return;
    window.clearTimeout(timer.current);
    setLoading(true);
    timer.current = window.setTimeout(() => setLoading(false), 1500);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const current = PANELS[panel] ?? PANELS.overview!;

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 items-start gap-4 md:grid-cols-2">
      <section aria-labelledby="crossfade-skeleton" className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 id="crossfade-skeleton" className="text-sm font-medium">
          Skeleton to content
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Same footprint, so nothing moves when the data lands.</p>
        <AutoHeight className="mt-5">
          <Crossfade activeKey={loading ? "skeleton" : "content"}>{loading ? <ProfileSkeleton /> : <Profile />}</Crossfade>
        </AutoHeight>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={reload} aria-disabled={loading || undefined} className="aria-disabled:pointer-events-none aria-disabled:opacity-50">
            <IconRefresh />
            Reload profile
          </Button>
          <span role="status" className="text-xs text-muted-foreground">
            {loading ? "Loading" : "Loaded"}
          </span>
        </div>
      </section>

      <section aria-labelledby="crossfade-panels" className="@container min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 id="crossfade-panels" className="text-sm font-medium">
          Panels of different heights
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Wrapped in <span className="font-mono">AutoHeight</span>, so the card glides as well as fades.
        </p>
        <div className="mt-4">
          <SegmentedControl
            label="Account section"
            value={panel}
            onValueChange={setPanel}
            className="[&>button]:px-2 @min-[16rem]:[&>button]:px-4"
            options={[
              { value: "overview", label: "Overview" },
              { value: "usage", label: "Usage" },
              { value: "billing", label: "Billing" },
            ]}
          />
        </div>
        <AutoHeight className="mt-5">
          <Crossfade activeKey={panel} mode={mode} duration={260}>
            <div>
              <h3 className="text-sm font-medium">{current.title}</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {current.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </Crossfade>
        </AutoHeight>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">Fade mode</span>
          <SegmentedControl
            label="Crossfade mode"
            value={mode}
            onValueChange={(value) => setMode(value === "wait" ? "wait" : "overlap")}
            options={[
              { value: "overlap", label: "Overlap" },
              { value: "wait", label: "Wait" },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
