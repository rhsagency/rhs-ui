"use client";

import { useRef } from "react";

import { useInView, usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { cn } from "@/lib/utils";

function Card({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-[transform,opacity] duration-700 motion-reduce:transition-none",
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
      )}
    >
      <p className="text-sm font-medium">Card {index + 1}</p>
      <p className="mt-1 text-xs text-muted-foreground">{inView ? "In view" : "Waiting"}</p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="mx-auto max-w-2xl p-8">
      <p className="mb-4 text-xs text-muted-foreground">Reduced motion: {reduced ? "on, so everything stands still" : "off"}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => <Card key={index} index={index} />)}
      </div>
    </div>
  );
}
