"use client";

import { useEffect } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface UnsavedChangesBarProps {
  /** Show the bar: there are changes that are not saved. */
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  message?: string;
  /** Warn when the tab is closed with unsaved changes. */
  guardUnload?: boolean;
  className?: string;
}

/**
 * The bar that rises when a form has changes nobody saved yet: what is
 * pending, discard and save. It can also ask the browser to warn before the
 * tab closes. Fixed to the bottom, announced when it appears.
 */
export function UnsavedChangesBar({ dirty, onSave, onDiscard, saving = false, message = "You have unsaved changes.", guardUnload = true, className }: UnsavedChangesBarProps) {
  useEffect(() => {
    if (!dirty || !guardUnload) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, guardUnload]);
  return (
    <div data-slot="unsaved-changes-bar" role="status" aria-live="polite" className={cn("pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4", className)}>
      {dirty ? (
        <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-xl">
          <span className="flex-1">{message}</span>
          <Button size="sm" variant="ghost" className="text-background hover:bg-background/15 hover:text-background" onClick={onDiscard} disabled={saving}>Discard</Button>
          <Button size="sm" variant="secondary" onClick={onSave} loading={saving}>Save changes</Button>
        </div>
      ) : null}
    </div>
  );
}
