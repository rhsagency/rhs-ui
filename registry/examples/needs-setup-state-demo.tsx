"use client";

import { useState, type ReactNode } from "react";

import { NeedsSetupState, type SetupStep } from "@rhs-ui/application/needs-setup-state";
import { IconCalendar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const STEPS: readonly string[] = ["Create a Stripe account", "Verify your business details", "Connect Stripe to Halcyon", "Choose which payouts to report"];

// The height of the cards once they have data. The setup panels ask for the same, so finishing setup moves nothing.
const HEIGHT = "36rem";

// The first panel has four steps and a lot to say, and on a narrow screen its words alone are taller than 36rem (up to about 48rem at 320px). It can never be shorter than its words, so the card that replaces it is as tall as they are: these three steps follow the width of the demo, and the panel and the card both read the result.
const STAND_IN = "[--stand-in:48.5rem] @min-[20rem]:[--stand-in:41rem] @min-[23.5rem]:[--stand-in:36rem]";

const BARS = [38, 52, 44, 61, 57, 72, 66, 84, 78, 91, 88, 100];
const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

/** The feature the first panel stands in for. It has the height the panel keeps, and its own way back, so nothing is added under it. */
function Revenue({ onReset }: { onReset: () => void }): React.JSX.Element {
  return (
    <div className="flex flex-col justify-between gap-8 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs" style={{ minHeight: "var(--stand-in)" }}>
      <div>
        <p className="text-sm text-muted-foreground">Revenue, last 12 months</p>
        <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] tabular-nums">€148,320</p>
        <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">€12,360 a month on average, 12.4% more than the year before.</p>
      </div>
      <div className="grid gap-5">
        <div aria-hidden="true">
          <div className="grid grid-cols-12 items-end gap-1.5">
            {BARS.map((height, index) => (
              <div key={MONTHS[index]} className="rounded-sm bg-foreground" style={{ height: `${height * 2}px` }} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-12 gap-1.5 text-center text-[0.625rem] text-muted-foreground">
            {MONTHS.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
        <div>
          <Button variant="ghost" size="sm" className="-ml-3" onClick={onReset}>
            Start the setup over
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The feature the second panel stands in for. */
function Availability({ onDisconnect }: { onDisconnect: () => void }): React.JSX.Element {
  return (
    <div className="flex flex-col justify-between gap-8 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs" style={{ minHeight: HEIGHT }}>
      <div>
        <p className="text-sm text-muted-foreground">Thursday 5 November</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Three open slots today</p>
      </div>
      <ul className="divide-y divide-border text-sm tabular-nums">
        {["09:30", "13:00", "16:15"].map((time) => (
          <li key={time} className="flex items-center justify-between py-3.5">
            <span className="font-medium">{time}</span>
            <span className="text-muted-foreground">Free for 45 minutes</span>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="ghost" size="sm" className="-ml-3" onClick={onDisconnect}>
          Disconnect the calendar
        </Button>
      </div>
    </div>
  );
}

/** A caption and what it captions. Under a container wide enough for two columns the captions share their rows, so the cards start level. */
function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3 @3xl:row-span-2 @3xl:grid-rows-subgrid">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [finished, setFinished] = useState(2);
  const [linked, setLinked] = useState(false);

  const steps: SetupStep[] = STEPS.map((label, index) => ({ label, done: index < finished }));
  const complete = finished >= STEPS.length;

  /** A real app sends the person to Stripe here. The demo waits a moment, so the spinner can be seen, and finishes the next step. */
  async function connect() {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setFinished((count) => Math.min(STEPS.length, count + 1));
  }

  return (
    <div className="@container w-full">
      <div className="mx-auto grid max-w-5xl gap-x-8 gap-y-10 @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Case caption="Four steps, two done: the first open one is marked Next and the button does that step. Press it. When the last step finishes, the feature takes the panel's place at the same height.">
          <div className={STAND_IN}>
            {complete ? (
              <Revenue onReset={() => setFinished(2)} />
            ) : (
              <NeedsSetupState
                minHeight="var(--stand-in)"
                title="Connect a Stripe account to see revenue"
                description="Revenue is read straight from your Stripe payouts, so there is nothing to show until an account is connected."
                steps={steps}
                actionLabel={finished === 2 ? "Connect Stripe" : "Choose payouts"}
                onAction={connect}
                secondary={
                  <Button asChild variant="ghost">
                    <a href="#guide">Read the guide</a>
                  </Button>
                }
              />
            )}
          </div>
        </Case>

        <Case caption="No steps: one missing prerequisite, one action and a quieter way out. A different icon says what is missing.">
          {linked ? (
            <Availability onDisconnect={() => setLinked(false)} />
          ) : (
            <NeedsSetupState
              minHeight={HEIGHT}
              icon={<IconCalendar className="size-6" />}
              title="Connect a calendar to see your availability"
              description="Halcyon checks your calendar before it offers a slot, so nobody books a time you are busy."
              actionLabel="Connect Google Calendar"
              onAction={() => setLinked(true)}
              secondary={
                <Button asChild variant="ghost">
                  <a href="#ics">Use an .ics link</a>
                </Button>
              }
            />
          )}
        </Case>
      </div>
    </div>
  );
}
