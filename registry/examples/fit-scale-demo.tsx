"use client";

import { useState, type ReactNode } from "react";

import { Slider } from "@rhs-ui/primitives/slider";
import { FitScale } from "@rhs-ui/commerce/fit-scale";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The card a fit scale usually sits in on a product page, under the size picker. */
function Card({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="text-sm font-medium">Fit</h2>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [fit, setFit] = useState(3.6);
  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-8 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
      <Example caption="Most reviewers say it runs small">
        <Card>
          <FitScale value={1.2} count={38} />
        </Card>
      </Example>

      <Example caption="True to size, with the reviews it comes from">
        <Card>
          <FitScale value={3.1} count={214} />
        </Card>
      </Example>

      <Example caption="Runs large">
        <Card>
          <FitScale value={4.7} count={87} />
        </Card>
      </Example>

      <Example caption="Move the average: the marker slides between points, and the words say slightly">
        <Card>
          <FitScale value={fit} count={612} />
          <div className="grid gap-2 border-t border-border pt-4">
            <p className="flex items-baseline justify-between text-xs text-muted-foreground">
              Average fit from reviews
              <span className="font-medium text-foreground tabular-nums">{fit.toFixed(1)}</span>
            </p>
            <Slider min={1} max={5} step={0.1} value={[fit]} onValueChange={(next) => setFit(Math.round((next[0] ?? 3) * 10) / 10)} thumbLabels={["Average fit"]} />
          </div>
        </Card>
      </Example>

      <Example caption="Compact, for a product card: the sentence stays available to a screen reader">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <FitScale compact value={2.4} count={61} />
        </div>
      </Example>

      <Example caption="No reviews yet: it renders nothing, not a fake middle">
        <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          <FitScale count={0} />
          <span>Nothing here until there is data.</span>
        </div>
      </Example>
    </div>
  );
}
