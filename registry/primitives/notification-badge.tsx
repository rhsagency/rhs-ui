import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface NotificationBadgeProps {
  /** What the count is about: "unread messages". */
  label: string;
  count: number;
  /** Shown as "99+" above this number. */
  max?: number;
  /** A dot instead of a number, for "something new". */
  dot?: boolean;
  /** The icon or avatar the badge sits on. */
  children: ReactNode;
  className?: string;
}

/**
 * A count on the corner of an icon: the inbox, the bell, an avatar. The
 * number is hidden at zero, capped at max, and spelled out for screen
 * readers ("3 unread messages") instead of just the digit.
 */
export function NotificationBadge({ label, count, max = 99, dot = false, children, className }: NotificationBadgeProps) {
  const shown = count > max ? `${max}+` : String(count);
  return (
    <span data-slot="notification-badge" className={cn("relative inline-flex", className)}>
      {children}
      {count > 0 ? (
        dot ? (
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-background"><span className="sr-only">{`New ${label}`}</span></span>
        ) : (
          <span className="absolute -top-1.5 -right-1.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums ring-2 ring-background">
            <span aria-hidden="true">{shown}</span>
            <span className="sr-only">{`${count} ${label}`}</span>
          </span>
        )
      ) : null}
    </span>
  );
}
