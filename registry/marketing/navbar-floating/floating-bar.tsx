"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";

import { IconClose, IconMenu } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** Layout effects run before the browser paints, which is what puts the highlight on the current link in the first frame; on the server there is nothing to run. */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Highlight {
  left: number;
  top: number;
  width: number;
  height: number;
  /** False while nothing is pointed at and nothing is current: the highlight stays where it was and fades out, so it never slides in from the corner. */
  shown: boolean;
}

export interface FloatingBarProps extends Omit<ComponentProps<"header">, "children"> {
  /** The mark, already a link home. */
  brand: ReactNode;
  /** The list items of the links for the pill, already rendered by the bar's server half: this holds no routes and takes no component as a prop. */
  links: ReactNode;
  /** The list items of the same links for the panel under the pill. */
  menuLinks: ReactNode;
  /** The buttons or links on the right of the pill, and at the foot of the panel. */
  actions?: ReactNode;
  /** Keep the pill at the top of the window as the page scrolls. */
  sticky: boolean;
  /** The name of the navigation landmark. */
  navLabel: string;
  /** The name of the button that opens the panel on a phone. */
  menuLabel: string;
}

/**
 * The client half of NavbarFloating: one highlight that follows the pointer
 * and the keyboard along the links and settles on the current page when
 * they leave, measured from the real link boxes so it fits any label, and
 * the disclosure panel a phone gets instead of the links. The links are
 * yours, rendered on the server with your router's Link; the pointer and
 * focus handlers sit on the list and find the link under the event, so no
 * link has to know about the highlight. The highlight slides, and jumps
 * under reduced motion.
 */
export function FloatingBar({ brand, links, menuLinks, actions, sticky, navLabel, menuLabel, className, ...props }: FloatingBarProps) {
  const list = useRef<HTMLUListElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  /** The link the pointer or the keyboard is on, or null: then the highlight rests on the current page. */
  const pointed = useRef<HTMLElement | null>(null);
  const [box, setBox] = useState<Highlight | null>(null);
  /** Off for the first placement, so the highlight appears where it belongs instead of travelling there. */
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const panel = useId();

  const place = useCallback(() => {
    const ul = list.current;
    if (!ul) return;
    const on = pointed.current && ul.contains(pointed.current) ? pointed.current : ul.querySelector<HTMLElement>('a[aria-current="page"]');
    if (on) setBox({ left: on.offsetLeft, top: on.offsetTop, width: on.offsetWidth, height: on.offsetHeight, shown: true });
    else setBox((now) => (now ? { ...now, shown: false } : now));
  }, []);

  const point = (link: HTMLElement | null) => {
    pointed.current = link;
    place();
  };

  useBeforePaint(() => {
    place();
  }, [place]);

  useEffect(() => {
    const ul = list.current;
    if (!ul) return;
    // A web font arriving, a label changing or the window resizing all change the link boxes, and the highlight is measured from them.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    observer?.observe(ul);
    for (const link of Array.from(ul.querySelectorAll("a"))) observer?.observe(link);
    let gone = false;
    void document.fonts?.ready.then(() => {
      if (!gone) place();
    });
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => {
      gone = true;
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [place]);

  // The panel is a disclosure: Escape closes it and hands focus back to the button, a click or Tab outside closes it, and so does a wider window.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    const away = (event: Event) => {
      if (event.target instanceof Node && !shell.current?.contains(event.target)) setOpen(false);
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const widen = () => {
      if (wide.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    wide.addEventListener("change", widen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
      wide.removeEventListener("change", widen);
    };
  }, [open]);

  const linkUnder = (target: EventTarget) => (target instanceof Element ? target.closest<HTMLElement>("a") : null);

  return (
    <header data-slot="navbar-floating" className={cn("pointer-events-none z-40 w-full px-3 pt-3 sm:px-4 sm:pt-4", sticky && "sticky top-0", className)} {...props}>
      <div ref={shell} className="pointer-events-auto relative mx-auto flex h-14 w-full max-w-3xl items-center gap-3 rounded-full border border-border bg-background pr-2 pl-5 shadow-xs">
        <div className="shrink-0">{brand}</div>

        <nav aria-label={navLabel} className="hidden min-w-0 flex-1 justify-center md:flex">
          {/* The handlers are on the list, which only watches where the pointer and focus go: the links inside are the controls. */}
          <ul
            ref={list}
            className="relative flex items-center gap-0.5"
            onPointerOver={(event: PointerEvent<HTMLUListElement>) => {
              const link = event.pointerType === "touch" ? null : linkUnder(event.target);
              if (link) point(link);
            }}
            onPointerLeave={() => point(null)}
            onFocus={(event: FocusEvent<HTMLUListElement>) => {
              const link = linkUnder(event.target);
              if (link) point(link);
            }}
            onBlur={(event: FocusEvent<HTMLUListElement>) => {
              if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) point(null);
            }}
          >
            <span
              aria-hidden="true"
              data-slot="navbar-floating-highlight"
              data-ready={ready}
              style={box ? { width: box.width, height: box.height, transform: `translate(${box.left}px, ${box.top}px)` } : undefined}
              className={cn(
                "pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-muted opacity-0",
                "motion-safe:data-[ready=true]:transition-[transform,width,height,opacity] motion-safe:data-[ready=true]:duration-300 motion-safe:data-[ready=true]:ease-[cubic-bezier(0.22,1,0.36,1)]",
                box?.shown && "opacity-100",
              )}
            />
            {links}
          </ul>
        </nav>

        {actions ? <div className="ml-auto hidden shrink-0 items-center gap-1.5 md:flex">{actions}</div> : null}

        <Button ref={toggle} variant="ghost" size="icon" aria-label={menuLabel} aria-expanded={open} aria-controls={panel} onClick={() => setOpen((now) => !now)} className="ml-auto rounded-full md:hidden">
          {open ? <IconClose size={18} /> : <IconMenu size={18} />}
        </Button>

        {/* A click on a link bubbles up to here and closes the panel; the links are real anchors and work before this script loads. */}
        <div
          id={panel}
          data-state={open ? "open" : "closed"}
          inert={!open}
          onClick={(event: MouseEvent<HTMLDivElement>) => {
            if (linkUnder(event.target)) setOpen(false);
          }}
          className={cn(
            "absolute inset-x-0 top-[calc(100%+0.5rem)] origin-top rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-sm md:hidden",
            "transition-[opacity,translate,scale,visibility] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            "data-[state=closed]:invisible data-[state=closed]:opacity-0 motion-safe:data-[state=closed]:-translate-y-1 motion-safe:data-[state=closed]:scale-[0.98]",
          )}
        >
          <nav aria-label={navLabel}>
            <ul className="grid gap-0.5">{menuLinks}</ul>
          </nav>
          {actions ? <div className="mt-2 grid gap-2 border-t border-border p-2 pt-4 *:w-full">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}
