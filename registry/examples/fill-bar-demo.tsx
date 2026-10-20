"use client";

import { useState } from "react";

import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FillBar } from "@rhs-ui/motion/fill-bar";

const SURVEY = [
  { label: "Very easy", value: 54 },
  { label: "Easy", value: 28 },
  { label: "Neutral", value: 11 },
  { label: "Hard", value: 5 },
  { label: "Very hard", value: 2 },
] as const;

export default function Demo(): React.JSX.Element {
  const [run, setRun] = useState(0);
  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Fill on view</h2>
          <p className="mt-1 text-xs text-muted-foreground">Bars fill once, in turn, when they scroll into view.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
          <IconRefresh />
          Replay
        </Button>
      </div>

      <div key={run} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section aria-labelledby="fill-bar-quota" className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 id="fill-bar-quota" className="text-sm font-medium">
            Plan usage
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Northwind Pro, renews on 1 November.</p>
          <div className="mt-5 grid gap-[1.375rem]">
            <FillBar label="Storage" value={7.2} max={10} valueText="7.2 of 10 GB" order={0} />
            <FillBar label="API requests" value={8420} max={10000} format="fraction" order={1} />
            <FillBar label="Webhook deliveries" value={41903} max={50000} format="fraction" order={2} />
            <FillBar label="Seats" value={12} max={12} valueText="12 of 12, full" tone="destructive" order={3} />
          </div>
        </section>

        <section aria-labelledby="fill-bar-survey" className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs">
          <h3 id="fill-bar-survey" className="text-sm font-medium">
            How was onboarding?
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Survey of 1,204 new customers.</p>
          <div className="mt-5 grid gap-3.5">
            {SURVEY.map((row, index) => (
              <FillBar key={row.label} label={row.label} value={row.value} order={index} tone={index === 0 ? "default" : "muted"} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
