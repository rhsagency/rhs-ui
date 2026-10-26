"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconMenu } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";

export interface InsetSidebarMenuProps {
  /** The menu button's name for screen readers. */
  label: string;
  /** The sidebar, as it is on a desktop. */
  children: ReactNode;
}

/**
 * The sidebar of InsetSidebarShell below md: a left sheet opened from the
 * menu button in the header. Focus returns to that button when the sheet
 * closes, following a link closes it, and it closes by itself if the window
 * grows into a desktop layout while it is open.
 */
export function InsetSidebarMenu({ label, children }: InsetSidebarMenuProps) {
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
        <Button type="button" variant="ghost" size="icon" aria-label={label} className="-ml-1 shrink-0 md:hidden">
          <IconMenu className="size-[18px]" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 max-w-[85vw] gap-0 bg-muted"
        onClick={(event) => {
          if ((event.target as Element).closest("a[href]")) setOpen(false);
        }}
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">The pages of this workspace.</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
