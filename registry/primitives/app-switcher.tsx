import type { ReactNode } from "react";

import { IconGrid } from "@rhs-ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface SwitcherApp {
  id: string;
  name: string;
  href: string;
  icon: ReactNode;
  /** One word under the name: "Docs", "Beta". */
  hint?: string;
}

export interface AppSwitcherProps {
  apps: readonly SwitcherApp[];
  /** The app you are in, marked in the grid. */
  current?: string;
  label?: string;
  className?: string;
}

/**
 * The grid button in a suite's top bar: every product in a three-column
 * grid of icon tiles, the current one marked. Each tile is a plain link.
 */
export function AppSwitcher({ apps, current, label = "Switch app", className }: AppSwitcherProps) {
  return (
    <Popover>
      <PopoverTrigger data-slot="app-switcher" aria-label={label} className={cn("inline-flex size-9 items-center justify-center rounded-lg outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4", className)}>
        <IconGrid />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <ul className="grid grid-cols-3 gap-1">
          {apps.map((app) => (
            <li key={app.id}>
              <a href={app.href} aria-current={app.id === current ? "page" : undefined} className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs outline-none hover:bg-muted focus-visible:bg-muted aria-[current=page]:bg-muted">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background [&_svg]:size-5">{app.icon}</span>
                <span className="font-medium">{app.name}</span>
                {app.hint ? <span className="-mt-1 text-[10px] text-muted-foreground">{app.hint}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
