"use client";

import { useState } from "react";

import { CookieBanner } from "@rhs-ui/marketing/cookie-banner";

export default function Demo(): React.JSX.Element {
  const [decision, setDecision] = useState<string[] | null>(null);
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10">
      {decision ? (
        <p role="status" className="text-sm text-muted-foreground">Saved: {decision.join(", ")}. <button type="button" className="underline underline-offset-4" onClick={() => setDecision(null)}>Show again</button></p>
      ) : (
        <CookieBanner
          position="inline"
          policyHref="#"
          onDecide={setDecision}
          categories={[
            { id: "necessary", label: "Necessary", description: "Sign-in, basket and security. Always on.", required: true },
            { id: "analytics", label: "Analytics", description: "Anonymous counts that help us improve pages." },
            { id: "marketing", label: "Marketing", description: "Measures which campaigns bring people here." },
          ]}
        />
      )}
    </div>
  );
}
