"use client";

import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Tabs with arrow-key navigation and automatic activation. Two looks: `line`
 * (an underline, for page sections and code panels) and `pill` (a segmented
 * control, for small toggles like light/dark or monthly/yearly).
 */
export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-3", className)} {...props} />;
}

const tabsListVariants = cva("inline-flex w-fit items-center", {
  variants: {
    variant: {
      line: "gap-4 border-b border-border",
      pill: "h-9 gap-0.5 rounded-lg bg-muted p-0.5",
    },
  },
  defaultVariants: { variant: "line" },
});

export interface TabsListProps extends ComponentProps<typeof TabsPrimitive.List>, VariantProps<typeof tabsListVariants> {}

export function TabsList({ className, variant = "line", ...props }: TabsListProps) {
  return <TabsPrimitive.List data-slot="tabs-list" data-variant={variant} className={cn(tabsListVariants({ variant }), className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground",
        "transition-[color,background-color,box-shadow] duration-150 outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // line
        "group-data-[variant=line]/list:-mb-px group-data-[variant=line]/list:border-b-2 group-data-[variant=line]/list:border-transparent group-data-[variant=line]/list:pb-2.5 group-data-[variant=line]/list:data-[state=active]:border-primary group-data-[variant=line]/list:data-[state=active]:text-foreground group-data-[variant=line]/list:hover:text-foreground",
        // pill
        "group-data-[variant=pill]/list:h-8 group-data-[variant=pill]/list:rounded-md group-data-[variant=pill]/list:px-3 group-data-[variant=pill]/list:data-[state=active]:bg-background group-data-[variant=pill]/list:data-[state=active]:text-foreground group-data-[variant=pill]/list:data-[state=active]:shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none", className)} {...props} />;
}

export { tabsListVariants };
