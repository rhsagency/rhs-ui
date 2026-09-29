import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type Status = "online" | "away" | "busy" | "offline";

const LABEL: Record<Status, string> = { online: "Online", away: "Away", busy: "Busy", offline: "Offline" };

export interface StatusDotProps extends Omit<ComponentProps<"span">, "children"> {
  status: Status;
  /** Show the word next to the dot. Without it the word is only for screen readers. */
  showLabel?: boolean;
  /** A slow pulse on "online", for live things. Still under reduced motion. */
  pulse?: boolean;
}

/**
 * Presence or health in a dot: online, away, busy, offline. Each state has
 * its own shape as well as its colour (a ring for away, a bar for busy), so
 * it reads without colour, and the word is always there for screen readers.
 */
export function StatusDot({ status, showLabel = false, pulse = false, className, ...props }: StatusDotProps) {
  return (
    <span data-slot="status-dot" data-status={status} className={cn("inline-flex items-center gap-1.5 text-xs", className)} {...props}>
      <span className="relative inline-flex size-2.5" aria-hidden="true">
        {pulse && status === "online" ? <span className="absolute inset-0 rounded-full bg-[var(--color-success,oklch(0.62_0.15_150))] opacity-60 motion-safe:animate-ping" /> : null}
        <span
          className={cn(
            "relative inline-flex size-2.5 items-center justify-center rounded-full",
            status === "online" && "bg-[var(--color-success,oklch(0.62_0.15_150))]",
            status === "away" && "border-2 border-[var(--color-warning,oklch(0.72_0.16_75))]",
            status === "busy" && "bg-destructive",
            status === "offline" && "border-2 border-muted-foreground/60",
          )}
        >
          {status === "busy" ? <span className="h-0.5 w-1.5 rounded-full bg-background" /> : null}
        </span>
      </span>
      <span className={showLabel ? "text-muted-foreground" : "sr-only"}>{LABEL[status]}</span>
    </span>
  );
}
