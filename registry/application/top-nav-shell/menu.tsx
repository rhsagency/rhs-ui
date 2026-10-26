"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconMenu } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface TopNavMenuProps {
  /** The menu button's name for screen readers. */
  label: string;
  /** Your mark and name, drawn in the top bar of the sheet. */
  brand: ReactNode;
  /** The width from which the header row takes over from this menu: the button is hidden, and an open sheet closes by itself. */
  collapse: "md" | "lg";
  /** What the sheet holds below the brand: the search, the links, the actions. */
  children: ReactNode;
}

const WIDE = { md: "(min-width: 48rem)", lg: "(min-width: 64rem)" } as const;
const HIDDEN = { md: "md:hidden", lg: "lg:hidden" } as const;

/**
 * The menu of TopNavShell below its collapse width: a button in the header
 * that opens a left sheet with the search, the links and the actions. The
 * sheet closes when a link is followed (the links are SheetClose elements),
 * and it closes by itself if the window grows into the header layout while
 * it is open, so a rotated tablet never keeps a modal over the desktop page.
 */
export function TopNavMenu({ label, brand, collapse, children }: TopNavMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia?.(WIDE[collapse]);
    if (!wide) return;
    const close = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, [collapse]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} className={cn("-ml-2 shrink-0", HIDDEN[collapse])}>
          <IconMenu className="size-[18px]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 p-0">
        <SheetHeader className="h-14 flex-row items-center border-b border-border px-5 py-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Every area of the product.</SheetDescription>
          <div className="text-sm font-semibold">{brand}</div>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
