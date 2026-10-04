"use client";

import { IconBell, IconCreditCard, IconShield, IconUser } from "@rhs-ui/icons";
import { VerticalTabs } from "@rhs-ui/primitives/vertical-tabs";

const panel = (title: string, text: string) => (
  <div className="rounded-2xl border border-border p-6">
    <h3 className="text-lg font-medium">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{text}</p>
  </div>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <VerticalTabs
        label="Settings"
        tabs={[
          { value: "profile", label: "Profile", description: "Name, photo, language", icon: <IconUser />, content: panel("Profile", "How you appear to your team.") },
          { value: "notifications", label: "Notifications", description: "Email and push", icon: <IconBell />, content: panel("Notifications", "Choose what reaches you, and when.") },
          { value: "security", label: "Security", description: "Password, two-step", icon: <IconShield />, content: panel("Security", "Sign-in methods and active sessions.") },
          { value: "billing", label: "Billing", description: "Plan and invoices", icon: <IconCreditCard />, content: panel("Billing", "Your plan, payment method and invoices.") },
        ]}
      />
    </div>
  );
}
