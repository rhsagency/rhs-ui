"use client";

import { useState } from "react";

import { AccessibilityPreferences, type AccessibilityPreferencesValue } from "@rhs-ui/application/accessibility-preferences";
import { DEFAULT_ACCESSIBILITY_PREFERENCES } from "@rhs-ui/application/accessibility-preferences/steps";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<AccessibilityPreferencesValue>({ ...DEFAULT_ACCESSIBILITY_PREFERENCES, textSize: 2, underlineLinks: true, keyboardHints: true });
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <AccessibilityPreferences value={value} onChange={setValue} />
    </div>
  );
}
