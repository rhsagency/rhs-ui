"use client";

import { useState } from "react";

import { LanguageSwitcher } from "@rhs-ui/marketing/language-switcher";

export default function Demo(): React.JSX.Element {
  const [language, setLanguage] = useState("nl");
  return (
    <div className="mx-auto flex min-h-64 max-w-md items-start justify-center p-10">
      <LanguageSwitcher
        current={language}
        onChange={setLanguage}
        languages={[
          { code: "nl", name: "Nederlands" },
          { code: "en", name: "English" },
          { code: "de", name: "Deutsch" },
          { code: "fr", name: "Français" },
          { code: "es", name: "Español" },
        ]}
      />
    </div>
  );
}
