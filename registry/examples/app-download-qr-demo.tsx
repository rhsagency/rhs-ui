"use client";

import type { ReactNode } from "react";

import { AppDownloadQr } from "@rhs-ui/marketing/app-download-qr";

/**
 * A real, scannable QR code for https://kestrel.example/get, drawn as one path on a 29 by 29 grid. In your project
 * it comes from your own generator (a library, or your server) and points at your download page.
 */
const QR_PATH =
  "M0 0h7v1h-7zM10 0h3v1h-3zM14 0h1v1h-1zM18 0h2v1h-2zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM16 1h3v1h-3zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM9 2h4v1h-4zM14 2h2v1h-2zM17 2h1v1h-1zM20 2h1v1h-1zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM9 3h2v1h-2zM13 3h1v1h-1zM16 3h1v1h-1zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM11 4h2v1h-2zM17 4h2v1h-2zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h3v1h-3zM15 5h6v1h-6zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM9 7h1v1h-1zM11 7h3v1h-3zM15 7h4v1h-4zM0 8h1v1h-1zM3 8h1v1h-1zM5 8h2v1h-2zM8 8h1v1h-1zM10 8h3v1h-3zM14 8h1v1h-1zM16 8h1v1h-1zM20 8h2v1h-2zM23 8h1v1h-1zM1 9h1v1h-1zM4 9h1v1h-1zM7 9h2v1h-2zM11 9h1v1h-1zM13 9h1v1h-1zM15 9h3v1h-3zM20 9h1v1h-1zM22 9h1v1h-1zM25 9h1v1h-1zM28 9h1v1h-1zM1 10h1v1h-1zM3 10h1v1h-1zM5 10h3v1h-3zM11 10h1v1h-1zM13 10h3v1h-3zM17 10h1v1h-1zM19 10h1v1h-1zM24 10h4v1h-4zM0 11h1v1h-1zM2 11h1v1h-1zM4 11h1v1h-1zM7 11h2v1h-2zM10 11h2v1h-2zM13 11h1v1h-1zM16 11h1v1h-1zM18 11h2v1h-2zM21 11h3v1h-3zM26 11h2v1h-2zM0 12h1v1h-1zM2 12h1v1h-1zM5 12h3v1h-3zM10 12h2v1h-2zM14 12h2v1h-2zM17 12h1v1h-1zM19 12h5v1h-5zM25 12h1v1h-1zM27 12h2v1h-2zM0 13h3v1h-3zM4 13h1v1h-1zM9 13h1v1h-1zM11 13h1v1h-1zM13 13h5v1h-5zM19 13h3v1h-3zM1 14h1v1h-1zM4 14h1v1h-1zM6 14h1v1h-1zM12 14h3v1h-3zM17 14h1v1h-1zM20 14h3v1h-3zM25 14h4v1h-4zM2 15h3v1h-3zM8 15h2v1h-2zM12 15h1v1h-1zM15 15h1v1h-1zM17 15h3v1h-3zM23 15h1v1h-1zM25 15h1v1h-1zM27 15h1v1h-1zM1 16h1v1h-1zM6 16h1v1h-1zM11 16h1v1h-1zM13 16h1v1h-1zM17 16h1v1h-1zM19 16h3v1h-3zM23 16h1v1h-1zM27 16h1v1h-1zM2 17h1v1h-1zM5 17h1v1h-1zM8 17h1v1h-1zM10 17h1v1h-1zM12 17h5v1h-5zM18 17h1v1h-1zM21 17h3v1h-3zM25 17h1v1h-1zM28 17h1v1h-1zM0 18h1v1h-1zM2 18h2v1h-2zM6 18h2v1h-2zM14 18h3v1h-3zM20 18h2v1h-2zM23 18h2v1h-2zM27 18h2v1h-2zM2 19h3v1h-3zM8 19h2v1h-2zM14 19h1v1h-1zM17 19h1v1h-1zM21 19h2v1h-2zM27 19h2v1h-2zM0 20h1v1h-1zM2 20h1v1h-1zM4 20h1v1h-1zM6 20h1v1h-1zM8 20h1v1h-1zM11 20h2v1h-2zM15 20h1v1h-1zM17 20h8v1h-8zM26 20h1v1h-1zM8 21h1v1h-1zM10 21h2v1h-2zM14 21h2v1h-2zM20 21h1v1h-1zM24 21h1v1h-1zM26 21h3v1h-3zM0 22h7v1h-7zM9 22h4v1h-4zM16 22h2v1h-2zM20 22h1v1h-1zM22 22h1v1h-1zM24 22h1v1h-1zM27 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM12 23h1v1h-1zM14 23h2v1h-2zM17 23h1v1h-1zM20 23h1v1h-1zM24 23h3v1h-3zM28 23h1v1h-1zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM16 24h1v1h-1zM20 24h5v1h-5zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM8 25h2v1h-2zM13 25h1v1h-1zM15 25h1v1h-1zM17 25h1v1h-1zM19 25h1v1h-1zM21 25h6v1h-6zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM12 26h2v1h-2zM15 26h5v1h-5zM24 26h3v1h-3zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM9 27h1v1h-1zM14 27h1v1h-1zM16 27h5v1h-5zM22 27h1v1h-1zM24 27h1v1h-1zM27 27h1v1h-1zM0 28h7v1h-7zM8 28h1v1h-1zM10 28h4v1h-4zM15 28h2v1h-2zM18 28h1v1h-1zM20 28h1v1h-1zM22 28h1v1h-1zM25 28h1v1h-1zM27 28h1v1h-1z";

function Qr(): React.JSX.Element {
  return (
    <svg viewBox="-2 -2 33 33" role="img" aria-label="QR code that opens the Kestrel Trails download page" shapeRendering="crispEdges">
      <path d={QR_PATH} fill="currentColor" />
    </svg>
  );
}

const shared = {
  title: "Take the route with you",
  description: "Kestrel Trails keeps every map on your phone, so a route still loads at the trailhead when the signal does not.",
  stores: [
    { name: "App Store", href: "#app-store" },
    { name: "Google Play", href: "#google-play" },
  ],
  qr: <Qr />,
  rating: { value: 4.8, count: 18300, source: "the App Store" },
  defaultCountry: "NL",
  locale: "en-GB",
} as const;

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const sendLink = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Try it: scan the code, or text the link. On a phone or tablet only the store buttons show, and no number is asked for">
        <AppDownloadQr {...shared} onSendLink={sendLink} />
      </Example>
      <div className="mt-16 border-t border-border pt-12">
        <Example caption="After sending: Link sent, as a status message, and a way to use another number">
          <AppDownloadQr {...shared} headingLevel={3} onSendLink={sendLink} defaultStatus="sent" defaultPhone="+31612345678" />
        </Example>
      </div>
    </div>
  );
}
