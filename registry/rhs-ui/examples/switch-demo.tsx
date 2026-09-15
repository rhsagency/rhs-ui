"use client";
import {useState,useId} from "react";
import {Switch} from "@/registry/rhs-ui/ui/rhs-ui/switch";
export default function Demo():React.JSX.Element {const [enabled,setEnabled]=useState(true);const id=useId();return <div className="flex w-full max-w-sm items-center justify-between gap-8 rounded-xl border border-border p-6"><div><label htmlFor={id} className="text-sm font-medium">Focus mode</label><p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{enabled?"Distractions are paused.":"All notifications are visible."}</p></div><Switch id={id} checked={enabled} onCheckedChange={setEnabled}/></div>;}
