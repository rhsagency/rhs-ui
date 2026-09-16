import type { ReactNode } from "react";

export interface SplitHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  action: ReactNode;
  visual: ReactNode;
  details?: readonly string[];
}

export function SplitHero({ eyebrow, title, description, action, visual, details = [] }: SplitHeroProps): React.JSX.Element {
  return <section data-slot="split-hero" className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
    <div><p className="mb-6 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p><h2 className="max-w-xl text-5xl font-medium leading-[1.05] tracking-[-.055em] sm:text-6xl">{title}</h2><p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p><div className="mt-8 flex flex-wrap gap-3">{action}</div>{details.length > 0 && <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">{details.map(detail => <li key={detail}>{detail}</li>)}</ul>}</div>
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-muted">{visual}</div>
  </section>;
}
