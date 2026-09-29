"use client";

import { useState } from "react";

import { Rating } from "@rhs-ui/primitives/rating";

export default function Demo(): React.JSX.Element {
  const [score, setScore] = useState(4);
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <Rating readOnly value={4.6} label="Average rating" />
        <span className="text-sm text-muted-foreground">4.6 from 1,280 reviews</span>
      </div>
      <div className="grid justify-items-center gap-2">
        <Rating label="Your rating" value={score} onValueChange={setScore} size={28} />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          You gave it {score} out of 5.
        </p>
      </div>
    </div>
  );
}
