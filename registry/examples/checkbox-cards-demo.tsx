"use client";

import { useState } from "react";

import { IconCalendar, IconCode, IconMail, IconMessages } from "@rhs-ui/icons";
import { CheckboxCards } from "@rhs-ui/primitives/checkbox-cards";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<string[]>(["calendar"]);
  return (
    <div className="mx-auto max-w-xl p-8">
      <CheckboxCards
        legend="Connect your tools"
        max={3}
        value={value}
        onValueChange={setValue}
        options={[
          { value: "calendar", label: "Calendar", description: "Due dates on your calendar", icon: <IconCalendar /> },
          { value: "email", label: "Email", description: "Turn emails into tasks", icon: <IconMail /> },
          { value: "chat", label: "Chat", description: "Updates where you talk", icon: <IconMessages /> },
          { value: "git", label: "Git", description: "Link pull requests", icon: <IconCode /> },
        ]}
      />
    </div>
  );
}
