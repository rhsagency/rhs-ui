"use client";

import { useState } from "react";

import { AppearanceSettings, type AppearanceValue } from "@rhs-ui/application/appearance-settings";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<AppearanceValue>({ theme: "system", density: "comfortable", font: "default" });
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <AppearanceSettings value={value} onChange={setValue} />
    </div>
  );
}
