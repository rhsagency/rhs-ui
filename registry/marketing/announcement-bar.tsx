"use client";

import { useState, type ReactNode } from "react";

import { IconArrowRight, IconClose } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AnnouncementBarProps {
  children: ReactNode;
  /** Where the announcement leads. */
  href?: string;
  linkLabel?: string;
  /** Show a close button; `onDismiss` lets you remember the choice. */
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * The strip above the navigation for one piece of news. Inverted, centred,
 * one link, and an optional close button that hands the choice back to you
 * to remember.
 */
export function AnnouncementBar({ children, href, linkLabel = "Read more", dismissible = false, onDismiss, className }: AnnouncementBarProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div data-slot="announcement-bar" role="region" aria-label="Announcement" className={cn("relative flex min-h-10 items-center justify-center bg-foreground px-12 py-2 text-center text-sm text-background", className)}>
      <p>
        {children}
        {href ? (
          <a href={href} className="group ml-2 inline-flex items-center gap-1 font-medium underline underline-offset-4">
            {linkLabel}
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5 [&_svg]:size-3.5"><IconArrowRight /></span>
          </a>
        ) : null}
      </p>
      {dismissible ? (
        <button type="button" aria-label="Dismiss announcement" onClick={() => { setOpen(false); onDismiss?.(); }} className="absolute right-2 inline-flex size-8 items-center justify-center rounded-full outline-none hover:bg-background/15 focus-visible:ring-2 focus-visible:ring-background [&_svg]:size-4">
          <IconClose />
        </button>
      ) : null}
    </div>
  );
}
