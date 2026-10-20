"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { IconClose, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface SpeedDialAction {
  /** A stable key for the action. */
  id: string;
  /** What it does. It is written out beside its button, because a dial of bare icons fails on touch. */
  label: string;
  /** The icon, as an element: `<IconShare />`. */
  icon: ReactNode;
  /** Runs when the action is chosen. The dial closes first and focus is back on the trigger. */
  onSelect?: () => void;
  /** Dims the action: it can be reached by keyboard but does nothing. */
  disabled?: boolean;
}

export interface SpeedDialProps {
  /** Three to five actions; with `direction="left"` on a phone, two or three. The first is the one nearest the trigger. */
  actions: readonly SpeedDialAction[];
  /** The trigger's icon while closed. Default a plus. */
  icon?: ReactNode;
  /** The trigger's icon while open; the trigger turns into it. Default a cross. */
  openIcon?: ReactNode;
  /** Which way the actions fan out from the trigger. `left` hangs each label above its button, so it needs short labels and about 260px of width for three actions. Default "up". */
  direction?: "up" | "left";
  /** The corner, or the middle of the bottom edge. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  /** The name of the trigger and of the menu: "Quick actions". It is also the trigger's tooltip while closed. */
  label?: string;
  /** A faint veil over the page while open; a tap on it closes the dial. Default true. */
  backdrop?: boolean;
  /** Open, when you control it. */
  open?: boolean;
  /** Start open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the dial opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Extra distance from the bottom edge in pixels, to clear a bottom navigation. The safe area is added on top. */
  offset?: number;
  /** On the layer that covers the viewport. Pass `absolute` to pin the dial inside a positioned container instead of the page. */
  className?: string;
}

const GROUP_POSITION = {
  "bottom-right": { right: "max(1.25rem, env(safe-area-inset-right, 0px))" },
  "bottom-left": { left: "max(1.25rem, env(safe-area-inset-left, 0px))" },
  "bottom-center": { left: "50%", translate: "-50% 0" },
} as const;

// A label sits on the side of the button that has room: left of a right-hand dial, right of the others.
const LABEL_SIDE = { "bottom-right": "right-full mr-3", "bottom-left": "left-full ml-3", "bottom-center": "left-full ml-3" } as const;

const swap = "col-start-1 row-start-1 grid place-items-center transition-[opacity,rotate,scale] duration-200 ease-out motion-reduce:transition-none";

/**
 * A floating action that fans out a few related actions when pressed, each
 * with its label written beside it. The trigger is a menu button
 * (`aria-haspopup`, `aria-expanded`) and the actions are menu items: the arrow
 * keys move between them, Home and End jump to the nearest and the farthest,
 * typing a letter finds one, Escape closes and returns focus to the trigger,
 * and choosing an action closes the dial. A tap outside, or on the veil,
 * closes it too. The stagger is a short CSS delay that disappears under
 * reduced motion.
 */
export function SpeedDial({
  actions,
  icon = <IconPlus />,
  openIcon = <IconClose />,
  direction = "up",
  position = "bottom-right",
  label = "Quick actions",
  backdrop = true,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  offset = 0,
  className,
}: SpeedDialProps) {
  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  const menuId = useId();
  const group = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const arrival = useRef<"first" | null>(null);
  // True from a press inside the dial until it ends. Safari does not focus a button that is clicked, so focus can leave the dial in the middle of a click on one of its own actions.
  const pressing = useRef(false);
  const horizontal = direction === "left";

  const setOpen = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    if (next !== open) onOpenChange?.(next);
  };

  // Arrow keys mean "away from the trigger" and "back toward it", whichever way the dial fans out.
  const away = horizontal ? ["ArrowLeft", "ArrowUp"] : ["ArrowUp"];
  const back = horizontal ? ["ArrowRight", "ArrowDown"] : ["ArrowDown"];

  const focusItem = (rank: number) => {
    const count = actions.length;
    if (!count) return;
    items.current[((rank % count) + count) % count]?.focus();
  };

  // Opening from the keyboard lands on the nearest action; opening with a pointer leaves focus on the trigger.
  useEffect(() => {
    if (open && arrival.current === "first") focusItem(0);
    arrival.current = null;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    pressing.current = false;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !group.current?.contains(event.target)) setOpen(false);
    };
    const endPress = () => {
      pressing.current = false;
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (group.current?.contains(document.activeElement)) trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", endPress);
    document.addEventListener("pointercancel", endPress);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", endPress);
      document.removeEventListener("pointercancel", endPress);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (action: SpeedDialAction) => {
    if (action.disabled) return;
    setOpen(false);
    // Focus goes back first, so a dialog that the action opens can take it from here.
    trigger.current?.focus();
    action.onSelect?.();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = items.current.findIndex((item) => item === document.activeElement);
    if (away.includes(event.key)) focusItem(current + 1);
    else if (back.includes(event.key)) focusItem(current - 1);
    else if (event.key === "Home") focusItem(0);
    else if (event.key === "End") focusItem(actions.length - 1);
    else if (event.key.length === 1 && /\S/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Typing a letter finds the next action that starts with it.
      const letter = event.key.toLowerCase();
      for (let step = 1; step <= actions.length; step += 1) {
        const rank = (current + step) % actions.length;
        if (actions[rank]?.label.toLowerCase().startsWith(letter)) {
          focusItem(rank);
          break;
        }
      }
    } else return;
    event.preventDefault();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (away.includes(event.key) || back.includes(event.key)) {
      event.preventDefault();
      if (open) focusItem(0);
      else {
        arrival.current = "first";
        setOpen(true);
      }
    } else if (open && event.key === "End") {
      event.preventDefault();
      focusItem(actions.length - 1);
    }
  };

  // The DOM reads the way the screen does: the farthest action first, the one beside the trigger last.
  const shown = actions.map((action, rank) => ({ action, rank })).reverse();
  const count = actions.length;

  const button = (
    <Button
      ref={trigger}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      aria-label={label}
      className="relative size-14 rounded-full p-0 shadow-sm ring-[5px] ring-background [&_svg:not([class*='size-'])]:size-6"
      onClick={(event) => {
        if (!open && event.detail === 0) arrival.current = "first";
        setOpen(!open);
      }}
      onKeyDown={onTriggerKeyDown}
    >
      <span className="grid size-6 place-items-center">
        <span aria-hidden="true" className={cn(swap, open ? "scale-50 rotate-90 opacity-0" : "opacity-100")}>
          {icon}
        </span>
        <span aria-hidden="true" className={cn(swap, open ? "opacity-100" : "scale-50 -rotate-90 opacity-0")}>
          {openIcon}
        </span>
      </span>
    </Button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div data-slot="speed-dial" data-state={open ? "open" : "closed"} data-direction={direction} className={cn("pointer-events-none fixed inset-0 z-40", className)}>
        {backdrop ? (
          <div
            aria-hidden="true"
            className={cn("absolute inset-0 bg-background/85 transition-opacity duration-200 motion-reduce:transition-none", open ? "pointer-events-auto opacity-100" : "opacity-0")}
          />
        ) : null}
        <div
          ref={group}
          className="pointer-events-auto absolute flex flex-col items-center"
          style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${offset}px + 1.25rem)`, ...GROUP_POSITION[position] }}
          onPointerDownCapture={() => {
            pressing.current = true;
          }}
          onBlur={(event) => {
            if (open && !pressing.current && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            {open ? null : (
              <TooltipContent side={position === "bottom-left" ? "right" : position === "bottom-center" ? "top" : "left"} sideOffset={12}>
                {label}
              </TooltipContent>
            )}
          </Tooltip>
          <div
            id={menuId}
            role="menu"
            aria-label={label}
            aria-orientation={horizontal ? "horizontal" : "vertical"}
            inert={!open}
            aria-hidden={open ? undefined : true}
            onKeyDown={onMenuKeyDown}
            className={cn(
              "absolute flex",
              // Sideways the labels sit above their buttons, so the buttons are spaced by more than a label is wide and no two labels meet.
              horizontal ? "right-full bottom-2 mr-4 flex-row items-end gap-6" : "bottom-full left-1/2 mb-3 -translate-x-1/2 flex-col items-center gap-3",
            )}
          >
            {shown.map(({ action, rank }) => {
              // The action nearest the trigger arrives first, and leaves last.
              const delay = open ? rank * 40 : (count - 1 - rank) * 25;
              return (
                <button
                  key={action.id}
                  ref={(element) => {
                    items.current[rank] = element;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={action.disabled || undefined}
                  onClick={() => choose(action)}
                  style={{ "--dial-delay": `${delay}ms` } as CSSProperties}
                  className={cn(
                    "group/dial-item relative block size-10 touch-manipulation outline-none [transition-delay:var(--dial-delay)]",
                    "transition-[opacity,translate,scale] duration-200 ease-out motion-reduce:transition-none motion-reduce:[transition-delay:0ms]",
                    open ? "translate-0 scale-100 opacity-100" : cn("scale-75 opacity-0", horizontal ? "translate-x-4" : "translate-y-4"),
                  )}
                >
                  <span
                    className={cn(
                      "absolute w-max rounded-md border border-border bg-card px-2.5 py-1.5 text-[0.8125rem] leading-none font-medium whitespace-nowrap text-card-foreground shadow-xs",
                      "transition-[background-color,box-shadow] duration-150 group-hover/dial-item:bg-muted group-focus-visible/dial-item:ring-[3px] group-focus-visible/dial-item:ring-ring/40 group-aria-disabled/dial-item:opacity-50",
                      // Every button is the same size box, so the buttons are evenly spaced whatever their labels say; the label hangs off it.
                      horizontal ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : cn("top-1/2 -translate-y-1/2", LABEL_SIDE[position]),
                    )}
                  >
                    {action.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-card-foreground shadow-xs [&_svg]:size-[1.125rem]",
                      "transition-[background-color,box-shadow] duration-150 group-hover/dial-item:bg-muted group-focus-visible/dial-item:ring-[3px] group-focus-visible/dial-item:ring-ring/40 group-aria-disabled/dial-item:opacity-50",
                    )}
                  >
                    {action.icon}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
