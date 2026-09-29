"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ProgressRing } from "@rhs-ui/primitives/progress-ring";

export default function Demo(): React.JSX.Element {
  const [done, setDone] = useState(3);
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-8">
        <ProgressRing value={done} max={5} label="Onboarding" size={80}>
          {done}/5
        </ProgressRing>
        <ProgressRing value={72} label="Storage used" />
        <ProgressRing label="Syncing" size={40} thickness={4} />
      </div>
      <Button variant="outline" onClick={() => setDone(done >= 5 ? 0 : done + 1)}>
        {done >= 5 ? "Start over" : "Finish a step"}
      </Button>
    </div>
  );
}
