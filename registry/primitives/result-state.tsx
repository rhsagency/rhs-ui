"use client";

import type { ReactNode } from "react";

import { IconCheck, IconRefresh, IconWarning } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ResultStateProps {
  /** A finished action, or one that failed. */
  tone: "success" | "error";
  title: string;
  description?: string;
  /** For an error: what someone can do about it. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Extra actions: "Back to orders", "Contact support". */
  actions?: ReactNode;
  /** A reference people can quote to support. */
  reference?: string;
  className?: string;
}

/**
 * The end of an action, in a panel: done (a check, what happened, what is
 * next) or failed (what went wrong in plain words, retry, and a reference
 * for support). Never a dead end; there is always a way on.
 */
export function ResultState({ tone, title, description, onRetry, retryLabel = "Try again", actions, reference, className }: ResultStateProps) {
  return (
    <section data-slot="result-state" data-tone={tone} role={tone === "error" ? "alert" : "status"} className={cn("mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center", className)}>
      <span className={cn("inline-flex size-12 items-center justify-center rounded-full [&_svg]:size-5", tone === "success" ? "bg-foreground text-background" : "bg-destructive/12 text-destructive")}>
        {tone === "success" ? <IconCheck /> : <IconWarning />}
      </span>
      <h3 className="mt-5 text-xl font-medium tracking-[-0.02em]">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <button type="button" onClick={onRetry} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconRefresh />{retryLabel}</button>
        ) : null}
        {actions}
      </div>
      {reference ? <p className="mt-6 font-mono text-xs text-muted-foreground">Reference {reference}</p> : null}
    </section>
  );
}
