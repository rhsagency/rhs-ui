"use client";

import { createContext, useContext, type ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { toggleVariants } from "@rhs-ui/primitives/toggle";
import { cn } from "@/lib/utils";

const ToggleGroupStyle = createContext<VariantProps<typeof toggleVariants>>({ variant: "outline", size: "default" });

/**
 * A row of toggles joined into one control: text alignment (one of them),
 * formatting (any of them). Arrow keys move between the items and Tab leaves
 * the group, like a toolbar. Give the group an aria-label.
 */
export function ToggleGroup({ className, variant = "outline", size = "default", children, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root data-slot="toggle-group" data-variant={variant} className={cn("inline-flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs", className)} {...props}>
      <ToggleGroupStyle.Provider value={{ variant, size }}>{children}</ToggleGroupStyle.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

export function ToggleGroupItem({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const style = useContext(ToggleGroupStyle);
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        toggleVariants(style),
        "rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus-visible:z-10",
        style.variant === "outline" && "border-l-0 first:border-l",
        className,
      )}
      {...props}
    />
  );
}
