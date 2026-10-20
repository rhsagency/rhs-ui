"use client";

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<ComponentProps<"button">, "children" | "aria-label" | "aria-labelledby" | "title"> {
  /** The icon, as an element: `<IconTrash />`. It is drawn at the size that fits the button. */
  icon: ReactNode;
  /** What the button does. It is the accessible name and the tooltip text, so it is required: an unlabelled icon button does not compile. */
  label: string;
  /** Keys shown beside the label in the tooltip: `["⌘", "K"]`, or `"Ctrl K"` split on spaces. Display only; bind the key yourself. */
  shortcut?: string | readonly string[];
  /** Makes it a toggle: `aria-pressed`, and a filled surface while true, so the state never depends on colour. */
  pressed?: boolean;
  /** Swaps the icon for a spinner and ignores presses, without changing the width. Focus stays on the button. */
  loading?: boolean;
  /** A count (hidden at 0, shown as 99+ above 99) or `true` for a dot on the corner. It can appear and disappear while the button has focus, and it joins the accessible name. */
  badge?: number | boolean;
  /** What the badge counts, said by screen readers after the number: "unread messages". */
  badgeLabel?: string;
  /** The drawing: 28, 32 or 40px. On a touch screen the target is 44px at every size. */
  size?: "sm" | "md" | "lg";
  /** The look. A ghost button is quiet in a toolbar; a toggle works in every variant. */
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  /** Which side of the button the tooltip opens on. */
  side?: "top" | "right" | "bottom" | "left";
  /** Take over the tooltip's open state, for example to show it open in a preview or to introduce a new button. */
  tooltip?: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };
}

/*
 * The drawing stays compact (28, 32 or 40px). On a touch screen a pseudo-element reaches 44px
 * around the centre, whatever the size. With a mouse it is left off: in a toolbar the 44px box
 * of one button would cover the edge of its neighbour and take its clicks.
 */
const sizes = {
  sm: { size: "icon-sm", className: "size-7 [&_svg:not([class*='size-'])]:size-3.5" },
  md: { size: "icon-sm", className: "[&_svg:not([class*='size-'])]:size-4" },
  lg: { size: "icon", className: "size-10 [&_svg:not([class*='size-'])]:size-[1.125rem]" },
} as const;

// Inside a Button Group that has a size, the button takes the height of its neighbours, so the joined bar stays level.
const inGroup = "group-data-[size=sm]/button-group:size-8 group-data-[size=default]/button-group:size-9 group-data-[size=lg]/button-group:size-11";

const touchTarget =
  "[@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:top-1/2 [@media(pointer:coarse)]:after:left-1/2 [@media(pointer:coarse)]:after:size-[max(100%,2.75rem)] [@media(pointer:coarse)]:after:-translate-x-1/2 [@media(pointer:coarse)]:after:-translate-y-1/2 [@media(pointer:coarse)]:after:content-['']";

// A pressed button gets a filled surface (the Toggle's look), not just another colour. In forced-colours mode, where fills are dropped, it gets an outline.
const forcedPressed = "forced-colors:aria-pressed:outline-2 forced-colors:aria-pressed:-outline-offset-2 forced-colors:aria-pressed:outline-solid";
const pressedStyles = {
  ghost: "aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-foreground/90",
  secondary: "aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-foreground/90",
  outline: "aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:border-foreground aria-pressed:hover:bg-foreground/90",
  default: "aria-pressed:border-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:hover:bg-background",
  destructive: "aria-pressed:border-destructive aria-pressed:bg-background aria-pressed:text-destructive aria-pressed:hover:bg-background",
} as const;

const SharedTooltips = createContext(false);

/**
 * A button that is only an icon, but can never be unlabelled: `label` is
 * required, becomes the accessible name and the tooltip, and the tooltip can
 * show the shortcut as keys. The drawing stays compact while the touch target
 * grows to 44px on a touch screen. It can be a toggle (`pressed`), busy
 * (`loading`) and carry a count or a dot on its corner, which can appear while
 * the button has focus without taking it away. The tooltip opens on hover and
 * keyboard focus and is skipped on touch.
 */
export function IconButton({
  icon,
  label,
  shortcut,
  pressed,
  loading = false,
  badge,
  badgeLabel = "notifications",
  size = "md",
  variant = "ghost",
  side = "top",
  tooltip,
  className,
  onClick,
  ...props
}: IconButtonProps) {
  const shared = useContext(SharedTooltips);
  // A Button Group hands its own size down, and its words ("default") are not these.
  const fit = sizes[size] ?? sizes.md;
  const keys = typeof shortcut === "string" ? shortcut.split(/\s+/).filter(Boolean) : (shortcut ?? []);
  const count = typeof badge === "number" ? Math.max(0, Math.floor(badge)) : badge ? 1 : 0;
  const dot = badge === true;
  // The badge is part of the name, with the number as it is drawn: a screen reader hears "Inbox, 12 unread messages", and a voice command can name what is on screen.
  const shown = count > 99 ? "99+" : String(count);
  const name = count > 0 ? `${label}, ${dot ? `new ${badgeLabel}` : `${shown} ${badgeLabel}`}` : label;
  const tip = (
    <Tooltip {...tooltip}>
      <TooltipTrigger asChild>
        <Button
          data-slot="icon-button"
          type="button"
          variant={variant}
          size={fit.size}
          aria-label={name}
          aria-pressed={pressed}
          aria-busy={loading || undefined}
          aria-disabled={loading || undefined}
          // The tooltip repeats the name, so it only describes the button when it adds the shortcut.
          {...(keys.length ? {} : { "aria-describedby": undefined })}
          className={cn("relative", touchTarget, fit.className, inGroup, pressedStyles[variant], forcedPressed, className)}
          onClick={(event) => {
            if (loading) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          }}
          {...props}
        >
          {loading ? <Spinner label="" role="presentation" aria-hidden="true" /> : icon}
          {count > 0 ? (
            dot ? (
              <span aria-hidden="true" className="absolute -top-[3px] -right-[3px] size-2.5 rounded-full bg-destructive ring-2 ring-background" />
            ) : (
              <span
                aria-hidden="true"
                className="absolute -top-[7px] -right-[7px] inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums ring-2 ring-background"
              >
                {shown}
              </span>
            )
          ) : null}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={8} collisionPadding={8} aria-label={keys.length ? `Shortcut: ${keys.join(" ")}` : undefined} className={keys.length ? "flex items-center gap-2.5" : undefined}>
        {label}
        {keys.length ? (
          <KbdGroup>
            {keys.map((key, index) => (
              <Kbd key={`${key}-${index}`} className="h-[1.125rem] min-w-[1.125rem] border-transparent bg-background/20 text-background">
                {key}
              </Kbd>
            ))}
          </KbdGroup>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
  return shared ? tip : <TooltipProvider delayDuration={200}>{tip}</TooltipProvider>;
}

export interface IconButtonProviderProps {
  /** How long the pointer rests on a button before its tooltip opens, in milliseconds. */
  delayDuration?: number;
  /** The icon buttons that share the delay. */
  children: ReactNode;
}

/**
 * Shares one tooltip delay between the icon buttons inside it. The first
 * tooltip waits a moment; while the pointer moves along the row, the ones next
 * to it open at once, so a toolbar feels like one surface. Put it around a
 * toolbar, or once around the app. An icon button outside any provider brings
 * its own, so a lone button works without it.
 */
export function IconButtonProvider({ delayDuration = 200, children }: IconButtonProviderProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <SharedTooltips.Provider value>{children}</SharedTooltips.Provider>
    </TooltipProvider>
  );
}
