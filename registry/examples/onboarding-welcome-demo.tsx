"use client";

import { useState } from "react";

import { IconBriefcase, IconCode, IconMegaphone, IconUsers } from "@rhs-ui/icons";
import { OnboardingWelcome } from "@rhs-ui/application/onboarding-welcome";

export default function Demo(): React.JSX.Element {
  const [done, setDone] = useState<string[] | null>(null);
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {done ? (
        <p role="status" className="text-center text-sm text-muted-foreground">Setting up templates for: {done.join(", ")}. <button type="button" className="underline underline-offset-4" onClick={() => setDone(null)}>Start over</button></p>
      ) : (
        <OnboardingWelcome
          titleAs="h2"
          title="Welcome, Anouk."
          question="What will you use Ledger for?"
          multiple
          onContinue={setDone}
          onSkip={() => setDone(["nothing yet"])}
          choices={[
            { id: "product", icon: <IconCode />, label: "Product development", description: "Roadmaps, sprints and releases" },
            { id: "clients", icon: <IconBriefcase />, label: "Client work", description: "Projects, approvals and hours" },
            { id: "marketing", icon: <IconMegaphone />, label: "Marketing", description: "Campaigns and a content calendar" },
            { id: "team", icon: <IconUsers />, label: "Running a team", description: "Goals, one-on-ones and hiring" },
          ]}
        />
      )}
    </div>
  );
}
