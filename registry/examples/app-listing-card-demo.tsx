"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { AppListingCard, type AppListingState } from "@rhs-ui/application/app-listing-card";

/** App icons drawn in flat shapes, so the demo needs no files. Use the real icons in an app. */
const icon = (ground: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect width='128' height='128' fill='${ground}'/>${body}</svg>`);

const ICONS = {
  pocketwise: icon("#1f2a36", `<rect x='28' y='40' width='72' height='52' rx='10' fill='#e9e3d3'/><path d='M28 56h72' stroke='#1f2a36' stroke-width='5'/><circle cx='82' cy='74' r='6' fill='#1f2a36'/>`),
  kestrel: icon("#dcd7ca", `<path d='M64 24c-18 0-30 13-30 30 0 22 30 50 30 50s30-28 30-50c0-17-12-30-30-30z' fill='#2f2b27'/><circle cx='64' cy='54' r='11' fill='#dcd7ca'/>`),
  notes: icon("#ece6d6", `<rect x='34' y='24' width='60' height='80' rx='8' fill='#ffffff'/><path d='M46 48h36M46 62h36M46 76h22' stroke='#3a3a3a' stroke-width='5' stroke-linecap='round'/>`),
  quill: icon("#46594a", `<g fill='#e8efe6'><rect x='30' y='56' width='9' height='16' rx='4.5'/><rect x='46' y='42' width='9' height='44' rx='4.5'/><rect x='62' y='28' width='9' height='72' rx='4.5'/><rect x='78' y='46' width='9' height='36' rx='4.5'/><rect x='94' y='58' width='9' height='12' rx='4.5'/></g>`),
};

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

interface Entry {
  state: AppListingState;
  progress: number;
}

export default function Demo(): React.JSX.Element {
  const [apps, setApps] = useState<Record<string, Entry>>({
    pocketwise: { state: "get", progress: 0 },
    notes: { state: "update", progress: 0 },
  });
  const [opened, setOpened] = useState("");
  const timers = useRef(new Set<number>());
  useEffect(() => {
    const running = timers.current;
    return () => running.forEach((timer) => window.clearInterval(timer));
  }, []);

  /** A preview of a download: the bar fills in steps, then the app is there. */
  function install(id: string) {
    setApps((current) => ({ ...current, [id]: { state: "installing", progress: 6 } }));
    const timer = window.setInterval(() => {
      setApps((current) => {
        const entry = current[id];
        if (!entry || entry.state !== "installing") {
          window.clearInterval(timer);
          return current;
        }
        const next = entry.progress + 13;
        if (next >= 100) {
          window.clearInterval(timer);
          timers.current.delete(timer);
          return { ...current, [id]: { state: "installed", progress: 100 } };
        }
        return { ...current, [id]: { state: "installing", progress: next } };
      });
    }, 420);
    timers.current.add(timer);
  }

  const common = (name: string) => ({
    href: "#",
    onOpen: (event: { preventDefault: () => void }) => {
      // A preview has nowhere to go: a router would navigate here.
      event.preventDefault();
      setOpened(name);
    },
  });

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-7 md:grid-cols-2">
      <Case caption="Get: press it and the bar fills, then the app opens.">
        <AppListingCard
          name="Pocketwise"
          icon={ICONS.pocketwise}
          developer="Halcyon Labs"
          category="Finance"
          rating={4.7}
          ratingCount={12400}
          size={48_300_000}
          version="3.2.1"
          state={apps.pocketwise?.state}
          progress={apps.pocketwise?.progress}
          onAction={(state) => (state === "get" ? install("pocketwise") : setOpened("Pocketwise"))}
          {...common("Pocketwise")}
        />
      </Case>

      <Case caption="Installing: the percentage is a number you pass in.">
        <AppListingCard
          name="Quill Audio"
          icon={ICONS.quill}
          developer="Fernleaf Collective"
          category="Music"
          rating={4.4}
          ratingCount={2830}
          size={96_000_000}
          version="1.9.0"
          state="installing"
          progress={42}
          {...common("Quill Audio")}
        />
      </Case>

      <Case caption="Installed: the action is Open.">
        <AppListingCard
          name="Kestrel Maps"
          icon={ICONS.kestrel}
          developer="Kestrel Software"
          category="Navigation"
          rating={4.5}
          ratingCount={86210}
          size={212_000_000}
          version="8.0.4"
          state="installed"
          onAction={() => setOpened("Kestrel Maps")}
          {...common("Kestrel Maps")}
        />
      </Case>

      <Case caption="A newer version is waiting: Update starts the same bar.">
        <AppListingCard
          name="Northwind Notes"
          icon={ICONS.notes}
          developer="Northwind Studio"
          category="Productivity"
          rating={4.8}
          ratingCount={3120}
          size={31_400_000}
          version="5.4.0"
          state={apps.notes?.state}
          progress={apps.notes?.progress}
          onAction={(state) => (state === "update" ? install("notes") : setOpened("Northwind Notes"))}
          {...common("Northwind Notes")}
        />
      </Case>

      <Case caption="No icon yet: the initials stand in, and the card stays tidy.">
        <AppListingCard name="Fernleaf" developer="Fernleaf Collective" category="Health" size="Under 20 MB" state="get" onAction={() => setOpened("Fernleaf")} {...common("Fernleaf")} />
      </Case>

      <p role="status" className="min-h-4 self-end text-xs text-muted-foreground">
        {opened ? `Opened ${opened}.` : ""}
      </p>
    </div>
  );
}
