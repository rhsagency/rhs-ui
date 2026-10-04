import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SettingsRowProps {
  /** The setting's name; link the control to it with htmlFor. */
  label: string;
  htmlFor?: string;
  description?: ReactNode;
  /** The control: a switch, a select, an input, a button. */
  children: ReactNode;
  className?: string;
}

/**
 * One setting: its name and an explanation on the left, the control on the
 * right, stacked on a phone. Stack several in a bordered list for a
 * settings page that reads the same everywhere.
 */
export function SettingsRow({ label, htmlFor, description, children, className }: SettingsRowProps) {
  return (
    <div data-slot="settings-row" className={cn("grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-8", className)}>
      <div>
        <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="sm:justify-self-end">{children}</div>
    </div>
  );
}
