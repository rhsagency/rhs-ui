"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { IconClose } from "@rhs-ui/icons";
import { DialogDescription, DialogFooter, DialogOverlay, DialogTitle } from "@rhs-ui/primitives/dialog";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export interface ResponsiveDialogProps {
  /** Whether it is open, when you control it. */
  open?: boolean;
  /** Whether it starts open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called with the state it asks for: a close button, Escape, a tap outside, a drag down, or the trigger. */
  onOpenChange?: (open: boolean) => void;
  /** The heading. Required: it names the dialog for assistive technology, and takes focus when there is no field to take it. */
  title: string;
  /** One line under the title saying what this is for. Required: it is the dialog's description. */
  description: string;
  /** The element that opens it, usually a Button: focus goes back to it on close. */
  trigger?: ReactNode;
  /** The row of buttons under the content. It stays in view while the content scrolls, and clears the home indicator on a phone. */
  footer?: ReactNode;
  /** The viewport width in px from which it is a centred dialog; below it is a bottom drawer. Default 640. */
  breakpoint?: number;
  /** Whether Escape, a tap outside, the close button and a drag down close it. Off, only your own buttons do, through `onOpenChange`. Default true. */
  dismissible?: boolean;
  /** The content. It keeps its state when the container changes. A field marked `data-autofocus` takes focus first. */
  children: ReactNode;
  /** Classes for the panel, for a different width. */
  className?: string;
}

const FIELDS = "input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable='true']";

/** The panel in each container: written out in full, since a class is only generated from text it can read. */
const DIALOG = "top-1/2 left-1/2 max-h-[min(40rem,calc(100dvh-3rem))] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border";
const DRAWER = "inset-x-0 bottom-0 mx-auto max-h-[88dvh] w-full max-w-lg rounded-t-2xl border border-b-0";

/** Whether a media query matches. The server and the first browser render answer `server`; the real answer arrives right after mount. */
function useMedia(query: string, server: boolean): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => server,
  );
}

/**
 * One dialog API for every screen: a centred modal above `breakpoint` (640px) and a bottom drawer below it,
 * with the same title, description, focus handling and close behaviour. It is one element that changes shape,
 * not two components, so resizing the window or rotating the phone while it is open moves nothing out of the
 * content: what someone has typed stays typed. The title and description are required and wired into both
 * shapes; the drawer gains a grab handle and drags down to close; the footer stays in view above the home
 * indicator while a tall body scrolls inside the panel, never the page. Focus lands on the first field, or on
 * the title when there is none, and returns to the trigger on close. The viewport is read after mount, so server
 * and browser markup agree.
 */
export function ResponsiveDialog({ open, defaultOpen = false, onOpenChange, title, description, trigger, footer, breakpoint = 640, dismissible = true, children, className }: ResponsiveDialogProps) {
  const wide = useMedia(`(min-width: ${breakpoint}px)`, true);
  const calm = useMedia("(prefers-reduced-motion: reduce)", false);
  const mode = wide ? "dialog" : "drawer";
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const drag = useRef<{ y: number; at: number } | null>(null);
  const away = useRef<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  /** The sheet was dragged off the screen: it has left already, so it does not play its exit again. */
  const [gone, setGone] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** The content is taller than the body, which then scrolls: it must be reachable with the keyboard as well. */
  const [scrolls, setScrolls] = useState(false);
  // The body is in a portal and appears when the dialog opens, so its size is watched from the ref, not from an effect of this component.
  const watchBody = useCallback((node: HTMLDivElement | null) => {
    body.current = node;
    if (!node) return;
    const measure = () => setScrolls(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    // The body keeps its size when its content grows, so the content is watched too.
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, []);
  /** The shape it had when it opened: its entrance does not play again when the window is resized while it is open. */
  const [entered, setEntered] = useState(mode);
  useEffect(() => {
    if (!isOpen) setEntered(mode);
  }, [isOpen, mode]);
  useEffect(() => {
    setOffset(0);
    setDragging(false);
  }, [mode]);
  useEffect(() => () => window.clearTimeout(away.current), []);
  // A parent that does not close it after the drag (a controlled one that said no) gets the sheet back, instead of one stuck off the screen.
  useEffect(() => {
    if (!gone || !isOpen) return;
    const timer = window.setTimeout(() => {
      setGone(false);
      setOffset(0);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [gone, isOpen]);

  const change = (next: boolean) => {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const draggable = mode === "drawer" && dismissible;

  function dragStart(event: PointerEvent<HTMLElement>) {
    // The close button is a button first.
    if (!draggable || (event.target instanceof Element && event.target.closest("button"))) return;
    drag.current = { y: event.clientY, at: performance.now() };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function dragMove(event: PointerEvent<HTMLElement>) {
    if (drag.current) setOffset(Math.max(0, event.clientY - drag.current.y));
  }
  function dragEnd(event: PointerEvent<HTMLElement>) {
    const started = drag.current;
    if (!started) return;
    drag.current = null;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The pointer is already gone; nothing to release.
    }
    const height = panel.current?.offsetHeight ?? 400;
    const speed = offset / Math.max(1, performance.now() - started.at);
    // Past a third of its height, or a quick flick: let it slide the rest of the way out, then close; with reduced motion, just close.
    if (offset > height / 3 || speed > 0.6) {
      setGone(true);
      setOffset(height);
      if (calm) change(false);
      else away.current = window.setTimeout(() => change(false), 180);
    } else setOffset(0);
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={change}>
      {trigger ? <DialogPrimitive.Trigger {...AS_CHILD}>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={panel}
          data-slot="responsive-dialog"
          data-mode={mode}
          style={mode === "drawer" ? ({ transform: `translateY(${offset}px)`, transition: dragging || calm ? "none" : "transform 200ms cubic-bezier(0.2, 0.7, 0.2, 1)" } as CSSProperties) : undefined}
          onOpenAutoFocus={(event) => {
            // The first field, so someone can type at once; with none, the heading, which a screen reader then reads out.
            event.preventDefault();
            const field = body.current?.querySelector<HTMLElement>("[data-autofocus]") ?? body.current?.querySelector<HTMLElement>(FIELDS);
            (field ?? heading.current)?.focus();
          }}
          onCloseAutoFocus={() => {
            setOffset(0);
            setGone(false);
          }}
          onEscapeKeyDown={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border-border bg-background text-foreground shadow-xl outline-none",
            mode === "dialog" ? DIALOG : DRAWER,
            // Written with motion-safe, so under reduced motion there is no entrance at all and a closed panel is gone at once.
            entered === "dialog" ? "motion-safe:data-[state=open]:animate-rhs-in" : "motion-safe:data-[state=open]:animate-rhs-slide-in-bottom",
            gone ? "" : mode === "dialog" ? "motion-safe:data-[state=closed]:animate-rhs-out" : "motion-safe:data-[state=closed]:animate-rhs-slide-out-bottom",
            className,
          )}
        >
          <div
            onPointerDown={draggable ? dragStart : undefined}
            onPointerMove={draggable ? dragMove : undefined}
            onPointerUp={draggable ? dragEnd : undefined}
            onPointerCancel={draggable ? dragEnd : undefined}
            className={cn("shrink-0 border-b border-transparent transition-colors duration-150 motion-reduce:transition-none", scrolled && "border-border", draggable && "cursor-grab touch-none active:cursor-grabbing")}
          >
            {draggable ? <span aria-hidden="true" className="mx-auto mt-2.5 block h-1.5 w-10 rounded-full bg-muted-foreground/30" /> : null}
            <div className={cn("px-6 pb-4", mode === "drawer" ? "pt-3" : "pt-6")}>
              <DialogTitle ref={heading} tabIndex={-1} className="pr-8 text-lg tracking-[-0.02em] outline-none">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1.5">{description}</DialogDescription>
            </div>
          </div>
          {dismissible ? (
            <DialogPrimitive.Close
              data-slot="responsive-dialog-close"
              className="absolute top-3.5 right-3.5 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              <IconClose size={16} />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          ) : null}
          <div
            ref={watchBody}
            onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 1)}
            // A body that scrolls is a tab stop with a name, so keys can scroll it; one that does not has none.
            {...(scrolls ? { tabIndex: 0, role: "group", "aria-label": title } : {})}
            className={cn(
              "relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
              footer || mode === "dialog" ? "pb-6" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
            )}
          >
            <div>{children}</div>
          </div>
          {footer ? <DialogFooter className={cn("shrink-0 border-t border-border bg-background px-6 py-4", mode === "drawer" && "pb-[max(1rem,env(safe-area-inset-bottom))]")}>{footer}</DialogFooter> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
