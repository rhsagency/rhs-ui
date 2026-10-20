"use client";

import { useState, type ReactNode } from "react";

import { DirectionsButton } from "@rhs-ui/application/directions-button";
import { APP_NAMES, buildAppleMapsUrl, buildGoogleMapsUrl, buildWazeUrl, type DirectionsApp, type DirectionsPlace } from "@rhs-ui/application/directions-button/directions";
import { IconClock, IconPin } from "@rhs-ui/icons";

const ROASTERY: DirectionsPlace = { name: "Kestrel Coffee Roasters", address: "Prinsengracht 412, 1016 HL Amsterdam" };
const TRAILHEAD: DirectionsPlace = { name: "Zuiderpad trailhead", latitude: 52.3379, longitude: 4.8531 };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Links({ place }: { place: DirectionsPlace }): React.JSX.Element {
  const rows: [string, string | null][] = [
    ["Google Maps", buildGoogleMapsUrl(place)],
    ["Apple Maps", buildAppleMapsUrl(place)],
    ["Waze", buildWazeUrl(place)],
  ];
  return (
    <dl className="mt-3 grid gap-3 rounded-lg border border-border bg-muted/40 p-4">
      {rows.map(([name, url]) => (
        <div key={name} className="min-w-0">
          <dt className="text-xs font-medium">{name}</dt>
          <dd className="mt-0.5 font-mono text-xs leading-relaxed break-all text-muted-foreground">{url}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("No link opened yet.");
  const opened = (app: DirectionsApp) => setLast(`Opened ${APP_NAMES[app]} in a new tab.`);

  return (
    <div className="grid w-full max-w-2xl gap-9">
      <div className="w-full min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <h2 className="text-base leading-snug font-semibold tracking-[-0.02em]">Kestrel Coffee Roasters</h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <IconPin className="size-4 shrink-0" />
          <span>Prinsengracht 412, 1016 HL Amsterdam</span>
        </p>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <IconClock className="size-4 shrink-0" />
          <span>Open today until 17:00</span>
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5">
          <DirectionsButton destination={ROASTERY} onOpen={opened} />
          <p role="status" className="text-xs text-muted-foreground">
            {last}
          </p>
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer rounded-md text-xs font-medium text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">See the links this builds</summary>
          <Links place={ROASTERY} />
        </details>
      </div>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
        <Example caption="Coordinates only, on foot">
          <DirectionsButton destination={TRAILHEAD} mode="walking" label="Walk there" />
        </Example>
        <Example caption="By bike: Waze is left out">
          <DirectionsButton destination={{ name: "Vondelpark", address: "Vondelpark, Amsterdam" }} origin={{ address: "Amsterdam Centraal" }} mode="cycling" variant="secondary" />
        </Example>
        <Example caption="Apple Maps first, then Google">
          <DirectionsButton destination={ROASTERY} apps={["apple", "google"]} variant="default" />
        </Example>
        <Example caption="A name and no address: disabled, with the reason">
          <DirectionsButton destination={{ name: "The old mill" }} />
        </Example>
      </div>
    </div>
  );
}
