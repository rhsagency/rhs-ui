"use client";

import { useState, type ReactNode } from "react";

import { RelativeTime } from "@rhs-ui/application/relative-time";
import { IconPlus } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";

// A fixed "now" keeps every wording the same on every load. In an app, leave `now` out and the times read the browser's clock and keep themselves current.
const NOW = Date.parse("2026-11-02T14:30:00Z");
const HOUR = 60;
const DAY = 24 * HOUR;
const ago = (minutes: number) => new Date(NOW - minutes * 60_000);

interface Entry {
  id: string;
  who: string;
  what: string;
  object: string;
  at: Date;
  live?: boolean;
}

const START: readonly Entry[] = [
  { id: "deploy", who: "Mara Okafor", what: "deployed", object: "Northwind web to production", at: ago(0.4) },
  { id: "comment", who: "Leo Martins", what: "commented on", object: "Checkout redesign", at: ago(3) },
  { id: "close", who: "Sofia Rossi", what: "closed", object: "4 tickets in the Q4 launch", at: ago(2 * HOUR + 10) },
  { id: "release", who: "Priya Nair", what: "published", object: "release 2.4", at: ago(25 * HOUR) },
  { id: "review", who: "Tomas Brandt", what: "asked for a review of", object: "the pricing page copy", at: ago(4 * DAY) },
  { id: "archive", who: "Ines Kowalski", what: "archived", object: "the Autumn campaign", at: ago(11 * DAY) },
];

function Row({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
      <span className="min-w-0 text-muted-foreground">{caption}</span>
      <span className="shrink-0 text-right font-medium whitespace-nowrap">{children}</span>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [entries, setEntries] = useState(START);
  const posted = entries.filter((entry) => entry.live).length;

  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-lg gap-6">
        <figure className="grid gap-3">
          <figcaption className="text-xs text-muted-foreground">The words follow the clock. Hover or tap a time for the exact moment.</figcaption>
          <section aria-labelledby="activity-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="activity-title" className="text-sm font-semibold tracking-[-0.01em]">
                Recent activity
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEntries((list) => [{ id: `live-${posted}`, who: "You", what: "posted an update to", object: "Northwind web", at: new Date(), live: true }, ...list])}
              >
                <IconPlus />
                Post update
              </Button>
            </header>
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar size="sm" aria-hidden="true">
                    <AvatarFallback>{initialsOf(entry.who)}</AvatarFallback>
                  </Avatar>
                  <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">
                    <span className="font-medium text-foreground">{entry.who}</span> {entry.what} <span className="font-medium text-foreground">{entry.object}</span>
                  </p>
                  <RelativeTime value={entry.at} now={entry.live ? undefined : NOW} className="shrink-0 text-xs leading-6 whitespace-nowrap text-muted-foreground" />
                </li>
              ))}
            </ul>
          </section>
        </figure>

        <figure className="grid gap-3">
          <figcaption className="text-xs text-muted-foreground">Ahead of now, in another language, with another threshold, and with the tooltip open</figcaption>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <Row caption="Next sync, focusable">
              <RelativeTime value={ago(-25)} now={NOW} focusable />
            </Row>
            <Row caption="Planning review">
              <RelativeTime value={ago(-(DAY + HOUR))} now={NOW} />
            </Row>
            <Row caption="Dutch, Europe/Amsterdam">
              <RelativeTime value={ago(25 * HOUR)} now={NOW} locale="nl-NL" timeZone="Europe/Amsterdam" />
            </Row>
            <Row caption="Dutch, under a minute">
              <RelativeTime value={ago(0.4)} now={NOW} locale="nl-NL" timeZone="Europe/Amsterdam" justNow="zojuist" />
            </Row>
            <Row caption="Past 3 days, written in full">
              <RelativeTime value={ago(11 * DAY)} now={NOW} threshold={3} format="long" />
            </Row>
            <Row caption="Words for as long as it can">
              <RelativeTime value={ago(80 * DAY)} now={NOW} threshold={Infinity} />
            </Row>
            <div className="flex items-baseline gap-2 px-4 pt-14 pb-4 text-sm">
              <span className="text-muted-foreground">The exact time, in the tooltip:</span>
              <span className="font-medium">
                <RelativeTime value={ago(3)} now={NOW} defaultOpen />
              </span>
            </div>
          </div>
        </figure>
      </div>
    </div>
  );
}
