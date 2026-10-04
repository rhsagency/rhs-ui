"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FloatingActionBarProps {
  /** Show the bar: usually "items are selected". */
  open: boolean;
  /** What the actions apply to: "3 files selected". */
  label: string;
  /** The actions; keep them to four. */
  children: ReactNode;
  /** A way out, rendered on the right: "Clear selection". */
  onDismiss?: () => void;
  className?: string;
}

/**
 * A dark bar that floats above the content while a selection is active,
 * with the count and the actions that apply to it: move, share, delete.
 * A toolbar for assistive technology, announced as it appears.
 */
export function FloatingActionBar({ open, label, children, onDismiss, className }: FloatingActionBarProps) {
  return (
    <div data-slot="floating-action-bar" aria-live="polite" className={cn("pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4", className)}>
      {open ? (
        <div role="toolbar" aria-label={label} className="pointer-events-auto flex max-w-full items-center gap-1 overflow-hidden rounded-2xl bg-foreground p-1.5 text-sm text-background shadow-2xl [&_button]:text-background [&_button:hover]:bg-background/15">
          <span className="px-3 whitespace-nowrap tabular-nums">{label}</span>
          <span aria-hidden="true" className="h-5 w-px bg-background/25" />
          <div className="flex items-center gap-0.5">{children}</div>
          {onDismiss ? (
            <>
              <span aria-hidden="true" className="h-5 w-px bg-background/25" />
              <button type="button" onClick={onDismiss} className="rounded-xl px-3 py-1.5 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-background">Clear</button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
