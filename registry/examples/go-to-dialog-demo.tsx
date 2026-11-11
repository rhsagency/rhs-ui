"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { IconCalendar, IconChevronLeft, IconChevronRight, IconBookOpen } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { GoToDialog } from "@rhs-ui/primitives/go-to-dialog";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";

const PAGES = 240;

/** The key to name in the shortcut, known only in the browser, so the server and the first browser render say Ctrl. */
function useCommandKey(): string {
  return useSyncExternalStore(
    () => () => {},
    () => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A page of a book, drawn with bars where the lines of text would be. */
function PageSheet({ page }: { page: number }): React.JSX.Element {
  const lines = [92, 100, 96, 84, 100, 71, 0, 100, 94, 100, 88, 60];
  return (
    <div className="grid gap-2.5" aria-hidden="true">
      {lines.map((width, index) =>
        width === 0 ? (
          <span key={index} className="h-2" />
        ) : (
          <span key={index} className="h-2 rounded-full bg-muted" style={{ width: `${Math.max(48, width - ((page * (index + 3)) % 14))}%` }} />
        ),
      )}
    </div>
  );
}

function Reader(): React.JSX.Element {
  const [page, setPage] = useState(87);
  const [said, setSaid] = useState("");
  const viewer = useRef<HTMLDivElement>(null);
  const key = useCommandKey();
  const chapter = Math.ceil(page / 20);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <IconChevronLeft />
          </Button>
          <p className="min-w-28 text-center text-sm text-muted-foreground tabular-nums">
            Page <span className="font-medium text-foreground">{page}</span> of {PAGES}
          </p>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Next page" disabled={page >= PAGES} onClick={() => setPage((value) => Math.min(PAGES, value + 1))}>
            <IconChevronRight />
          </Button>
        </div>
        <GoToDialog
          min={1}
          max={PAGES}
          defaultValue={page}
          label="Go to page"
          noun="page"
          onGo={(value) => {
            setPage(value);
            setSaid(`Jumped to page ${value}`);
            // The dialog has already given focus back, so the page you went to can take it.
            viewer.current?.focus();
          }}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <IconBookOpen />
              Go to page
              <KbdGroup className="ml-1 hidden @md:inline-flex">
                <Kbd>{key}</Kbd>
                <Kbd>G</Kbd>
              </KbdGroup>
            </Button>
          }
        />
      </div>
      <div ref={viewer} tabIndex={-1} aria-label={`Page ${page}, chapter ${chapter}`} className="grid gap-5 p-5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 sm:p-7">
        <div className="grid gap-1">
          <p className="text-xs text-muted-foreground tabular-nums">Chapter {chapter}</p>
          <h2 className="text-base font-semibold tracking-[-0.02em]">Delivery windows and how to keep them</h2>
        </div>
        <PageSheet page={page} />
      </div>
      <p role="status" className="min-h-9 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {said || `Press ${key} G anywhere on the page, or use the button.`}
      </p>
    </div>
  );
}

const ENTRIES = [
  { time: "08:12", text: "Mara Okafor approved the October payout run" },
  { time: "10:40", text: "Halcyon storefront deployed to production" },
  { time: "13:05", text: "Jonas Weber changed the VAT rate for Belgium" },
  { time: "16:48", text: "Kestrel Analytics invoice INV-1001 was paid" },
];

const DAY = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" });

function ActivityLog(): React.JSX.Element {
  const [day, setDay] = useState("2026-10-14");
  const log = useRef<HTMLDivElement>(null);
  const shown = ENTRIES.slice(0, 2 + (Number(day.slice(-2)) % 3));
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-3 py-2.5 sm:px-4">
        <h2 className="text-sm font-medium">Activity</h2>
        <GoToDialog
          kind="date"
          min="2026-01-05"
          max="2026-11-10"
          defaultValue={day}
          locale="en-GB"
          label="Go to date"
          shortcut="mod+shift+g"
          onGo={(value) => {
            setDay(value);
            log.current?.focus();
          }}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <IconCalendar />
              Go to date
            </Button>
          }
        />
      </div>
      <div ref={log} tabIndex={-1} className="grid gap-4 p-5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 sm:p-6">
        <p className="text-sm font-medium">{DAY.format(new Date(`${day}T12:00:00Z`))}</p>
        <ol className="grid gap-3">
          {shown.map((entry) => (
            <li key={entry.time} className="grid grid-cols-[3rem_1fr] items-baseline gap-3 text-sm">
              <span className="text-xs text-muted-foreground tabular-nums">{entry.time}</span>
              <span>{entry.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="@container grid w-full max-w-2xl gap-10">
      <Example caption="A page number: the field is selected on open, so typing replaces it. Try 300, then 142, then Enter. The shortcut works from anywhere on the page">
        <Reader />
      </Example>
      <Example caption="A date, in the order the locale writes it (en-GB here), limited to this year so far">
        <ActivityLog />
      </Example>
    </div>
  );
}
