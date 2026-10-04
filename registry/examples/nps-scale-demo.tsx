"use client";

import { useState } from "react";

import { NpsScale } from "@rhs-ui/primitives/nps-scale";

export default function Demo(): React.JSX.Element {
  const [score, setScore] = useState<number | null>(null);
  return (
    <div className="mx-auto grid max-w-xl gap-4 p-8">
      <NpsScale question="How likely are you to recommend Ledger to a colleague?" value={score} onValueChange={setScore} />
      <p role="status" className="text-sm text-muted-foreground">{score === null ? "No score yet." : score >= 9 ? "Thank you! What do you love most?" : score >= 7 ? "Thanks. What would make it a 10?" : "Sorry to hear that. What went wrong?"}</p>
    </div>
  );
}
