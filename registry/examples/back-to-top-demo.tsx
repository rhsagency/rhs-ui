"use client";

import { BackToTop } from "@rhs-ui/primitives/back-to-top";

export default function Demo(): React.JSX.Element {
  return (
    <div className="relative mx-auto h-64 max-w-md rounded-2xl border border-border p-6">
      <p className="text-sm text-muted-foreground">On a long page the button appears after the reader scrolls past the threshold, with a ring that fills as they go.</p>
      <BackToTop threshold={-1} className="absolute" />
    </div>
  );
}
