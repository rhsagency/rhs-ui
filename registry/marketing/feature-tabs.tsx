"use client";

import { useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface FeatureTab {
  id: string;
  label: string;
  title: string;
  description: string;
  points?: readonly string[];
  visual: ReactNode;
}

export interface FeatureTabsProps {
  eyebrow?: string;
  title: string;
  tabs: readonly FeatureTab[];
  className?: string;
}

/**
 * One product, several jobs: a tab per job, each with its own story and
 * screen. Real tabs (arrow keys, roving focus), so the hidden panels are
 * skipped by screen readers until chosen.
 */
export function FeatureTabs({ eyebrow, title, tabs, className }: FeatureTabsProps) {
  const [value, setValue] = useState(tabs[0]?.id ?? "");
  return (
    <section data-slot="feature-tabs" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
      </header>
      <Tabs value={value} onValueChange={setValue} className="mt-12">
        <TabsList variant="pill" className="mx-auto max-w-full overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-10">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
              <div>
                <h3 className="text-2xl font-medium tracking-[-.03em]">{tab.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{tab.description}</p>
                {tab.points?.length ? (
                  <ul className="mt-6 space-y-2 text-sm">
                    {tab.points.map((point) => (
                      <li key={point} className="flex gap-3"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />{point}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-muted">{tab.visual}</div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
