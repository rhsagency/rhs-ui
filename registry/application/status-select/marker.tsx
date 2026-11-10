"use client";

import { useId, type ComponentProps } from "react";

import type { StatusKind } from "@rhs-ui/application/status-select/kinds";
import { cn } from "@/lib/utils";

/** The kinds that are drawn in the quiet ink: not started yet, or set aside. */
const QUIET: ReadonlySet<StatusKind> = new Set(["backlog", "todo", "cancelled"]);

export interface StatusMarkerProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Which marker to draw. */
  kind: StatusKind;
  /** Width and height in px. Default 16. It is drawn on a 16 unit grid and was checked at 14, 16, 20 and 24. */
  size?: number;
}

/**
 * The marker of a status, on a 16 unit grid: a dashed ring for backlog, a ring
 * for to do, a ring half filled for in progress and three quarters for in
 * review, a solid disc with the check cut out of it for done, and a ring with a
 * cross for cancelled. The check is cut with a mask, so whatever is behind the
 * marker shows through it, on a hovered row as on the page. It draws in
 * `currentColor` and is hidden from assistive technology: put the word next to it.
 */
export function StatusMarker({ kind, size = 16, className, style, ...props }: StatusMarkerProps) {
  const mask = useId().replace(/[^\w-]/g, "");
  return (
    <svg
      data-slot="status-marker"
      data-kind={kind}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ width: size, height: size, ...style }}
      className={cn("shrink-0", QUIET.has(kind) ? "text-muted-foreground" : "text-foreground", className)}
      {...props}
    >
      {kind === "done" ? (
        <>
          <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
            <rect width="16" height="16" fill="white" />
            <path d="M5.1 8.2l2 2 3.8-4.2" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </mask>
          <circle cx="8" cy="8" r="7" fill="currentColor" mask={`url(#${mask})`} />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" strokeDasharray={kind === "backlog" ? "1.9 2.03" : undefined} />
          {kind === "progress" ? <path d="M8 4.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" /> : null}
          {kind === "review" ? <path d="M8 8V4.5A3.5 3.5 0 1 1 4.5 8z" fill="currentColor" /> : null}
          {kind === "cancelled" ? <path d="M5.9 5.9l4.2 4.2M10.1 5.9l-4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : null}
        </>
      )}
    </svg>
  );
}
