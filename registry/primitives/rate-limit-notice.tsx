"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconHourglass } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface RateLimitNoticeProps {
  /** Seconds until the next try is allowed (from Retry-After). */
  retryAfter: number;
  /** What was limited: "sending codes", "exports". */
  what: string;
  /** Called when the wait is over, to re-enable the action. */
  onReady?: () => void;
  /** An upgrade or contact link for people who hit it often. */
  action?: ReactNode;
  className?: string;
}

/**
 * What to show after a 429 instead of a bare error: what was limited, a
 * live countdown to when it works again (from the Retry-After header), and
 * a call back when the wait is over so the button can come back by itself.
 * The countdown is a timer element, announced politely only at the end.
 */
export function RateLimitNotice({ retryAfter, what, onReady, action, className }: RateLimitNoticeProps) {
  const [left, setLeft] = useState(retryAfter);
  useEffect(() => {
    setLeft(retryAfter);
    const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);
  useEffect(() => {
    if (left === 0) onReady?.();
  }, [left, onReady]);
  const time = left >= 60 ? `${Math.floor(left / 60)} min ${left % 60} s` : `${left} s`;
  return (
    <div data-slot="rate-limit-notice" className={cn("flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm", className)}>
      <IconHourglass aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        {left > 0 ? (
          <p>You have been {what} a lot in a short time. Try again in <span role="timer" className="font-medium tabular-nums">{time}</span>.</p>
        ) : (
          <p role="status">You can try again now.</p>
        )}
        {action ? <div className="mt-2 text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4">{action}</div> : null}
      </div>
    </div>
  );
}
