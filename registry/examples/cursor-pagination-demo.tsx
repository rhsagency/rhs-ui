"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { CursorPagination } from "@rhs-ui/primitives/cursor-pagination";

interface AuditEvent {
  who: string;
  what: string;
  when: string;
}

const EVENTS: readonly AuditEvent[] = [
  { who: "Mara Okafor", what: "invited jonas@northwind.dev as an admin", when: "Today, 09:41" },
  { who: "Priya Raman", what: "rotated the production API key", when: "Today, 08:15" },
  { who: "Lena Hartmann", what: "changed the plan from Team to Scale", when: "Yesterday, 17:02" },
  { who: "Tomasz Wrona", what: "turned on single sign-on for northwind.dev", when: "Yesterday, 14:30" },
  { who: "Mara Okafor", what: "removed 3 inactive seats", when: "Yesterday, 11:48" },
  { who: "Jonas Lindqvist", what: "created the webhook \"Invoice paid\"", when: "Mon, 16:20" },
  { who: "Priya Raman", what: "exported the audit log as CSV", when: "Mon, 13:05" },
  { who: "Lena Hartmann", what: "updated the billing address", when: "Mon, 10:12" },
  { who: "Tomasz Wrona", what: "revoked a personal access token", when: "Sun, 19:44" },
  { who: "Mara Okafor", what: "created the project Halcyon", when: "Sun, 15:09" },
  { who: "Jonas Lindqvist", what: "set the data region to Frankfurt", when: "Sat, 12:31" },
  { who: "Priya Raman", what: "required two-factor sign-in for everyone", when: "Fri, 17:55" },
  { who: "Lena Hartmann", what: "added a payment method ending 4242", when: "Fri, 09:20" },
  { who: "Tomasz Wrona", what: "archived the project Kestrel", when: "Thu, 18:03" },
  { who: "Mara Okafor", what: "renamed the workspace to Northwind", when: "Thu, 11:27" },
  { who: "Jonas Lindqvist", what: "connected the Slack integration", when: "Wed, 15:40" },
  { who: "Priya Raman", what: "created the API key ci-deploy", when: "Wed, 10:58" },
  { who: "Lena Hartmann", what: "downloaded invoice INV-2024-0916", when: "Tue, 14:16" },
  { who: "Tomasz Wrona", what: "accepted the data processing agreement", when: "Tue, 09:02" },
  { who: "Mara Okafor", what: "created the workspace", when: "Mon, 08:30" },
];

const PAGE = 5;
const PAGES = EVENTS.length / PAGE;

const initials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Feed(): React.JSX.Element {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState<"previous" | "next" | false>(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  // A real feed asks the server for the cursor; here the answer takes a moment, so the pending state is there to see.
  const go = (direction: "previous" | "next") => {
    setLoading(direction);
    timer.current = setTimeout(() => {
      setPage((now) => now + (direction === "next" ? 1 : -1));
      setLoading(false);
    }, 900);
  };
  const first = page * PAGE;
  const rows = EVENTS.slice(first, first + PAGE);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">Audit log</h2>
        <p className="text-xs text-muted-foreground">Northwind workspace</p>
      </div>
      <ul aria-busy={loading ? true : undefined} className={`divide-y divide-border transition-opacity duration-200 motion-reduce:transition-none ${loading ? "opacity-50" : ""}`}>
        {rows.map((event) => (
          <li key={`${event.when}-${event.what}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted text-[0.6875rem] font-medium text-muted-foreground">
              {initials(event.who)}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-snug">
              <span className="font-medium">{event.who}</span> <span className="text-muted-foreground">{event.what}</span>
            </p>
            <time className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block">{event.when}</time>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-4 py-3 sm:px-5">
        <CursorPagination
          aria-label="Audit log pages"
          hasPrevious={page > 0}
          hasNext={page < PAGES - 1}
          loading={loading}
          range={`${first + 1} to ${first + rows.length}`}
          onPrevious={() => go("previous")}
          onNext={() => go("next")}
        />
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-xl gap-10">
        <Example caption="A feed that pages by cursor. Press Older: the spinner takes the arrow's place, the other button waits, and the last page ends in plain text.">
          <Feed />
        </Example>
        <div className="grid gap-8 sm:grid-cols-2">
          <Example caption="Loading the previous page.">
            <CursorPagination aria-label="Loading newer" hasPrevious hasNext loading="previous" range="21 to 40" />
          </Example>
          <Example caption="Real links, for crawlable pages.">
            <CursorPagination aria-label="Linked pages" hasPrevious hasNext range="21 to 40" hrefs={{ previous: "?before=cur_8f2a", next: "?after=cur_c41d" }} />
          </Example>
        </div>
      </div>
    </div>
  );
}
