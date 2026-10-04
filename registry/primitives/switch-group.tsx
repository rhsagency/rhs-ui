"use client";

import { useId, type ReactNode } from "react";

import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface SwitchGroupItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SwitchGroupProps {
  title: string;
  description?: string;
  items: readonly SwitchGroupItem[];
  value: Readonly<Record<string, boolean>>;
  onValueChange: (id: string, on: boolean) => void;
  className?: string;
}

/**
 * Settings as a list of switches on one surface, each with its label and a
 * line of explanation tied to the switch, so the description is read along
 * with it. For notifications, privacy and feature toggles.
 */
export function SwitchGroup({ title, description, items, value, onValueChange, className }: SwitchGroupProps) {
  const id = useId();
  return (
    <section data-slot="switch-group" aria-labelledby={`${id}-title`} className={cn("rounded-xl border border-border", className)}>
      <header className="border-b border-border px-5 py-4">
        <h3 id={`${id}-title`} className="text-sm font-medium">{title}</h3>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-4">
            {item.icon ? <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4">{item.icon}</span> : null}
            <label htmlFor={`${id}-${item.id}`} className={cn("min-w-0 flex-1 text-sm", item.disabled && "text-muted-foreground")}>
              <span className="block font-medium">{item.label}</span>
              {item.description ? <span id={`${id}-${item.id}-d`} className="block text-muted-foreground">{item.description}</span> : null}
            </label>
            <Switch id={`${id}-${item.id}`} checked={Boolean(value[item.id])} disabled={item.disabled} aria-describedby={item.description ? `${id}-${item.id}-d` : undefined} onCheckedChange={(on) => onValueChange(item.id, on)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
