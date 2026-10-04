"use client";

import { IconMonitor, IconMoon, IconSun } from "@rhs-ui/icons";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type ThemeChoice = "light" | "dark" | "system";

const CHOICES: readonly { value: ThemeChoice; label: string; icon: typeof IconSun }[] = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconMonitor },
];

export interface ThemeSwitcherProps {
  value: ThemeChoice;
  onValueChange: (value: ThemeChoice) => void;
  /** Show the words next to the icons. */
  showLabels?: boolean;
  className?: string;
}

/**
 * Light, dark or follow the system, as three joined toggles for a footer
 * or a settings page. Controlled: wire it to next-themes or your own
 * store. One is always chosen (clicking the active one keeps it), and each
 * icon has its name for screen readers.
 */
export function ThemeSwitcher({ value, onValueChange, showLabels = false, className }: ThemeSwitcherProps) {
  return (
    <ToggleGroup
      data-slot="theme-switcher"
      type="single"
      size="sm"
      aria-label="Colour theme"
      value={value}
      onValueChange={(next: string) => { if (next) onValueChange(next as ThemeChoice); }}
      className={cn("rounded-full", className)}
    >
      {CHOICES.map(({ value: choice, label, icon: Icon }) => (
        <ToggleGroupItem key={choice} value={choice} aria-label={showLabels ? undefined : label} className="gap-1.5 first:rounded-l-full last:rounded-r-full">
          <Icon aria-hidden="true" className="size-3.5" />
          {showLabels ? label : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
