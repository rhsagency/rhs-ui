import type { ReactNode } from "react";

import { GreetingHeader } from "@rhs-ui/dashboard/greeting-header";
import { IconPlus } from "@rhs-ui/icons";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="border-t border-border py-9 first:border-t-0 first:pt-0 last:pb-0">
      <p className="mb-5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

// 12:30 UTC on Tuesday 20 October 2026: afternoon in Amsterdam, early morning in Los Angeles.
const SERVER_CLOCK = "2026-10-20T12:30:00Z";

const waiting = [
  { count: 3, one: "order to ship", other: "orders to ship", href: "#orders" },
  { count: 2, one: "ticket waiting", other: "tickets waiting", href: "#tickets" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Example caption="12:30 UTC on the server, read for a reader in Amsterdam">
        <GreetingHeader
          name="Anna"
          headingAs="h2"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          now={SERVER_CLOCK}
          summary={waiting}
          action={{ label: "New order", href: "#new-order", icon: <IconPlus /> }}
        />
      </Example>
      <Example caption="The same 12:30 UTC, read for a reader in Los Angeles: still morning">
        <GreetingHeader
          name="Dana"
          headingAs="h2"
          locale="en-GB"
          timeZone="America/Los_Angeles"
          now={SERVER_CLOCK}
          summary={[
            { count: 1, one: "order to ship", other: "orders to ship", href: "#orders" },
            { count: 0, one: "ticket waiting", other: "tickets waiting", href: "#tickets" },
            { count: 12, one: "review to approve", other: "reviews to approve", href: "#reviews" },
          ]}
          action={{ label: "New order", href: "#new-order", icon: <IconPlus /> }}
        />
      </Example>
      <Example caption="21:50 in Amsterdam, with nothing waiting">
        <GreetingHeader
          name="Anna"
          headingAs="h2"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          now="2026-10-20T19:50:00Z"
          summary={[
            { count: 0, one: "order to ship", other: "orders to ship", href: "#orders" },
            { count: 0, one: "ticket waiting", other: "tickets waiting", href: "#tickets" },
          ]}
          action={{ label: "New order", href: "#new-order", icon: <IconPlus /> }}
        />
      </Example>
    </div>
  );
}
