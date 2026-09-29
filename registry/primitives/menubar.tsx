"use client";

import type { ComponentProps } from "react";
import { Menubar as MenubarPrimitive } from "radix-ui";

import { IconCheck, IconChevronRight } from "@rhs-ui/icons";
import { panelSurface } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/**
 * The row of menus a desktop app has along its top: File, Edit, View. Arrow
 * keys move between the menus and inside them, as in any native menu bar.
 * For a website's navigation use navigation-menu instead.
 */
export function Menubar({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Root>) {
  return <MenubarPrimitive.Root data-slot="menubar" className={cn("flex h-9 items-center gap-1 rounded-lg border border-border bg-background p-1", className)} {...props} />;
}

export function MenubarMenu(props: ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

export function MenubarGroup(props: ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
}

export function MenubarSub(props: ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

export function MenubarRadioGroup(props: ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />;
}

export function MenubarTrigger({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn("flex items-center rounded-md px-2.5 py-1 text-sm font-medium outline-none select-none data-[highlighted]:bg-muted data-[state=open]:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}
      {...props}
    />
  );
}

export function MenubarContent({ className, align = "start", alignOffset = -4, sideOffset = 8, ...props }: ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(panelSurface, "min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden p-1", className)}
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
}

const itemBase = cn(
  "relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none",
  "data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
);

export function MenubarItem({ className, inset, variant = "default", ...props }: ComponentProps<typeof MenubarPrimitive.Item> & { inset?: boolean; variant?: "default" | "destructive" }) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset || undefined}
      data-variant={variant}
      className={cn(itemBase, "data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:data-[highlighted]:bg-destructive/10", className)}
      {...props}
    />
  );
}

export function MenubarCheckboxItem({ className, children, ...props }: ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem data-slot="menubar-checkbox-item" className={cn(itemBase, "pl-8", className)} {...props}>
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <IconCheck size={14} className="text-foreground" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}

export function MenubarRadioItem({ className, children, ...props }: ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem data-slot="menubar-radio-item" className={cn(itemBase, "pl-8", className)} {...props}>
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <span className="block size-2 rounded-full bg-foreground" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
}

export function MenubarLabel({ className, inset, ...props }: ComponentProps<typeof MenubarPrimitive.Label> & { inset?: boolean }) {
  return <MenubarPrimitive.Label data-slot="menubar-label" data-inset={inset || undefined} className={cn("px-2 pt-2 pb-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground data-[inset]:pl-8", className)} {...props} />;
}

export function MenubarSeparator({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Separator>) {
  return <MenubarPrimitive.Separator data-slot="menubar-separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function MenubarShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="menubar-shortcut" className={cn("ml-auto pl-4 font-mono text-[0.6875rem] tracking-wide text-muted-foreground", className)} {...props} />;
}

export function MenubarSubTrigger({ className, inset, children, ...props }: ComponentProps<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <MenubarPrimitive.SubTrigger data-slot="menubar-sub-trigger" data-inset={inset || undefined} className={cn(itemBase, "data-[inset]:pl-8 data-[state=open]:bg-muted", className)} {...props}>
      {children}
      <IconChevronRight size={14} className="ml-auto" />
    </MenubarPrimitive.SubTrigger>
  );
}

export function MenubarSubContent({ className, ...props }: ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent data-slot="menubar-sub-content" className={cn(panelSurface, "min-w-[10rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden p-1", className)} {...props} />
    </MenubarPrimitive.Portal>
  );
}
