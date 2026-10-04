"use client";

import { useState } from "react";

import { IconChartBar, IconMail, IconNote, IconUsers } from "@rhs-ui/icons";
import { AiPromptLibrary } from "@rhs-ui/application/ai-prompt-library";

export default function Demo(): React.JSX.Element {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-2xl p-8">
      <AiPromptLibrary
        onUse={(prompt) => setChosen(prompt.prompt)}
        prompts={[
          { id: "1", category: "Writing", icon: <IconMail />, title: "Reply to a customer", prompt: "Write a short, friendly reply to {customer} about {issue}, and offer {next step}." },
          { id: "2", category: "Writing", icon: <IconNote />, title: "Release notes", prompt: "Turn these finished tasks into release notes for {audience}: {tasks}" },
          { id: "3", category: "Analysis", icon: <IconChartBar />, title: "Explain a metric", prompt: "Why did {metric} change from {before} to {after} this month? List three likely causes." },
          { id: "4", category: "Team", icon: <IconUsers />, title: "One-on-one agenda", prompt: "Draft an agenda for a one-on-one with {name}, focused on {topic}." },
        ]}
      />
      {chosen ? <p className="mt-4 rounded-xl bg-muted p-3 text-sm">In the composer: {chosen}</p> : null}
    </div>
  );
}
