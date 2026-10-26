"use client";

import { useState, type ReactNode } from "react";

import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Label } from "@rhs-ui/primitives/label";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { SkeletonGroup, useSkeletonDelay } from "@rhs-ui/primitives/skeleton-group";
import { Switch } from "@rhs-ui/primitives/switch";

const ACTIVITY = [
  { name: "Mara de Vries", did: "pushed 3 commits to kestrel-web", when: "2 min" },
  { name: "Jonas Falk", did: "commented on the Halcyon pricing page", when: "14 min" },
  { name: "Priya Nair", did: "closed the Polder invoice export bug", when: "1 h" },
  { name: "Tomas Ruiz", did: "deployed Northwind checkout to staging", when: "3 h" },
] as const;

function FeedSkeleton(): React.JSX.Element {
  return (
    <>
      {ACTIVITY.map((entry) => (
        <div key={entry.name} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          {/* One 20px line box per bar, the height of the text lines in Feed below, so the real rows take exactly the room these do. */}
          <div className="grid min-w-0 flex-1 gap-0.5">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-2/5" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
          <Skeleton className="hidden h-5 w-12 rounded-full sm:block" />
        </div>
      ))}
    </>
  );
}

function Feed(): React.JSX.Element {
  return (
    <>
      {ACTIVITY.map((entry) => (
        <div key={entry.name} className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initialsOf(entry.name)}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="truncate text-sm font-medium">{entry.name}</p>
            <p className="truncate text-sm text-muted-foreground">{entry.did}</p>
          </div>
          <Badge variant="muted" className="hidden tabular-nums sm:inline-flex">
            {entry.when}
          </Badge>
        </div>
      ))}
    </>
  );
}

const BARS = ["42%", "64%", "50%", "80%", "57%", "92%", "68%", "74%", "47%", "85%", "60%", "72%"] as const;

/** A custom shape: plain divs with their own pulse, taking their place in the wave from the group. */
function Bar({ index, height }: { index: number; height: string }): React.JSX.Element {
  const delay = useSkeletonDelay(index);
  return <div className="w-full rounded-t-md bg-muted motion-safe:animate-pulse" style={{ height, animationDelay: `${delay}ms` }} />;
}

function Chart({ placeholder }: { placeholder: boolean }): React.JSX.Element {
  return (
    <div className="flex h-36 items-end gap-1.5">
      {BARS.map((height, index) => (placeholder ? <Bar key={height + index} index={index} height={height} /> : <div key={height + index} className="w-full rounded-t-md bg-foreground/85" style={{ height }} />))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid content-start gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="text-sm font-medium tracking-[-0.01em]">{title}</h2>
      {children}
    </div>
  );
}

/** One row of two cards. With `loading` the placeholders are in groups; without it the real content stands in the same places. */
function Row({ loading }: { loading: boolean }): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card title="Team activity">
        {loading ? (
          <SkeletonGroup className="grid gap-4">
            <FeedSkeleton />
          </SkeletonGroup>
        ) : (
          <div className="grid gap-4">
            <Feed />
          </div>
        )}
      </Card>
      <Card title="Commits this week">
        {loading ? (
          <SkeletonGroup stagger={70}>
            <Chart placeholder />
          </SkeletonGroup>
        ) : (
          <Chart placeholder={false} />
        )}
      </Card>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  return (
    <div className="@container grid w-full max-w-4xl gap-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Switch id="group-loading" checked={loading} onCheckedChange={setLoading} />
        <Label htmlFor="group-loading">Loading</Label>
        <span className="text-xs text-muted-foreground">Turn it off and the real content arrives in the same places; nothing is announced.</span>
      </div>

      <div className="grid gap-3">
        <p className="text-xs text-muted-foreground">Skeleton blocks in a group sweep as one wave, in document order. A custom shape asks for its delay with useSkeletonDelay</p>
        <Row loading={loading} />
        <p className="text-xs text-muted-foreground">A screen reader hears one polite status, &quot;Loading content&quot;, instead of a dozen empty boxes.</p>
      </div>

      <div className="grid gap-3">
        <p className="text-xs text-muted-foreground">The same cards once the data is in</p>
        <Row loading={false} />
      </div>
    </div>
  );
}
