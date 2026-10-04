"use client";

import { useState, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconCopy, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ErrorPanelProps {
  /** What went wrong, for a person: "We could not load your invoices." */
  title: string;
  /** What they can do about it. */
  description?: string;
  /** Retry the failed call. */
  onRetry?: () => void;
  /** A reference support can look up: a request id or digest. Never the raw error message. */
  reference?: string;
  /** Extra actions: "Go to dashboard", "Contact support". */
  actions?: ReactNode;
  className?: string;
}

/**
 * The fallback for a failed section or an error boundary: what happened in
 * plain words, what to do, retry, and a reference id with a copy button for
 * support. It never shows a stack trace or the raw error, which can leak
 * table names and keys; log those on the server against the reference.
 */
export function ErrorPanel({ title, description, onRetry, reference, actions, className }: ErrorPanelProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!reference) return;
    await navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div data-slot="error-panel" role="alert" className={cn("rounded-2xl border border-destructive/30 bg-destructive/5 p-6", className)}>
      <div className="flex gap-3">
        <IconAlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          {onRetry || actions ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry ? <Button size="sm" onClick={onRetry}><IconRefresh /> Try again</Button> : null}
              {actions}
            </div>
          ) : null}
          {reference ? (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              Reference <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{reference}</code>
              <button type="button" onClick={copy} aria-label={copied ? "Reference copied" : "Copy reference"} className="inline-flex size-6 items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3.5">{copied ? <IconCheck /> : <IconCopy />}</button>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
