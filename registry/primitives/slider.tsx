"use client";
import type { ComponentProps } from "react";
import { Slider as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
type Props = ComponentProps<typeof Primitive.Root> & { thumbLabels?: readonly string[] };
export function Slider({className,thumbLabels=["Value"],value,defaultValue=[50],...props}:Props):React.JSX.Element {
  return <Primitive.Root data-slot="slider" className={cn("relative flex h-6 w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-6 data-[orientation=vertical]:flex-col",className)} value={value} defaultValue={defaultValue} {...props}><Primitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted data-[orientation=vertical]:w-1.5"><Primitive.Range className="absolute h-full rounded-full bg-primary data-[orientation=vertical]:w-full" /></Primitive.Track>{(value??defaultValue).map((_,i)=><Primitive.Thumb key={i} aria-label={thumbLabels[i]??`Value ${i+1}`} className="block size-5 rounded-full border-2 border-primary bg-background shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" />)}</Primitive.Root>;
}
