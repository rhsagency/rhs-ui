"use client";

import type { ComponentProps, ReactNode } from "react";
import { Select as SelectPrimitive } from "radix-ui";

import { IconCheck, IconChevronDown, IconChevronUp } from "@rhs-ui/icons";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { panelSurface } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/**
 * A select on the field surface with a listbox of our own, never the
 * browser's menu: labelled groups, a check on the chosen option, a second
 * line per option, typeahead, Home and End, and Escape returns focus. It opens
 * under the field. With a `name`, Radix keeps a visually hidden, aria-hidden
 * native select in sync so FormData, autofill and form reset keep working;
 * nobody sees it or tabs to it.
 */
export function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

export function SelectGroup(props: ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectValue(props: ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

export interface SelectTriggerProps extends ComponentProps<typeof SelectPrimitive.Trigger> {
  size?: "sm" | "default";
}

export function SelectTrigger({ className, size = "default", children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        fieldSurface,
        "flex w-full min-w-0 items-center justify-between gap-2 px-3 text-left whitespace-nowrap",
        "data-[size=default]:h-9 data-[size=sm]:h-8 data-[size=sm]:text-[0.8125rem]",
        "data-[placeholder]:text-muted-foreground",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-muted-foreground">
        <IconChevronDown size={16} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, children, position = "popper", align = "start", sideOffset = 4, ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  const popper = position === "popper";
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        align={align}
        sideOffset={popper ? sideOffset : undefined}
        className={cn(
          panelSurface,
          "relative max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto",
          popper && "min-w-(--radix-select-trigger-width)",
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={cn("p-1", popper && "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2 pt-2 pb-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground", className)}
      {...props}
    />
  );
}

export interface SelectItemProps extends ComponentProps<typeof SelectPrimitive.Item> {
  /** A second line under the option. It stays in the list; the trigger shows the text only. */
  description?: ReactNode;
}

export function SelectItem({ className, children, description, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default flex-col items-start gap-0.5 rounded-md py-2 pr-8 pl-2 text-sm outline-none select-none",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="absolute top-2.5 right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <IconCheck size={14} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <span className="flex items-center gap-2">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </span>
      {description ? <span data-slot="select-item-description" className="text-xs text-muted-foreground">{description}</span> : null}
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function SelectScrollUpButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-muted-foreground", className)}
      {...props}
    >
      <IconChevronUp size={14} />
    </SelectPrimitive.ScrollUpButton>
  );
}

export function SelectScrollDownButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-muted-foreground", className)}
      {...props}
    >
      <IconChevronDown size={14} />
    </SelectPrimitive.ScrollDownButton>
  );
}
