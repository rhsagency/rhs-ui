"use client";

import { useState, type ReactNode } from "react";

import { QueuePosition } from "@rhs-ui/application/queue-position";
import { Button } from "@rhs-ui/primitives/button";

const ZONE = "Europe/Amsterdam";
// Joined at 10:38 Amsterdam time, 60th in a line of 212.
const JOINED = "2026-11-02T09:38:00Z";
const START = 60;

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [position, setPosition] = useState(14);
  const [mode, setMode] = useState<"waiting" | "ready" | "short">("waiting");
  const [log, setLog] = useState("Nothing has happened yet.");

  const ready = mode !== "waiting";
  // The wait follows the place, to the nearest minute: about eighteen seconds a place.
  const estimate = Math.max(30, Math.round((position * 18) / 60) * 60);

  function reset() {
    setPosition(14);
    setMode("waiting");
    setLog("Back in the line at 14th.");
  }

  return (
    <div className="grid w-full max-w-md gap-9">
      <Case caption="Waiting. The number counts to the new place, the bar shows how far you have moved since joining, and the wait is a range. Leave asks again before it gives up the place.">
        <QueuePosition
          position={position}
          total={212}
          startPosition={START}
          joinedAt={JOINED}
          estimateSeconds={estimate}
          status={ready ? "ready" : "waiting"}
          holdSeconds={mode === "short" ? 6 : 120}
          timeZone={ZONE}
          locale="en-GB"
          onLeave={async () => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            setLog("You left the line. In an app, your place is released here.");
            setPosition(14);
          }}
          onEnter={async () => {
            await new Promise((resolve) => setTimeout(resolve, 900));
            setLog("Enter now was pressed. In an app, this opens the sale.");
          }}
          onExpire={() => setLog("The hold ran out, and the spot went to the next person.")}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={ready || position <= 1} onClick={() => setPosition((place) => Math.max(1, place - 3))}>
            Move up 3 places
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ready}
            onClick={() => {
              setPosition(1);
              setMode("ready");
              setLog("It is your turn: the spot is held for two minutes.");
            }}
          >
            It is your turn
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={ready}
            onClick={() => {
              setPosition(1);
              setMode("short");
              setLog("A short hold, so the end of it can be seen.");
            }}
          >
            Let the hold run out
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            Start over
          </Button>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {log}
        </p>
      </Case>

      <Case caption="Your turn, as it is when the page opens straight on it: the action, and a spot held for ninety seconds, counting down.">
        <QueuePosition position={1} status="ready" holdSeconds={90} onEnter={() => undefined} labels={{ ready: "Your turn at the Kestrel drop" }} />
      </Case>
    </div>
  );
}
