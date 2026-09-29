"use client";

import { useState, type ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface BannerProps {
  children: ReactNode;
  /** An icon or badge in front of the message. */
  leading?: ReactNode;
  /** A link or button after the message: "Read the release notes". */
  action?: ReactNode;
  /** Adds a close button; persist the choice yourself in onDismiss if it should stay closed. */
  onDismiss?: () => void;
  dismissible?: boolean;
  tone?: "default" | "inverted";
  className?: string;
}

/**
 * A full-width announcement above everything else: a launch, a sale,
 * scheduled maintenance. One sentence, at most one action, and a close
 * button when it is not essential. It is a region with a label, so screen
 * reader users can find it and skip it.
 */
export function Banner({ children, leading, action, onDismiss, dismissible = Boolean(onDismiss), tone = "inverted", className }: BannerProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      data-slot="banner"
      role="region"
      aria-label="Announcement"
      className={cn(
        "relative flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 px-10 py-2.5 text-center text-sm",
        tone === "inverted" ? "bg-foreground text-background" : "border-b border-border bg-muted text-foreground",
        className,
      )}
    >
      {leading ? <span className="flex items-center [&_svg]:size-4">{leading}</span> : null}
      <span>{children}</span>
      {action ? <span className="font-medium underline underline-offset-4 [&_a]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-current">{action}</span> : null}
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            setOpen(false);
            onDismiss?.();
          }}
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
        >
          <IconClose size={14} />
        </button>
      ) : null}
    </div>
  );
}
