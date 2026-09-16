"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode, KeyboardEvent } from "react";

export interface SpotlightFeature { id: string; label: string; title: string; description: string; visual: ReactNode }
export function FeatureSpotlight({ eyebrow = "A closer look", title, features }: { eyebrow?: string; title: string; features: readonly SpotlightFeature[] }): React.JSX.Element {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const tabs = useRef<HTMLDivElement>(null);
  const active = Math.min(selected, Math.max(0, features.length - 1));
  function navigate(event: KeyboardEvent<HTMLButtonElement>): void {
    const next = event.key === "ArrowRight" ? (active + 1) % features.length : event.key === "ArrowLeft" ? (active - 1 + features.length) % features.length : event.key === "Home" ? 0 : event.key === "End" ? features.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault(); setSelected(next); tabs.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }
  return <section data-slot="feature-spotlight" className="py-16"><header className="mx-auto mb-10 max-w-xl text-center"><p className="text-xs uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p><h2 className="mt-4 text-4xl font-medium tracking-tight">{title}</h2></header><div ref={tabs} role="tablist" aria-label={title} className="mx-auto mb-8 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-border p-1">{features.map((feature, index) => <button key={feature.id} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={index === active} aria-controls={`${id}-panel-${index}`} tabIndex={index === active ? 0 : -1} onKeyDown={navigate} onClick={() => setSelected(index)} className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition-colors aria-selected:bg-foreground aria-selected:text-background focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none">{feature.label}</button>)}</div>{features.map((feature, index) => <div key={feature.id} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={index !== active} tabIndex={0} className="rounded-2xl border border-border bg-card p-6 focus-visible:outline-2 focus-visible:outline-ring sm:p-10"><div className="grid items-center gap-10 md:grid-cols-[.8fr_1.2fr]"><div><span className="font-mono text-xs text-muted-foreground">0{index + 1} / 0{features.length}</span><h3 className="mt-5 text-3xl font-medium tracking-tight">{feature.title}</h3><p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{feature.description}</p></div><div className="min-w-0 overflow-hidden rounded-xl bg-muted">{feature.visual}</div></div></div>)}</section>;
}
