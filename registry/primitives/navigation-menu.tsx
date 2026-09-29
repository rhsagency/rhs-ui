import type { ComponentProps } from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";

import { IconChevronDown } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/**
 * Site navigation with panels: triggers open on hover and on Enter, arrow
 * keys move between the items, Escape closes and focus stays on the trigger.
 * Panels render in one shared viewport that resizes between them. Set
 * `viewport={false}` and place <NavigationMenuViewport> yourself when the
 * panel needs to sit somewhere else, like under a full-width header.
 */
export function NavigationMenu({ className, children, viewport = true, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Root> & { viewport?: boolean }) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn("group/navigation-menu relative flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    >
      {children}
      {viewport ? (
        <div className="absolute top-full left-0 isolate z-50 flex justify-center">
          <NavigationMenuViewport />
        </div>
      ) : null}
    </NavigationMenuPrimitive.Root>
  );
}

export function NavigationMenuList({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

export function NavigationMenuItem({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" className={cn("relative", className)} {...props} />;
}

/** The look of a trigger, for a plain link that sits in the same row. */
export const navigationMenuTriggerStyle = cn(
  "group inline-flex h-9 w-max items-center justify-center gap-1 rounded-md px-3 text-sm font-medium text-foreground",
  "transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "data-[state=open]:bg-muted data-[active]:bg-muted disabled:pointer-events-none disabled:opacity-50",
);

export function NavigationMenuTrigger({ className, children, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger data-slot="navigation-menu-trigger" className={cn(navigationMenuTriggerStyle, className)} {...props}>
      {children}
      <IconChevronDown size={14} aria-hidden="true" className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
    </NavigationMenuPrimitive.Trigger>
  );
}

export function NavigationMenuContent({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "top-0 left-0 w-full p-2 md:absolute md:w-auto",
        "data-[motion^=from-]:animate-rhs-fade-in data-[motion^=to-]:animate-rhs-fade-out",
        className,
      )}
      {...props}
    />
  );
}

/** The panel surface. NavigationMenu places it under the list; with viewport={false}, position its parent yourself. */
export function NavigationMenuViewport({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <NavigationMenuPrimitive.Viewport
      data-slot="navigation-menu-viewport"
      className={cn(
        "relative mt-2 h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
        "transition-[width,height] duration-200 md:w-(--radix-navigation-menu-viewport-width) motion-reduce:transition-none",
        "data-[state=open]:animate-rhs-in data-[state=closed]:animate-rhs-out",
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuLink({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex flex-col gap-1 rounded-md p-2.5 text-sm transition-colors duration-150 outline-none",
        "hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[active]:bg-muted",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuIndicator({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn("top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-rhs-fade-in data-[state=hidden]:animate-rhs-fade-out", className)}
      {...props}
    >
      <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}
