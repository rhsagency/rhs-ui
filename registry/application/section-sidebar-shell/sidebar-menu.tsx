"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconMenu } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";

export interface SidebarMenuProps {
  /** The menu button's name for screen readers. */
  label: string;
  /** The sheet's heading: the name of the current section. */
  title: string;
  /** What the sheet says it holds, for screen readers. */
  description: string;
  /** The sidebar, as it is on a desktop. */
  children: ReactNode;
  /** The foot of the sidebar, repeated at the foot of the sheet. */
  footer?: ReactNode;
}

/**
 * The sidebar of SectionSidebarShell below md: a left sheet opened from a
 * menu button in the header. Focus returns to that button when the sheet
 * closes, following a link closes it, and it closes by itself when the
 * window grows into the desktop layout while it is open.
 */
export function SidebarMenu({ label, title, description, children, footer }: SidebarMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia?.("(min-width: 48rem)");
    if (!desktop) return;
    const close = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} className="-ml-2 shrink-0 md:hidden">
          <IconMenu className="size-[18px]" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 max-w-[85vw] gap-0 bg-[color-mix(in_oklab,var(--muted)_40%,var(--background))] p-0 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
        onClick={(event) => {
          if ((event.target as Element).closest("a[href]")) setOpen(false);
        }}
      >
        <SheetHeader className="h-14 justify-center border-b border-border py-0 pr-12">
          <SheetTitle className="truncate text-sm">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
        </SheetHeader>
        {/* A plain overflow box: the links are already in the tab order, and a scroller with no tabindex cannot take the sheet's first focus. */}
        <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
          <div className="p-3 [&_nav_*]:min-w-0">{children}</div>
        </div>
        {footer ? <div className="shrink-0 border-t border-border p-3">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
