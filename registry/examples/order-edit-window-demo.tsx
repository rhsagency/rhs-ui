"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { OrderEditWindow, type OrderEditAction } from "@rhs-ui/commerce/order-edit-window";
import { Button } from "@rhs-ui/primitives/button";

/** The order was placed at 10:00 UTC and can be changed for 24 minutes. */
const PLACED = Date.parse("2026-10-20T10:00:00Z");
const UNTIL = PLACED + 24 * 60_000;
const MINUTE = 60_000;

const SAID: Record<OrderEditAction, string> = { address: "Edit address pressed.", items: "Edit items pressed.", cancel: "The order was cancelled, after the shopper confirmed." };

function Example({ caption, note, children }: { caption: string; note?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/** A clock you can move: play it at a minute a second, or jump to the moments that matter. */
function Playground(): React.JSX.Element {
  const [now, setNow] = useState(PLACED);
  const [playing, setPlaying] = useState(false);
  const [said, setSaid] = useState("Press an action. Cancel asks first.");
  const left = Math.max(0, Math.ceil((UNTIL - now) / MINUTE));

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setNow((current) => {
        const next = Math.min(current + MINUTE, UNTIL);
        if (next === UNTIL) setPlaying(false);
        return next;
      });
    }, 600);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <Example caption="A clock you can move: play it, or jump to the moments that are announced" note={said}>
      <OrderEditWindow editableUntil={new Date(UNTIL)} now={now} windowMinutes={24} locale="en-GB" onAction={(action) => setSaid(SAID[action])} onExpire={() => setSaid("onExpire was called: the order is locked.")} />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Move the clock">
        <Button type="button" size="sm" variant="secondary" onClick={() => setPlaying((on) => (left === 0 ? false : !on))} disabled={left === 0}>
          {playing ? <IconPause /> : <IconPlay />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { setPlaying(false); setNow(UNTIL - 10 * MINUTE); }}>
          10 minutes left
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { setPlaying(false); setNow(UNTIL - 40_000); }}>
          Last minute
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setPlaying(false); setNow(PLACED); setSaid("Back to 24 minutes."); }}>
          Reset
        </Button>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{left} min on the clock</span>
      </div>
    </Example>
  );
}

/** The strip on the real clock: it is built here, so it has a few minutes left and counts down by itself. */
function RealClock(): React.JSX.Element {
  const [until] = useState(() => Date.now() + 3 * MINUTE + 30_000);
  const [said, setSaid] = useState("No `now` is passed: the browser's clock is read after load.");
  return (
    <Example caption="On the real clock: this one has three and a half minutes" note={said}>
      <OrderEditWindow editableUntil={until} windowMinutes={4} locale="en-GB" onAction={(action) => setSaid(SAID[action])} onExpire={() => setSaid("Time ran out while you were looking: onExpire was called.")} />
    </Example>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl min-w-0 grid-cols-[minmax(0,1fr)] gap-y-9">
      <Playground />
      <Example caption="Time is up: the same space, a different sentence, the actions quiet">
        <OrderEditWindow editableUntil={new Date(UNTIL)} now={UNTIL + 5 * MINUTE} windowMinutes={24} locale="en-GB" />
      </Example>
      <RealClock />
    </div>
  );
}
