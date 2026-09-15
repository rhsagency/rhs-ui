"use client";
import type { ComponentProps } from "react";
import { Switch as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
export function Switch({className,...props}:ComponentProps<typeof Primitive.Root>):React.JSX.Element {
  return <Primitive.Root data-slot="switch" className={cn("inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted p-0.5 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",className)} {...props}><Primitive.Thumb className="block size-[18px] rounded-full bg-foreground transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-foreground motion-reduce:transition-none" /></Primitive.Root>;
}
