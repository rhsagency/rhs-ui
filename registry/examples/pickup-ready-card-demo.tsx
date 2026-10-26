import type { ReactNode } from "react";

import { PickupReadyCard } from "@rhs-ui/commerce/pickup-ready-card";

/** A stand-in for a real QR code: finder squares and a pattern drawn from the code. It does not scan; pass your own QR component to the `qr` slot. */
function QrPlaceholder({ seed }: { seed: string }): React.JSX.Element {
  const size = 25;
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
  const cells: ReactNode[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!finder(x, y) && next() > 0.5) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <path d={`M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z`} fillRule="evenodd" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`QR code for pickup code ${seed}`} fill="currentColor" shapeRendering="crispEdges">
      {cells}
      {eye(0, 0)}
      {eye(size - 7, 0)}
      {eye(0, size - 7)}
    </svg>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      {/* Two lines tall in a two-column row, so a short caption does not lift its card above the one beside it. */}
      <p className="text-xs text-muted-foreground lg:min-h-8">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl min-w-0 gap-x-10 gap-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2">
      <Example caption="Ready to collect: the code is the one thing the counter needs, with a QR for shops that scan">
        <PickupReadyCard
          headingAs="h2"
          order="NW-20418"
          code="K7M-4Q2"
          store={{ name: "Northwind Utrecht", address: ["Oudegracht 112", "3511 AV Utrecht"], phone: "+31 30 555 0142" }}
          hours="Open today, 09:00 to 18:00"
          heldUntil="2026-10-30"
          directionsHref="#directions"
          qr={<QrPlaceholder seed="K7M-4Q2" />}
          now="2026-10-26T09:00:00Z"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Example>
      <Example caption="After the last day the code is out of use, and the card says who to call">
        <PickupReadyCard
          headingAs="h2"
          order="HA-77310"
          code="H3X-9B1"
          store={{ name: "Halcyon Outlet Rotterdam", address: ["Lijnbaan 41", "3012 EL Rotterdam"], phone: "+31 10 555 0178" }}
          hours="Closed today, opens Monday at 10:00"
          heldUntil="2026-10-24"
          directionsHref="#directions"
          now="2026-10-26T09:00:00Z"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Example>
    </div>
  );
}
