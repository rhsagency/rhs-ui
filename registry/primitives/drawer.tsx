"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trigger, if the drawer opens from a button. */
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A bottom sheet for phones: slides up from the edge, has a grab handle you
 * can drag down to dismiss (past a third of its height or a quick flick), and
 * is a real modal dialog underneath, so focus is trapped and Escape and the
 * backdrop close it. The handle is a button too, for anyone who cannot drag.
 */
export function Drawer({ open, onOpenChange, trigger, title, description, children, className }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const start = useRef<{ y: number; t: number } | null>(null);
  const [offset, setOffset] = useState(0);
  function down(event: PointerEvent<HTMLDivElement>) {
    start.current = { y: event.clientY, t: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (start.current) setOffset(Math.max(0, event.clientY - start.current.y));
  }
  function up(event: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const height = panel.current?.offsetHeight ?? 400;
    const speed = offset / Math.max(1, performance.now() - start.current.t);
    start.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (offset > height / 3 || speed > 0.6) onOpenChange(false);
    setOffset(0);
  }
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-rhs-fade-in data-[state=closed]:animate-rhs-fade-out" />
        <DialogPrimitive.Content
          ref={panel}
          data-slot="drawer"
          style={{ transform: offset ? `translateY(${offset}px)` : undefined, transition: offset ? "none" : undefined }}
          className={cn("fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border border-b-0 border-border bg-background pb-[env(safe-area-inset-bottom)] text-foreground shadow-2xl outline-none data-[state=open]:animate-rhs-slide-in-bottom data-[state=closed]:animate-rhs-slide-out-bottom", className)}
        >
          <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="flex cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing">
            <DialogPrimitive.Close aria-label="Close" className="h-1.5 w-12 rounded-full bg-muted-foreground/30 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" />
          </div>
          <div className="px-6 pb-2">
            <DialogPrimitive.Title className="text-lg font-medium">{title}</DialogPrimitive.Title>
            {description ? <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description> : null}
          </div>
          <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
