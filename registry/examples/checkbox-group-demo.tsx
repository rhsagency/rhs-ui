"use client";

import { useState } from "react";

import { CheckboxGroup } from "@rhs-ui/primitives/checkbox-group";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<string[]>(["comments"]);
  return (
    <div className="mx-auto max-w-sm p-8">
      <CheckboxGroup
        legend="Email me about"
        selectAll
        value={value}
        onValueChange={setValue}
        options={[
          { value: "comments", label: "Comments", description: "Someone replies to you" },
          { value: "mentions", label: "Mentions", description: "Someone writes your name" },
          { value: "digest", label: "Weekly digest", description: "Mondays at 08:00" },
          { value: "billing", label: "Billing", description: "Always on for owners", disabled: true },
        ]}
      />
    </div>
  );
}
