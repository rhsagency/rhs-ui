"use client";

import { useState } from "react";

import { LanguageRegionSection, type LanguageRegionValue } from "@rhs-ui/application/language-region-section";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<LanguageRegionValue>({
    language: "nl",
    country: "NL",
    timeZone: "Europe/Amsterdam",
    dateOrder: "dmy",
    firstDay: "monday",
    hour24: true,
  });
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <LanguageRegionSection
        value={value}
        onSave={async (next) => {
          await new Promise<void>((resolve) => setTimeout(resolve, 700));
          setValue(next);
        }}
      />
    </div>
  );
}
