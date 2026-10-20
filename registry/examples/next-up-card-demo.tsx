"use client";

import { useState, type ReactNode } from "react";

import { NextUpCard, type NextUpEvent } from "@rhs-ui/dashboard/next-up-card";

const ZONE = "Europe/Amsterdam";

const review: NextUpEvent = {
  id: "checkout-review",
  title: "Design review: Checkout redesign",
  start: "2026-10-20T14:30:00+02:00",
  end: "2026-10-20T15:15:00+02:00",
  place: "Room Vondel, Keizersgracht 62",
  link: "https://meet.example.com/halcyon/checkout-review",
  attendees: [{ name: "Anna de Vries" }, { name: "Mo Haddad" }, { name: "Priya Nair" }, { name: "Tom Jansen" }, { name: "Sofia Marin" }],
};

const visit: NextUpEvent = {
  id: "kestrel-visit",
  title: "Supplier visit: Kestrel Foods",
  start: "2026-10-21T09:00:00+02:00",
  end: "2026-10-21T10:30:00+02:00",
  place: "Kestrel Foods, Havenstraat 14, Rotterdam",
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [joined, setJoined] = useState<string | null>(null);
  const common = { timeZone: ZONE, locale: "en-GB", onJoin: (event: NextUpEvent) => setJoined(event.title) } as const;

  return (
    <div className="grid w-full max-w-4xl gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      <Example caption="25 minutes before it starts">
        <NextUpCard event={review} now="2026-10-20T14:05:00+02:00" {...common} />
      </Example>
      <Example caption="Twenty minutes in">
        <NextUpCard event={review} now="2026-10-20T14:50:00+02:00" {...common} />
      </Example>
      <Example caption="The next event is tomorrow, in person">
        <NextUpCard event={visit} now="2026-10-20T16:10:00+02:00" {...common} />
      </Example>
      <Example caption="After the last event of the day">
        <NextUpCard event={review} now="2026-10-20T16:10:00+02:00" {...common} />
      </Example>
      <p role="status" className="col-span-full min-h-5 text-sm text-muted-foreground">
        {joined ? `Joining ${joined}.` : ""}
      </p>
    </div>
  );
}
