"use client";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
export interface SegmentOption { value: string; label: string; disabled?: boolean }
export interface SegmentedControlProps { label: string; options: readonly SegmentOption[]; value: string; onValueChange: (value: string) => void; className?: string }
export function SegmentedControl({ label, options, value, onValueChange, className }: SegmentedControlProps): React.JSX.Element {
  const id = useId(); const root = useRef<HTMLDivElement>(null);
  return <div ref={root} data-slot="segmented-control" role="radiogroup" aria-label={label} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-muted p-1",className)} onKeyDown={(event) => {
    if (!["ArrowRight","ArrowLeft","ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
    event.preventDefault(); const enabled = options.filter(item=>!item.disabled); if (!enabled.length) return;
    const index = enabled.findIndex(item=>item.value===value);
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length-1 : (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
    const option = enabled[next]!; onValueChange(option.value); root.current?.querySelector<HTMLButtonElement>(`[data-index="${options.indexOf(option)}"]`)?.focus();
  }}>{options.map((option,index)=><button key={option.value} id={`${id}-${index}`} type="button" role="radio" data-index={index} aria-checked={option.value===value} disabled={option.disabled} tabIndex={option.value===value || (!options.some(item=>item.value===value&&!item.disabled) && index===options.findIndex(item=>!item.disabled)) ? 0 : -1} onClick={()=>onValueChange(option.value)} className={cn("whitespace-nowrap rounded-lg px-4 py-2 text-sm transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40 motion-reduce:transition-none",option.value===value?"bg-background text-foreground shadow-sm":"text-muted-foreground hover:text-foreground")}>{option.label}</button>)}</div>;
}
