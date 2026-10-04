import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface LogoStatsProps {
  /** One line above the logos: "Trusted by 2,400 teams". */
  title: string;
  /** Logos as images or SVGs, each with its own accessible name. */
  logos: readonly { name: string; logo: ReactNode }[];
  stats: readonly { value: string; label: string }[];
  className?: string;
}

/**
 * Social proof in one band: a row of customer logos and, under a rule, the
 * three or four numbers that matter. The logos are greyed so no single
 * brand shouts; the numbers are a description list, value with its label.
 */
export function LogoStats({ title, logos, stats, className }: LogoStatsProps) {
  return (
    <section data-slot="logo-stats" className={cn("py-14 sm:py-20", className)}>
      <h2 className="text-center text-sm text-muted-foreground">{title}</h2>
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-muted-foreground [&_img]:h-7 [&_img]:w-auto [&_svg]:h-7 [&_svg]:w-auto">
        {logos.map((logo) => <li key={logo.name} className="opacity-80 grayscale">{logo.logo}</li>)}
      </ul>
      <dl className="mt-12 grid grid-cols-2 gap-y-8 border-t border-border pt-10 text-center md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse px-2">
            <dt className="mt-1 text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="text-3xl font-medium tracking-[-.04em] tabular-nums sm:text-4xl">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
