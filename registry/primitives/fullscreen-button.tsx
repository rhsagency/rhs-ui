"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import { IconMaximize, IconMinimize } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface FullscreenButtonProps extends Omit<ComponentProps<"button">, "onClick" | "onChange" | "children" | "title" | "aria-label"> {
  /** The element to expand, as a ref. Defaults to the nearest ancestor marked `data-fullscreen-root`, then the whole page. Keep the button inside it, or the way out is only Escape. */
  target?: RefObject<HTMLElement | null>;
  /** The words for each state. */
  labels?: { enter?: string; exit?: string };
  /** Called with the real state whenever it changes, including when someone leaves with Escape. */
  onChange?: (isFullscreen: boolean) => void;
  /** Any Button variant. */
  variant?: ButtonProps["variant"];
  /** The height: 32, 36 or 44px. With `iconOnly` it is the width too. */
  size?: "sm" | "default" | "lg";
  /** Only the icon, with the label in a tooltip. */
  iconOnly?: boolean;
  /** Where the browser cannot expand an element (iPhone Safari), cover the viewport with a fixed layer and lock page scroll instead. Without it the button renders nothing there. */
  fallback?: boolean;
}

const LAYER = "data-rhs-fullscreen";
const LAYER_CSS = `[${LAYER}]{position:fixed!important;inset:0!important;z-index:2147483000!important;width:auto!important;height:auto!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;margin:0!important;border-radius:0!important;overflow:auto!important;box-sizing:border-box!important;background:var(--background,#fff)}`;
const iconSizes = { sm: "icon-sm", default: "icon", lg: "icon" } as const;

const nativeFullscreen = () => document.fullscreenEnabled === true && typeof document.documentElement.requestFullscreen === "function";

/**
 * A toggle for fullscreen on any element. It asks the browser's Fullscreen API
 * for the element and listens to the real `fullscreenchange` event, so the
 * icon and the label stay right when someone leaves with Escape, and focus
 * returns to the button. With words on it the accessible name is the visible
 * label, which changes with the state; the icon-only button keeps one name and
 * reports the state with `aria-pressed`. iPhone Safari cannot expand an
 * element, so there the button renders nothing, unless `fallback` switches to
 * a fixed layer that covers the viewport and locks page scroll.
 */
export function FullscreenButton({ target, labels, onChange, variant = "outline", size, iconOnly = false, fallback = false, className, ...props }: FullscreenButtonProps) {
  const text = { enter: "Fullscreen", exit: "Exit fullscreen", ...labels };
  const button = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(true);
  const layer = useRef<{ root: HTMLElement; scroll: string } | null>(null);
  const last = useRef(false);
  const notify = useRef(onChange);
  useEffect(() => {
    notify.current = onChange;
  });

  const rootOf = useCallback(() => target?.current ?? button.current?.closest<HTMLElement>("[data-fullscreen-root]") ?? document.documentElement, [target]);
  const report = useCallback((now: boolean) => {
    setActive(now);
    if (last.current === now) return;
    last.current = now;
    notify.current?.(now);
    if (!now) button.current?.focus({ preventScroll: true });
  }, []);
  const leaveLayer = useCallback(() => {
    const held = layer.current;
    if (!held) return;
    layer.current = null;
    held.root.removeAttribute(LAYER);
    document.documentElement.style.overflow = held.scroll;
    report(false);
  }, [report]);

  // The button only shows where something can happen. It is rendered first, so the server and the browser agree.
  useEffect(() => {
    setSupported(nativeFullscreen() || fallback);
  }, [fallback]);

  useEffect(() => {
    const sync = () => {
      if (layer.current) return;
      const element = document.fullscreenElement;
      report(element !== null && element === rootOf());
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leaveLayer();
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("keydown", onKey);
      leaveLayer();
    };
  }, [report, rootOf, leaveLayer]);

  async function toggle() {
    if (active) {
      if (layer.current) leaveLayer();
      else await document.exitFullscreen().catch(() => undefined);
      return;
    }
    const root = rootOf();
    if (nativeFullscreen() && typeof root.requestFullscreen === "function") {
      try {
        await root.requestFullscreen();
        return;
      } catch {
        /* Refused, for example inside a frame that does not allow it: use the layer if there is one. */
      }
    }
    if (!fallback) return;
    if (!document.querySelector("style[data-rhs-fullscreen-style]")) {
      const sheet = document.createElement("style");
      sheet.setAttribute("data-rhs-fullscreen-style", "");
      sheet.textContent = LAYER_CSS;
      document.head.append(sheet);
    }
    root.setAttribute(LAYER, "");
    layer.current = { root, scroll: document.documentElement.style.overflow };
    document.documentElement.style.overflow = "hidden";
    report(true);
  }

  if (!supported) return null;
  const label = active ? text.exit : text.enter;
  const control = (
    <Button
      ref={button}
      data-slot="fullscreen-button"
      type="button"
      variant={variant}
      size={iconOnly ? iconSizes[size ?? "default"] : size}
      // An icon-only toggle keeps one name and reports its state. With words on it the name is those words ("Fullscreen", then "Exit fullscreen"), so what is said and what is read always match, and it is not also pressed.
      {...(iconOnly ? { "aria-pressed": active, "aria-label": text.enter } : {})}
      onClick={() => void toggle()}
      className={cn(iconOnly && size === "lg" && "size-11", className)}
      {...props}
    >
      {active ? <IconMinimize /> : <IconMaximize />}
      {iconOnly ? null : label}
    </Button>
  );
  return iconOnly ? (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    control
  );
}
