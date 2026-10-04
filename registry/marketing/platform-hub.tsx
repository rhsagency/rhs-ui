import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HubSpoke {
  name: string;
  icon: ReactNode;
}

export interface PlatformHubProps {
  title: string;
  description?: string;
  /** The product in the middle: a logo or a mark. */
  center: ReactNode;
  centerLabel: string;
  /** Six to eight tools around it. */
  spokes: readonly HubSpoke[];
  className?: string;
}

/**
 * "Everything connects to us": the product in the middle and the tools it
 * talks to on a ring around it, joined by thin lines. The ring is drawn with
 * trigonometry, not a picture, so it takes any number of spokes; the list
 * underneath is what a screen reader gets.
 */
export function PlatformHub({ title, description, center, centerLabel, spokes, className }: PlatformHubProps) {
  const radius = 40;
  const points = spokes.map((_, index) => {
    const angle = (index / spokes.length) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
  });
  return (
    <section data-slot="platform-hub" className={cn("grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2", className)}>
      <div>
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        <ul className="mt-8 flex flex-wrap gap-2 text-sm">
          {spokes.map((spoke) => (
            <li key={spoke.name} className="rounded-full border border-border px-3 py-1">{spoke.name}</li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-border">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth=".3" strokeDasharray="1 1.5" />
          {points.map((point, index) => (
            <line key={index} x1="50" y1="50" x2={point.x} y2={point.y} stroke="currentColor" strokeWidth=".3" />
          ))}
        </svg>
        <span className="absolute top-1/2 left-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-3xl bg-foreground text-background shadow-xl [&_svg]:size-8">
          {center}
          <span className="text-[10px] font-medium">{centerLabel}</span>
        </span>
        {spokes.map((spoke, index) => (
          <span
            key={spoke.name}
            className="absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-border bg-background shadow-sm [&_svg]:size-6"
            style={{ left: `${points[index]?.x}%`, top: `${points[index]?.y}%` }}
          >
            {spoke.icon}
          </span>
        ))}
      </div>
    </section>
  );
}
