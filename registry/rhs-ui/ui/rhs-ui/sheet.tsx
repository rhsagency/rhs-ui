"use client";

import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Dialog as SheetPrimitive } from "radix-ui";

import { IconClose } from "@/registry/rhs-ui/ui/rhs-ui/icons";
import { cn } from "@/lib/utils";

/**
 * A panel that slides in from an edge: menus, carts, filters, settings. Same
 * accessibility contract as Dialog (focus trap, Escape, labelled by Title).
 * On the right and left it is a full-height column; on the top and bottom a
 * band. Slides on transform only.
 */
export function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

export function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

export function SheetClose(props: ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

export function SheetPortal(props: ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

export function SheetOverlay({ className, ...props }: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/55 data-[state=open]:animate-rhs-fade-in data-[state=closed]:animate-rhs-fade-out",
        className,
      )}
      {...props}
    />
  );
}

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border-border bg-background text-foreground shadow-xl outline-none transition-transform",
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:animate-rhs-slide-in-right data-[state=closed]:animate-rhs-slide-out-right",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:animate-rhs-slide-in-left data-[state=closed]:animate-rhs-slide-out-left",
        top: "inset-x-0 top-0 max-h-[85dvh] border-b data-[state=open]:animate-rhs-slide-in-top data-[state=closed]:animate-rhs-slide-out-top",
        bottom: "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t data-[state=open]:animate-rhs-slide-in-bottom data-[state=closed]:animate-rhs-slide-out-bottom",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface SheetContentProps extends ComponentProps<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {
  showCloseButton?: boolean;
}

export function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content data-slot="sheet-content" data-side={side} className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className="absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <IconClose size={16} />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-5", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-base leading-tight font-semibold", className)} {...props} />;
}

export function SheetDescription({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { sheetVariants };
