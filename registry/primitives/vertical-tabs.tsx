"use client";

import type { ReactNode } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export interface VerticalTab {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  content: ReactNode;
}

export interface VerticalTabsProps {
  tabs: readonly VerticalTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label: string;
  className?: string;
}

/**
 * Tabs down the side for settings pages and long forms: a vertical tablist
 * (up and down arrows move) beside the panel, each tab with an icon and an
 * optional line, collapsing to a horizontal scroll row on a phone. Radix
 * Tabs underneath, so selection and focus follow the ARIA pattern.
 */
export function VerticalTabs({ tabs, value, defaultValue, onValueChange, label, className }: VerticalTabsProps) {
  return (
    <TabsPrimitive.Root data-slot="vertical-tabs" orientation="vertical" value={value} defaultValue={defaultValue ?? tabs[0]?.value} onValueChange={onValueChange} className={cn("grid gap-6 md:grid-cols-[14rem_1fr]", className)}>
      <TabsPrimitive.List aria-label={label} className="relative -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger key={tab.value} value={tab.value} className="flex shrink-0 items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=active]:bg-muted data-[state=active]:text-foreground [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0">
            {tab.icon}
            <span>
              <span className="block font-medium whitespace-nowrap">{tab.label}</span>
              {tab.description ? <span className="hidden text-xs text-muted-foreground md:block">{tab.description}</span> : null}
            </span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.value} value={tab.value} className="min-w-0 outline-none">{tab.content}</TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
