"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { KeepAwakeToggle, type WakeLockLike } from "@rhs-ui/application/keep-awake-toggle";
import { IconClock } from "@rhs-ui/icons";

const INGREDIENTS = ["1.2 kg ripe tomatoes, halved", "1 head of garlic, left whole", "2 tbsp olive oil", "500 ml vegetable stock", "A handful of basil"];
const STEPS = [
  { text: "Roast the tomatoes and garlic, cut side up, at 200 °C.", time: "35 min" },
  { text: "Squeeze the garlic out of its skin and add it to the pot with the stock.", time: "5 min" },
  { text: "Blend until smooth, season, and finish with basil and oil.", time: "10 min" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Recipe(): React.JSX.Element {
  return (
    <article className="w-full rounded-xl border border-border bg-card shadow-xs">
      <div className="p-5 sm:p-6">
        <p className="text-xs text-muted-foreground">Kestrel kitchen &middot; serves 4 &middot; 50 minutes</p>
        <h2 className="mt-1.5 text-xl leading-snug font-semibold tracking-[-0.02em]">Roasted tomato soup</h2>
      </div>
      <div className="border-y border-border bg-muted/30 px-5 py-4 sm:px-6">
        <KeepAwakeToggle description="Stops the screen from dimming while you cook with floury hands." />
      </div>
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold tracking-[-0.01em]">Ingredients</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {INGREDIENTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-[-0.01em]">Method</h3>
          <ol className="mt-3 grid gap-3 text-sm">
            {STEPS.map((step, index) => (
              <li key={step.text} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="grid size-5 place-items-center rounded-full border border-border text-[0.6875rem] font-medium text-muted-foreground tabular-nums">{index + 1}</span>
                <span className="text-muted-foreground">
                  {step.text}{" "}
                  <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-foreground">
                    <IconClock className="size-3" />
                    {step.time}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

/** A browser that answers the way we say, so each outcome can be seen without a real battery or policy. */
function simulated(refuse: boolean): WakeLockLike {
  return {
    request: () =>
      new Promise((resolve, reject) => {
        window.setTimeout(() => {
          if (refuse) reject(Object.assign(new Error("Wake Lock permission request denied"), { name: "NotAllowedError" }));
          else resolve({ release: () => Promise.resolve() });
        }, 120);
      }),
  };
}
const HOLDS = simulated(false);
const REFUSES = simulated(true);

/** Turns the switch inside it on once, so the outcome shows without a click. */
function SwitchOnce({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => box.current?.querySelector<HTMLElement>("[role=switch]")?.click(), 40);
    return () => window.clearTimeout(timer);
  }, []);
  return <div ref={box}>{children}</div>;
}

/** A switch that starts on, from a saved choice: the counter shows that nothing was asked for until the first touch. */
function SavedChoice(): React.JSX.Element {
  const [requests, setRequests] = useState(0);
  const lock = useMemo<WakeLockLike>(
    () => ({
      request: () =>
        new Promise((resolve) => {
          setRequests((count) => count + 1);
          window.setTimeout(() => resolve({ release: () => Promise.resolve() }), 100);
        }),
    }),
    [],
  );
  return (
    <div className="grid gap-3">
      <KeepAwakeToggle defaultOn wakeLock={lock} description="Remembered from your last visit." />
      <p role="status" className="text-xs text-muted-foreground tabular-nums">
        Lock requests so far: {requests}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="On a recipe page. Turn it on (a real wake lock) and the screen stays on until you turn it off or leave; it comes back after a tab switch.">
        <Recipe />
      </Example>

      <div className="grid gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
        <Example caption="On: the lock is held (simulated)">
          <SwitchOnce>
            <KeepAwakeToggle wakeLock={HOLDS} description="Stops the screen from dimming while you read the script." />
          </SwitchOnce>
        </Example>
        <Example caption="Refused, for example by battery saver: back to off, with the reason (simulated)">
          <SwitchOnce>
            <KeepAwakeToggle wakeLock={REFUSES} description="Stops the screen from dimming during the talk." />
          </SwitchOnce>
        </Example>
        <Example caption="Starts on: nothing is asked for until your first touch">
          <SavedChoice />
        </Example>
        <Example caption="Small, with no description">
          <KeepAwakeToggle size="sm" label="Keep screen on while presenting" wakeLock={HOLDS} />
        </Example>
      </div>
    </div>
  );
}
