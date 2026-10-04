"use client";

import { useState } from "react";

import { AiAnswerCompare } from "@rhs-ui/application/ai-answer-compare";

export default function Demo(): React.JSX.Element {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-3xl p-8">
      <AiAnswerCompare
        prompt="Write a one-line subject for an email about a price increase."
        onPick={setChoice}
        answers={[
          { id: "a", label: "Response A", body: "Our prices change on 1 June: here is what it means for you." },
          { id: "b", label: "Response B", body: "IMPORTANT UPDATE regarding your subscription pricing!!!" },
        ]}
      />
      <p role="status" className="mt-4 text-xs text-muted-foreground">{choice ? `Thanks, recorded: ${choice === "tie" ? "a tie" : `response ${choice.toUpperCase()}`}.` : ""}</p>
    </div>
  );
}
