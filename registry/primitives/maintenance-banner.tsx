import type { ReactNode } from "react";

import { IconWrench } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface MaintenanceBannerProps {
  /** "Planned maintenance on Sunday 19 April". */
  title: string;
  /** The window in the reader's time zone, formatted on your side: "02:00 to 04:00 CEST". */
  window: string;
  /** Machine-readable start for the time element. */
  startDateTime: string;
  /** What will and will not work. */
  impact?: string;
  /** A link to the status page. */
  action?: ReactNode;
  /** "upcoming" warns ahead, "active" says it is happening now. */
  phase?: "upcoming" | "active";
  className?: string;
}

/**
 * Tells people about planned maintenance before it surprises them: what,
 * when (a real time element in their own time zone), what still works, and
 * the status page. Upcoming is calm; active is a stronger band that says
 * it is happening now.
 */
export function MaintenanceBanner({ title, window, startDateTime, impact, action, phase = "upcoming", className }: MaintenanceBannerProps) {
  return (
    <aside data-slot="maintenance-banner" aria-label="Maintenance" className={cn("flex flex-col gap-3 rounded-2xl border px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between", phase === "active" ? "border-foreground bg-foreground text-background [&_[data-muted]]:text-background/75" : "border-border bg-muted/60", className)}>
      <div className="flex gap-3">
        <IconWrench aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">{phase === "active" ? `Happening now: ${title}` : title}</p>
          <p data-muted="" className="mt-0.5 text-muted-foreground"><time dateTime={startDateTime}>{window}</time>{impact ? `. ${impact}` : ""}</p>
        </div>
      </div>
      {action ? <div className="shrink-0 pl-7 sm:pl-0">{action}</div> : null}
    </aside>
  );
}
