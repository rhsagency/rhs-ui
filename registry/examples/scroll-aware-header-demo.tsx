"use client";

import { useEffect, useRef, useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconChevronDown } from "@rhs-ui/icons";
import { ScrollAwareHeader } from "@rhs-ui/motion/scroll-aware-header";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

type Behavior = "hide" | "condense" | "solid";

// The Product menu is part of the nav, which is hidden on a phone, so its sentence only shows from sm up.
const HINTS: Record<Behavior, React.ReactNode> = {
  hide: (
    <>
      Scroll down and the header slides away; scroll up and it returns.<span className="hidden sm:inline"> Open the Product menu and it stays put.</span>
    </>
  ),
  condense: "Scroll down and the header tucks its padding in and gains a hairline. Nothing below it moves.",
  solid: "Transparent at the top, solid with a hairline once the page has scrolled.",
};

/** Quiet stand-ins for product screenshots, drawn with borders and fills so the page needs no images. */
function TimelineArt(): React.JSX.Element {
  const rows = [
    { from: 3, to: 46, strong: true },
    { from: 24, to: 68, strong: false },
    { from: 44, to: 92, strong: true },
  ] as const;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.from} className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3">
          <span className="h-1.5 rounded-full bg-border" />
          <span className="relative h-5 rounded-md bg-muted">
            <span className={cn("absolute inset-y-0 rounded-md", row.strong ? "bg-foreground" : "bg-foreground/30")} style={{ left: `${row.from}%`, width: `${row.to - row.from}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function BoardsArt(): React.JSX.Element {
  const columns = [2, 2, 1] as const;
  return (
    <div className="grid grid-cols-3 gap-3">
      {columns.map((cards, column) => (
        <div key={column} className="space-y-2 rounded-lg bg-muted p-2">
          <span className="block h-1.5 w-8 rounded-full bg-border" />
          {Array.from({ length: cards }, (_, card) => (
            <span key={card} className="block space-y-1.5 rounded-md border border-border bg-card p-2">
              <span className="block h-1.5 w-4/5 rounded-full bg-foreground/30" />
              <span className="block h-1.5 w-1/2 rounded-full bg-border" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function WorkloadArt(): React.JSX.Element {
  const loads = [52, 78, 100, 36] as const;
  return (
    <div className="space-y-2.5">
      {loads.map((load) => (
        <div key={load} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3">
          <span className="size-5 rounded-full bg-muted" />
          <span className="relative h-2.5 overflow-clip rounded-full bg-muted">
            <span className={cn("absolute inset-y-0 left-0 rounded-full", load >= 100 ? "bg-foreground" : "bg-foreground/30")} style={{ width: `${load}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

const SECTIONS = [
  { title: "Timeline", body: "Every task on one line, with dependencies drawn between them. Drag a date and everything that depends on it moves too.", art: <TimelineArt /> },
  { title: "Boards", body: "Columns for how your team works, not how a tool thinks you should. Limits, swimlanes and rules for what may move where.", art: <BoardsArt /> },
  { title: "Workload", body: "See who is overbooked next week before you assign one more task, and move work with a single drag.", art: <WorkloadArt /> },
] as const;

export default function Demo(): React.JSX.Element {
  const [behavior, setBehavior] = useState<Behavior>("condense");
  const panel = useRef<HTMLDivElement>(null);

  // Open part-way down, so the preview already shows the header after it has reacted. The spot is measured from the
  // first section, so it is the same on a phone, where the text wraps differently, and again once web fonts are ready,
  // as long as the reader has not scrolled yet.
  useEffect(() => {
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>("main > section + section");
    if (!el) return;
    let placed = -1;
    const place = (): void => {
      if (placed >= 0 && Math.abs(el.scrollTop - placed) > 1) return;
      placed = behavior === "hide" || !first ? 0 : Math.max(0, first.offsetTop - (behavior === "solid" ? 92 : 76));
      el.scrollTop = placed;
    };
    place();
    void document.fonts?.ready.then(place);
  }, [behavior]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
          <h2 className="text-sm font-medium">Header behaviour</h2>
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {HINTS[behavior]}
          </p>
        </div>
        <SegmentedControl
          label="Behaviour"
          value={behavior}
          onValueChange={(value) => setBehavior(value === "hide" ? "hide" : value === "solid" ? "solid" : "condense")}
          options={[
            { value: "hide", label: "Hide" },
            { value: "condense", label: "Condense" },
            { value: "solid", label: "Solid" },
          ]}
        />
      </div>

      <div ref={panel} className="relative mt-4 h-[min(30rem,calc(100dvh-8.5rem))] overflow-y-auto rounded-xl border border-border bg-background">
        <ScrollAwareHeader key={behavior} behavior={behavior} className="px-5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2.5 text-sm font-medium tracking-[-0.01em]">
              <span className="grid size-6 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">
                H
              </span>
              Halcyon
            </span>
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Product
                    <IconChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Timeline</DropdownMenuItem>
                  <DropdownMenuItem>Boards</DropdownMenuItem>
                  <DropdownMenuItem>Workload</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
              <Button variant="ghost" size="sm">
                Docs
              </Button>
            </nav>
            <Button size="sm">Start free</Button>
          </div>
        </ScrollAwareHeader>

        <main className="mx-auto max-w-2xl px-5 pb-16">
          <section className="pt-12 pb-8">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Product tour</p>
            <h2 className="mt-3 text-4xl font-medium tracking-[-0.04em] text-balance">Plan less. Ship more.</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">Halcyon keeps the plan, the work and the people in one place, so a status meeting becomes a link.</p>
          </section>
          {SECTIONS.map((section) => (
            <section key={section.title} className="border-t border-border py-8">
              <h3 className="text-lg font-medium tracking-[-0.02em]">{section.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              <div className="mt-5 grid h-36 content-center rounded-lg border border-border bg-card p-4 shadow-xs" aria-hidden="true">
                {section.art}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
