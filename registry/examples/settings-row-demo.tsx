"use client";

import { Input } from "@rhs-ui/primitives/input";
import { SettingsRow } from "@rhs-ui/primitives/settings-row";
import { Switch } from "@rhs-ui/primitives/switch";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl divide-y divide-border p-8">
      <SettingsRow label="Display name" htmlFor="sr-name" description="Shown on comments and invoices.">
        <Input id="sr-name" defaultValue="Anouk de Wit" className="sm:w-64" />
      </SettingsRow>
      <SettingsRow label="Weekly summary" htmlFor="sr-summary" description="A Monday email with what changed.">
        <Switch id="sr-summary" defaultChecked />
      </SettingsRow>
      <SettingsRow label="Two-step sign-in" htmlFor="sr-2fa" description="Ask for a code from your phone.">
        <Switch id="sr-2fa" />
      </SettingsRow>
    </div>
  );
}
