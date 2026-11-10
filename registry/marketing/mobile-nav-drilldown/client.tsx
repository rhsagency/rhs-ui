"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Slot } from "radix-ui";

import { ROOT_PANEL } from "@rhs-ui/marketing/mobile-nav-drilldown/types";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

interface Stack {
  baseId: string;
  /** The panels the visitor has been through, from the root to the one on screen. */
  trail: readonly string[];
  push: (id: string) => void;
  pop: () => void;
  panels: RefObject<Map<string, HTMLElement>>;
  openers: RefObject<Map<string, HTMLElement>>;
}

const StackContext = createContext<Stack | null>(null);
/** Set by the sheet: what a link does to the sheet it sits in, which is to close it. */
const DismissContext = createContext<(() => void) | null>(null);
/** Set by the sheet: lets Escape ask the stack to go up one level before the sheet closes. */
const EscapeContext = createContext<((handler: (() => boolean) | null) => void) | null>(null);

function useStack(): Stack {
  const stack = useContext(StackContext);
  if (!stack) throw new Error("A drill-down part must sit inside a DrilldownStack.");
  return stack;
}

export interface DrilldownStackProps extends ComponentProps<"div"> {
  /** The id of the panel to show first. Left out, the root list. */
  defaultPanel?: string;
}

/**
 * The stack of panels: the state of which one is on screen, and the keys that
 * move through it. Escape goes up one level, Up, Down, Home and End move
 * between the rows of the panel on screen. Focus follows the visitor: it moves
 * to the first row of a panel that opens, and back to the row that opened it
 * when they return.
 */
export function DrilldownStack({ defaultPanel, className, children, onKeyDown, ...props }: DrilldownStackProps) {
  const baseId = useId();
  const registerEscape = useContext(EscapeContext);
  const [trail, setTrail] = useState<readonly string[]>(defaultPanel && defaultPanel !== ROOT_PANEL ? [ROOT_PANEL, defaultPanel] : [ROOT_PANEL]);
  // The trail as last committed, for the key handlers, which must not wait for a render.
  const shown = useRef(trail);
  const panels = useRef(new Map<string, HTMLElement>());
  const openers = useRef(new Map<string, HTMLElement>());

  const push = useCallback((id: string) => setTrail((before) => (before.at(-1) === id ? before : [...before, id])), []);
  const pop = useCallback(() => setTrail((before) => (before.length > 1 ? before.slice(0, -1) : before)), []);

  // Focus follows what the visitor did. A first render, which changes nothing, moves nothing. The panel is still sliding when it gets
  // focus, so the focus must not scroll: a browser would scroll the clipped stack sideways to reach it and leave the wrong panel in view.
  useEffect(() => {
    const before = shown.current;
    shown.current = trail;
    if (before === trail) return;
    if (trail.length > before.length) panels.current.get(trail.at(-1) ?? "")?.querySelector<HTMLElement>("[data-drill-item]")?.focus({ preventScroll: true });
    else openers.current.get(before.at(-1) ?? "")?.focus({ preventScroll: true });
  }, [trail]);

  useEffect(() => {
    if (!registerEscape) return;
    registerEscape(() => {
      if (shown.current.length < 2) return false;
      pop();
      return true;
    });
    return () => registerEscape(null);
  }, [registerEscape, pop]);

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    // A sheet has already had its Escape by now: it either went up a level or closed, and says so by preventing the default.
    if (event.defaultPrevented) return;
    if (event.key === "Escape" && shown.current.length > 1) {
      event.preventDefault();
      event.stopPropagation();
      pop();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
    const panel = panels.current.get(shown.current.at(-1) ?? "");
    const rows = panel ? Array.from(panel.querySelectorAll<HTMLElement>("[data-drill-item], [data-drill-back]")) : [];
    const index = rows.indexOf(document.activeElement as HTMLElement);
    if (index === -1) return;
    event.preventDefault();
    const last = rows.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? last : Math.min(last, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)));
    rows[next]?.focus();
  }

  return (
    <StackContext.Provider value={{ baseId, trail, push, pop, panels, openers }}>
      <div data-slot="drilldown-stack" className={cn("relative overflow-clip", className)} onKeyDown={handleKeys} {...props}>
        {children}
      </div>
    </StackContext.Provider>
  );
}

export interface DrilldownPanelProps extends Omit<ComponentProps<"div">, "id"> {
  /** The id of the panel: the root's for the list of groups, a group's own for its links. */
  id: string;
  /** The name a screen reader gives the panel. */
  label: string;
}

/**
 * One panel of the stack. All of them stay in the page; the one on screen sits
 * at rest, the ones the visitor has passed are nudged left behind it and the
 * rest wait off the right edge, and every panel that is not on screen is inert,
 * so its links are neither tabbable nor read out. Under reduced motion the
 * panels change place without sliding.
 */
export function DrilldownPanel({ id, label, className, children, ...props }: DrilldownPanelProps) {
  const stack = useStack();
  const { panels } = stack;
  const position = stack.trail.indexOf(id);
  const state = position === -1 ? "ahead" : position === stack.trail.length - 1 ? "active" : "behind";
  const register = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      panels.current.set(id, node);
      return () => {
        panels.current.delete(id);
      };
    },
    [id, panels],
  );

  return (
    <div
      ref={register}
      id={`${stack.baseId}-${id}`}
      role="group"
      aria-label={label}
      data-slot="drilldown-panel"
      data-state={state}
      inert={state !== "active"}
      className={cn(
        "absolute inset-0 flex flex-col bg-background transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none",
        state === "active" && "translate-x-0",
        state === "behind" && "-translate-x-1/4",
        state === "ahead" && "translate-x-full",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DrilldownOpenProps extends Omit<ComponentProps<"button">, "type" | "onClick"> {
  /** The id of the panel this row opens. */
  target: string;
}

/** A row of the root list that opens a group's panel. A button, because it does not leave the page. */
export function DrilldownOpen({ target, className, children, ...props }: DrilldownOpenProps) {
  const stack = useStack();
  const { openers } = stack;
  const register = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node) return;
      openers.current.set(target, node);
      return () => {
        openers.current.delete(target);
      };
    },
    [target, openers],
  );

  return (
    <button
      ref={register}
      type="button"
      data-drill-item=""
      aria-expanded={stack.trail.includes(target)}
      aria-controls={`${stack.baseId}-${target}`}
      onClick={() => stack.push(target)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

/** The Back row of a group's panel: goes up one level. */
export function DrilldownBack({ className, children, ...props }: Omit<ComponentProps<"button">, "type" | "onClick">) {
  const stack = useStack();
  return (
    <button type="button" data-drill-back="" onClick={stack.pop} className={className} {...props}>
      {children}
    </button>
  );
}

/**
 * Wraps one link, rendered on the server with your router's Link: it joins the
 * rows the arrow keys move between, and closes the sheet around it when the
 * visitor follows it. Outside a sheet it does nothing more.
 */
export function DrilldownLeaf({ children }: { children: ReactNode }) {
  const dismiss = useContext(DismissContext);
  return (
    <Slot.Root data-drill-item="" onClick={() => dismiss?.()}>
      {children}
    </Slot.Root>
  );
}

export interface DrilldownSheetProps {
  /** The element that opens the sheet: a button. */
  trigger: ReactNode;
  /** The title of the sheet, for a screen reader. */
  title: string;
  /** What the sheet is for, for a screen reader. */
  description: string;
  /** The edge it slides in from. */
  side?: "left" | "right";
  /** Open or closed, when you control it. Pair with onOpenChange. */
  open?: boolean;
  /** Whether the sheet starts open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called when the sheet opens or closes, by the visitor or because a link was followed. */
  onOpenChange?: (open: boolean) => void;
  /** Classes for the sheet. */
  className?: string;
  /** The menu: a DrilldownStack and whatever frames it. */
  children: ReactNode;
}

/**
 * The sheet around the menu. Escape goes up a level first and only closes the
 * sheet from the root, and every panel starts over at the root the next time it
 * opens, because the stack lives inside the sheet's content. Under reduced
 * motion the sheet itself appears and goes without sliding, like its panels.
 */
export function DrilldownSheet({ trigger, title, description, side = "left", open, defaultOpen = false, onOpenChange, className, children }: DrilldownSheetProps) {
  const [own, setOwn] = useState(defaultOpen);
  const escape = useRef<(() => boolean) | null>(null);
  const register = useCallback((handler: (() => boolean) | null) => {
    escape.current = handler;
  }, []);
  const isOpen = open ?? own;
  const change = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  };

  return (
    <EscapeContext.Provider value={register}>
      <DismissContext.Provider value={() => change(false)}>
        <Sheet open={isOpen} onOpenChange={change}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent
            side={side}
            showCloseButton={false}
            data-slot="mobile-nav-drilldown"
            onEscapeKeyDown={(event) => {
              if (escape.current?.()) event.preventDefault();
            }}
            className={cn("w-[min(24rem,88vw)] gap-0 p-0 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none", className)}
          >
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
            {children}
          </SheetContent>
        </Sheet>
      </DismissContext.Provider>
    </EscapeContext.Provider>
  );
}
