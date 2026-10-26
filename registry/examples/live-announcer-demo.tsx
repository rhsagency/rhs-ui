"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { LiveAnnouncer, useAnnounce, type AnnounceEvent } from "@rhs-ui/primitives/live-announcer";

const PRODUCTS = ["Trail bottle 750 ml", "Trail bottle 500 ml", "Camp stove, compact", "Merino base layer", "Headlamp 400 lm", "Headlamp 800 lm", "Wool socks, 3 pack"] as const;

interface Heard extends AnnounceEvent {
  id: number;
  /** Seconds since the preview opened. */
  at: number;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const say = useAnnounce();
  const [query, setQuery] = useState("");
  const [heard, setHeard] = useState<readonly Heard[]>([]);
  const opened = useRef(0);
  const counter = useRef(0);
  const typed = useRef(false);

  const matches = PRODUCTS.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  // The log is fed by the announcer itself, so it shows what was handed to the regions and in which order.
  const onAnnounce = (event: AnnounceEvent) =>
    setHeard((all) => [{ ...event, id: ++counter.current, at: (performance.now() - opened.current) / 1000 }, ...all].slice(0, 7));

  useEffect(() => {
    opened.current = performance.now();
    say("Inventory loaded, 24 products");
    say("Offline. Changes are saved on this device.", "assertive");
  }, [say]);

  // A live count after the person stops typing, not after every key.
  useEffect(() => {
    if (!typed.current) return;
    const timer = window.setTimeout(() => {
      const found = matches.length;
      say(found === 0 ? `No products match ${query.trim()}` : `${found} ${found === 1 ? "product" : "products"} found`);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [query, matches.length, say]);

  return (
    // Two columns only when the preview itself is wide enough for two panels: the width of the page says nothing about the pane the demo gets.
    <div className="@container w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Example caption="Anything on the page can announce: a count, a save, a failure">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="grid gap-1.5">
              <Label htmlFor="announcer-search">Search products</Label>
              <div className="relative">
                <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="announcer-search"
                  type="search"
                  value={query}
                  placeholder="Try bottle or lamp"
                  autoComplete="off"
                  className="pl-9"
                  onChange={(event) => {
                    typed.current = true;
                    setQuery(event.target.value);
                  }}
                />
              </div>
            </div>
            <ul className="grid gap-1.5 text-sm">
              {matches.length === 0 ? <li className="text-muted-foreground">No products match.</li> : null}
              {matches.map((name) => (
                <li key={name} className="flex items-center justify-between gap-3 border-b border-border pb-1.5 last:border-0 last:pb-0">
                  {name}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => say("Draft saved")}>
                Save draft
              </Button>
              <Button variant="outline" size="sm" onClick={() => say("Upload failed: the file is larger than 10 MB", "assertive")}>
                Fail an upload
              </Button>
            </div>
            <div className="grid gap-2.5 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Try to break it</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-auto min-h-8 max-w-full py-1.5 text-left whitespace-normal"
                  onClick={() => {
                    for (let time = 0; time < 5; time++) say("Added to cart");
                  }}
                >
                  Send one message five times
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-auto min-h-8 max-w-full py-1.5 text-left whitespace-normal"
                  onClick={() => {
                    say("Step 1 of 3: address saved");
                    say("Step 2 of 3: payment checked");
                    say("Step 3 of 3: order placed");
                  }}
                >
                  Send three at once
                </Button>
              </div>
            </div>
          </div>
        </Example>

        <Example caption="What the screen reader was told, newest first. Five identical messages are one; three different ones are read in turn">
          <div className="rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium tracking-[-0.01em]">Announced</h2>
              <span className="text-xs text-muted-foreground tabular-nums">{heard.length === 0 ? "Nothing yet" : `${heard.length} shown`}</span>
            </div>
            <ol className="grid min-h-72 content-start gap-2.5 p-5">
              {heard.map((entry) => (
                <li key={entry.id} className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5 sm:grid-cols-[4.75rem_minmax(0,1fr)_auto]">
                  <Badge variant={entry.politeness === "assertive" ? "destructive" : "outline"} className={entry.politeness === "assertive" ? "justify-self-start text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]" : "justify-self-start"}>
                    {entry.politeness}
                  </Badge>
                  <span className="min-w-0 text-sm">{entry.message}</span>
                  <span className="col-start-2 text-xs text-muted-foreground tabular-nums sm:col-start-3">+{entry.at.toFixed(1)} s</span>
                </li>
              ))}
            </ol>
          </div>
        </Example>

        <LiveAnnouncer onAnnounce={onAnnounce} />
      </div>
    </div>
  );
}
