import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
export function EmptyState({title,description,icon,children,className}:{title:string;description:string;icon?:ReactNode;children?:ReactNode;className?:string}):React.JSX.Element {
  return <div data-slot="empty-state" className={cn("flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center",className)}>{icon?<div aria-hidden="true" className="mb-6 grid size-14 place-items-center rounded-xl border border-border bg-muted">{icon}</div>:null}<h3 className="text-lg font-medium tracking-tight">{title}</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>{children?<div className="mt-6">{children}</div>:null}</div>;
}
