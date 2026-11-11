"use client";

import { isValidElement, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactElement } from "react";
import { Slot, Tooltip as TooltipPrimitive } from "radix-ui";

import { IconInfo } from "@rhs-ui/icons";
import { Tooltip, TooltipContent, TooltipProvider } from "@rhs-ui/primitives/tooltip";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export interface DisabledReasonProps {
  /** Whether the control is unavailable. Do not also set `disabled` on the control: that is what this replaces. Default false. */
  disabled?: boolean;
  /** Why it is unavailable, as a short sentence that says what to do: "Accept the terms to continue". */
  reason: string;
  /** The side of the control the tooltip opens on. Default "top". */
  placement?: "top" | "right" | "bottom" | "left";
  /** Print the reason under the control, as well as telling it in a tooltip: `true` always, "touch" only where the main pointer cannot hover (a phone or a tablet). With `true` there is no tooltip. Default false. */
  inline?: boolean | "touch";
  /** Start with the reason showing in its tooltip, for a preview or a tour. */
  defaultOpen?: boolean;
  /** The one control to make honest: a Button, a Switch, a Checkbox, an Input, or the trigger of a select or a menu (SelectTrigger). It must be a control that renders an element of its own: a composite root such as Select, which renders none, cannot be wrapped, so wrap its trigger. */
  children: ReactElement;
}

/** The keys that would activate a button; a refused control swallows them. */
const ACTIVATES = new Set(["Enter", " "]);

/** A trigger of a select, a menu or a combobox also opens on the arrow keys and answers a typed character (it jumps to an entry), and not only Enter and Space. */
const opensAList = (element: Element | null): boolean => {
  const popup = element?.getAttribute("aria-haspopup");
  return (popup !== null && popup !== undefined && popup !== "false") || element?.getAttribute("role") === "combobox";
};

/**
 * What a refused control shows besides the dimming: no dip on a press, and no change on hover. A Button only guards
 * `:disabled`, so what it does for a press and a hover is undone here (written out per variant, the way Button names them).
 */
const REFUSED_LOOK = [
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:translate-y-0!",
  "aria-disabled:data-[variant=default]:hover:bg-primary! aria-disabled:data-[variant=destructive]:hover:bg-destructive! aria-disabled:data-[variant=secondary]:hover:bg-secondary!",
  "aria-disabled:data-[variant=outline]:hover:bg-background! aria-disabled:data-[variant=ghost]:hover:bg-transparent! aria-disabled:data-[variant=link]:hover:no-underline!",
].join(" ");

/**
 * Makes a disabled control honest. The native `disabled` attribute takes a control out of the tab order and
 * hides the reason from a keyboard and a screen reader user, who are left with a dimmed thing that does not
 * answer. This sets `aria-disabled` instead: the control stays in the tab order, is read as unavailable,
 * refuses the click, Enter and Space (and a text field cannot be typed in), and tells why in a tooltip on
 * hover and focus, a tap on it, and in its accessible description. A button does not dip on a press or change
 * on hover while it is refused. For a select or a menu, wrap its trigger (SelectTrigger), not its root: the
 * arrow keys and the typing that would open or change it are refused too. On a touch screen, where hover
 * does not exist, `inline` prints the reason under it. When `disabled` goes back to false nothing is left
 * behind: the control is exactly as you wrote it, and it keeps its focus, because it is never moved or replaced.
 */
export function DisabledReason({ disabled = false, reason, placement = "top", inline = false, defaultOpen = false, children }: DisabledReasonProps) {
  const id = useId();
  const reasonId = `${id}-reason`;
  const [open, setOpen] = useState(defaultOpen);
  const control = useRef<Element | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const own = isValidElement<{ "aria-describedby"?: string }>(children) ? children.props["aria-describedby"] : undefined;
  const active = disabled && reason !== "";

  // A text field is made read-only while it is refused, so nothing can be typed in it; its own setting comes back afterwards.
  useEffect(() => {
    const element = control.current;
    if (!disabled || !(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
    const was = element.readOnly;
    element.readOnly = true;
    return () => {
      element.readOnly = was;
    };
  }, [disabled]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // A child that renders no element of its own (a Select root, a Dialog), or does not pass the ref on, has nothing to refuse: say so while building, instead of failing silently.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !control.current) {
      console.warn("DisabledReason: its child gave no element to refuse (it renders none, or does not pass its ref on). Wrap the control that is pressed: SelectTrigger, not Select.");
    }
  }, []);

  // A control that is refused while it holds the keyboard focus gets no focus event to open the tooltip: it opens here, so the reason is there when it is needed.
  useEffect(() => {
    const element = control.current;
    if (disabled && element && element === document.activeElement && element.matches(":focus-visible")) setOpen(true);
  }, [disabled]);

  /** A tap or a click that was refused shows the reason, for a few seconds: on a touch screen it is the only way to ask. */
  function reveal() {
    setOpen(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 4000);
  }

  function refuse(event: MouseEvent | KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    reveal();
  }

  const refusing = disabled
    ? {
        "aria-disabled": true as const,
        "aria-describedby": [own, reason ? reasonId : null].filter(Boolean).join(" ") || undefined,
        // Capture phase: the refusal is made before the control's own handlers, and its own never run.
        onClickCapture: refuse,
        onKeyDownCapture: (event: KeyboardEvent) => {
          if (ACTIVATES.has(event.key)) refuse(event);
          // Those keys never reach it, and the page still scrolls. Any other control is left alone, so the keys and shortcuts of the page work from it.
          else if (opensAList(control.current) && (event.key === "ArrowUp" || event.key === "ArrowDown" || (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey))) event.stopPropagation();
        },
        // A control that opens on the press (a select, a menu) never sees it.
        onPointerDownCapture: (event: PointerEvent) => event.stopPropagation(),
        className: REFUSED_LOOK,
      }
    : {};

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip
          open={active && inline !== true && open}
          onOpenChange={(next) => {
            if (active) setOpen(next);
          }}
        >
          {/* The trigger is Radix's own, not the house wrapper: that one stamps a data-slot onto its child, and the control must keep its own. data-state is cleared too, so an enabled control carries nothing of ours. */}
          <TooltipPrimitive.Trigger {...AS_CHILD} data-state={undefined}>
            <Slot.Root
              ref={(node: Element | null) => {
                control.current = node;
              }}
              {...refusing}
            >
              {children}
            </Slot.Root>
          </TooltipPrimitive.Trigger>
          {active && inline !== true ? (
            // The tooltip never grows past the room there is beside the control, so on a narrow screen the sentence wraps and does not leave the screen.
            <TooltipContent side={placement} collisionPadding={8} className="max-w-[min(20rem,var(--radix-tooltip-content-available-width))]">
              {reason}
            </TooltipContent>
          ) : null}
        </Tooltip>
      </TooltipProvider>
      {active ? (
        inline ? (
          <p
            id={reasonId}
            data-slot="disabled-reason"
            className={cn("mt-1.5 items-start gap-1.5 text-xs leading-5 text-muted-foreground", inline === "touch" ? "hidden pointer-coarse:flex" : "flex")}
          >
            <IconInfo aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {reason}
          </p>
        ) : (
          <span id={reasonId} data-slot="disabled-reason" className="sr-only">
            {reason}
          </span>
        )
      ) : null}
    </>
  );
}
