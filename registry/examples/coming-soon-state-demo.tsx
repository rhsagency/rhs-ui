"use client";

import { useRef, useState, type ReactNode } from "react";

import { ComingSoonState } from "@rhs-ui/application/coming-soon-state";
import { IconChartLine, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const KEYS = ["demo-soon-reports", "demo-soon-people"];

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The sign-up is saved by the app; the demo only waits a moment, so the busy state can be seen. */
const save = () => new Promise<void>((resolve) => window.setTimeout(resolve, 900));

function forget() {
  for (const key of KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage is blocked: there is nothing to forget.
    }
  }
}

export default function Demo(): React.JSX.Element {
  const [round, setRound] = useState(0);
  // The people panel fails once, to show that a failed save is said in words and the button comes back.
  const failed = useRef(false);

  async function savePeople() {
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    if (!failed.current) {
      failed.current = true;
      throw new Error("The list is busy right now. Try again in a moment.");
    }
  }

  return (
    <div className="grid w-full max-w-3xl gap-8">
      <Case caption="In a tab: the feature, what it will do and roughly when. Notify me waits for the save, then turns into a plain confirmation that this device remembers.">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
          <div aria-hidden="true" className="flex gap-5 border-b border-border px-5 text-sm text-muted-foreground">
            <span className="py-3">Overview</span>
            <span className="border-b-2 border-foreground py-3 font-medium text-foreground">Reports</span>
            <span className="py-3">Exports</span>
          </div>
          <div className="p-5">
            <ComingSoonState
              key={`reports-${round}`}
              icon={<IconChartLine />}
              title="Scheduled reports"
              description="Send a weekly summary of bookings and revenue to anyone on your team, every Monday morning, with no one having to remember."
              expected="Q1"
              storageKey="demo-soon-reports"
              onNotify={save}
            />
          </div>
        </div>
      </Case>

      <div className="grid items-start gap-x-8 gap-y-8 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        <Case caption="In a sidebar slot. The first save fails, on purpose.">
          <ComingSoonState key={`people-${round}`} icon={<IconClock />} title="Shift swaps" description="Let your team trade shifts with each other, with your approval." expected="early 2027" storageKey="demo-soon-people" onNotify={savePeople} className="px-4 py-8" />
        </Case>

        <Case caption="Already on the list, from your server: no button, and no way to sign up twice.">
          <ComingSoonState title="Waitlist for classes" description="Join a full class and be booked in automatically if a place opens." expected="Q2" notified />
        </Case>
      </div>

      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            forget();
            failed.current = false;
            setRound((count) => count + 1);
          }}
        >
          Start over
        </Button>
      </div>
    </div>
  );
}
