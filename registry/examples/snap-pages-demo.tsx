"use client";

import { useState, type ReactNode } from "react";

import { IconInbox, IconMail, IconMessage } from "@rhs-ui/icons";
import { SnapPages, type SnapPage } from "@rhs-ui/motion/snap-pages";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

/** Every size here answers to the width of the story, not of the screen, so the pages read well in a small frame too. */
function Story({ eyebrow, title, text, children, hint, long = false }: { eyebrow: string; title: string; text: string; children?: ReactNode; hint?: ReactNode; long?: boolean }): React.JSX.Element {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-5xl gap-5 px-6 py-8 pr-14 @2xl:grid-cols-[1.05fr_1fr] @2xl:gap-12 @2xl:px-12 @2xl:py-10 @2xl:pr-20",
        long ? "items-start @2xl:py-14" : "items-center",
      )}
    >
      <div className={long ? "@2xl:sticky @2xl:top-14" : undefined}>
        <p className="text-xs tracking-widest uppercase opacity-70">{eyebrow}</p>
        <h2 className="mt-3 max-w-[16ch] text-3xl leading-[1.05] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl @4xl:text-5xl">{title}</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80 @2xl:mt-4 @2xl:text-base">{text}</p>
        {hint}
      </div>
      {children}
    </div>
  );
}

const ROADMAP: readonly { name: string; owner: string; done: number }[] = [
  { name: "Design system", owner: "IV", done: 82 },
  { name: "Checkout rebuild", owner: "MK", done: 56 },
  { name: "Mobile app", owner: "SD", done: 31 },
  { name: "Analytics export", owner: "JP", done: 12 },
];

function Roadmap(): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm @2xl:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">Q4 roadmap</p>
        <p className="hidden text-xs text-muted-foreground tabular-nums @sm:block">12 Oct to 18 Dec</p>
      </div>
      <ul className="mt-4 space-y-3 @2xl:mt-6 @2xl:space-y-5">
        {ROADMAP.map((row) => (
          <li key={row.name}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2.5">
                <span aria-hidden="true" className="hidden size-6 place-items-center rounded-full bg-muted text-[0.625rem] font-medium text-muted-foreground @sm:grid">
                  {row.owner}
                </span>
                {row.name}
              </span>
              <span className="text-muted-foreground tabular-nums">{row.done}%</span>
            </div>
            <div role="img" aria-label={`${row.name}: ${row.done} percent done`} className="mt-2 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${row.done}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const INBOX: readonly { icon: ReactNode; title: string; source: string; when: string }[] = [
  { icon: <IconMail className="size-4" />, title: "Can Halcyon export to our ERP?", source: "Sales", when: "2 min" },
  { icon: <IconMessage className="size-4" />, title: "Shipping label prints twice on Safari", source: "Support", when: "14 min" },
  { icon: <IconInbox className="size-4" />, title: "Quarterly planning template request", source: "Customer success", when: "1 h" },
];

function Inbox(): React.JSX.Element {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      {INBOX.map((item) => (
        <li key={item.title} className="flex items-center gap-3 px-4 py-3 @2xl:gap-4 @2xl:px-5 @2xl:py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.source}, {item.when} ago
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const RELEASES: readonly { version: string; date: string; text: string }[] = [
  { version: "3.4", date: "14 Oct", text: "Capacity view for every team" },
  { version: "3.3", date: "30 Sep", text: "Saved filters and keyboard shortcuts" },
  { version: "3.2", date: "16 Sep", text: "Offline counts in Kestrel Mobile" },
  { version: "3.1", date: "2 Sep", text: "Bank feed matching in Northwind Ledger" },
  { version: "3.0", date: "19 Aug", text: "A calmer interface, rebuilt from the ground" },
  { version: "2.9", date: "5 Aug", text: "Roadmap sharing with read-only links" },
  { version: "2.8", date: "22 Jul", text: "Workload warnings before a plan breaks" },
  { version: "2.7", date: "8 Jul", text: "Import plans from a spreadsheet" },
  { version: "2.6", date: "24 Jun", text: "Comments on any roadmap row" },
  { version: "2.5", date: "10 Jun", text: "Faster search across every plan" },
  { version: "2.4", date: "27 May", text: "Owners and due dates on milestones" },
  { version: "2.3", date: "13 May", text: "Single sign-on for teams on Business" },
  { version: "2.2", date: "29 Apr", text: "Duplicate a plan with its history" },
  { version: "2.1", date: "15 Apr", text: "The first public release" },
];

function Releases(): React.JSX.Element {
  return (
    <ol className="relative border-l border-border pl-6">
      {RELEASES.map((release) => (
        <li key={release.version} className="relative pb-6 last:pb-0">
          <span aria-hidden="true" className="absolute top-1.5 -left-[1.9rem] size-2.5 rounded-full border-2 border-foreground bg-background" />
          <p className="flex items-baseline gap-3 text-sm">
            <span className="font-medium tabular-nums">{release.version}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{release.date}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{release.text}</p>
        </li>
      ))}
    </ol>
  );
}

const PAGES: readonly SnapPage[] = [
  {
    id: "welcome",
    title: "Welcome",
    className: "flex items-center",
    content: (
      <Story
        eyebrow="Halcyon 3.0"
        title="Plan the quarter in an afternoon."
        text="Roadmaps, capacity and releases in one calm view, so the plan survives its first Monday."
        hint={
          <p className="mt-5 text-xs text-muted-foreground @2xl:mt-8">
            <span className="hidden items-center gap-2 @2xl:flex">
              <KbdGroup>
                <Kbd>Page Down</Kbd>
              </KbdGroup>
              or scroll to continue
            </span>
            <span className="@2xl:hidden">Swipe up to continue</span>
          </p>
        }
      >
        <Roadmap />
      </Story>
    ),
  },
  {
    id: "capture",
    title: "Capture",
    className: "flex items-center bg-muted/60",
    content: (
      <Story eyebrow="01 Capture" title="Everything lands in one inbox." text="Requests from email, chat and the support desk arrive already sorted by who owns them.">
        <Inbox />
      </Story>
    ),
  },
  {
    id: "release",
    title: "Release",
    className: "flex items-start",
    content: (
      <Story long eyebrow="02 Release" title="Every release, in order." text="This page is taller than the screen, so it scrolls like any page before the next one snaps in.">
        <Releases />
      </Story>
    ),
  },
  {
    id: "start",
    title: "Start",
    className: "flex items-center bg-primary text-primary-foreground",
    content: (
      <div className="mx-auto w-full max-w-3xl px-6 py-10 pr-14 text-center @2xl:px-12 @2xl:pr-12">
        <p className="text-xs tracking-widest uppercase opacity-70">03 Start</p>
        <h2 className="mx-auto mt-3 max-w-[18ch] text-3xl leading-[1.05] font-medium tracking-[-0.04em] text-balance @2xl:mt-4 @2xl:text-4xl @4xl:text-5xl">Your next quarter starts here.</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed opacity-80 @2xl:mt-5 @2xl:text-base">Import a plan from a spreadsheet in about a minute. Free for teams of up to five.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 @2xl:mt-9">
          <Button size="lg" variant="outline" className="border-transparent">
            Start free
          </Button>
          <Button size="lg" variant="ghost" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            Book a walkthrough
          </Button>
        </div>
      </div>
    ),
  },
];

export default function Demo(): React.JSX.Element {
  const [page, setPage] = useState(0);
  return (
    <div className="@container mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="relative">
        <SnapPages pages={PAGES} label="Halcyon product story" onPageChange={(index) => setPage(index)} className="h-[min(36rem,calc(100dvh-6rem))] min-h-[28rem] overflow-hidden rounded-xl border border-border" />
        <p aria-hidden="true" className="pointer-events-none absolute top-4 left-4 z-10 hidden rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground tabular-nums shadow-xs @2xl:block">
          <span className="font-medium text-foreground">{String(page + 1).padStart(2, "0")}</span> / {String(PAGES.length).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
