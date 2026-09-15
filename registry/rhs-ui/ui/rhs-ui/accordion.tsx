"use client";
import type { ComponentProps } from "react";
import { Accordion as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
export function Accordion(props:ComponentProps<typeof Primitive.Root>):React.JSX.Element { return <Primitive.Root data-slot="accordion" {...props} />; }
export function AccordionItem({className,...props}:ComponentProps<typeof Primitive.Item>):React.JSX.Element { return <Primitive.Item data-slot="accordion-item" className={cn("border-b border-border",className)} {...props} />; }
export function AccordionTrigger({className,children,...props}:ComponentProps<typeof Primitive.Trigger>):React.JSX.Element {
  return <Primitive.Header><Primitive.Trigger data-slot="accordion-trigger" className={cn("group flex w-full items-center justify-between gap-6 py-5 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50",className)} {...props}>{children}<span aria-hidden="true" className="text-xl font-normal transition-transform group-data-[state=open]:rotate-45 motion-reduce:transition-none">+</span></Primitive.Trigger></Primitive.Header>;
}
export function AccordionContent({className,children,...props}:ComponentProps<typeof Primitive.Content>):React.JSX.Element { return <Primitive.Content data-slot="accordion-content" className={cn("overflow-hidden text-sm leading-relaxed text-muted-foreground",className)} {...props}><div className="pb-5">{children}</div></Primitive.Content>; }
