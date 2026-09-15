"use client";
import { useId } from "react";
import { Switch } from "@/registry/rhs-ui/ui/rhs-ui/switch";
export type Preference = {key:string;title:string;description:string;enabled:boolean};
export function PreferencesPanel({title="Your preferences",items,onChange}:{title?:string;items:readonly Preference[];onChange:(key:string,enabled:boolean)=>void}):React.JSX.Element {
  const id=useId();
  return <section data-slot="preferences-panel" aria-labelledby={id} className="w-full rounded-xl border border-border bg-card p-6 sm:p-8"><p className="text-xs uppercase tracking-widest text-muted-foreground">Make it yours</p><h2 id={id} className="mt-3 text-2xl font-medium tracking-tight">{title}</h2><div className="mt-7 divide-y divide-border">{items.map(item=><div key={item.key} className="flex items-center justify-between gap-8 py-5"><div><label htmlFor={`${id}-${item.key}`} className="text-sm font-medium">{item.title}</label><p id={`${id}-${item.key}-description`} className="mt-1 max-w-sm text-sm text-muted-foreground">{item.description}</p></div><Switch id={`${id}-${item.key}`} aria-describedby={`${id}-${item.key}-description`} checked={item.enabled} onCheckedChange={enabled=>onChange(item.key,enabled)} /></div>)}</div></section>;
}
