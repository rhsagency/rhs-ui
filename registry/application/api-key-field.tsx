"use client";

import { useState } from "react";

import { IconCheck, IconCopy, IconEye, IconEyeOff, IconRefresh } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ApiKeyFieldProps {
  label: string;
  /** The full key. Shown masked until revealed. */
  value: string;
  /** Characters left visible at the end while masked. */
  visibleTail?: number;
  /** Ask before rotating; resolve with nothing, the new key comes in through `value`. */
  onRotate?: () => Promise<void> | void;
  /** "Created 3 March, last used 2 hours ago". */
  meta?: string;
  className?: string;
}

/**
 * A secret on a settings page: masked by default with the last characters
 * visible, reveal and copy buttons that say what they did, and an optional
 * rotate that asks for a second click before it replaces the key.
 */
export function ApiKeyField({ label, value, visibleTail = 4, onRotate, meta, className }: ApiKeyFieldProps) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const masked = "•".repeat(Math.max(8, value.length - visibleTail)) + value.slice(-visibleTail);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  async function rotate() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    try {
      await onRotate?.();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }
  const icon = "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4";
  return (
    <div data-slot="api-key-field" className={cn("rounded-xl border border-border p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{label}</p>
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
      </div>
      <div className="mt-3 flex items-center gap-1 rounded-lg bg-muted py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-sm" aria-label={shown ? undefined : "Hidden key"}>{shown ? value : masked}</code>
        <button type="button" className={icon} aria-label={shown ? "Hide key" : "Show key"} aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          {shown ? <IconEyeOff /> : <IconEye />}
        </button>
        <button type="button" className={icon} aria-label={copied ? "Copied" : "Copy key"} onClick={copy}>
          {copied ? <IconCheck /> : <IconCopy />}
        </button>
      </div>
      {onRotate ? (
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={rotate} disabled={busy} className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 [&_svg]:size-3.5", confirming && "text-destructive")}>
            <IconRefresh />
            {busy ? "Rotating…" : confirming ? "Click again to replace this key" : "Rotate key"}
          </button>
          {confirming && !busy ? <button type="button" onClick={() => setConfirming(false)} className="text-xs text-muted-foreground underline-offset-4 hover:underline">Cancel</button> : null}
        </div>
      ) : null}
    </div>
  );
}
