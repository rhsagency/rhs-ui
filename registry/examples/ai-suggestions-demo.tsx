"use client";

import { useState } from "react";

import { IconChart, IconFileText, IconMail, IconSearch } from "@rhs-ui/icons";
import { AiSuggestions } from "@rhs-ui/application/ai-suggestions";

export default function Demo(): React.JSX.Element {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <AiSuggestions
        onSelect={setPicked}
        suggestions={[
          { id: "1", label: "Summarise this page" },
          { id: "2", label: "Draft a reply" },
          { id: "3", label: "Find similar tickets" },
        ]}
      />
      <AiSuggestions
        layout="grid"
        onSelect={setPicked}
        suggestions={[
          { id: "a", label: "Explain last month's revenue dip", icon: <IconChart /> },
          { id: "b", label: "Write a launch email", icon: <IconMail /> },
          { id: "c", label: "Search the docs for webhooks", icon: <IconSearch /> },
          { id: "d", label: "Turn notes into a brief", icon: <IconFileText /> },
        ]}
      />
      <p role="status" className="text-sm text-muted-foreground">{picked ? `Sent: ${picked}` : "Pick a prompt."}</p>
    </div>
  );
}
