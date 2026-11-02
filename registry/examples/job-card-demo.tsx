"use client";

import { useState } from "react";

import { JobCard } from "@rhs-ui/application/job-card";

// A fixed "now" keeps "Posted 2 days ago" and the "New" mark the same on every load. In an app, leave `now` out and the cards read the browser's clock.
const NOW = Date.parse("2026-10-29T15:20:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** A logo tile drawn in flat shapes, with its own ground so it reads on both themes. Use real logos in an app. */
const mark = (ground: string, ink: string, shape: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='18' fill='${ground}'/>${shape.replaceAll("INK", ink)}</svg>`);

const HALCYON = mark("#1f2328", "#f1efe9", "<rect x='27' y='26' width='11' height='44' rx='2' fill='INK'/><rect x='58' y='26' width='11' height='44' rx='2' fill='INK'/><rect x='27' y='42' width='42' height='11' fill='INK'/>");
const KESTREL = mark("#e6e3dc", "#2f3236", "<path d='M24 62 48 32 72 62' fill='none' stroke='INK' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/><circle cx='48' cy='70' r='5' fill='INK'/>");

const JOBS = [
  { id: "designer", title: "Senior Product Designer", company: "Halcyon Freight", logo: HALCYON },
  { id: "backend", title: "Staff Backend Engineer", company: "Kestrel Labs", logo: KESTREL },
  { id: "coordinator", title: "Operations Coordinator", company: "Larkspur Studio" },
  { id: "writer", title: "Technical Writer", company: "Northwind" },
] as const;

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set(["backend"]));
  const [opened, setOpened] = useState<string | null>(null);
  const toggle = (id: string) => (next: boolean) =>
    setSaved((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  const open = (name: string) => (event: { preventDefault: () => void }) => {
    // A preview has nowhere to go: a router would navigate here.
    event.preventDefault();
    setOpened(name);
  };
  const [designer, backend, coordinator, writer] = JOBS;

  return (
    <div className="grid w-full max-w-4xl gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Open roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {saved.size} saved. The bookmark is its own button; the rest of the card opens the posting.
          </p>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {opened ? `Opened ${opened}.` : ""}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <JobCard
          {...designer}
          location="Amsterdam, Netherlands"
          workMode="hybrid"
          type="Full-time"
          salary={{ min: 85000, max: 105000, currency: "EUR", period: "year" }}
          postedAt={NOW - 26 * HOUR}
          tags={["Design systems", "Figma", "Research"]}
          href="#designer"
          onOpen={open(designer.title)}
          saved={saved.has(designer.id)}
          onSave={toggle(designer.id)}
          now={NOW}
        />
        <JobCard
          {...backend}
          location="Anywhere in Europe"
          workMode="remote"
          type="Full-time"
          salary={{ min: 120000, max: 150000, currency: "USD", period: "year" }}
          postedAt={NOW - 5 * DAY}
          tags={["Go", "PostgreSQL", "Kafka"]}
          href="#backend"
          onOpen={open(backend.title)}
          saved={saved.has(backend.id)}
          onSave={toggle(backend.id)}
          now={NOW}
        />
        <JobCard
          {...coordinator}
          location="Utrecht, Netherlands"
          workMode="onsite"
          type="Part-time, 24 hours"
          salary={{ min: 22, max: 26, currency: "EUR", period: "hour" }}
          postedAt={NOW - 16 * DAY}
          tags={["Planning", "Suppliers"]}
          href="#coordinator"
          onOpen={open(coordinator.title)}
          saved={saved.has(coordinator.id)}
          onSave={toggle(coordinator.id)}
          now={NOW}
        />
        <JobCard
          {...writer}
          location="Europe, any time zone"
          workMode="remote"
          type="Contract, 6 months"
          postedAt={NOW - 6 * HOUR}
          tags={["Documentation", "APIs"]}
          href="#writer"
          onOpen={open(writer.title)}
          saved={saved.has(writer.id)}
          onSave={toggle(writer.id)}
          now={NOW}
        />
      </div>
    </div>
  );
}
