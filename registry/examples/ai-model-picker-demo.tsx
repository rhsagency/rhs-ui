"use client";

import { useState } from "react";

import { AiModelPicker } from "@rhs-ui/application/ai-model-picker";

export default function Demo(): React.JSX.Element {
  const [model, setModel] = useState("balanced");
  return (
    <div className="flex min-h-48 items-start justify-center p-6">
      <div className="flex w-full max-w-xl items-center justify-between rounded-2xl border border-border p-2 pl-4 text-sm text-muted-foreground">
        Ask anything about your workspace
        <AiModelPicker
          value={model}
          onValueChange={setModel}
          models={[
            { id: "fast", label: "Fast", description: "Quick answers to short questions" },
            { id: "balanced", label: "Balanced", description: "The everyday default" },
            { id: "deep", label: "Deep", description: "Long reasoning for hard problems", badge: "New" },
          ]}
        />
      </div>
    </div>
  );
}
