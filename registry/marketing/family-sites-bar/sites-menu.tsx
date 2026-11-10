"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface SitesMenuProps {
  /** The text of the button. */
  label: string;
  /** The list of sites, already rendered by the bar: this holds no routes and takes no component as a prop. */
  children: ReactNode;
  /** Classes for the wrapper: the bar uses them to hide the button from lg up. */
  className?: string;
}

/**
 * The narrow-screen half of FamilySitesBar (below lg, so phones and tablets
 * held upright): a button and the panel it discloses under the strip. It is a
 * disclosure, not a menu, because what it holds are links: the button says
 * whether it is expanded, Tab walks the links in order, Escape closes it and
 * gives focus back to the button, and so does a click anywhere else or moving
 * on past the last link. Choosing a link closes it too, for a page that stays
 * put. The panel is out of the tab order and the accessibility tree while it
 * is closed, and fades under reduced motion rather than sliding.
 */
export function SitesMenu({ label, children, className }: SitesMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const away = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
    };
  }, [open]);

  const onPanelClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  };

  return (
    // The wrapper is not positioned, so the panel is placed against the strip itself and spans its whole width.
    <div ref={root} className={className}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((now) => !now)}
        className="group/menu -mr-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 font-medium whitespace-nowrap text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {label}
        <IconChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground transition-transform duration-150 group-aria-expanded/menu:rotate-180 motion-reduce:transition-none" />
      </button>
      {/* A click on a link bubbles up to here; the links themselves are real anchors and work before this script loads. */}
      <div
        id={panel}
        data-state={open ? "open" : "closed"}
        inert={!open}
        onClick={onPanelClick}
        className={cn(
          "absolute inset-x-0 top-full border-b border-border bg-popover text-popover-foreground shadow-sm transition-[opacity,translate,visibility] duration-150",
          "data-[state=closed]:invisible data-[state=closed]:opacity-0 motion-safe:data-[state=closed]:-translate-y-1 motion-reduce:transition-none",
        )}
      >
        {children}
      </div>
    </div>
  );
}
