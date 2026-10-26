"use client";

import { useRef, useState, type ReactNode } from "react";

import { WatchButton, type WatchLevel, type WatchLevelOption } from "@rhs-ui/application/watch-button";
import { Badge } from "@rhs-ui/primitives/badge";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The parent keeps the truth, as in a real app: the level and the watcher count change together once the server has
 * said yes. `failFirst` makes the first request fail, so the rollback can be seen.
 */
function useWatch(initial: { level: WatchLevel; count: number }, failFirst = false) {
  const [state, setState] = useState(initial);
  const spent = useRef(!failFirst);
  const onLevelChange = async (next: WatchLevel) => {
    await wait(550);
    if (!spent.current) {
      spent.current = true;
      throw new Error("offline");
    }
    setState((current) => ({ level: next, count: current.count + (next !== "ignore" ? 1 : 0) - (current.level !== "ignore" ? 1 : 0) }));
  };
  return { ...state, onLevelChange };
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Issue(): React.JSX.Element {
  const watch = useWatch({ level: "all", count: 128 }, true);
  return (
    <article className="w-full rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 basis-64">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">northwind/api #482</span>
            <Badge variant="outline">Open</Badge>
          </p>
          <h2 className="mt-2 text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">Rate limit headers are missing on 429 responses</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Opened by Tomas Brandt 3 days ago &middot; 14 comments &middot; linked to release 4.2</p>
        </div>
        <WatchButton subject="this issue" level={watch.level} count={watch.count} onLevelChange={watch.onLevelChange} />
      </div>
    </article>
  );
}

const PROJECT_LEVELS: readonly WatchLevelOption[] = [
  { id: "all", label: "Everything", description: "Every task, comment and file in this project.", status: "Following" },
  { id: "mentions", label: "Only me", description: "Tasks assigned to you, and mentions.", status: "Only me" },
  { id: "ignore", label: "Mute", description: "Nothing, even when you are assigned.", status: "Muted" },
];

function Level({ level, subject }: { level: WatchLevel; subject: string }): React.JSX.Element {
  const watch = useWatch({ level, count: 41 });
  return <WatchButton subject={subject} level={watch.level} count={watch.count} onLevelChange={watch.onLevelChange} />;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="An issue you watch. The first change you make fails, to show the rollback; the count moves by one when you start or stop.">
        <Issue />
      </Example>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <Example caption="All activity: a bell">
          <Level level="all" subject="this thread" />
        </Example>
        <Example caption="Mentions only: a bell with a dot">
          <Level level="mentions" subject="this thread" />
        </Example>
        <Example caption="Not watching: a bell crossed out">
          <Level level="ignore" subject="this thread" />
        </Example>
      </div>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        <Example caption="Your own words, for a project">
          <WatchButton subject="this project" defaultLevel="mentions" levels={PROJECT_LEVELS} />
        </Example>
        <Example caption="Small, with no count">
          <WatchButton subject="this document" size="sm" defaultLevel="all" />
        </Example>
      </div>
    </div>
  );
}
