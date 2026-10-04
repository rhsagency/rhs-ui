"use client";

import { useDeferredValue, useId, useState } from "react";

import { IconClock, IconPhone, IconPin, IconSearch } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  /** "Open until 18:00", worked out on your side in the store's time zone. */
  hours: string;
  open: boolean;
  phone?: string;
  /** Distance from the shopper, already formatted: "1.2 km". */
  distance?: string;
  /** Where "Directions" goes. */
  directionsHref: string;
  /** Services as short tags: "Pick-up", "Repairs". */
  services?: readonly string[];
}

export interface StoreLocatorProps {
  stores: readonly Store[];
  /** Sort or fetch by the query on your side; leave out to filter by name and city here. */
  onSearch?: (query: string) => void;
  /** A map, if you have one; the list works without it. */
  map?: React.ReactNode;
  className?: string;
}

/**
 * Find a store: search by city or postcode, a list of stores with open now
 * in words, hours, distance and services, and directions per store. A map
 * slot sits beside the list on wide screens; the list never depends on it.
 */
export function StoreLocator({ stores, onSearch, map, className }: StoreLocatorProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const shown = onSearch || !deferred ? stores : stores.filter((store) => `${store.name} ${store.city} ${store.address}`.toLowerCase().includes(deferred));
  return (
    <section data-slot="store-locator" aria-label="Store locator" className={cn("grid gap-6", map ? "lg:grid-cols-[minmax(0,26rem)_1fr]" : "", className)}>
      <div>
        <div role="search" className="relative">
          <label htmlFor={id} className="sr-only">City or postcode</label>
          <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id={id} type="search" value={query} onChange={(event) => { setQuery(event.target.value); onSearch?.(event.target.value); }} placeholder="City or postcode" className="h-11 w-full rounded-xl border border-border bg-background pr-3 pl-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40" />
        </div>
        <p role="status" className="mt-3 text-xs text-muted-foreground">{shown.length} {shown.length === 1 ? "store" : "stores"}</p>
        <ul className="mt-2 divide-y divide-border rounded-2xl border border-border">
          {shown.map((store) => (
            <li key={store.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{store.name}</p>
                  <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground"><IconPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{store.address}, {store.city}</p>
                </div>
                {store.distance ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{store.distance}</span> : null}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <IconClock aria-hidden="true" className="size-3.5" />
                <span className={cn("inline-block size-1.5 rounded-full", store.open ? "bg-foreground" : "bg-muted-foreground/40")} aria-hidden="true" />
                <span>{store.open ? "Open" : "Closed"}</span>
                <span className="text-muted-foreground">· {store.hours}</span>
              </p>
              {store.services?.length ? (
                <ul aria-label="Services" className="mt-2 flex flex-wrap gap-1.5">
                  {store.services.map((service) => <li key={service} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{service}</li>)}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
                <a href={store.directionsHref} className="underline-offset-4 hover:underline">Directions</a>
                {store.phone ? <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"><IconPhone aria-hidden="true" className="size-3.5" />{store.phone}</a> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {map ? <div className="hidden min-h-96 overflow-clip rounded-2xl border border-border bg-muted lg:block">{map}</div> : null}
    </section>
  );
}
