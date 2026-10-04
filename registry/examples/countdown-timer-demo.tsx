"use client";

import { useState } from "react";

import { CountdownTimer } from "@rhs-ui/application/countdown-timer";

export default function Demo(): React.JSX.Element {
  // A fixed offset from the first render, so the demo always has something to count.
  const [target] = useState(() => Date.now() + ((2 * 24 + 5) * 3600 + 42 * 60) * 1000);
  return (
    <div className="flex flex-col items-center gap-4 p-10">
      <p className="text-sm text-muted-foreground">The spring sale ends in</p>
      <CountdownTimer target={target} label="The spring sale ends" finished="The sale has ended." />
    </div>
  );
}
