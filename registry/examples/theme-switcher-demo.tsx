"use client";

import { useState } from "react";

import { ThemeSwitcher, type ThemeChoice } from "@rhs-ui/primitives/theme-switcher";

export default function Demo(): React.JSX.Element {
  const [theme, setTheme] = useState<ThemeChoice>("system");
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-4 p-6">
      <ThemeSwitcher value={theme} onValueChange={setTheme} />
      <ThemeSwitcher value={theme} onValueChange={setTheme} showLabels />
    </div>
  );
}
