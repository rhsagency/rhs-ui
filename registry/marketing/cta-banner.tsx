import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CtaBannerProps {
  title: string;
  description?: string;
  actions: ReactNode;
  /** `inverted` turns the band dark in light mode and light in dark mode. */
  tone?: "muted" | "inverted";
  className?: string;
}

/**
 * A slim call to action between sections: one line of copy on the left, the
 * action on the right, stacking on a phone. Lighter than a closing CTA, for
 * the middle of a long page.
 */
export function CtaBanner({ title, description, actions, tone = "muted", className }: CtaBannerProps) {
  return (
    <section
      data-slot="cta-banner"
      className={cn(
        "flex flex-col gap-6 rounded-2xl px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10",
        tone === "muted" ? "border border-border bg-muted" : "bg-foreground text-background [&_[data-slot=cta-banner-description]]:text-background/70",
        className,
      )}
    >
      <div className="max-w-xl">
        <h2 className="text-xl font-medium tracking-[-.03em] sm:text-2xl">{title}</h2>
        {description ? <p data-slot="cta-banner-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
    </section>
  );
}
