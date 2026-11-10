"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";

import { IconCursor, IconVolume } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RouteFocus } from "@rhs-ui/primitives/route-focus";
import { cn } from "@/lib/utils";

interface Page {
  title: string;
  lead: string;
  rows: readonly (readonly [string, string])[];
}

const PAGES: Record<string, Page> = {
  "/overview": {
    title: "Overview",
    lead: "Halcyon Studio is on the Scale plan and renews on 14 March.",
    rows: [
      ["Active seats", "148 of 150"],
      ["Monthly spend", "€12,480"],
      ["Open invoices", "2"],
    ],
  },
  "/billing": {
    title: "Billing",
    lead: "Invoices are sent to finance@halcyon.studio on the first of the month.",
    rows: [
      ["Invoice 2041, February", "€12,480"],
      ["Invoice 2012, January", "€12,480"],
      ["Invoice 1987, December", "€11,960"],
    ],
  },
  "/team": {
    title: "Team",
    lead: "Seven people can manage billing and invite new members.",
    rows: [
      ["Mara Okafor", "Owner"],
      ["Jonas Lindqvist", "Admin"],
      ["Priya Raman", "Billing"],
    ],
  },
};

/** What a focus event landed on, in the words of the inspector below: the tag and its name. */
function describe(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const name = element.getAttribute("aria-label") ?? (element.textContent ?? "").trim();
  return `<${tag}> ${name}`.slice(0, 48);
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-start gap-3 px-4 py-2.5">
      <dt className="flex w-36 shrink-0 items-center gap-3 text-xs text-muted-foreground">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted [&_svg]:size-3.5">{icon}</span>
        {label}
      </dt>
      <dd className={cn("min-w-0 pt-1.5 text-xs [overflow-wrap:anywhere]", value ? "font-mono" : "text-muted-foreground")}>{value ?? "Waiting for a navigation"}</dd>
    </div>
  );
}

function App(): React.JSX.Element {
  const [path, setPath] = useState("/overview");
  const [hash, setHash] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const page = PAGES[path] ?? PAGES["/overview"]!;

  // Mirrors the live region, so what a screen reader would say can be read here too.
  useEffect(() => {
    const region = root.current?.querySelector("[data-slot='route-focus']");
    if (!region) return;
    const observer = new MutationObserver(() => {
      if (region.textContent) setHeard(`"${region.textContent}"`);
    });
    observer.observe(region, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!scheduled) return;
    const timer = window.setTimeout(() => {
      setPath("/team");
      setHash("");
      setScheduled(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [scheduled]);

  const go = (next: string) => {
    setPath(next);
    setHash("");
  };

  return (
    <div ref={root} onFocus={(event: FocusEvent) => setFocused(describe(event.target))} className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* A real app lets the default target find its h1. This preview sits inside a page that has headings of its own, so it names its heading by ref and gives the title itself: a selector or document.title would point at the page around it. */}
      <RouteFocus pathname={`${path}${hash}`} target={heading} title={page.title} />
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-4 py-2.5">
        <p className="text-sm font-semibold tracking-[-0.02em]">Northwind</p>
        <nav aria-label="Account" className="flex gap-1">
          {Object.entries(PAGES).map(([href, item]) => (
            <button
              key={href}
              type="button"
              aria-current={href === path ? "page" : undefined}
              onClick={() => go(href)}
              className="h-8 rounded-md px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
            >
              {item.title}
            </button>
          ))}
        </nav>
      </header>
      <section aria-label="Northwind account" className="grid min-h-56 content-start gap-4 px-4 py-6 sm:px-6">
        <div className="grid gap-1.5">
          <h2 ref={heading} className="w-fit rounded-md text-2xl font-semibold tracking-[-0.03em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            {page.title}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">{page.lead}</p>
        </div>
        <ul id="rows" className="divide-y divide-border rounded-lg border border-border">
          {page.rows.map(([name, value]) => (
            <li key={name} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <span className="min-w-0 truncate">{name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{value}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setHash("#rows")}
          className="w-fit rounded-md text-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          Jump to the list (a hash change)
        </button>
      </section>
      <dl className="divide-y divide-border border-t border-border bg-muted/40">
        <Row icon={<IconCursor />} label="Focus is on" value={focused} />
        <Row icon={<IconVolume />} label="Announced" value={heard} />
      </dl>
      <div className={cn("grid gap-3 border-t border-border px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end")}>
        <div className="grid gap-1.5">
          <Label htmlFor="route-focus-search" className="text-xs font-normal text-muted-foreground">
            Search customers
          </Label>
          <Input id="route-focus-search" placeholder="Start typing a name" className="h-9" />
        </div>
        <Button type="button" variant="outline" size="sm" disabled={scheduled} onClick={() => setScheduled(true)}>
          {scheduled ? "Going to Team in 3 s" : "Go to Team in 3 s"}
        </Button>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <p className="text-xs text-muted-foreground">Choose a page: focus moves to its heading and the title is announced.</p>
      <App />
      <p className="text-xs text-muted-foreground">A hash change leaves focus alone. So does a page change while you type: start the timer, click into the search field and keep typing.</p>
    </div>
  );
}
