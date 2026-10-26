"use client";

import { useEffect, useRef, useState } from "react";

import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CopyBoilerplateProps {
  /** The text that goes to the clipboard. */
  text: string;
  /** The button's words at rest: "Copy boilerplate". */
  label: string;
  /** The button's words for a moment after a successful copy: "Copied". */
  copiedLabel: string;
  /** The sentence announced to screen readers after a successful copy. */
  copiedStatus: string;
  /** The sentence shown, and announced, when the browser refuses to copy. */
  failedStatus: string;
  /** Merged into the wrapper, which holds the button and its live region. */
  className?: string;
}

/**
 * The copy button of the press list's boilerplate card. It confirms in words,
 * twice: the button says "Copied" for a couple of seconds, and a live region
 * says it to screen readers. When the browser refuses (an insecure page, a
 * blocked permission) it says so out loud instead of staying silent.
 */
export function CopyBoilerplate({ text, label, copiedLabel, copiedStatus, failedStatus, className }: CopyBoilerplateProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (): Promise<void> => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    timer.current = setTimeout(() => setStatus("idle"), 3200);
  };

  const copied = status === "copied";

  return (
    <div data-slot="copy-boilerplate" className={className}>
      <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
        {copied ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
        {copied ? copiedLabel : label}
      </Button>
      <p role="status" aria-live="polite" className={cn(status === "failed" ? "mt-2 text-xs leading-relaxed text-destructive" : "sr-only")}>
        {copied ? copiedStatus : status === "failed" ? failedStatus : ""}
      </p>
    </div>
  );
}
