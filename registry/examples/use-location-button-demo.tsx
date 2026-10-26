"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { UseLocationButton, type GeolocationLike, type LocatePosition } from "@rhs-ui/application/use-location-button";
import { IconPin } from "@rhs-ui/icons";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";

interface Store {
  name: string;
  street: string;
  latitude: number;
  longitude: number;
}

const STORES: Store[] = [
  { name: "Northwind Amsterdam Centraal", street: "Stationsplein 12, Amsterdam", latitude: 52.3791, longitude: 4.9003 },
  { name: "Northwind Utrecht Hoog Catharijne", street: "Radboudkwartier 31, Utrecht", latitude: 52.0907, longitude: 5.11 },
  { name: "Northwind Rotterdam Markthal", street: "Dominee Jan Scharpstraat 298, Rotterdam", latitude: 51.92, longitude: 4.487 },
  { name: "Northwind Eindhoven Piazza", street: "Stationsplein 3, Eindhoven", latitude: 51.4416, longitude: 5.4797 },
];

/** Great-circle distance in kilometres. */
function kilometres(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function StoreFinder(): React.JSX.Element {
  const [here, setHere] = useState<LocatePosition | null>(null);
  const rows = STORES.map((store) => ({ store, km: here ? kilometres(here, store) : null })).sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  return (
    <div className="w-full rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <h2 className="text-lg leading-snug font-semibold tracking-[-0.02em]">Find a Northwind store</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter a postcode, or let your browser say where you are.</p>
      <div className="mt-4 flex flex-wrap items-start gap-x-3 gap-y-3">
        <div className="grid min-w-44 flex-1 gap-1.5">
          <Label htmlFor="store-postcode" className="sr-only">
            Postcode
          </Label>
          <Input id="store-postcode" placeholder="Postcode, like 1012 AB" autoComplete="postal-code" />
        </div>
        <UseLocationButton onLocate={setHere} />
      </div>
      <ul className="mt-5 divide-y divide-border border-t border-border">
        {rows.map(({ store, km }) => (
          <li key={store.name} className="flex items-center gap-3 py-3">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/60">
              <IconPin className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug font-medium">{store.name}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{store.street}</p>
            </div>
            {km !== null ? <p className="shrink-0 text-sm font-medium whitespace-nowrap tabular-nums">{km < 10 ? km.toFixed(1) : Math.round(km)} km</p> : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground" role="status">
        {here ? "Sorted by distance from you. Your position stayed in this page." : "Not sorted yet. Nothing is asked until you press the button."}
      </p>
    </div>
  );
}

type Outcome = "found" | "never" | "denied" | "timeout" | "unavailable";

/** A browser that answers the way we say, so every outcome can be seen without changing any setting. */
function simulated(outcome: Outcome): GeolocationLike {
  return {
    getCurrentPosition(success, failure) {
      if (outcome === "never") return;
      window.setTimeout(() => {
        if (outcome === "found") success({ coords: { latitude: 52.3791, longitude: 4.9003, accuracy: 38 } });
        else failure({ code: outcome === "denied" ? 1 : outcome === "timeout" ? 3 : 2 });
      }, 120);
    },
  };
}

const OUTCOMES: { outcome: Outcome; caption: string }[] = [
  { outcome: "found", caption: "Found: a check and the accuracy in words" },
  { outcome: "never", caption: "Finding you: waiting for the browser" },
  { outcome: "denied", caption: "Blocked: how to allow it" },
  { outcome: "timeout", caption: "Timed out: try again" },
  { outcome: "unavailable", caption: "Unavailable: the device cannot tell" },
];
const ENGINES = Object.fromEntries(OUTCOMES.map(({ outcome }) => [outcome, simulated(outcome)])) as Record<Outcome, GeolocationLike>;

/** Presses the button inside it once, so the outcome shows without a click. */
function PressOnce({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => box.current?.querySelector("button")?.click(), 40);
    return () => window.clearTimeout(timer);
  }, []);
  return <div ref={box}>{children}</div>;
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="A store finder. Press the button (the browser asks first) and the stores sort by distance. The position never leaves the page.">
        <StoreFinder />
      </Example>

      <div className="grid gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        {OUTCOMES.map(({ outcome, caption }) => (
          <Example key={outcome} caption={caption}>
            <PressOnce>
              <UseLocationButton geolocation={ENGINES[outcome]} timeoutMs={outcome === "never" ? 3_600_000 : undefined} />
            </PressOnce>
          </Example>
        ))}
      </div>
    </div>
  );
}
