"use client";

import { useState, type ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { BackButton } from "@rhs-ui/primitives/back-button";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("Press a back button to see where it would go.");
  // A router would act here; the demo only reports what it would do. Without onBack the button acts by itself.
  const onBack = (canGoBack: boolean) =>
    setNote(canGoBack ? "The page before this one is on this site, so it goes back one page." : "There is no earlier page on this site, so it opens /orders instead of leaving.");

  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-md gap-8">
        <Example caption="In a page header. Screen readers hear “Back to Orders”">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <BackButton fallbackHref="/orders" context="Orders" size="sm" className="-ml-3.5" onBack={onBack} />
              <Badge variant="secondary">Shipped</Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Order #4821</h2>
            <p className="mt-1 text-sm text-muted-foreground">Placed 14 Oct 2026 by Halcyon Labs, 3 items.</p>
          </div>
        </Example>

        <Example caption="Variants">
          <div className="flex flex-wrap items-center gap-3">
            <BackButton fallbackHref="/orders" variant="outline" onBack={onBack} />
            <BackButton fallbackHref="/orders" variant="secondary" label="All orders" onBack={onBack} />
            <BackButton fallbackHref="/orders" variant="link" label="Back to orders" onBack={onBack} />
          </div>
        </Example>

        <p role="status" className="flex min-h-10 items-start gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {note}
        </p>
      </div>
    </div>
  );
}
