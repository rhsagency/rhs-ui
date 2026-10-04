import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Logo {
  name: string;
  /** An SVG or image of the mark; the name is used when it is missing. */
  mark?: ReactNode;
  href?: string;
}

export interface LogoCloudProps {
  /** One quiet line: "Trusted by teams at". */
  title?: string;
  logos: readonly Logo[];
  className?: string;
}

/**
 * Customer marks on a hairline grid. Marks render in the text colour at
 * reduced strength so a mixed set of brands reads as one row, and full
 * strength on hover. Each cell names the company for screen readers.
 */
export function LogoCloud({ title, logos, className }: LogoCloudProps) {
  return (
    <section data-slot="logo-cloud" className={cn("py-12 sm:py-16", className)}>
      {title ? <h2 className="mb-8 text-center text-sm text-muted-foreground">{title}</h2> : null}
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {logos.map((logo) => {
          const body = logo.mark ? <span aria-hidden="true" className="[&_svg]:h-7 [&_svg]:w-auto">{logo.mark}</span> : <span className="text-lg font-semibold tracking-tight">{logo.name}</span>;
          return (
            <li key={logo.name} className="flex h-24 items-center justify-center bg-background px-6 text-foreground/55 transition-colors duration-200 hover:text-foreground">
              {logo.href ? (
                <a href={logo.href} className="flex items-center rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" aria-label={logo.name}>{body}</a>
              ) : (
                <>
                  {body}
                  {logo.mark ? <span className="sr-only">{logo.name}</span> : null}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
