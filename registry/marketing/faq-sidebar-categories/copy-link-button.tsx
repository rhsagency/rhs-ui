"use client";

import { useEffect, useRef, useState } from "react";

import { IconCheck, IconLink } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CopyLinkButtonProps {
  /** The id of the answer: the link is this page's address with #id. */
  id: string;
  /** The button's accessible name. */
  label?: string;
  /** Said in words after the copy worked. */
  copiedLabel?: string;
  /** Said when the browser refused to copy; the address bar already holds the link. */
  failedLabel?: string;
  /** Called after the link was copied, with the id and the full address. */
  onCopy?: (id: string, url: string) => void;
  className?: string;
}

/**
 * The permalink button of an answer. It puts #id in the address bar, copies
 * the full link, and confirms in words ("Link copied") in a live region that
 * is also read out. The region is in the page from the start, empty and
 * invisible, and only its text changes, which is what makes a screen reader
 * announce it. The hash is replaced rather than pushed, so the page does not
 * jump and Back still leaves it.
 */
export function CopyLinkButton({ id, label = "Copy link to this answer", copiedLabel = "Link copied", failedLabel = "Copy it from the address bar", onCopy, className }: CopyLinkButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const url = new URL(window.location.href);
    url.hash = id;
    try {
      window.history.replaceState(null, "", url);
    } catch {
      // A sandboxed frame may refuse to rewrite its address; the link is still copied.
    }
    let next: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(url.href);
    } catch {
      next = "failed";
    }
    setState(next);
    if (next === "copied") onCopy?.(id, url.href);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2400);
  };

  return (
    <span data-slot="copy-link-button" className="relative flex shrink-0">
      <span role="status" className="pointer-events-none absolute right-0 bottom-full z-10 mb-1.5 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium whitespace-nowrap text-background shadow-sm empty:opacity-0">
        {state === "copied" ? copiedLabel : state === "failed" ? failedLabel : ""}
      </span>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={label} onClick={() => void copy()} className={cn("text-muted-foreground hover:text-foreground", className)}>
        {state === "copied" ? <IconCheck /> : <IconLink />}
      </Button>
    </span>
  );
}
