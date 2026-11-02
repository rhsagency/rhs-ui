"use client";

import { useState, type ReactNode } from "react";

import { RatingFilter } from "@rhs-ui/commerce/rating-filter";

function Example({ title, caption, children }: { title: string; caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs leading-relaxed text-muted-foreground sm:min-h-12">{caption}</p>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-sm leading-none font-medium">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [minimum, setMinimum] = useState<number | null>(4);

  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-12 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
      <Example title="Customer rating" caption="With counts. The numbers are cumulative, so 4 and up includes the 5s, and the answer is read out in words.">
        <RatingFilter value={minimum} onValueChange={setMinimum} counts={{ any: 593, 4: 128, 3: 211, 2: 240, 1: 252 }} />
        <p className="text-xs text-muted-foreground">
          Minimum{" "}
          <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground tabular-nums [overflow-wrap:anywhere]">{String(minimum)}</code>
        </p>
      </Example>

      <Example title="Rating" caption="Without counts, for a directory that cannot tell you how many each choice leaves. Any rating is the way it starts.">
        <RatingFilter defaultValue={null} />
      </Example>

      <Example title="Rating" caption="A row with no products is disabled and says so: 0 products.">
        <RatingFilter defaultValue={3} counts={{ any: 9, 4: 0, 3: 2, 2: 5, 1: 5 }} />
      </Example>
    </div>
  );
}
