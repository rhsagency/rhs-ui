"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { IconChevronDown, IconChevronUp, IconClose } from "@rhs-ui/icons";
import { IconButton } from "@rhs-ui/primitives/icon-button";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { Separator } from "@rhs-ui/primitives/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface InspectorShellLabels {
  /** The close button's name. Default "Close panel". */
  close?: string;
  /** The previous button's name. Default "Previous". */
  previous?: string;
  /** The next button's name. Default "Next". */
  next?: string;
  /** What the panel says it is for, for screen readers. Default "Details of the selected item. Press Escape to close."  */
  description?: string;
}

export interface InspectorShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** Whether the panel is open. Leave it out to let the shell keep it, and use `defaultOpen`. */
  open?: boolean;
  /** Whether the panel starts open when the shell keeps it. Default false. */
  defaultOpen?: boolean;
  /** The panel was opened or closed from inside the shell: the close button, Escape, a click on the dimmed page of the sheet. Opening it is yours: set `open` when a row is picked. */
  onOpenChange?: (open: boolean) => void;
  /** What the panel holds: the details of the selected record. It scrolls inside the panel. */
  panel: ReactNode;
  /** The panel's heading, usually the record's name. It takes focus when the panel opens and is announced when it changes. */
  panelTitle: string;
  /** Moves to the record before the selected one. Leave it out on the first record and the button dims. Leave out both handlers to have no buttons. */
  onPrevious?: () => void;
  /** Moves to the record after the selected one. Leave it out on the last record and the button dims. */
  onNext?: () => void;
  /** The bar above the content: a search field, filters, a button. It wraps on a narrow screen. */
  toolbar?: ReactNode;
  /** The words the shell uses, for translation. */
  labels?: InspectorShellLabels;
  /** The list, table, board or grid. It scrolls inside the shell; the toolbar and the panel stay put. Make each row hold a real button or link: that is what gets focus back when the panel closes. */
  children: ReactNode;
}

/** True from lg up, where the panel sits beside the content. The server and the first client render say true, so the markup agrees. */
function useBesideContent(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(min-width: 64rem)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(min-width: 64rem)").matches,
    () => true,
  );
}

const FOCUSABLE = "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

/** The look of an arrow with nowhere to go: dimmed and out of the pointer's reach, yet still focusable. */
const STEP = "aria-disabled:pointer-events-none aria-disabled:opacity-50";

/** The rows of a table or list; a header row is not one, so pressing beside a column title never changes where focus returns. */
const ROW = "tbody > tr, li, [role=row]";

/**
 * A list or table with a peek: pick a row and its details open in a 24rem
 * panel beside the list, without leaving it. The panel opens by animating
 * its width (instantly under reduced motion), takes focus on its heading,
 * has previous and next buttons to walk the list, and closes with its close
 * button or Escape, giving focus back to the row that opened it. Below lg
 * the panel is a sheet from the right with a focus trap. When the record
 * changes while the panel is open, its new name is announced. The toolbar and
 * the list sit in the main region and scroll on their own. It fills its
 * container: it is as tall as the viewport unless you give it a height.
 */
export function InspectorShell({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  panel,
  panelTitle,
  onPrevious,
  onNext,
  toolbar,
  labels,
  children,
  className,
  onKeyDown,
  onFocusCapture,
  onClickCapture,
  ...props
}: InspectorShellProps) {
  const text = { close: "Close panel", previous: "Previous", next: "Next", description: "Details of the selected item. Press Escape to close.", ...labels };
  const titleId = useId();
  const beside = useBesideContent();
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const [announcement, setAnnouncement] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const last = useRef({ open, title: panelTitle });

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInner(next);
    onOpenChange?.(next);
  };

  /** The row that opened the panel is the last thing outside it that was focused or pressed. */
  const remember = (target: EventTarget) => {
    if (!(target instanceof Element)) return;
    // A press on the row but beside its button (a cell, the gap) still belongs to the row: its first control gets focus back.
    const element = target.closest<HTMLElement>(FOCUSABLE) ?? target.closest(ROW)?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
    if (element && !element.closest("[data-slot=inspector-shell-panel]")) opener.current = element;
  };

  const close = () => {
    // Focus is about to lose its place: hand it back to the row before the panel goes inert.
    if (panelRef.current?.contains(document.activeElement) && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    setOpen(false);
  };

  // Opening moves focus to the heading, once the person has used the page: a panel that opens by itself on load must not take focus.
  // Moving to another record while the panel is open is announced.
  useEffect(() => {
    const before = last.current;
    last.current = { open, title: panelTitle };
    const touched = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true;
    if (open && !before.open && beside && touched) titleRef.current?.focus({ preventScroll: true });
    else if (open && before.open && before.title !== panelTitle) setAnnouncement(panelTitle);
  }, [open, panelTitle, beside]);

  const header = (asSheet: boolean) => {
    // The ring of the heading hugs its words, not the whole bar.
    const title = "-mx-1 min-w-0 truncate rounded-sm px-1 text-sm font-semibold tracking-[-0.01em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
    return (
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border pr-3 pl-5">
        {asSheet ? (
          <SheetTitle ref={titleRef} tabIndex={-1} className={title}>
            {panelTitle}
          </SheetTitle>
        ) : (
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className={title}>
            {panelTitle}
          </h2>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {onPrevious || onNext ? (
            <>
              {/* aria-disabled, not disabled: stepping onto the last record must not take focus away from the arrow that was just pressed. */}
              <IconButton icon={<IconChevronUp />} label={text.previous} size="sm" aria-disabled={!onPrevious || undefined} onClick={onPrevious} className={STEP} />
              <IconButton icon={<IconChevronDown />} label={text.next} size="sm" aria-disabled={!onNext || undefined} onClick={onNext} className={STEP} />
              <Separator orientation="vertical" className="mx-1.5 h-4" />
            </>
          ) : null}
          <IconButton icon={<IconClose />} label={text.close} size="sm" onClick={close} />
        </div>
      </div>
    );
  };

  const body = (
    // A new record starts at the top: the scroll area is keyed by the title. Its viewport is a tab stop (the details may hold nothing else to focus),
    // so its focus ring is drawn inside, where the clipping root cannot hide it.
    <ScrollArea key={panelTitle} className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]]:focus-visible:ring-inset [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="p-5">{panel}</div>
    </ScrollArea>
  );

  return (
    <div
      data-slot="inspector-shell"
      className={cn("relative flex h-dvh min-w-0 bg-background text-foreground", className)}
      onFocusCapture={(event: FocusEvent<HTMLDivElement>) => {
        remember(event.target);
        onFocusCapture?.(event);
      }}
      onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
        remember(event.target);
        onClickCapture?.(event);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        // A menu or a field that used the key has already said so; the sheet below lg closes itself.
        if (event.key === "Escape" && open && beside && !event.defaultPrevented) {
          event.preventDefault();
          close();
        }
      }}
      {...props}
    >
      <div data-slot="inspector-shell-main" className="flex min-w-0 flex-1 flex-col">
        {toolbar ? <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2 sm:px-6">{toolbar}</div> : null}
        <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">{children}</div>
      </div>

      {beside ? (
        <aside
          ref={panelRef}
          aria-labelledby={titleId}
          data-slot="inspector-shell-panel"
          data-state={open ? "open" : "closed"}
          inert={!open}
          className={cn("hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none lg:block", open ? "w-96" : "w-0")}
        >
          <div className="flex h-full w-96 flex-col border-l border-border bg-background">
            {header(false)}
            {body}
          </div>
        </aside>
      ) : (
        <Sheet open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
          <SheetContent
            side="right"
            showCloseButton={false}
            data-slot="inspector-shell-panel"
            className="w-full max-w-[min(24rem,calc(100vw-3rem))] gap-0 p-0 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              titleRef.current?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
            }}
          >
            {header(true)}
            <SheetDescription className="sr-only">{text.description}</SheetDescription>
            {body}
          </SheetContent>
        </Sheet>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
