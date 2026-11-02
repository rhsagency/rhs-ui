"use client";

import { useEffect, useRef, useState } from "react";

import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

export interface CopyEmailLabels {
  /** The button before copying. */
  copy: string;
  /** The button for a moment after copying. */
  copied: string;
  /** Said to a screen reader after copying. */
  announcement: string;
  /** Said when the browser refuses to copy. */
  failed: string;
}

export interface CopyEmailProps {
  /** The address to put on the clipboard. */
  value: string;
  /** The id of the element that shows the address, so a screen reader hears what the button copies. */
  describedBy: string;
  /** The words of the button and of what is said after pressing it. */
  labels: CopyEmailLabels;
}

/**
 * A small Copy button that confirms in words: the label turns to Copied for two seconds, a screen reader is told
 * the address is on the clipboard, and if the browser refuses, it says so next to the button instead of doing nothing.
 */
export function CopyEmail({ value, describedBy, labels }: CopyEmailProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    timer.current = setTimeout(() => setState("idle"), 2200);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" aria-describedby={describedBy} onClick={copy}>
        {state === "copied" ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
        {state === "copied" ? labels.copied : labels.copy}
      </Button>
      {state === "error" ? <span className="text-xs text-destructive">{labels.failed}</span> : null}
      {/* Success and failure are both said to a screen reader: a Copy that does nothing and says nothing is the worst answer. */}
      <span role="status" className="sr-only">
        {state === "copied" ? labels.announcement : state === "error" ? labels.failed : ""}
      </span>
    </>
  );
}
