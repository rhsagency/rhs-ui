"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface InlineConfirmProps {
  /** The button's label: "Delete". */
  children: ReactNode;
  /** The question in place of the button: "Delete this row?" */
  question: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  /** Seconds before the question folds back on its own. */
  timeout?: number;
  size?: "sm" | "default";
  className?: string;
}

/**
 * A two-step button for small destructive actions in a row: the first press
 * turns it into "Delete this row? Yes / No" right where it was, focus moves
 * to No (the safe choice), and the question folds back by itself after a
 * few seconds. Lighter than a popover, safer than a single click.
 */
export function InlineConfirm({ children, question, confirmLabel = "Yes", onConfirm, timeout = 6, size = "sm", className }: InlineConfirmProps) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const no = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!asking) return;
    no.current?.focus();
    const timer = setTimeout(() => setAsking(false), timeout * 1000);
    return () => clearTimeout(timer);
  }, [asking, timeout]);
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }
  if (!asking) return <Button ref={trigger} variant="ghost" size={size} className={className} onClick={() => setAsking(true)}>{children}</Button>;
  return (
    <span data-slot="inline-confirm" role="group" aria-label={question} className={cn("inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 py-0.5 pr-0.5 pl-2.5 text-sm", className)}>
      <span className="text-destructive">{question}</span>
      <Button size={size} variant="destructive" loading={busy} onClick={confirm}>{confirmLabel}</Button>
      <Button ref={no} size={size} variant="ghost" onClick={() => { setAsking(false); requestAnimationFrame(() => trigger.current?.focus()); }}>No</Button>
    </span>
  );
}
