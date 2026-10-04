"use client";

import { useState } from "react";

import { AiFeedback } from "@rhs-ui/application/ai-feedback";

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState<string>("No feedback yet.");
  return (
    <div className="mx-auto max-w-md p-6">
      <p className="text-sm leading-relaxed">Your next invoice is due on 1 April and will be €240 for 20 seats.</p>
      <AiFeedback className="mt-3" onFeedback={(feedback) => setLast(`${feedback.rating}${feedback.reason ? `: ${feedback.reason}` : ""}`)} />
      <p className="mt-6 text-xs text-muted-foreground">Received: {last}</p>
    </div>
  );
}
