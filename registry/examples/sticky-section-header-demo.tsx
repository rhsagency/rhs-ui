"use client";

import { useEffect, useRef } from "react";

import { StickySectionHeader } from "@rhs-ui/motion/sticky-section-header";
import { Badge } from "@rhs-ui/primitives/badge";

interface Release {
  version: string;
  title: string;
  summary: string;
  day: string;
  kind: "Feature" | "Fix" | "Improvement";
}

const MONTHS: readonly { month: string; releases: readonly Release[] }[] = [
  {
    month: "October 2026",
    releases: [
      { version: "4.12.0", day: "19 Oct", kind: "Feature", title: "Dependencies on the timeline", summary: "Draw a line between two tasks and the later one moves when the earlier one slips." },
      { version: "4.11.2", day: "12 Oct", kind: "Fix", title: "Archiving large projects", summary: "Archiving a project with more than 500 tasks no longer stalls the page." },
      { version: "4.11.0", day: "5 Oct", kind: "Improvement", title: "Shared views", summary: "Save a filtered board as a view and share one link with the whole team." },
    ],
  },
  {
    month: "September 2026",
    releases: [
      { version: "4.10.1", day: "28 Sep", kind: "Fix", title: "Time zones in reminders", summary: "Reminders now fire in the time zone of the person who set them." },
      { version: "4.10.0", day: "16 Sep", kind: "Feature", title: "Workload view", summary: "See who is overbooked next week before you assign one more task." },
      { version: "4.9.3", day: "4 Sep", kind: "Improvement", title: "Faster search", summary: "Search results arrive in under 80 ms, even in a workspace with 40,000 tasks." },
    ],
  },
  {
    month: "August 2026",
    releases: [
      { version: "4.9.0", day: "21 Aug", kind: "Feature", title: "Guest access", summary: "Invite a client to a single project without giving them the rest of the workspace." },
      { version: "4.8.2", day: "9 Aug", kind: "Fix", title: "Duplicate notifications", summary: "A comment mentioning two people no longer notifies the first one twice." },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const panel = useRef<HTMLDivElement>(null);

  // Open with the first heading just stuck, so the preview already shows the point. It is measured from the section,
  // which never moves, so running this twice (Strict Mode) lands in the same place, and again once web fonts are ready
  // (they re-wrap the text above), as long as the reader has not scrolled yet.
  useEffect(() => {
    const scroller = panel.current;
    const first = scroller?.querySelector<HTMLElement>("section");
    if (!scroller || !first) return;
    let placed = -1;
    const place = (): void => {
      if (placed >= 0 && Math.abs(scroller.scrollTop - placed) > 1) return;
      placed = first.offsetTop + 8;
      scroller.scrollTop = placed;
    };
    place();
    void document.fonts?.ready.then(place);
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <p className="pb-3 text-xs text-muted-foreground">Scroll the panel: each month keeps its heading under the top edge until the next one takes over.</p>
      <div ref={panel} role="region" aria-label="Halcyon release notes" tabIndex={0} className="relative h-[var(--panel)] scroll-pt-12 overflow-y-auto rounded-xl border border-border bg-background outline-none [--panel:min(32rem,calc(100dvh-5.5rem))] focus-visible:ring-[3px] focus-visible:ring-ring/40">
        <div className="px-6 pt-8 pb-6">
          <h2 className="text-2xl font-medium tracking-[-0.03em]">What is new in Halcyon</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">Every release since August, newest first.</p>
        </div>
        {/* The last month is as tall as the panel (less the padding below), so its heading can reach the top edge like the others. */}
        <div className="px-6 pb-10 [&>section:last-child]:min-h-[calc(var(--panel)-2.5rem)]">
          {MONTHS.map((group, index) => (
            <section key={group.month} aria-label={group.month}>
              <StickySectionHeader level={3} aside={`${group.releases.length} releases`} className="-mx-6 px-6">
                {group.month}
              </StickySectionHeader>
              <ul className="divide-y divide-border">
                {group.releases.map((release) => (
                  <li key={release.version} className="py-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">v{release.version}</span>
                      <Badge variant={release.kind === "Fix" ? "outline" : "muted"}>{release.kind}</Badge>
                      <span className="ml-auto text-xs text-muted-foreground">{release.day}</span>
                    </div>
                    <h4 className="mt-2 text-base font-medium tracking-[-0.02em]">{release.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{release.summary}</p>
                  </li>
                ))}
              </ul>
              {index === MONTHS.length - 1 ? <p className="pt-6 text-xs text-muted-foreground">That is the whole list.</p> : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
