"use client";

import { useState } from "react";

import { IconBell, IconEye, IconMail } from "@rhs-ui/icons";
import { SwitchGroup } from "@rhs-ui/primitives/switch-group";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<Record<string, boolean>>({ email: true, push: false, profile: true });
  return (
    <div className="mx-auto max-w-lg p-8">
      <SwitchGroup
        title="Privacy and alerts"
        description="Changes save right away."
        value={value}
        onValueChange={(id, on) => setValue((current) => ({ ...current, [id]: on }))}
        items={[
          { id: "email", label: "Email summaries", description: "One email a day with what changed", icon: <IconMail /> },
          { id: "push", label: "Push notifications", description: "Only for mentions and assignments", icon: <IconBell /> },
          { id: "profile", label: "Public profile", description: "Anyone with the link can see your work", icon: <IconEye /> },
        ]}
      />
    </div>
  );
}
