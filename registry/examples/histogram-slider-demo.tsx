"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { HistogramSlider, type HistogramLabels } from "@rhs-ui/primitives/histogram-slider";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs";

/** Monthly rents from 400 to 2,400 euros in steps of 100: 20 buckets, 312 homes between 800 and 1,400. */
const RENTS = [3, 8, 16, 28, 48, 62, 70, 58, 44, 30, 19, 13, 9, 6, 4, 3, 2, 2, 1, 1];
/** Delivery times from 10 to 60 minutes: 10 buckets. */
const MINUTES = [4, 11, 24, 33, 29, 20, 12, 7, 3, 1];

const euro = new Intl.NumberFormat("en-US");
const dutch = new Intl.NumberFormat("nl-NL");

const DUTCH: Partial<HistogramLabels> = {
  minimum: "Minimaal",
  maximum: "Maximaal",
  minimumOf: (label) => `Minimale ${label.toLowerCase()}`,
  maximumOf: (label) => `Maximale ${label.toLowerCase()}`,
  summary: (info) => `${info.count === 0 ? "Geen" : info.countText} ${info.noun} tussen ${info.lowText} en ${info.highText}`,
};

export default function Demo(): React.JSX.Element {
  const [rent, setRent] = useState<[number, number]>([800, 1400]);
  const [saved, setSaved] = useState<[number, number] | null>(null);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: drag a handle, use the arrow, Page, Home and End keys, or type in a field. The count follows and is read out politely.">
          <div className={card}>
            <div className="grid gap-1">
              <h2 className="text-sm font-medium tracking-[-0.01em]">Homes in Utrecht</h2>
              <p className="text-xs text-muted-foreground">Kestrel Rentals, unfurnished, available from December.</p>
            </div>
            <HistogramSlider
              label="Monthly rent"
              buckets={RENTS}
              min={400}
              max={2400}
              step={50}
              value={rent}
              onValueChange={setRent}
              onValueCommit={setSaved}
              noun={["home", "homes"]}
              formatValue={(amount) => `€${euro.format(amount)}`}
              summary={(info) => `${info.count === 0 ? "No" : info.countText} ${info.noun} between ${euro.format(info.low)} and ${euro.format(info.high)} euros`}
            />
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p role="status" className="min-w-0 text-xs text-muted-foreground">
                {saved ? `Search ran for €${euro.format(saved[0])} to €${euro.format(saved[1])}.` : "The search runs when you let go."}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => setRent([400, 2400])}>
                Reset
              </Button>
            </div>
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Other units, and the other end of the scale: most of the choices cluster at the left">
          <div className={card}>
            <HistogramSlider
              label="Delivery time"
              buckets={MINUTES}
              min={10}
              max={60}
              step={5}
              defaultValue={[15, 40]}
              noun={["restaurant", "restaurants"]}
              formatValue={(minutes) => `${minutes} min`}
            />
          </div>
        </Example>
        <Example caption="Dutch: the thousands, the sentence and the words of the fields, and a different scale">
          <div className={card}>
            <HistogramSlider
              label="Koopprijs"
              buckets={[2, 5, 9, 15, 24, 31, 27, 19, 12, 8, 5, 3]}
              min={150000}
              max={750000}
              step={5000}
              defaultValue={[250000, 500000]}
              noun={["woning", "woningen"]}
              locale="nl-NL"
              labels={DUTCH}
              formatValue={(amount) => `€ ${dutch.format(amount)}`}
            />
          </div>
        </Example>
        <Example caption="Disabled, as a filter is while the results load">
          <div className={card}>
            <HistogramSlider
              disabled
              label="Floor area"
              buckets={[6, 18, 34, 41, 30, 17, 8, 3]}
              min={30}
              max={190}
              step={5}
              defaultValue={[50, 130]}
              noun={["flat", "flats"]}
              formatValue={(area) => `${area} m²`}
            />
          </div>
        </Example>
      </div>
    </div>
  );
}
