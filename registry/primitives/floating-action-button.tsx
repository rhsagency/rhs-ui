"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEventHandler, type ReactNode, type RefObject } from "react";

import { IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface FloatingActionButtonProps extends Omit<ComponentProps<"button">, "children" | "className" | "aria-label" | "type" | "onClick"> {
  /** The icon, as an element: `<IconEdit />`. Default a plus. */
  icon?: ReactNode;
  /** What the action does: "New message". It is the accessible name always, the visible text while extended, and the tooltip while collapsed. */
  label: string;
  /** Runs on press. Use `href` instead when the action is a place to go. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Makes it a link instead of a button. */
  href?: string;
  /** For a link: where it opens. */
  target?: string;
  /** For a link: the relationship, for example "noopener". */
  rel?: string;
  /** `"auto"` shows the label at the top of the page and while scrolling up, and shrinks to the icon while scrolling down. `true` keeps the label, `false` is always the icon. Default "auto". */
  extended?: boolean | "auto";
  /** The corner, or the middle of the bottom edge. Default "bottom-right". */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  /** Extra distance from the bottom edge in pixels, to clear a bottom navigation: `offset={64}`. The safe area is added on top. */
  offset?: number;
  /** The scrolling element to watch when the page itself is not what scrolls (a panel, a phone frame). Default the window. */
  scrollTarget?: RefObject<HTMLElement | null>;
  /** Hide it, for example while a dialog is open. It leaves the tab order and the accessibility tree too. Default true. */
  visible?: boolean;
  /** 44, 56 or 64px high. Default "md". */
  size?: "sm" | "md" | "lg";
  /** On the fixed layer that positions the button. Pass `absolute` to pin it inside a positioned container instead of the viewport. */
  className?: string;
  /** On the button itself. */
  buttonClassName?: string;
}

const ALIGN = { "bottom-right": "justify-end", "bottom-left": "justify-start", "bottom-center": "justify-center" } as const;
const TIP_SIDE = { "bottom-right": "left", "bottom-left": "right", "bottom-center": "top" } as const;

// The padding is half of what is left of the height once the icon is in, so a collapsed button is exactly a circle.
const SIZE = {
  sm: "h-11 px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-5",
  md: "h-14 px-4 text-[0.9375rem] [&_svg:not([class*='size-'])]:size-6",
  lg: "h-16 px-[1.125rem] text-base [&_svg:not([class*='size-'])]:size-7",
} as const;

/**
 * The one thing people come to a screen to do, pinned to a corner: New
 * message, Add expense. Extended it shows its label; scrolling down shrinks
 * it to the icon (a width transition, instant under reduced motion) and
 * scrolling up or reaching the top brings the label back. It keeps its label
 * as the accessible name when collapsed, explains itself in a tooltip then,
 * clears the safe area and any bottom navigation you give it room for, and
 * steps aside while the on-screen keyboard is up or when you set `visible`
 * to false. With `href` it is a real link; a disabled one is dimmed, leaves
 * the tab order and does not navigate.
 */
export function FloatingActionButton({
  icon = <IconPlus />,
  label,
  onClick,
  href,
  target,
  rel,
  extended = "auto",
  position = "bottom-right",
  offset = 0,
  scrollTarget,
  visible = true,
  size = "md",
  className,
  buttonClassName,
  disabled,
  ...props
}: FloatingActionButtonProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    if (extended !== "auto") return;
    const element = scrollTarget?.current ?? null;
    const read = () => (element ? element.scrollTop : window.scrollY);
    let previous = read();
    let travelled = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = read();
      const delta = y - previous;
      previous = y;
      if (y <= 16) {
        travelled = 0;
        setCollapsed(false);
        return;
      }
      if (delta === 0) return;
      // Turning around starts the count again, so a jittery scroll never flickers the label.
      travelled = Math.sign(delta) === Math.sign(travelled) ? travelled + delta : delta;
      if (travelled > 14) setCollapsed(true);
      else if (travelled < -14) setCollapsed(false);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const target: EventTarget = element ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [extended, scrollTarget]);

  // The on-screen keyboard shrinks the visual viewport and nothing else; a pinch zoom shrinks it too, so a zoomed page is not mistaken for it.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let base = window.innerHeight;
    let width = window.innerWidth;
    const check = () => {
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        base = window.innerHeight;
      }
      base = Math.max(base, window.innerHeight);
      setKeyboard(viewport.scale <= 1.05 && base - viewport.height > 150);
    };
    viewport.addEventListener("resize", check);
    return () => viewport.removeEventListener("resize", check);
  }, []);

  const hidden = !visible || keyboard;
  const showLabel = extended === true || (extended === "auto" && !collapsed);
  // No border: it would add two pixels to the width and turn the collapsed circle into an oval.
  const classes = cn("pointer-events-auto gap-0 rounded-full border-0 shadow-sm ring-[5px] ring-background", SIZE[size], buttonClassName);
  const content = (
    <>
      <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>
      <span aria-hidden="true" className={cn("grid transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none", showLabel ? "grid-cols-[1fr]" : "grid-cols-[0fr]")}>
        <span className="overflow-hidden">
          <span className={cn("block pl-2.5 whitespace-nowrap transition-opacity duration-200 motion-reduce:transition-none", showLabel ? "opacity-100" : "opacity-0")}>{label}</span>
        </span>
      </span>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div
        data-slot="floating-action-button"
        data-position={position}
        data-extended={showLabel}
        data-hidden={hidden || undefined}
        className={cn("pointer-events-none fixed inset-x-0 z-40 flex", ALIGN[position], className)}
        style={{
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${offset}px + 1.25rem)`,
          paddingInline: "max(1.25rem, env(safe-area-inset-left, 0px)) max(1.25rem, env(safe-area-inset-right, 0px))",
        }}
      >
        <div
          inert={hidden}
          aria-hidden={hidden || undefined}
          className={cn("pointer-events-auto transition-[opacity,translate,scale] duration-200 ease-out motion-reduce:transition-none", hidden && "pointer-events-none translate-y-3 scale-90 opacity-0")}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              {href ? (
                // A link has no disabled state of its own, so it is dimmed, taken out of the tab order and stopped on click.
                <Button asChild className={cn(classes, "aria-disabled:pointer-events-none aria-disabled:opacity-50")}>
                  <a
                    {...(props as ComponentProps<"a">)}
                    href={href}
                    target={target}
                    rel={rel}
                    aria-label={label}
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : (props as ComponentProps<"a">).tabIndex}
                    onClick={(event) => {
                      if (disabled) {
                        event.preventDefault();
                        return;
                      }
                      onClick?.(event);
                    }}
                  >
                    {content}
                  </a>
                </Button>
              ) : (
                <Button type="button" aria-label={label} disabled={disabled} className={classes} onClick={onClick} {...props}>
                  {content}
                </Button>
              )}
            </TooltipTrigger>
            {showLabel ? null : (
              <TooltipContent side={TIP_SIDE[position]} sideOffset={12}>
                {label}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
