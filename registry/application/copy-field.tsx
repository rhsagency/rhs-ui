"use client";
import { useEffect, useRef, useState } from "react";
import { IconCopyAnimated } from "@rhs-ui/icons/animated/copy";
import { cn } from "@/lib/utils";
export function CopyField({ value, label = "Copy value", className }: { value: string; label?: string; className?: string }): React.JSX.Element {
  const [status,setStatus] = useState<"idle"|"copied"|"error">("idle"); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  const copy = async (): Promise<void> => { if(timer.current)clearTimeout(timer.current); try { await navigator.clipboard.writeText(value); setStatus("copied"); if(timer.current)clearTimeout(timer.current); timer.current=setTimeout(()=>setStatus("idle"),1800); } catch { setStatus("error"); } };
  return <div data-slot="copy-field" className={cn("w-full",className)}><div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2 pl-4"><code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-2 text-sm" tabIndex={0}>{value}</code><button type="button" aria-label={label} onClick={()=>void copy()} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><IconCopyAnimated active={status==="copied"} size={16}/>{status==="copied"?"Copied":"Copy"}</button></div><p role="status" className="mt-2 min-h-4 text-xs text-muted-foreground">{status==="error"?"Could not copy. Select the value and copy it manually.":status==="copied"?"Copied to clipboard.":""}</p></div>;
}
