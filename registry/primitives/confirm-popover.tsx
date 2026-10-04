"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";

export interface ConfirmPopoverProps {
  /** The button that asks: usually a destructive action. */
  children: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Resolve when done; the popover closes. */
  onConfirm: () => Promise<void> | void;
  destructive?: boolean;
}

/**
 * A lighter confirmation than a dialog, for reversible-but-annoying actions
 * like removing a row: a small popover next to the button with the
 * question, cancel and confirm. Focus starts on cancel, the safe choice.
 */
export function ConfirmPopover({ children, title, description, confirmLabel = "Confirm", onConfirm, destructive = true }: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent data-slot="confirm-popover" role="alertdialog" aria-label={title} className="w-72">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="outline" autoFocus onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" variant={destructive ? "destructive" : "default"} loading={busy} onClick={() => void confirm()}>{confirmLabel}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
