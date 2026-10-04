import type { ReactNode } from "react";

import { IconSparkle } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AiQuotaBannerProps {
  used: number;
  limit: number;
  /** "messages", "images". */
  unit: string;
  /** "Resets tomorrow at 00:00", worked out on your side. */
  resets?: string;
  /** Upgrade or buy more. */
  action?: ReactNode;
  locale?: string;
  className?: string;
}

/**
 * The usage line above a chat composer: how many messages are left today
 * as a meter, a calm note until the last fifth, a clear one when it runs
 * out, when it resets, and the way to more. Never a surprise wall halfway
 * through a conversation.
 */
export function AiQuotaBanner({ used, limit, unit, resets, action, locale = "en-GB", className }: AiQuotaBannerProps) {
  const number = new Intl.NumberFormat(locale);
  const left = Math.max(0, limit - used);
  const low = left > 0 && left <= limit * 0.2;
  const out = left === 0;
  return (
    <div data-slot="ai-quota-banner" className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-2.5 text-sm", out ? "border-destructive/40 bg-destructive/5" : low ? "border-border bg-muted/60" : "border-border", className)}>
      <IconSparkle aria-hidden="true" className="size-4 shrink-0" />
      <p className={cn("min-w-0 flex-1", out && "text-destructive")} role={out ? "alert" : undefined}>
        {out ? `You have used all ${number.format(limit)} ${unit} for now.` : `${number.format(left)} of ${number.format(limit)} ${unit} left`}
        {resets ? <span className="text-muted-foreground"> · {resets}</span> : null}
      </p>
      <div role="meter" aria-label={`${unit} used`} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(used, limit)} className="h-1.5 w-24 overflow-clip rounded-full bg-muted">
        <div className={cn("h-full rounded-full", out ? "bg-destructive" : "bg-foreground")} style={{ width: `${Math.min(1, used / limit) * 100}%` }} />
      </div>
      {action && (low || out) ? action : null}
    </div>
  );
}
