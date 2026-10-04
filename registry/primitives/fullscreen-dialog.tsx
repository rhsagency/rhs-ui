"use client";

import type { ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export interface FullscreenDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: string;
  /** The main action in the header: "Save", "Publish". */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A task that needs the whole screen: an editor, a long form, a preview. A
 * modal dialog filling the viewport with a sticky header (close, title and
 * the main action) and a scrolling body. On a phone it is the natural
 * pattern; on a desktop it keeps people focused on one job.
 */
export function FullscreenDialog({ open, onOpenChange, trigger, title, description, action, children, className }: FullscreenDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent showCloseButton={false} className={cn("top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none", className)}>
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <DialogClose aria-label="Close" className="inline-flex size-9 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-5"><IconClose /></DialogClose>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base font-medium">{title}</DialogTitle>
            {description ? <DialogDescription className="truncate text-xs text-muted-foreground">{description}</DialogDescription> : null}
          </div>
          {action}
        </header>
        <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
