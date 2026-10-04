"use client";

import { useState } from "react";

import { AiDiffSuggestion } from "@rhs-ui/application/ai-diff-suggestion";

const BEFORE = "Our tool helps teams to plan their work in a much better and more efficient way than before.";
const AFTER = "Ledger helps teams plan their work calmly and ship it sooner.";

export default function Demo(): React.JSX.Element {
  const [text, setText] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-lg p-8">
      {text === null ? (
        <AiDiffSuggestion before={BEFORE} after={AFTER} reason="shorter, names the product" onAccept={() => setText(AFTER)} onReject={() => setText(BEFORE)} />
      ) : (
        <p role="status" className="text-sm">{text} <button type="button" className="ml-2 text-muted-foreground underline underline-offset-4" onClick={() => setText(null)}>Show the suggestion again</button></p>
      )}
    </div>
  );
}
