import type { ReactNode } from "react";

import { MembershipCard } from "@rhs-ui/application/membership-card";

/** A small deterministic random: the code below is drawn from it, so it is the same on the server and in the browser. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * A drawing that looks like a QR code, so the demo needs no library. It does not scan: in an app you pass the real
 * thing (the kit's QR code, or any `<svg>` or `<img>` that fills its box), drawn with dark modules, because the card
 * always puts it on a white tile.
 */
function Code({ size = 25, seed = 7 }: { size?: number; seed?: number }) {
  const random = seeded(seed);
  const corners = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const;
  // The three squares in the corners, each ringed by a light line, as in a real code.
  const finder = (x: number, y: number): boolean | null => {
    for (const [cx, cy] of corners) {
      if (x >= cx - 1 && x < cx + 8 && y >= cy - 1 && y < cy + 8) {
        if (x < cx || x >= cx + 7 || y < cy || y >= cy + 7) return false;
        return Math.max(Math.abs(x - (cx + 3)), Math.abs(y - (cy + 3))) !== 2;
      }
    }
    return null;
  };
  let path = "";
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const fixed = finder(x, y);
      const dark = fixed !== null ? fixed : x === 6 || y === 6 ? (x + y) % 2 === 0 : random() > 0.52;
      if (dark) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img" aria-label="QR code" shapeRendering="crispEdges">
      <path d={path} fill="#111" />
    </svg>
  );
}

/** A portrait drawn in flat shapes for a member who does not exist. Use a real photograph in an app. */
const MAYA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='#d9d3c5'/><path d='M20 210C20 160 56 144 100 144C144 144 180 160 180 210Z' fill='#2f4a3c'/><path d='M80 118h40v34q-20 14 -40 0z' fill='#9c6b4c'/><ellipse cx='100' cy='94' rx='36' ry='44' fill='#b07d5c'/><path d='M62 92C58 48 84 36 102 36C124 36 144 50 138 94C130 74 120 66 100 66C80 66 68 74 62 92Z' fill='#1f1713'/><circle cx='66' cy='64' r='18' fill='#1f1713'/><circle cx='134' cy='62' r='20' fill='#1f1713'/></svg>`,
  );

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl items-start gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Active: tap the code to open it large on a white tile, whatever the theme.">
        <MembershipCard
          organisation="Halcyon Fitness"
          tier="Gold"
          member={{ name: "Maya Okafor", number: "HF 4821 0937", image: MAYA }}
          since="2021-01-18"
          validUntil="2027-01-17"
          qr={<Code seed={7} />}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Case>

      <Case caption="Lapsed: it says when, mutes the tier and hides the code.">
        <MembershipCard
          organisation="Halcyon Fitness"
          tier="Silver"
          status="expired"
          member={{ name: "Jonas Weber", number: "HF 3307 1184" }}
          since="2023-03-04"
          validUntil="2026-03-03"
          qr={<Code seed={19} />}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Case>
    </div>
  );
}
