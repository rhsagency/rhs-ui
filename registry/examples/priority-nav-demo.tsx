"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconBook, IconBookOpen, IconBoard, IconChart, IconCircleDot, IconGitPullRequest, IconPlay, IconSettings, IconShield } from "@rhs-ui/icons";
import { PriorityNav, type PriorityNavItem } from "@rhs-ui/primitives/priority-nav";
import { Slider } from "@rhs-ui/primitives/slider";

const REPO = "/northwind/kestrel";

const REPO_LINKS: readonly PriorityNavItem[] = [
  { label: "Overview", href: REPO, icon: <IconBook /> },
  { label: "Issues", href: `${REPO}/issues`, count: 24, icon: <IconCircleDot /> },
  { label: "Pull requests", href: `${REPO}/pulls`, count: 8, icon: <IconGitPullRequest /> },
  { label: "Actions", href: `${REPO}/actions`, icon: <IconPlay /> },
  { label: "Projects", href: `${REPO}/projects`, count: 3, icon: <IconBoard /> },
  { label: "Wiki", href: `${REPO}/wiki`, icon: <IconBookOpen /> },
  { label: "Security", href: `${REPO}/security`, count: 2, icon: <IconShield /> },
  { label: "Insights", href: `${REPO}/insights`, icon: <IconChart /> },
  { label: "Settings", href: `${REPO}/settings`, icon: <IconSettings /> },
];

const APP_LINKS: readonly PriorityNavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Reports", href: "/reports", count: 12 },
  { label: "Customers", href: "/customers" },
  { label: "Invoices", href: "/invoices" },
  { label: "Team", href: "/team" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
];

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Repository(): React.JSX.Element {
  const stage = useRef<HTMLDivElement>(null);
  const [wanted, setWanted] = useState(520);
  // The slider only offers widths the stage has room for, so the number it shows is the width the card really has.
  const [room, setRoom] = useState(760);
  const [current, setCurrent] = useState(`${REPO}/pulls/118`);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => setRoom(Math.floor(element.clientWidth - (window.innerWidth < 640 ? 24 : 40)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const max = Math.max(200, Math.min(760, room));
  const min = Math.min(240, max - 20);
  const width = Math.min(max, Math.max(min, wanted));
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-xs font-medium text-foreground">Width</span>
        <Slider min={min} max={max} step={4} value={[width]} onValueChange={(next) => setWanted(next[0] ?? 520)} thumbLabels={["Width of the repository card"]} className="max-w-md" />
        <output className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{width}px</output>
      </div>

      <div ref={stage} className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 sm:p-5">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs" style={{ width, maxWidth: "100%" }}>
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <p className="text-sm font-semibold tracking-[-0.01em]">northwind / kestrel</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Billing and invoicing service · updated 2 hours ago</p>
          </div>
          {/* The links sit on the card's own bottom edge, so the nav draws no hairline of its own. */}
          <PriorityNav items={REPO_LINKS} currentHref={current} onNavigate={setCurrent} aria-label="Repository" className="mt-3 border-b-0 px-1 sm:px-2" />
        </div>
      </div>
    </div>
  );
}

function Header(): React.JSX.Element {
  const [current, setCurrent] = useState("/billing");
  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-xs">
      <span className="shrink-0 pl-1 text-sm font-semibold tracking-[-0.02em]">Halcyon</span>
      <PriorityNav items={APP_LINKS} currentHref={current} onNavigate={setCurrent} variant="pill" aria-label="Application" className="flex-1" />
    </div>
  );
}

function Narrowest(): React.JSX.Element {
  return (
    <div className="w-36 rounded-xl border border-border bg-card px-2 shadow-xs">
      <PriorityNav items={REPO_LINKS} onNavigate={() => {}} aria-label="Repository, narrowest" />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Drag the width. The current page always stays in the row; the rest move into More, in order. Choose one from the menu and it takes a place in the row.">
          <Repository />
        </Example>
      </div>

      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Pills, in an app header. Billing is the sixth link, but it is the current page, so it stays in view.">
          <Header />
        </Example>
      </div>

      <Example caption="With no current page and no room, everything lives in the menu. A screen reader hears its button as “More, 9 links”.">
        <Narrowest />
      </Example>
    </div>
  );
}
