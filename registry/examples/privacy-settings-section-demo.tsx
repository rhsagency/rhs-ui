"use client";

import { useState } from "react";

import { PrivacySettingsSection, type PrivacySettings } from "@rhs-ui/application/privacy-settings-section";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<PrivacySettings>({ visibility: "members", showActivity: true, searchEngines: false, shareUsage: true });
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <PrivacySettingsSection
        value={value}
        policyHref="#privacy"
        onChange={async (next) => {
          setValue(next);
          await new Promise<void>((resolve) => setTimeout(resolve, 450));
        }}
      />
    </div>
  );
}
