import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface NotFoundSectionProps {
  /** "404" by default; use "500" or "Offline" for other error pages. */
  code?: string;
  title?: string;
  description?: string;
  /** The way back: home, search, or support. */
  actions?: ReactNode;
  /** Popular pages to try instead. */
  suggestions?: readonly { label: string; href: string; description?: string }[];
  className?: string;
}

/**
 * An error page that helps: what happened in plain words, the way back, and a
 * short list of places people usually look for. The code is decoration; the
 * heading carries the meaning.
 */
export function NotFoundSection({ code = "404", title = "This page does not exist.", description = "The link may be old, or the page has moved. Here are a few places to go instead.", actions, suggestions = [], className }: NotFoundSectionProps) {
  return (
    <section data-slot="not-found-section" className={cn("mx-auto max-w-2xl py-20 text-center sm:py-28", className)}>
      <p aria-hidden="true" className="font-mono text-sm text-muted-foreground">{code}</p>
      <h2 className="mt-4 text-4xl font-medium tracking-[-.045em] text-balance sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p>
      {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
      {suggestions.length ? (
        <ul className="mt-14 divide-y divide-border border-y border-border text-left">
          {suggestions.map((item) => (
            <li key={`${item.label}-${item.href}`}>
              <a href={item.href} className="group flex items-center justify-between gap-6 py-4 outline-none focus-visible:bg-muted">
                <span>
                  <span className="block text-sm font-medium group-hover:underline group-hover:underline-offset-4">{item.label}</span>
                  {item.description ? <span className="block text-sm text-muted-foreground">{item.description}</span> : null}
                </span>
                <span aria-hidden="true" className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
