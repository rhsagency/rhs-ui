import type { ReactNode } from "react";

import { IconNavigation, IconPin } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface MapCardProps {
  name: string;
  /** The address, a line each. */
  address: readonly string[];
  /** A static map image or your own map component. Drawn as a quiet grid when left out. */
  map?: ReactNode;
  /** Directions in the visitor's map app: a geo: or maps URL. */
  directionsHref: string;
  /** Opening hours or a note: "Parking behind the building". */
  note?: ReactNode;
  className?: string;
}

/**
 * Where to find you, as a card: a map (yours, or a calm placeholder grid
 * with a pin, so no third-party map loads until you choose one), the
 * address as a real address element and a directions link. For contact
 * pages and event pages.
 */
export function MapCard({ name, address, map, directionsHref, note, className }: MapCardProps) {
  return (
    <article data-slot="map-card" className={cn("overflow-clip rounded-3xl border border-border bg-background", className)}>
      <div className="relative aspect-[16/9] bg-muted">
        {map ?? (
          <svg aria-hidden="true" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="size-full text-foreground">
            {Array.from({ length: 12 }, (_, i) => <line key={`v${i}`} x1={i * 30} x2={i * 30 - 20} y1="0" y2="180" stroke="currentColor" strokeOpacity="0.07" strokeWidth={i % 4 === 0 ? 8 : 2} />)}
            {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1="0" x2="320" y1={i * 30} y2={i * 30 + 12} stroke="currentColor" strokeOpacity="0.07" strokeWidth={i % 3 === 0 ? 8 : 2} />)}
          </svg>
        )}
        {map ? null : <span className="absolute top-1/2 left-1/2 inline-flex size-10 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-foreground text-background shadow-lg [&_svg]:size-5"><IconPin aria-hidden="true" /></span>}
      </div>
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <h3 className="font-medium">{name}</h3>
          <address className="mt-1 text-sm leading-relaxed text-muted-foreground not-italic">{address.map((line) => <span key={line} className="block">{line}</span>)}</address>
          {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
        </div>
        <a href={directionsHref} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconNavigation aria-hidden="true" />Directions</a>
      </div>
    </article>
  );
}
